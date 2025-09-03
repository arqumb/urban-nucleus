# Urban Nucleus - Hostinger VPS Deployment Guide

## Prerequisites
- Hostinger VPS with Ubuntu/Debian
- Node.js 18+ installed
- MySQL/MariaDB installed
- Nginx installed
- Domain name configured

## Step 1: VPS Setup

### 1.1 Connect to your VPS
```bash
ssh root@your-vps-ip
```

### 1.2 Update system
```bash
apt update && apt upgrade -y
```

### 1.3 Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
```

### 1.4 Install MySQL
```bash
apt install mysql-server -y
mysql_secure_installation
```

### 1.5 Install Nginx
```bash
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

### 1.6 Install PM2 (Process Manager)
```bash
npm install -g pm2
```

## Step 2: Database Setup

### 2.1 Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE urban_nucleus;
CREATE USER 'urban_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON urban_nucleus.* TO 'urban_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2 Import Database Schema
```bash
mysql -u urban_user -p urban_nucleus < database_schema.sql
```

## Step 3: Application Deployment

### 3.1 Clone/Upload Project
```bash
cd /var/www
git clone https://github.com/arqumb/urban-nucleus.git
# OR upload your files via SFTP
```

### 3.2 Install Dependencies
```bash
cd urban-nucleus
npm install
cd backend
npm install
```

### 3.3 Create Environment File
```bash
nano .env
```

Add the following:
```env
NODE_ENV=production
PORT=3000
MYSQL_HOST=localhost
MYSQL_USER=urban_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=urban_nucleus
MYSQL_PORT=3306
ADMIN_EMAIL=your_admin_email@domain.com
ADMIN_PASSWORD=your_admin_password
DOMAIN_URL=https://yourdomain.com
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 3.4 Set File Permissions
```bash
chown -R www-data:www-data /var/www/urban-nucleus
chmod -R 755 /var/www/urban-nucleus
chmod -R 777 /var/www/urban-nucleus/uploads
```

## Step 4: PM2 Configuration

### 4.1 Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

Add:
```javascript
module.exports = {
  apps: [{
    name: 'urban-nucleus',
    script: 'backend/server.js',
    cwd: '/var/www/urban-nucleus',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 4.2 Start Application
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 5: Nginx Configuration

### 5.1 Create Nginx Site Configuration
```bash
nano /etc/nginx/sites-available/urban-nucleus
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (add your SSL certificate paths)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Root directory
    root /var/www/urban-nucleus;
    index index.html;
    
    # Static files
    location / {
        try_files $uri $uri/ @nodejs;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://31.97.239.99;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Uploads directory
    location /uploads/ {
        alias /var/www/urban-nucleus/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Node.js fallback
    location @nodejs {
        proxy_pass http://31.97.239.99;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
```

### 5.2 Enable Site
```bash
ln -s /etc/nginx/sites-available/urban-nucleus /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Step 6: SSL Certificate (Let's Encrypt)

### 6.1 Install Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

### 6.2 Obtain SSL Certificate
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 7: Firewall Configuration

### 7.1 Configure UFW
```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

## Step 8: Monitoring & Maintenance

### 8.1 PM2 Monitoring
```bash
pm2 monit
pm2 logs urban-nucleus
```

### 8.2 Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 8.3 Application Logs
```bash
pm2 logs urban-nucleus --lines 100
```

## Step 9: Backup Strategy

### 9.1 Database Backup Script
```bash
nano /root/backup_db.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u urban_user -p urban_nucleus > /backup/db_backup_$DATE.sql
find /backup -name "db_backup_*.sql" -mtime +7 -delete
```

### 9.2 Make Executable
```bash
chmod +x /root/backup_db.sh
```

### 9.3 Add to Crontab
```bash
crontab -e
# Add: 0 2 * * * /root/backup_db.sh
```

## Troubleshooting

### Common Issues:

1. **Port 3000 not accessible**
   - Check if PM2 is running: `pm2 status`
   - Check firewall: `ufw status`

2. **Database connection issues**
   - Verify MySQL is running: `systemctl status mysql`
   - Check credentials in .env file

3. **Nginx 502 errors**
   - Check if Node.js app is running: `pm2 logs`
   - Verify proxy_pass configuration

4. **File upload issues**
   - Check uploads directory permissions
   - Verify disk space: `df -h`

### Useful Commands:
```bash
# Restart application
pm2 restart urban-nucleus

# Restart Nginx
systemctl restart nginx

# Check system resources
htop
df -h
free -h

# Monitor logs
pm2 logs urban-nucleus --lines 50
tail -f /var/log/nginx/error.log
```

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH key-based authentication
- [ ] Strong database passwords
- [ ] SSL certificate installed
- [ ] Regular security updates
- [ ] Database backups scheduled
- [ ] File permissions set correctly
- [ ] Environment variables secured

## Performance Optimization

1. **Enable Nginx caching**
2. **Configure MySQL optimization**
3. **Use PM2 cluster mode for multiple cores**
4. **Implement CDN for static assets**
5. **Enable Gzip compression**

Your Urban Nucleus application should now be successfully deployed on Hostinger VPS! 