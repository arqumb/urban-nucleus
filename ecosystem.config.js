module.exports = {
  apps: [{
    name: 'urban-nucleus',
    script: 'backend/server.js',
    cwd: '/var/www/urban-nucleus',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/urban-nucleus/err.log',
    out_file: '/var/log/urban-nucleus/out.log',
    log_file: '/var/log/urban-nucleus/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}; 