# Housemate Zm

A fully functional rental marketplace webapp for all types of properties and spaces in Zambia. Browse apartments, houses, offices, farms, event centers, and more.

## Features

- **Browse & Search** - Find places by name, location, category, rent range, and amenities
- **Featured Slider** - Homepage carousel showcasing featured listings with glass-effect design
- **Post a Place** - Upload listings with multiple photos directly from your device
- **User Dashboard** - Manage your listings, view messages, update your profile
- **Admin Dashboard** - Moderate listings, manage users, track platform statistics
- **Internal Messaging** - Contact property owners directly through the platform
- **Premium UI** - Glassmorphism design with smooth animations, fully responsive

## Quick Start

```bash
# Install dependencies
npm install

# Start the app
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Accounts

| Role  | Email                  | Password |
|-------|------------------------|----------|
| Admin | admin@housemate.zm     | admin123 |
| User  | chipo@example.com      | user123  |
| User  | bwalya@example.com     | user123  |
| User  | thandiwe@example.com   | user123  |
| User  | mulenga@example.com    | user123  |

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite (via better-sqlite3)
- **Views**: EJS templates
- **Auth**: bcryptjs + express-session
- **Uploads**: multer (stored in `/public/uploads/`)
- **Frontend**: Vanilla CSS with glassmorphism, vanilla JavaScript

## Project Structure

```
├── server.js           # Express app entry point
├── db.js               # Database setup, migrations, and seed data
├── routes/
│   ├── auth.js         # Signup, login, logout, profile
│   ├── listings.js     # CRUD for listings with image upload
│   ├── messages.js     # Internal messaging system
│   └── admin.js        # Admin dashboard and moderation
├── views/
│   ├── partials/       # Header and footer
│   ├── index.ejs       # Homepage with slider and grid
│   ├── search.ejs      # Search and filter page
│   ├── listing.ejs     # Single listing detail
│   ├── login.ejs       # Login page
│   ├── signup.ejs      # Signup page
│   ├── dashboard.ejs   # User dashboard
│   ├── admin.ejs       # Admin dashboard
│   ├── post-listing.ejs    # Post a new place
│   └── edit-listing.ejs    # Edit existing place
├── public/
│   ├── css/style.css   # Glassmorphism styles
│   ├── js/main.js      # Frontend interactions
│   └── uploads/        # Uploaded and demo images
├── data/               # SQLite database (auto-created)
└── package.json
```

## Deployment

### Render
1. Connect your GitHub repo on [render.com](https://render.com)
2. It will auto-detect `render.yaml` and configure everything
3. A persistent disk is configured for the SQLite database

### Railway
1. Connect your GitHub repo on [railway.app](https://railway.app)
2. It will auto-detect `railway.toml` and deploy

### Docker
```bash
docker build -t housemate-zm .
docker run -p 3000:3000 housemate-zm
```

### Heroku
Uses the included `Procfile`. Push to Heroku and it will start automatically.

## No External Dependencies

Everything runs internally. No API keys, external services, or environment variables needed. Clone, install, run.
