# Urban Nucleus VPS Deployment Checklist

## Pre-Deployment Checklist

### ✅ VPS Requirements
- [ ] Hostinger VPS with Ubuntu/Debian
- [ ] Minimum 2GB RAM
- [ ] 20GB+ storage
- [ ] Root access
- [ ] Domain name configured

### ✅ Domain Configuration
- [ ] Domain points to VPS IP
- [ ] DNS records updated
- [ ] A record configured
- [ ] CNAME for www subdomain

### ✅ Required Information
- [ ] VPS IP address
- [ ] Domain name
- [ ] Razorpay API keys
- [ ] Admin email and password
- [ ] Database credentials

## Deployment Steps

### 1. Initial VPS Setup
```bash
# Connect to VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install MySQL
apt install mysql-server -y
mysql_secure_installation

# Install Nginx
apt install nginx -y
systemctl enable nginx
systemctl start nginx

# Install PM2
npm install -g pm2
```

### 2. Database Setup
```bash
# Create database and user
mysql -u root -p
CREATE DATABASE urban_nucleus;
CREATE USER 'urban_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON urban_nucleus.* TO 'urban_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u urban_user -p urban_nucleus < export_database_schema.sql
```

### 3. Application Deployment
```bash
# Upload project files to VPS
cd /var/www
# Upload your project files here

# Install dependencies
cd urban-nucleus
npm install
cd backend
npm install

# Create environment file
nano .env
# Add your environment variables

# Set permissions
chown -R www-data:www-data /var/www/urban-nucleus
chmod -R 755 /var/www/urban-nucleus
chmod -R 777 /var/www/urban-nucleus/uploads
```

### 4. PM2 Configuration
```bash
# Start application
cd /var/www/urban-nucleus
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Nginx Configuration
```bash
# Create site configuration
nano /etc/nginx/sites-available/urban-nucleus
# Add nginx configuration

# Enable site
ln -s /etc/nginx/sites-available/urban-nucleus /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 6. SSL Certificate
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7. Firewall Setup
```bash
# Configure firewall
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

## Post-Deployment Verification

### ✅ Application Health
- [ ] Website loads at https://yourdomain.com
- [ ] Admin panel accessible at /admin.html
- [ ] API endpoints responding
- [ ] Database connection working
- [ ] File uploads functional

### ✅ Security Checks
- [ ] HTTPS redirect working
- [ ] Firewall active
- [ ] SSH key authentication
- [ ] Strong passwords set
- [ ] Environment variables secured

### ✅ Performance Checks
- [ ] Page load times acceptable
- [ ] Images loading properly
- [ ] Database queries optimized
- [ ] Nginx caching enabled
- [ ] Gzip compression working

### ✅ Payment Integration
- [ ] Razorpay test payment working
- [ ] Payment callbacks functional
- [ ] Order creation successful
- [ ] Email notifications sent

## Monitoring Setup

### ✅ Log Monitoring
- [ ] PM2 logs accessible
- [ ] Nginx logs monitored
- [ ] Application errors tracked
- [ ] Database logs reviewed

### ✅ Backup System
- [ ] Database backup script created
- [ ] File backup configured
- [ ] Automated backups scheduled
- [ ] Backup restoration tested

### ✅ Performance Monitoring
- [ ] System resources monitored
- [ ] Application performance tracked
- [ ] Uptime monitoring enabled
- [ ] Alert system configured

## Maintenance Tasks

### Daily
- [ ] Check application logs
- [ ] Monitor system resources
- [ ] Verify backups completed

### Weekly
- [ ] Review security updates
- [ ] Check disk space
- [ ] Monitor performance metrics

### Monthly
- [ ] Update system packages
- [ ] Review and rotate logs
- [ ] Test backup restoration
- [ ] Security audit

## Troubleshooting Commands

```bash
# Check application status
pm2 status
pm2 logs urban-nucleus

# Check Nginx status
systemctl status nginx
nginx -t

# Check MySQL status
systemctl status mysql

# Check system resources
htop
df -h
free -h

# Check firewall
ufw status

# Check SSL certificate
certbot certificates

# Restart services
pm2 restart urban-nucleus
systemctl restart nginx
systemctl restart mysql
```

## Emergency Contacts

- Hostinger Support: [Your Hostinger Support Contact]
- Domain Registrar: [Your Domain Registrar Contact]
- Razorpay Support: [Razorpay Support Contact]

## Important Files

- Application: `/var/www/urban-nucleus/`
- Logs: `/var/log/urban-nucleus/`
- Backups: `/backup/`
- Nginx config: `/etc/nginx/sites-available/urban-nucleus`
- Environment: `/var/www/urban-nucleus/.env`

## Success Criteria

✅ Website accessible via HTTPS
✅ All functionality working
✅ Payment processing operational
✅ Admin panel functional
✅ Database properly configured
✅ SSL certificate installed
✅ Firewall configured
✅ Backups automated
✅ Monitoring active

**Deployment Status: [ ] Pending [ ] In Progress [ ] Completed** 