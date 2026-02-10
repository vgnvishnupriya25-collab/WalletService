-- Seed data for wallet service

-- Insert asset types
INSERT INTO asset_types (code, name, description) VALUES
    ('GOLD_COINS', 'Gold Coins', 'Premium currency for in-game purchases'),
    ('DIAMONDS', 'Diamonds', 'Rare currency for exclusive items'),
    ('LOYALTY_POINTS', 'Loyalty Points', 'Reward points for user engagement')
ON CONFLICT (code) DO NOTHING;

-- Insert system accounts
INSERT INTO accounts (account_number, account_type, name) VALUES
    ('SYS-TREASURY-001', 'SYSTEM', 'Treasury Account'),
    ('SYS-REVENUE-001', 'SYSTEM', 'Revenue Account'),
    ('SYS-BONUS-001', 'SYSTEM', 'Bonus Pool Account')
ON CONFLICT (account_number) DO NOTHING;

-- Insert user accounts
INSERT INTO accounts (account_number, account_type, user_id, name) VALUES
    ('USR-001', 'USER', 'user_001', 'Alice Johnson'),
    ('USR-002', 'USER', 'user_002', 'Bob Smith'),
    ('USR-003', 'USER', 'user_003', 'Charlie Davis')
ON CONFLICT (account_number) DO NOTHING;

-- Initialize balances for system accounts (large initial amounts)
INSERT INTO account_balances (account_id, asset_type_id, balance)
SELECT a.id, at.id, 1000000.00
FROM accounts a
CROSS JOIN asset_types at
WHERE a.account_type = 'SYSTEM'
ON CONFLICT (account_id, asset_type_id) DO NOTHING;

-- Initialize balances for user accounts with starting amounts
INSERT INTO account_balances (account_id, asset_type_id, balance)
SELECT a.id, at.id, 
    CASE 
        WHEN at.code = 'GOLD_COINS' THEN 100.00
        WHEN at.code = 'DIAMONDS' THEN 50.00
        WHEN at.code = 'LOYALTY_POINTS' THEN 500.00
    END
FROM accounts a
CROSS JOIN asset_types at
WHERE a.account_type = 'USER'
ON CONFLICT (account_id, asset_type_id) DO NOTHING;
