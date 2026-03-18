const express = require('express');
const router = express.Router();
const db = require('../db');

// Send message
router.post('/message/send', (req, res) => {
  if (!req.session.user) {
    req.session.error = 'Please log in to send a message';
    return res.redirect('/login');
  }

  const { receiver_id, listing_id, message } = req.body;

  if (!message || !message.trim()) {
    req.session.error = 'Please type something';
    return res.redirect('back');
  }

  if (Number(receiver_id) === req.session.user.id) {
    req.session.error = 'You cannot message yourself';
    return res.redirect('back');
  }

  db.prepare('INSERT INTO messages (sender_id, receiver_id, listing_id, message) VALUES (?, ?, ?, ?)')
    .run(req.session.user.id, Number(receiver_id), listing_id ? Number(listing_id) : null, message.trim());

  req.session.success = 'Message sent!';
  res.redirect(listing_id ? `/listing/${listing_id}` : '/dashboard');
});

// Mark message as read
router.post('/message/read/:id', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  db.prepare('UPDATE messages SET read = 1 WHERE id = ? AND receiver_id = ?')
    .run(req.params.id, req.session.user.id);

  res.redirect('/dashboard');
});

module.exports = router;
