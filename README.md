# Internal Wallet Service

A high-performance wallet service for managing virtual credits in gaming platforms and loyalty reward systems. Built with Node.js, Express, and PostgreSQL with a focus on data integrity, concurrency handling, and auditability.

## Features

✅ **Double-Entry Ledger System** - Full audit trail of all transactions  
✅ **Idempotency** - Prevents duplicate transactions  
✅ **Deadlock Avoidance** - Consistent lock ordering prevents database deadlocks  
✅ **ACID Transactions** - Guaranteed data consistency  
✅ **Concurrency Safe** - Row-level locking with proper ordering  
✅ **Docker Support** - One-command deployment  
✅ **RESTful API** - Clean and intuitive endpoints  

## Technology Stack

### Why Node.js?
- **High Concurrency**: Event-driven architecture handles thousands of concurrent requests efficiently
- **Fast Development**: Rich ecosystem and simple async/await patterns
- **JSON Native**: Perfect for REST APIs and metadata handling
- **Production Ready**: Used by Netflix, PayPal, and other high-traffic platforms

### Why PostgreSQL?
- **ACID Compliance**: Critical for financial transactions
- **Row-Level Locking**: Prevents race conditions
- **JSONB Support**: Flexible metadata storage
- **Mature & Reliable**: Battle-tested in production environments

## Architecture

### Double-Entry Ledger
Every transaction creates two ledger entries:
- **DEBIT**: Removes credits from source account
- **CREDIT**: Adds credits to destination account

This ensures:
- Complete audit trail
- Balance verification
- Transaction history
- Regulatory compliance

### Deadlock Avoidance Strategy
1. **Consistent Lock Ordering**: Always lock accounts in ascending ID order
2. **Row-Level Locks**: Use `FOR UPDATE` to lock specific rows
3. **Short Transactions**: Minimize lock hold time
4. **Retry Logic**: Can be added at application level if needed

### Concurrency Handling
- Row-level locks prevent race conditions
- Idempotency keys prevent duplicate transactions
- Optimistic balance checks before updates
- Transaction isolation level ensures consistency

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd wallet-service

# Start everything with Docker Compose
docker-compose up --build

# The service will be available at http://localhost:3000
```

That's it! Docker Compose will:
1. Start PostgreSQL
2. Initialize the database schema
3. Seed initial data
4. Start the application

### Option 2: Local Development

#### Prerequisites
- Node.js 18+
- PostgreSQL 15+

#### Setup

```bash
# Install dependencies
npm install

# Create database
psql -U postgres -c "CREATE DATABASE wallet_db;"

# Initialize schema
psql -U postgres -d wallet_db -f database/init.sql

# Seed data
npm run seed

# Start the server
npm start
# or for development with auto-reload
npm run dev
```

## API Endpoints

### 1. Top-Up (Purchase)
User purchases credits with real money.

```bash
POST /api/wallet/topup
Content-Type: application/json

{
  "accountNumber": "USR-001",
  "assetCode": "GOLD_COINS",
  "amount": 100,
  "idempotencyKey": "unique-key-123",
  "metadata": {
    "paymentMethod": "credit_card",
    "orderId": "ORD-12345"
  }
}
```

### 2. Issue Bonus
System issues free credits to user.

```bash
POST /api/wallet/bonus
Content-Type: application/json

{
  "accountNumber": "USR-001",
  "assetCode": "LOYALTY_POINTS",
  "amount": 50,
  "reason": "Referral bonus",
  "idempotencyKey": "unique-key-456"
}
```

### 3. Spend Credits
User spends credits on in-app purchases.

```bash
POST /api/wallet/spend
Content-Type: application/json

{
  "accountNumber": "USR-001",
  "assetCode": "GOLD_COINS",
  "amount": 30,
  "description": "Purchased premium sword",
  "idempotencyKey": "unique-key-789",
  "metadata": {
    "itemId": "ITEM-999",
    "itemName": "Legendary Sword"
  }
}
```

### 4. Check Balance
Get current balance for all asset types.

```bash
GET /api/wallet/balance/USR-001
```

Response:
```json
{
  "accountNumber": "USR-001",
  "balances": [
    {
      "code": "GOLD_COINS",
      "name": "Gold Coins",
      "balance": "170.00"
    },
    {
      "code": "DIAMONDS",
      "name": "Diamonds",
      "balance": "50.00"
    },
    {
      "code": "LOYALTY_POINTS",
      "name": "Loyalty Points",
      "balance": "550.00"
    }
  ]
}
```

### 5. Transaction History
Get transaction history for an account.

```bash
GET /api/wallet/history/USR-001?limit=10
```

## Testing the Service

### Example Test Flow

```bash
# 1. Check initial balance
curl http://localhost:3000/api/wallet/balance/USR-001

