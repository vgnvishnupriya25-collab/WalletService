#!/bin/bash

BASE_URL="http://localhost:3000"

echo "==================================="
echo "Wallet Service API Test Script"
echo "==================================="

echo ""
echo "1. Health Check"
echo "-----------------------------------"
curl -s "$BASE_URL/health" | json_pp || curl -s "$BASE_URL/health"

echo ""
echo ""
echo "2. Check Initial Balance (USR-001)"
echo "-----------------------------------"
curl -s "$BASE_URL/api/wallet/balance/USR-001" | json_pp || curl -s "$BASE_URL/api/wallet/balance/USR-001"

echo ""
echo ""
echo "3. Top-up 100 Gold Coins"
echo "-----------------------------------"
curl -s -X POST "$BASE_URL/api/wallet/topup" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "USR-001",
    "assetCode": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "test-topup-'$(date +%s)'"
  }' | json_pp || curl -s -X POST "$BASE_URL/api/wallet/topup" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "USR-001",
    "assetCode": "GOLD_COINS",
    "amount": 100,
    "idempotencyKey": "test-topup-'$(date +%s)'"
  }'

echo ""
echo ""
echo "4. Issue Bonus 50 Loyalty Points"
echo "-----------------------------------"
curl -s -X POST "$BASE_URL/api/wallet/bonus" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "USR-001",
    "assetCode": "LOYALTY_POINTS",
    "amount": 50,
    "reason": "Welcome bonus",
    "idempotencyKey": "test-bonus-'$(date +%s)'"
  }' | json_pp || curl -s -X POST "$BASE_URL/api/wallet/bonus" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "USR-001",
    "assetCode": "LOYALTY_POINTS",
    "amount": 50,
    "reason": "Welcome bonus",
    "idempotencyKey": "test-bonus-'$(date +%s)'"
  }'

echo ""
echo ""
echo "5. Spend 30 Gold Coins"
echo "-----------------------------------"
curl -s -X POST "$BASE_URL/api/wallet/spend" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "USR-001",
    "assetCode": "GOLD_COINS",
    "amount": 30,
    "description": "Bought premium sword",
    "idempotencyKey": "test-spend-'$(date +%s)'"
  }' | json_pp || curl -s -X POST "$BASE_URL/api/wallet/spend" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "USR-001",
    "assetCode": "GOLD_COINS",
    "amount": 30,
    "description": "Bought premium sword",
    "idempotencyKey": "test-spend-'$(date +%s)'"
  }'

echo ""
echo ""
echo "6. Check Updated Balance"
echo "-----------------------------------"
curl -s "$BASE_URL/api/wallet/balance/USR-001" | json_pp || curl -s "$BASE_URL/api/wallet/balance/USR-001"

echo ""
echo ""
echo "7. View Transaction History"
echo "-----------------------------------"
curl -s "$BASE_URL/api/wallet/history/USR-001?limit=5" | json_pp || curl -s "$BASE_URL/api/wallet/history/USR-001?limit=5"

echo ""
echo ""
echo "==================================="
echo "Test Complete!"
echo "==================================="
