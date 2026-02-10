const express = require('express');
const router = express.Router();
const walletService = require('../services/walletService');
const { generateIdempotencyKey } = require('../utils/idempotency');

/**
 * POST /api/wallet/topup
 * Top-up user wallet (purchase)
 */
router.post('/topup', async (req, res) => {
  try {
    const { accountNumber, assetCode, amount, idempotencyKey, metadata } = req.body;
    
    if (!accountNumber || !assetCode || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    const key = idempotencyKey || generateIdempotencyKey();
    
    const result = await walletService.topUp(
      accountNumber,
      assetCode,
      parseFloat(amount),
      key,
      metadata || {}
    );
    
    res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) {
    console.error('Top-up error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/wallet/bonus
 * Issue bonus/incentive to user
 */
router.post('/bonus', async (req, res) => {
  try {
    const { accountNumber, assetCode, amount, reason, idempotencyKey, metadata } = req.body;
    
    if (!accountNumber || !assetCode || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    const key = idempotencyKey || generateIdempotencyKey();
    
    const result = await walletService.issueBonus(
      accountNumber,
      assetCode,
      parseFloat(amount),
      key,
      reason,
      metadata || {}
    );
    
    res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) {
    console.error('Bonus error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/wallet/spend
 * User spends credits
 */
router.post('/spend', async (req, res) => {
  try {
    const { accountNumber, assetCode, amount, description, idempotencyKey, metadata } = req.body;
    
    if (!accountNumber || !assetCode || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    const key = idempotencyKey || generateIdempotencyKey();
    
    const result = await walletService.spend(
      accountNumber,
      assetCode,
      parseFloat(amount),
      key,
      description,
      metadata || {}
    );
    
    res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) {
    console.error('Spend error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/wallet/balance/:accountNumber
 * Get account balance
 */
router.get('/balance/:accountNumber', async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const balance = await walletService.getBalance(accountNumber);
    res.json({ accountNumber, balances: balance });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(404).json({ error: error.message });
  }
});

/**
 * GET /api/wallet/history/:accountNumber
 * Get transaction history
 */
router.get('/history/:accountNumber', async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const history = await walletService.getTransactionHistory(accountNumber, limit);
    res.json({ accountNumber, transactions: history });
  } catch (error) {
    console.error('History error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
