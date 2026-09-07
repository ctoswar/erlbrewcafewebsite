# Erlbrew Cafe Website

A full-stack web application for Erlbrew Cafe, featuring a public-facing website and an admin panel for managing content.

## Features

- **Public Website**
  - Gallery photo display
  - Business hours
  - Menu with categories and items
  - Seasonal recommendations
  - Event inquiry form

- **Admin Panel**
  - Gallery photo management (upload/delete)
  - Menu CRUD operations
  - Business hours editing
  - Seasonal item management
  - Event inquiry viewing

## Tech Stack

- **Frontend**: HTML, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Security**: Cloudflare Zero Trust, Helmet, CORS

## Prerequisites

- Node.js 18+
- MySQL 8+
- Cloudflare account (for Zero Trust)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ctoswar/erlbrewcafewebsite.git
   cd erlbrewcafewebsite/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Initialize the database:
   ```bash
   mysql -h localhost -u root -p < init.sql
   ```

5. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_HOST` | MySQL host | Yes |
| `DB_PORT` | MySQL port | No (default: 3306) |
| `DB_USER` | MySQL username | Yes |
| `DB_PASSWORD` | MySQL password | Yes |
| `DB_NAME` | MySQL database name | Yes |
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment (production/development) | No |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | No |

## Project Structure

```
erlbrewcafewebsite/
├── server/
│   ├── bin/              # Setup scripts
│   ├── middleware/        # Auth middleware
│   ├── public/           # Static files
│   ├── routes/           # API routes
│   ├── uploads/          # Uploaded files
│   ├── server.js         # Main server file
│   ├── db.js             # Database connection
│   └── init.sql          # Database schema
├── erlbrew-cafe-website.html  # Public website
└── erlbrew-admin.html         # Admin panel
```

## API Endpoints

### Public
- `GET /api/gallery` - Get all gallery photos
- `GET /api/menu` - Get menu with categories and items
- `GET /api/hours` - Get business hours
- `GET /api/recommendations` - Get seasonal recommendations
- `POST /api/events/inquiries` - Submit event inquiry

### Admin (requires session)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `POST /api/gallery/:slot` - Upload gallery photo
- `DELETE /api/gallery/:slot` - Delete gallery photo
- `POST /api/menu/categories` - Add menu category
- `PUT /api/menu/categories/:id` - Update menu category
- `DELETE /api/menu/categories/:id` - Delete menu category
- `POST /api/menu/items` - Add menu item
- `PUT /api/menu/items/:id` - Update menu item
- `DELETE /api/menu/items/:id` - Delete menu item
- `PUT /api/hours/:id` - Update business hours

## Security

- Admin panel protected by Cloudflare Zero Trust
- Session-based authentication
- Rate limiting on login endpoint
- Helmet security headers
- CORS configuration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
