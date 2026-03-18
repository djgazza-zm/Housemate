const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `listing-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// Add listing page
router.get('/post', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('post-listing');
});

// Add listing action
router.post('/post', upload.array('images', 10), (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const { name, description, rent, location, category, room_type, amenities } = req.body;

  if (!name || !description || !rent || !location || !category) {
    req.session.error = 'Please fill in all the required fields';
    return res.redirect('/post');
  }

  const images = req.files ? req.files.map(f => f.filename) : [];

  db.prepare(`
    INSERT INTO listings (user_id, name, description, rent, location, category, room_type, amenities, images)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.session.user.id, name, description, Number(rent), location, category,
    room_type || '', amenities || '', JSON.stringify(images)
  );

  req.session.success = 'Place posted!';
  res.redirect('/dashboard');
});

// Edit listing page
router.get('/edit/:id', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const listing = db.prepare('SELECT * FROM listings WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.user.id);

  if (!listing && !req.session.user.is_admin) {
    req.session.error = 'You can only edit your own places';
    return res.redirect('/dashboard');
  }

  const listingData = listing || db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listingData) {
    req.session.error = 'Place not found';
    return res.redirect('/dashboard');
  }

  res.render('edit-listing', { listing: listingData });
});

// Update listing action
router.post('/edit/:id', upload.array('images', 10), (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) {
    req.session.error = 'Place not found';
    return res.redirect('/dashboard');
  }

  if (listing.user_id !== req.session.user.id && !req.session.user.is_admin) {
    req.session.error = 'You can only edit your own places';
    return res.redirect('/dashboard');
  }

  const { name, description, rent, location, category, room_type, amenities, keep_images } = req.body;

  let images = [];
  // Keep existing images if specified
  if (keep_images) {
    images = Array.isArray(keep_images) ? keep_images : [keep_images];
  }
  // Add new uploaded images
  if (req.files && req.files.length > 0) {
    images = images.concat(req.files.map(f => f.filename));
  }

  db.prepare(`
    UPDATE listings SET name = ?, description = ?, rent = ?, location = ?, category = ?, room_type = ?, amenities = ?, images = ?
    WHERE id = ?
  `).run(name, description, Number(rent), location, category, room_type || '', amenities || '', JSON.stringify(images), req.params.id);

  req.session.success = 'Place updated!';
  res.redirect('/dashboard');
});

// Delete listing
router.post('/delete/:id', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) {
    req.session.error = 'Place not found';
    return res.redirect('/dashboard');
  }

  if (listing.user_id !== req.session.user.id && !req.session.user.is_admin) {
    req.session.error = 'You can only delete your own places';
    return res.redirect('/dashboard');
  }

  db.prepare('DELETE FROM listings WHERE id = ?').run(req.params.id);
  req.session.success = 'Place removed!';

  if (req.session.user.is_admin) return res.redirect('/admin');
  res.redirect('/dashboard');
});

module.exports = router;
