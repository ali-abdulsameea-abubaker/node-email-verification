// server.js

// ===== Import modules =====
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

// Local imports
const sendEmail = require('./email/sendVerification');
const db = require('./db');

// ===== Create Express app =====
const app = express();

// ===== Middleware =====
app.use(express.json()); // parse JSON for fetch/ajax requests
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(express.static(path.join(__dirname, 'public'))); // serve static files

// ===== Routes =====

// --- Home redirect ---
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// --- Register ---
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).send('Email and password are required.');

  try {
    const hash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');

    const sql = `INSERT INTO users (email, password, verification_token) VALUES (?, ?, ?)`;
    db.query(sql, [email, hash, token], async (err) => {
      if (err) return res.status(400).send('User already exists');

      await sendEmail(email, token);
      res.send('Check your email to verify your account.');
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// --- Verify Email ---
app.get('/verify', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send('Invalid token.');

  const sql = `UPDATE users SET is_verified = true, verification_token = NULL WHERE verification_token = ?`;
  db.query(sql, [token], (err, result) => {
    if (err) return res.status(500).send('Database error');
    if (result.affectedRows === 0) return res.send('Invalid or expired token.');

    res.redirect('/verify.html');
  });
});

// --- Login ---
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).send('Email and password required.');

  const sql = `SELECT * FROM users WHERE email = ?`;
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).send('Database error');
    if (results.length === 0) return res.send('Invalid credentials');

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('Wrong password');
    if (!user.is_verified) return res.send('Please verify your email first.');

    // Redirect user to a static dashboard page
    res.redirect('/dashboard.html');
  });
});


// ===== Start server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