# 2. Top-up 100 Gold Coins
curl -X POST http://localhost:3000/api/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "USR-001",
    "assetCode": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "test-topup-1"
  }'

# 3. Issue bonus 50 Loyalty Points
curl -X POST http://localhost:3000/api/wallet/bonus \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "USR-001",
    "assetCode": "LOYALTY_POINTS",
    "amount": 50,
    "reason": "Welcome bonus",
    "idempotencyKey": "test-bonus-1"
  }'

# 4. Spend 30 Gold Coins
curl -X POST http://localhost:3000/api/wallet/spend \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "USR-001",
    "assetCode": "GOLD_COINS",
    "amount": 30,
    "description": "Bought premium item",
    "idempotencyKey": "test-spend-1"
  }'

# 5. Check updated balance
curl http://localhost:3000/api/wallet/balance/USR-001

# 6. View transaction history
curl http://localhost:3000/api/wallet/history/USR-001
```

### Testing Idempotency

```bash
# Send the same request twice with same idempotency key
curl -X POST http://localhost:3000/api/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "USR-001",
    "assetCode": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "duplicate-test-1"
  }'

# Second request returns same result without creating duplicate transaction
curl -X POST http://localhost:3000/api/wallet/topup \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "USR-001",
    "assetCode": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "duplicate-test-1"
  }'
```

## Database Schema

### Tables

- **asset_types**: Defines virtual currencies (Gold Coins, Diamonds, etc.)
- **accounts**: User and system accounts
- **account_balances**: Current balance per account per asset type
- **transactions**: High-level transaction records
- **ledger_entries**: Double-entry bookkeeping records (DEBIT/CREDIT)

### Key Constraints

- Balances cannot go negative (`CHECK (balance >= 0)`)
- Amounts must be positive (`CHECK (amount > 0)`)
- Unique idempotency keys prevent duplicates
- Foreign key constraints ensure referential integrity

## Seeded Data

### Asset Types
- **GOLD_COINS**: Premium currency
- **DIAMONDS**: Rare currency
- **LOYALTY_POINTS**: Reward points

### System Accounts
- **SYS-TREASURY-001**: Source for top-ups
- **SYS-REVENUE-001**: Destination for spends
- **SYS-BONUS-001**: Source for bonuses

### User Accounts
- **USR-001**: Alice Johnson (100 Gold, 50 Diamonds, 500 Points)
- **USR-002**: Bob Smith (100 Gold, 50 Diamonds, 500 Points)
- **USR-003**: Charlie Davis (100 Gold, 50 Diamonds, 500 Points)

## Production Considerations

### Scaling
- Add read replicas for balance queries
- Use connection pooling (already configured)
- Implement caching for frequently accessed balances
- Consider sharding by user ID for massive scale

### Monitoring
- Add logging (Winston, Pino)
- Implement metrics (Prometheus)
- Set up alerts for failed transactions
- Monitor database connection pool

### Security
- Add authentication/authorization
- Rate limiting per user
- Input validation and sanitization
- Encrypt sensitive metadata
- Use environment-specific secrets

### Deployment
The service is containerized and ready for deployment to:
- AWS ECS/EKS
- Google Cloud Run
- Azure Container Instances
- Any Kubernetes cluster

## Project Structure

```
wallet-service/
├── database/
│   ├── init.sql          # Database schema
│   └── seed.sql          # Seed data
├── src/
│   ├── config/
│   │   └── database.js   # Database connection
│   ├── routes/
│   │   └── walletRoutes.js  # API routes
│   ├── services/
│   │   └── walletService.js # Business logic
│   ├── scripts/
│   │   └── seed.js       # Seeding script
│   ├── utils/
│   │   └── idempotency.js   # Helper functions
│   └── server.js         # Express app
├── docker-compose.yml    # Docker orchestration
├── Dockerfile           # Container definition
├── package.json         # Dependencies
└── README.md           # This file
```

## License

MIT
