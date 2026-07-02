// ─── PM2 Ecosystem Configuration ──────────────────────────────────────────
// Start: pm2 start ecosystem.config.js
// Stop:  pm2 stop erlbrew-backend
// Logs:  pm2 logs erlbrew-backend
module.exports = {
  apps: [{
    name: 'erlbrew-backend',
    script: 'server.js',
    cwd: __dirname,
    node_args: '--max-old-space-size=256',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    env_file: '.env',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '300M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: '../logs/err.log',
    out_file: '../logs/out.log',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
  }],
};
