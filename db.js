const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'housemate.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    profile_photo TEXT DEFAULT 'default-avatar.png',
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    rent REAL NOT NULL,
    location TEXT NOT NULL,
    category TEXT NOT NULL,
    room_type TEXT DEFAULT '',
    amenities TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    featured INTEGER DEFAULT 0,
    status TEXT DEFAULT 'approved',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    listing_id INTEGER,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
  );
`);

function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return; // Already seeded

  console.log('Seeding database with demo data...');

  // Create demo users
  const adminPass = bcrypt.hashSync('admin123', 10);
  const userPass = bcrypt.hashSync('user123', 10);

  const insertUser = db.prepare('INSERT INTO users (username, email, password, profile_photo, is_admin) VALUES (?, ?, ?, ?, ?)');

  insertUser.run('Admin', 'admin@housemate.zm', adminPass, 'default-avatar.png', 1);
  insertUser.run('Chipo Mwale', 'chipo@example.com', userPass, 'default-avatar.png', 0);
  insertUser.run('Bwalya Mutale', 'bwalya@example.com', userPass, 'default-avatar.png', 0);
  insertUser.run('Thandiwe Banda', 'thandiwe@example.com', userPass, 'default-avatar.png', 0);
  insertUser.run('Mulenga Phiri', 'mulenga@example.com', userPass, 'default-avatar.png', 0);

  // Create demo listings
  const insertListing = db.prepare(`
    INSERT INTO listings (user_id, name, description, rent, location, category, room_type, amenities, images, featured, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
  `);

  const demoListings = [
    {
      user_id: 2, name: 'Sunny 2-Bedroom Apartment', description: 'A bright and airy 2-bedroom apartment with modern finishes, open-plan kitchen, and a balcony overlooking the park. Perfect for young professionals or a small family.',
      rent: 4500, location: 'Lusaka, Kabulonga', category: 'Apartment', room_type: '2 Bedroom',
      amenities: 'WiFi,Parking,Balcony,Security,Water Tank', featured: 1
    },
    {
      user_id: 3, name: 'Cozy Studio Room', description: 'Compact and well-furnished studio room in a quiet neighborhood. Ideal for students or single working professionals. Shared kitchen and bathroom.',
      rent: 1200, location: 'Kitwe, Parklands', category: 'Room', room_type: 'Studio',
      amenities: 'WiFi,Furnished,Shared Kitchen', featured: 0
    },
    {
      user_id: 2, name: 'Spacious Family House', description: 'Beautiful 4-bedroom house with a large garden, modern kitchen, and double garage. Located in a secure gated community with 24-hour security.',
      rent: 12000, location: 'Lusaka, Roma', category: 'House', room_type: '4 Bedroom',
      amenities: 'WiFi,Parking,Garden,Security,Garage,Borehole', featured: 1
    },
    {
      user_id: 4, name: 'Modern Office Space', description: 'Open-plan office space in a prime business district. Includes reception area, conference room, and kitchenette. Fiber internet available.',
      rent: 8000, location: 'Lusaka, Cairo Road', category: 'Office', room_type: 'Open Plan',
      amenities: 'WiFi,Parking,Air Conditioning,Conference Room,Reception', featured: 1
    },
    {
      user_id: 3, name: 'Farm Land with Cottage', description: '10 hectares of fertile farm land with a 2-bedroom cottage, borehole, and storage shed. Great for commercial farming or weekend retreat.',
      rent: 6000, location: 'Chisamba', category: 'Farm', room_type: 'Cottage + Land',
      amenities: 'Borehole,Storage,Fenced,Cottage', featured: 0
    },
    {
      user_id: 5, name: 'Grand Event Center', description: 'Elegant event center with capacity for 500 guests. Includes stage, sound system, catering kitchen, and ample parking. Perfect for weddings, conferences, and parties.',
      rent: 15000, location: 'Lusaka, Woodlands', category: 'Event Center', room_type: 'Hall',
      amenities: 'Parking,Sound System,Stage,Kitchen,Air Conditioning,Tables and Chairs', featured: 1
    },
    {
      user_id: 4, name: 'Luxury Condo with Pool', description: 'High-end 3-bedroom condo in a premium complex. Features a shared swimming pool, gym, and rooftop terrace. Fully furnished with modern appliances.',
      rent: 18000, location: 'Lusaka, Ibex Hill', category: 'Condo', room_type: '3 Bedroom',
      amenities: 'WiFi,Pool,Gym,Furnished,Security,Rooftop Terrace,Parking', featured: 1
    },
    {
      user_id: 2, name: 'Budget Single Room', description: 'Affordable single room in a shared house. Close to shops, bus stop, and local market. Basic amenities provided.',
      rent: 800, location: 'Ndola, Masala', category: 'Room', room_type: 'Single',
      amenities: 'Shared Bathroom,Near Shops,Bus Stop Nearby', featured: 0
    },
    {
      user_id: 5, name: 'Warehouse & Storage Space', description: 'Large warehouse space suitable for storage, distribution, or light manufacturing. Easy access from main road with loading bay.',
      rent: 10000, location: 'Lusaka, Heavy Industrial', category: 'Office', room_type: 'Warehouse',
      amenities: 'Loading Bay,Security,Main Road Access,Fenced', featured: 0
    },
    {
      user_id: 3, name: 'Charming Garden Apartment', description: 'Ground floor apartment with a private garden. 1 bedroom, open-plan living, and a small patio. Very quiet and green surroundings.',
      rent: 3500, location: 'Livingstone, Dambwa', category: 'Apartment', room_type: '1 Bedroom',
      amenities: 'Garden,Parking,Quiet Area,Patio', featured: 0
    },
    {
      user_id: 4, name: 'Executive 3-Bed House', description: 'Executive house in a prestigious area. 3 bedrooms, en-suite master, modern kitchen, and a large entertainment area. Walled and gated.',
      rent: 9500, location: 'Lusaka, Sunningdale', category: 'House', room_type: '3 Bedroom',
      amenities: 'WiFi,Parking,Security,Borehole,Garden,Servant Quarters', featured: 1
    },
    {
      user_id: 5, name: 'Conference & Meeting Room', description: 'Professional meeting room available for daily or weekly rent. Seats 20 people. Includes projector, whiteboard, and refreshment area.',
      rent: 2000, location: 'Lusaka, Longacres', category: 'Office', room_type: 'Meeting Room',
      amenities: 'WiFi,Projector,Whiteboard,Air Conditioning,Refreshments', featured: 0
    },
  ];

  for (const listing of demoListings) {
    const imgIndex = demoListings.indexOf(listing) + 1;
    const images = JSON.stringify([`demo-${imgIndex}.jpg`]);
    insertListing.run(
      listing.user_id, listing.name, listing.description, listing.rent,
      listing.location, listing.category, listing.room_type, listing.amenities,
      images, listing.featured
    );
  }

  // Create demo messages
  const insertMessage = db.prepare('INSERT INTO messages (sender_id, receiver_id, listing_id, message) VALUES (?, ?, ?, ?)');
  insertMessage.run(3, 2, 1, 'Hi! Is the Sunny 2-Bedroom Apartment still available? I would love to schedule a viewing.');
  insertMessage.run(2, 3, 1, 'Yes, it is! You can come see it this Saturday at 10am. Let me know if that works.');
  insertMessage.run(4, 5, 6, 'I am interested in the Grand Event Center for a wedding in December. What dates are open?');
  insertMessage.run(5, 4, 6, 'December is filling up fast! We have the 7th and 14th available. Would either of those work?');
  insertMessage.run(2, 4, 4, 'Is the Modern Office Space available for a 6-month lease?');

  console.log('Demo data seeded successfully!');
}

// Generate demo placeholder images
function generateDemoImages() {
  for (let i = 1; i <= 12; i++) {
    const imgPath = path.join(UPLOADS_DIR, `demo-${i}.jpg`);
    if (!fs.existsSync(imgPath)) {
      // Create a simple SVG-based placeholder and save as a file
      const colors = [
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140',
        '#a18cd1', '#fbc2eb', '#ffecd2', '#fcb69f', '#ff9a9e', '#fad0c4'
      ];
      const categories = [
        'Apartment', 'Room', 'House', 'Office', 'Farm', 'Event Center',
        'Condo', 'Room', 'Office', 'Apartment', 'House', 'Office'
      ];
      const color = colors[i - 1];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#667eea;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#g)" rx="0"/>
        <text x="400" y="220" font-family="Arial,sans-serif" font-size="36" fill="white" text-anchor="middle" font-weight="bold">Housemate Zm</text>
        <text x="400" y="280" font-family="Arial,sans-serif" font-size="24" fill="rgba(255,255,255,0.8)" text-anchor="middle">${categories[i - 1]} #${i}</text>
        <rect x="300" y="320" width="200" height="3" fill="rgba(255,255,255,0.5)" rx="2"/>
      </svg>`;
      fs.writeFileSync(imgPath, svg);
    }
  }

  // Create default avatar
  const avatarPath = path.join(UPLOADS_DIR, 'default-avatar.png');
  if (!fs.existsSync(avatarPath)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#g)" rx="100"/>
      <circle cx="100" cy="80" r="35" fill="rgba(255,255,255,0.8)"/>
      <ellipse cx="100" cy="170" rx="55" ry="45" fill="rgba(255,255,255,0.8)"/>
    </svg>`;
    fs.writeFileSync(avatarPath, svg);
  }
}

seedDatabase();
generateDemoImages();

module.exports = db;
