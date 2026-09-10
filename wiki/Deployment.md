# Deployment

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- MySQL 8.0+ (remote or local)
- Cloudflare account (for Zero Trust)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ctoswar/erlbrewcafewebsite.git
cd erlbrewcafewebsite
```

### 2. Configure Environment Variables

```bash
cd server
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=192.168.75.101
DB_PORT=3306
DB_USER=erlbrew
DB_PASSWORD=your-secure-password
DB_NAME=erlbrew
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$your-bcrypt-hash-here
```

### 3. Generate Admin Password Hash

```bash
cd server
npm run hash:password
```

Follow the prompts to generate a bcrypt hash for your admin password.

### 4. Initialize Database

```bash
mysql -h your-mysql-host -u root -p < server/init.sql
```

### 5. Start with Docker Compose

```bash
docker compose up -d --build
```

The application will be available at `http://localhost:3002`.

---

## Production Deployment

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `192.168.75.101` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `erlbrew` |
| `DB_PASSWORD` | MySQL password | - |
| `DB_NAME` | Database name | `erlbrew` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PASSWORD_HASH` | Bcrypt password hash | - |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `*` |

### Docker Compose Production Config

```yaml
services:
  erlbrew:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: erlbrew-backend
    restart: unless-stopped
    ports:
      - "3002:3000"
    environment:
      DB_HOST: "${DB_HOST}"
      DB_PORT: "${DB_PORT:-3306}"
      DB_USER: "${DB_USER}"
      DB_PASSWORD: "${DB_PASSWORD}"
      DB_NAME: "${DB_NAME}"
      NODE_ENV: production
      PORT: 3000
      ADMIN_USERNAME: "${ADMIN_USERNAME}"
    volumes:
      - ./server/.env:/app/server/.env
      - uploads_data:/app/server/uploads

volumes:
  uploads_data:
```

---

## Cloudflare Zero Trust Setup

### 1. Create Cloudflare Tunnel

```bash
cloudflared tunnel create erlbrew-tunnel
```

### 2. Configure Tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: erlbrew-tunnel
credentials-file: /path/to/credentials.json

ingress:
  - hostname: admin.yourdomain.com
    service: http://localhost:3002
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

### 3. Route DNS

```bash
cloudflared tunnel route dns erlbrew-tunnel admin.yourdomain.com
```

### 4. Start Tunnel

```bash
cloudflared tunnel run erlbrew-tunnel
```

### 5. Configure Access Policies

1. Go to Cloudflare Zero Trust Dashboard
2. Navigate to **Access** > **Applications**
3. Create a new application for `admin.yourdomain.com`
4. Set up authentication policies (email, OTP, etc.)

---

## Manual Deployment (Without Docker)

### 1. Install Dependencies

```bash
cd server
npm ci --production
```

### 2. Build CSS

```bash
npm run build:css
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Initialize Database

```bash
mysql -h your-host -u root -p < init.sql
```

### 5. Start Server

```bash
npm start
```

Or use PM2 for process management:

```bash
pm2 start server.js --name erlbrew
pm2 save
pm2 startup
```

---

## Database Setup

### Create Database User

```sql
CREATE USER IF NOT EXISTS 'erlbrew'@'%' IDENTIFIED BY 'your-secure-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON erlbrew.* TO 'erlbrew'@'%';
FLUSH PRIVILEGES;
```

### Initialize Schema

```bash
mysql -h your-host -u root -p < server/init.sql
```

### Backup Strategy

```bash
# Daily backup
mysqldump -h your-host -u erlbrew -p erlbrew > backup_$(date +%Y%m%d).sql

# Restore
mysql -h your-host -u root -p erlbrew < backup_20260911.sql
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:3002/api/health
# {"status":"ok","timestamp":"2026-09-11T12:00:00.000Z"}
```

### Docker Logs

```bash
docker logs -f erlbrew-backend
```

### PM2 Monitoring

```bash
pm2 monit
pm2 logs erlbrew
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Database connection failed | Check `DB_HOST`, `DB_PORT`, credentials |
| Port already in use | Change `PORT` or stop conflicting service |
| Upload directory not found | Ensure `uploads/` exists with write permissions |
| CSS not loading | Run `npm run build:css` |

### Debug Mode

Set `NODE_ENV=development` for verbose logging:

```env
NODE_ENV=development
```

---

## Updating

### Docker

```bash
docker compose down
docker compose up -d --build
```

### Manual

```bash
git pull
cd server
npm ci --production
npm run build:css
pm2 restart erlbrew
```
