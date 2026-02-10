const pool = require('../config/database');
const { generateTransactionId } = require('../utils/idempotency');

class WalletService {
  /**
   * Execute a transaction with proper locking to avoid deadlocks
   * Uses consistent ordering of account locks (lower ID first)
   */
  async executeTransaction(fromAccountNumber, toAccountNumber, assetCode, amount, transactionType, description, idempotencyKey, metadata = {}) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check for existing transaction with same idempotency key
      const existingTxn = await client.query(
        'SELECT * FROM transactions WHERE idempotency_key = $1',
        [idempotencyKey]
      );
      
      if (existingTxn.rows.length > 0) {
        await client.query('ROLLBACK');
        return {
          success: true,
          duplicate: true,
          transaction: existingTxn.rows[0]
        };
      }
      
      // Get asset type
      const assetResult = await client.query(
        'SELECT id FROM asset_types WHERE code = $1',
        [assetCode]
      );
      
      if (assetResult.rows.length === 0) {
        throw new Error(`Asset type ${assetCode} not found`);
      }
      
      const assetTypeId = assetResult.rows[0].id;
      
      // Get accounts with row-level locks in consistent order to prevent deadlocks
      const accountsResult = await client.query(
        `SELECT id, account_number FROM accounts 
         WHERE account_number IN ($1, $2)
         ORDER BY id ASC
         FOR UPDATE`,
        [fromAccountNumber, toAccountNumber]
      );
      
      if (accountsResult.rows.length !== 2) {
        throw new Error('One or both accounts not found');
      }
      
      const accounts = {};
      accountsResult.rows.forEach(acc => {
        accounts[acc.account_number] = acc.id;
      });
      
      const fromAccountId = accounts[fromAccountNumber];
      const toAccountId = accounts[toAccountNumber];
      
      // Lock and get balances in consistent order
      const balanceIds = [fromAccountId, toAccountId].sort((a, b) => a - b);
      
      await client.query(
        `SELECT account_id, balance FROM account_balances 
         WHERE account_id = ANY($1) AND asset_type_id = $2
         ORDER BY account_id ASC
         FOR UPDATE`,
        [balanceIds, assetTypeId]
      );
      
      // Get from account balance
      const fromBalanceResult = await client.query(
        'SELECT balance FROM account_balances WHERE account_id = $1 AND asset_type_id = $2',
        [fromAccountId, assetTypeId]
      );
      
      if (fromBalanceResult.rows.length === 0) {
        throw new Error('From account balance not found');
      }
      
      const currentBalance = parseFloat(fromBalanceResult.rows[0].balance);
      
      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }
      
      // Generate transaction ID
      const transactionId = generateTransactionId();
      
      // Create transaction record
      await client.query(
        `INSERT INTO transactions 
         (transaction_id, idempotency_key, transaction_type, status, from_account_id, to_account_id, asset_type_id, amount, description, metadata, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)`,
        [transactionId, idempotencyKey, transactionType, 'COMPLETED', fromAccountId, toAccountId, assetTypeId, amount, description, JSON.stringify(metadata)]
      );
      
      // Debit from source account
      await client.query(
        `INSERT INTO ledger_entries 
         (transaction_id, idempotency_key, entry_type, account_id, asset_type_id, amount, transaction_type, description, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [transactionId, `${idempotencyKey}-DEBIT`, 'DEBIT', fromAccountId, assetTypeId, amount, transactionType, description, JSON.stringify(metadata)]
      );
      
      // Credit to destination account
      await client.query(
        `INSERT INTO ledger_entries 
         (transaction_id, idempotency_key, entry_type, account_id, asset_type_id, amount, transaction_type, description, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [transactionId, `${idempotencyKey}-CREDIT`, 'CREDIT', toAccountId, assetTypeId, amount, transactionType, description, JSON.stringify(metadata)]
      );
      
      // Update balances
      await client.query(
        'UPDATE account_balances SET balance = balance - $1 WHERE account_id = $2 AND asset_type_id = $3',
        [amount, fromAccountId, assetTypeId]
      );
      
      await client.query(
        'UPDATE account_balances SET balance = balance + $1 WHERE account_id = $2 AND asset_type_id = $3',
        [amount, toAccountId, assetTypeId]
      );
      
      await client.query('COMMIT');
      
      return {
        success: true,
        duplicate: false,
        transactionId,
        amount,
        fromAccount: fromAccountNumber,
        toAccount: toAccountNumber,
        assetCode
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Top-up user wallet (purchase with real money)
   */
  async topUp(userAccountNumber, assetCode, amount, idempotencyKey, metadata = {}) {
    return this.executeTransaction(
      'SYS-TREASURY-001',
      userAccountNumber,
      assetCode,
      amount,
      'TOP_UP',
      'Wallet top-up via purchase',
      idempotencyKey,
      metadata
    );
  }
  
  /**
   * Issue bonus/incentive to user
   */
  async issueBonus(userAccountNumber, assetCode, amount, idempotencyKey, reason, metadata = {}) {
    return this.executeTransaction(
      'SYS-BONUS-001',
      userAccountNumber,
      assetCode,
      amount,
      'BONUS',
      reason || 'Bonus credit',
      idempotencyKey,
      metadata
    );
  }
  
  /**
   * User spends credits
   */
  async spend(userAccountNumber, assetCode, amount, idempotencyKey, description, metadata = {}) {
    return this.executeTransaction(
      userAccountNumber,
      'SYS-REVENUE-001',
      assetCode,
      amount,
      'SPEND',
      description || 'In-app purchase',
      idempotencyKey,
      metadata
    );
  }
  
  /**
   * Get account balance
   */
  async getBalance(accountNumber) {
    const result = await pool.query(
      `SELECT at.code, at.name, ab.balance
       FROM account_balances ab
       JOIN accounts a ON ab.account_id = a.id
       JOIN asset_types at ON ab.asset_type_id = at.id
       WHERE a.account_number = $1`,
      [accountNumber]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Account not found');
    }
    
    return result.rows;
  }
  
  /**
   * Get transaction history
   */
  async getTransactionHistory(accountNumber, limit = 50) {
    const result = await pool.query(
      `SELECT t.transaction_id, t.transaction_type, t.amount, t.description, 
              t.created_at, at.code as asset_code,
              fa.account_number as from_account, ta.account_number as to_account
       FROM transactions t
       JOIN asset_types at ON t.asset_type_id = at.id
       LEFT JOIN accounts fa ON t.from_account_id = fa.id
       LEFT JOIN accounts ta ON t.to_account_id = ta.id
       WHERE fa.account_number = $1 OR ta.account_number = $1
       ORDER BY t.created_at DESC
       LIMIT $2`,
      [accountNumber, limit]
    );
    
    return result.rows;
  }
}

module.exports = new WalletService();
