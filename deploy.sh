#!/bin/bash

# Urban Nucleus - Hostinger VPS Deployment Script
# Run this script on your VPS after initial setup

set -e  # Exit on any error

echo "🚀 Starting Urban Nucleus VPS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

# Variables
PROJECT_DIR="/var/www/urban-nucleus"
LOG_DIR="/var/log/urban-nucleus"
BACKUP_DIR="/backup"

print_status "Setting up Urban Nucleus deployment..."

# Step 1: Create necessary directories
print_status "Creating directories..."
mkdir -p $PROJECT_DIR
mkdir -p $LOG_DIR
mkdir -p $BACKUP_DIR

# Step 2: Install system dependencies
print_status "Installing system dependencies..."
apt update
apt install -y curl wget git unzip

# Step 3: Install Node.js 18+
print_status "Installing Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
else
    print_warning "Node.js is already installed"
fi

# Step 4: Install MySQL if not installed
print_status "Checking MySQL installation..."
if ! command -v mysql &> /dev/null; then
    print_status "Installing MySQL..."
    apt install -y mysql-server
    mysql_secure_installation
else
    print_warning "MySQL is already installed"
fi

# Step 5: Install Nginx if not installed
print_status "Checking Nginx installation..."
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
else
    print_warning "Nginx is already installed"
fi

# Step 6: Install PM2 globally
print_status "Installing PM2..."
npm install -g pm2

# Step 7: Set up database
print_status "Setting up database..."
read -p "Enter MySQL root password: " MYSQL_ROOT_PASS
read -p "Enter database name (default: urban_nucleus): " DB_NAME
DB_NAME=${DB_NAME:-urban_nucleus}

read -p "Enter database user (default: urban_user): " DB_USER
DB_USER=${DB_USER:-urban_user}

read -s -p "Enter database password: " DB_PASS
echo

# Create database and user
mysql -u root -p$MYSQL_ROOT_PASS << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

print_status "Database setup completed"

# Step 8: Set file permissions
print_status "Setting file permissions..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod -R 777 $PROJECT_DIR/uploads

# Step 9: Create environment file
print_status "Creating environment file..."
read -p "Enter your domain name: " DOMAIN_NAME
read -p "Enter admin email: " ADMIN_EMAIL
read -s -p "Enter admin password: " ADMIN_PASS
echo

read -p "Enter Razorpay Key ID: " RAZORPAY_KEY_ID
read -s -p "Enter Razorpay Key Secret: " RAZORPAY_KEY_SECRET
echo

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

cat > $PROJECT_DIR/.env << EOF
NODE_ENV=production
PORT=3000
MYSQL_HOST=localhost
MYSQL_USER=$DB_USER
MYSQL_PASSWORD=$DB_PASS
MYSQL_DATABASE=$DB_NAME
MYSQL_PORT=3306
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASS
DOMAIN_URL=https://$DOMAIN_NAME
RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET
JWT_SECRET=$JWT_SECRET
EOF

chmod 600 $PROJECT_DIR/.env

# Step 10: Install application dependencies
print_status "Installing application dependencies..."
cd $PROJECT_DIR
npm install
cd backend
npm install

# Step 11: Start application with PM2
print_status "Starting application with PM2..."
cd $PROJECT_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Step 12: Configure Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/urban-nucleus << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    root $PROJECT_DIR;
    index index.html;
    
    # Static files
    location / {
        try_files \$uri \$uri/ @nodejs;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Uploads directory
    location /uploads/ {
        alias $PROJECT_DIR/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Node.js fallback
    location @nodejs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/urban-nucleus /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

# Step 13: Configure firewall
print_status "Configuring firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Step 14: Install SSL certificate
print_status "Installing SSL certificate..."
apt install -y certbot python3-certbot-nginx
certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email $ADMIN_EMAIL

# Step 15: Create backup script
print_status "Setting up backup system..."
cat > /root/backup_urban_nucleus.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_backup_\$DATE.sql
tar -czf $BACKUP_DIR/app_backup_\$DATE.tar.gz $PROJECT_DIR
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /root/backup_urban_nucleus.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup_urban_nucleus.sh") | crontab -

print_status "Deployment completed successfully! 🎉"
echo ""
echo "Your Urban Nucleus application is now deployed at: https://$DOMAIN_NAME"
echo ""
echo "Useful commands:"
echo "  - View logs: pm2 logs urban-nucleus"
echo "  - Restart app: pm2 restart urban-nucleus"
echo "  - Monitor: pm2 monit"
echo "  - Backup: /root/backup_urban_nucleus.sh"
echo ""
echo "Admin panel: https://$DOMAIN_NAME/admin.html"
echo "Admin email: $ADMIN_EMAIL"
echo ""
print_warning "Please remember to:"
echo "  1. Update your DNS records to point to this server"
echo "  2. Test all functionality"
echo "  3. Set up monitoring and alerts"
echo "  4. Configure regular backups" 