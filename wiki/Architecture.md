# Architecture

## System Overview

Erlbrew Cafe is a full-stack web application consisting of a public-facing website and an admin panel for managing content.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                       │
├─────────────────────────────────────────────────────────────┤
│  erlbrew-cafe-website.html  │  erlbrew-admin.html          │
│  (Public Website)            │  (Admin Panel)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js Backend                        │
├─────────────────────────────────────────────────────────────┤
│  server.js          │  middleware/auth.js                   │
│  routes/            │  db.js                               │
│  ─────────────────────────────────────────────────────────  │
│  gallery │ about │ hours │ menu │ recommendations │ events  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     MySQL Database                          │
├─────────────────────────────────────────────────────────────┤
│  gallery_photos │ business_hours │ about_photo              │
│  admin_users │ menu_categories │ menu_items                 │
│  seasonal_items │ event_inquiries                           │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | HTML, Tailwind CSS | Static website with responsive design |
| Backend | Node.js, Express.js | REST API server |
| Database | MySQL 8 | Persistent data storage |
| Security | Cloudflare Zero Trust | Admin panel protection |
| Deployment | Docker, Docker Compose | Containerized deployment |

## Project Structure

```
erlbrewcafewebsite/
├── server/
│   ├── bin/                    # Setup and utility scripts
│   │   ├── setup-db.js        # Database initialization
│   │   └── hash-password.js   # Password hashing utility
│   ├── middleware/
│   │   └── auth.js            # Session-based authentication
│   ├── public/                 # Static assets (compiled CSS)
│   ├── routes/                 # API route handlers
│   │   ├── gallery.js         # Gallery photo CRUD
│   │   ├── about.js           # About photo management
│   │   ├── hours.js           # Business hours
│   │   ├── menu.js            # Menu categories & items
│   │   ├── recommendations.js # Seasonal recommendations
│   │   ├── seasonal.js        # Seasonal items
│   │   └── events.js          # Event inquiries
│   ├── uploads/                # User-uploaded images
│   ├── server.js              # Main Express server
│   ├── db.js                  # MySQL connection pool
│   └── init.sql               # Database schema
├── erlbrew-cafe-website.html  # Public website
├── erlbrew-admin.html         # Admin panel
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Container orchestration
└── package.json               # Root package manifest
```

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `gallery_photos` | Stores gallery slot assignments and file metadata |
| `business_hours` | Operating hours for each day |
| `about_photo` | Single "about" photo for the cafe |
| `admin_users` | Admin credentials (bcrypt hashed) |
| `menu_categories` | Menu category groupings (English + Japanese) |
| `menu_items` | Individual menu items with prices |
| `seasonal_items` | Limited-time menu offerings |
| `event_inquiries` | Customer event booking requests |

### Key Relationships

```
menu_categories 1───∞ menu_items
menu_items 1───∞ seasonal_items
```

## Authentication Flow

```
┌──────────────┐     POST /api/admin/login     ┌──────────────┐
│   Admin      │ ─────────────────────────────▶ │   Server     │
│   Browser    │                                │              │
│              │ ◀───────────────────────────── │  1. Verify   │
│              │     Set-Cookie: session        │     bcrypt   │
│              │                                │  2. Create   │
│              │     GET /admin                 │     session  │
│              │ ─────────────────────────────▶ │  3. Set      │
│              │                                │     cookie   │
│              │ ◀───────────────────────────── │              │
│              │     Admin Panel HTML           │              │
└──────────────┘                                └──────────────┘
```

## Security Features

- **Cloudflare Zero Trust**: Admin panel protected at network level
- **Session-based Auth**: In-memory sessions with 24h TTL
- **Rate Limiting**: 5 attempts per 15 minutes on login
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **CORS**: Configurable allowed origins
- **bcrypt**: Password hashing with salt

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Setup                         │
├─────────────────────────────────────────────────────────────┤
│  Cloudflare Tunnel ──▶ Docker Container ──▶ MySQL Server   │
│  (Zero Trust)         (Node.js App)         (Local/Remote) │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimizations

- **Compression**: Gzip enabled for all responses
- **Static Caching**: 7-day max-age for production assets
- **Connection Pooling**: MySQL2 connection pool
- **Tailwind CSS**: Minified CSS output
- **Multi-stage Docker**: Smaller production image
