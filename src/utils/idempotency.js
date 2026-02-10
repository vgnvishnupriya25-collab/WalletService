const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique idempotency key
 */
function generateIdempotencyKey() {
  return uuidv4();
}

/**
 * Generate a unique transaction ID
 */
function generateTransactionId() {
  return `TXN-${Date.now()}-${uuidv4().substring(0, 8)}`;
}

module.exports = {
  generateIdempotencyKey,
  generateTransactionId
};
