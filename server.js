const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'housemate-zm-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Make user session available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  delete req.session.success;
  delete req.session.error;
  next();
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/listings'));
app.use('/', require('./routes/messages'));
app.use('/admin', require('./routes/admin'));

// Homepage
app.get('/', (req, res) => {
  const featured = db.prepare(`
    SELECT l.*, u.username as owner_name 
    FROM listings l JOIN users u ON l.user_id = u.id 
    WHERE l.featured = 1 AND l.status = 'approved' 
    ORDER BY l.created_at DESC
  `).all();

  const recent = db.prepare(`
    SELECT l.*, u.username as owner_name 
    FROM listings l JOIN users u ON l.user_id = u.id 
    WHERE l.status = 'approved' 
    ORDER BY l.created_at DESC 
    LIMIT 12
  `).all();

  const categories = db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM listings WHERE status = 'approved' 
    GROUP BY category ORDER BY count DESC
  `).all();

  res.render('index', { featured, recent, categories });
});

// Search
app.get('/search', (req, res) => {
  const { q, category, min_rent, max_rent, amenities } = req.query;
  let sql = `SELECT l.*, u.username as owner_name FROM listings l JOIN users u ON l.user_id = u.id WHERE l.status = 'approved'`;
  const params = [];

  if (q) {
    sql += ` AND (l.name LIKE ? OR l.location LIKE ? OR l.description LIKE ?)`;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category && category !== 'all') {
    sql += ` AND l.category = ?`;
    params.push(category);
  }
  if (min_rent) {
    sql += ` AND l.rent >= ?`;
    params.push(Number(min_rent));
  }
  if (max_rent) {
    sql += ` AND l.rent <= ?`;
    params.push(Number(max_rent));
  }
  if (amenities) {
    const amenityList = amenities.split(',');
    for (const a of amenityList) {
      sql += ` AND l.amenities LIKE ?`;
      params.push(`%${a.trim()}%`);
    }
  }

  sql += ` ORDER BY l.created_at DESC`;
  const results = db.prepare(sql).all(...params);

  const categories = db.prepare(`
    SELECT DISTINCT category FROM listings WHERE status = 'approved' ORDER BY category
  `).all();

  res.render('search', { results, categories, query: req.query });
});

// Single listing page
app.get('/listing/:id', (req, res) => {
  const listing = db.prepare(`
    SELECT l.*, u.username as owner_name, u.email as owner_email, u.profile_photo as owner_photo
    FROM listings l JOIN users u ON l.user_id = u.id 
    WHERE l.id = ?
  `).get(req.params.id);

  if (!listing) {
    req.session.error = 'Place not found';
    return res.redirect('/');
  }

  res.render('listing', { listing });
});

app.listen(PORT, () => {
  console.log(`Housemate Zm is running at http://localhost:${PORT}`);
});
