-- Initialize database schema for wallet service
-- This uses a double-entry ledger system for full auditability

-- Asset types (e.g., Gold Coins, Diamonds, Loyalty Points)
CREATE TABLE IF NOT EXISTS asset_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts (both user wallets and system accounts)
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('USER', 'SYSTEM')),
    user_id VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account balances per asset type
CREATE TABLE IF NOT EXISTS account_balances (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    asset_type_id INTEGER NOT NULL REFERENCES asset_types(id),
    balance DECIMAL(20, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, asset_type_id)
);

-- Ledger entries (double-entry bookkeeping)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    asset_type_id INTEGER NOT NULL REFERENCES asset_types(id),
    amount DECIMAL(20, 2) NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table for grouping related ledger entries
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    from_account_id INTEGER REFERENCES accounts(id),
    to_account_id INTEGER REFERENCES accounts(id),
    asset_type_id INTEGER NOT NULL REFERENCES asset_types(id),
    amount DECIMAL(20, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_ledger_account ON ledger_entries(account_id);
CREATE INDEX idx_ledger_transaction ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_idempotency ON ledger_entries(idempotency_key);
CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key);
CREATE INDEX idx_account_balances_account ON account_balances(account_id);

-- Function to update account balance timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_account_balances_updated_at BEFORE UPDATE ON account_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
