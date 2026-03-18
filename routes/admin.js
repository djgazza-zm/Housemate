const express = require('express');
const router = express.Router();
const db = require('../db');

// Admin middleware
function isAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.is_admin) {
    req.session.error = 'You do not have access to this page';
    return res.redirect('/');
  }
  next();
}

router.use(isAdmin);

// Admin dashboard
router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC').all();
  const listings = db.prepare(`
    SELECT l.*, u.username as owner_name 
    FROM listings l JOIN users u ON l.user_id = u.id 
    ORDER BY l.created_at DESC
  `).all();
  const messages = db.prepare(`
    SELECT m.*, 
      s.username as sender_name, 
      r.username as receiver_name,
      l.name as listing_name
    FROM messages m 
    LEFT JOIN users s ON m.sender_id = s.id 
    LEFT JOIN users r ON m.receiver_id = r.id
    LEFT JOIN listings l ON m.listing_id = l.id
    ORDER BY m.created_at DESC
  `).all();

  // Stats
  const totalUsers = users.length;
  const totalListings = listings.length;
  const totalMessages = messages.length;
  const categoryCounts = db.prepare('SELECT category, COUNT(*) as count FROM listings GROUP BY category').all();
  const pendingListings = listings.filter(l => l.status === 'pending').length;
  const featuredListings = listings.filter(l => l.featured).length;

  res.render('admin', {
    users, listings, messages,
    stats: { totalUsers, totalListings, totalMessages, categoryCounts, pendingListings, featuredListings }
  });
});

// Approve listing
router.post('/listing/:id/approve', (req, res) => {
  db.prepare('UPDATE listings SET status = ? WHERE id = ?').run('approved', req.params.id);
  req.session.success = 'Place approved!';
  res.redirect('/admin');
});

// Reject listing
router.post('/listing/:id/reject', (req, res) => {
  db.prepare('UPDATE listings SET status = ? WHERE id = ?').run('rejected', req.params.id);
  req.session.success = 'Place rejected';
  res.redirect('/admin');
});

// Toggle featured
router.post('/listing/:id/feature', (req, res) => {
  const listing = db.prepare('SELECT featured FROM listings WHERE id = ?').get(req.params.id);
  if (listing) {
    db.prepare('UPDATE listings SET featured = ? WHERE id = ?').run(listing.featured ? 0 : 1, req.params.id);
    req.session.success = listing.featured ? 'Removed from featured' : 'Added to featured!';
  }
  res.redirect('/admin');
});

// Delete listing (admin)
router.post('/listing/:id/delete', (req, res) => {
  db.prepare('DELETE FROM listings WHERE id = ?').run(req.params.id);
  req.session.success = 'Place deleted';
  res.redirect('/admin');
});

// Delete message (admin)
router.post('/message/:id/delete', (req, res) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
  req.session.success = 'Message deleted';
  res.redirect('/admin');
});

module.exports = router;
