const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const db = require('../db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Signup page
router.get('/signup', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('signup');
});

// Signup action
router.post('/signup', (req, res) => {
  const { username, email, password, password2 } = req.body;

  if (!username || !email || !password) {
    req.session.error = 'Please fill in all fields';
    return res.redirect('/signup');
  }
  if (password !== password2) {
    req.session.error = 'Passwords do not match';
    return res.redirect('/signup');
  }
  if (password.length < 4) {
    req.session.error = 'Password must be at least 4 characters';
    return res.redirect('/signup');
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) {
    req.session.error = 'Email or username already taken';
    return res.redirect('/signup');
  }

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashed);

  req.session.user = { id: result.lastInsertRowid, username, email, is_admin: 0, profile_photo: 'default-avatar.png' };
  req.session.success = 'Welcome to Housemate Zm!';
  res.redirect('/dashboard');
});

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login');
});

// Login action
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.session.error = 'Please type your email and password';
    return res.redirect('/login');
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    req.session.error = 'Wrong email or password';
    return res.redirect('/login');
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    is_admin: user.is_admin,
    profile_photo: user.profile_photo
  };
  req.session.success = `Welcome back, ${user.username}!`;

  if (user.is_admin) return res.redirect('/admin');
  res.redirect('/dashboard');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Dashboard
router.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const listings = db.prepare(`
    SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.session.user.id);

  const messages = db.prepare(`
    SELECT m.*, u.username as sender_name, l.name as listing_name
    FROM messages m 
    LEFT JOIN users u ON m.sender_id = u.id 
    LEFT JOIN listings l ON m.listing_id = l.id
    WHERE m.receiver_id = ? 
    ORDER BY m.created_at DESC
  `).all(req.session.user.id);

  const sentMessages = db.prepare(`
    SELECT m.*, u.username as receiver_name, l.name as listing_name
    FROM messages m 
    LEFT JOIN users u ON m.receiver_id = u.id 
    LEFT JOIN listings l ON m.listing_id = l.id
    WHERE m.sender_id = ? 
    ORDER BY m.created_at DESC
  `).all(req.session.user.id);

  res.render('dashboard', { listings, messages, sentMessages });
});

// Edit profile
router.post('/profile/update', upload.single('profile_photo'), (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const { username } = req.body;
  const userId = req.session.user.id;

  if (username) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, userId);
    if (existing) {
      req.session.error = 'That username is already taken';
      return res.redirect('/dashboard');
    }
    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, userId);
    req.session.user.username = username;
  }

  if (req.file) {
    const photo = req.file.filename;
    db.prepare('UPDATE users SET profile_photo = ? WHERE id = ?').run(photo, userId);
    req.session.user.profile_photo = photo;
  }

  req.session.success = 'Profile updated!';
  res.redirect('/dashboard');
});

module.exports = router;
