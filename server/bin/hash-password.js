#!/usr/bin/env node
// ─── Hash a password with bcrypt ─────────────────────────────────────────
// Usage: node bin/hash-password.js
// Prompts for a password and outputs the bcrypt hash to stdout.
// ─────────────────────────────────────────────────────────────────────────

const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter password to hash: ', (password) => {
  rl.question('Confirm password: ', async (confirm) => {
    if (password !== confirm) {
      console.error('Passwords do not match!');
      rl.close();
      process.exit(1);
    }
    if (password.length < 8) {
      console.error('Password must be at least 8 characters!');
      rl.close();
      process.exit(1);
    }
    try {
      const hash = await bcrypt.hash(password, 12);
      console.log('\nBcrypt hash (cost=12):');
      console.log(hash);
      console.log('\nAdd this to your .env file as:');
      console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    } catch (err) {
      console.error('Failed to hash password:', err.message);
      process.exit(1);
    } finally {
      rl.close();
    }
  });
});
