const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function seed() {
  try {
    console.log('Starting database seeding...');
    
    const seedSQL = fs.readFileSync(
      path.join(__dirname, '../../database/seed.sql'),
      'utf8'
    );
    
    await pool.query(seedSQL);
    
    console.log('Database seeded successfully!');
    
    // Display seeded data
    const assets = await pool.query('SELECT * FROM asset_types');
    console.log('\nAsset Types:', assets.rows);
    
    const accounts = await pool.query('SELECT * FROM accounts');
    console.log('\nAccounts:', accounts.rows);
    
    const balances = await pool.query(`
      SELECT a.account_number, a.name, at.code, ab.balance
      FROM account_balances ab
      JOIN accounts a ON ab.account_id = a.id
      JOIN asset_types at ON ab.asset_type_id = at.id
      ORDER BY a.account_number, at.code
    `);
    console.log('\nInitial Balances:', balances.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
