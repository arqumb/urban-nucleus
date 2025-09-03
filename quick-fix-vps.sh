#!/bin/bash

# Urban Nucleus VPS Quick Fix Script
# Run this script to quickly fix common deployment issues

echo "🚀 Urban Nucleus VPS Quick Fix Script"
echo "====================================="

# Make scripts executable
chmod +x *.sh

# Stop LiteSpeed if running
echo "�� Stopping LiteSpeed..."
if systemctl is-active --quiet lsws; then
    systemctl stop lsws
    systemctl disable lsws
    echo "✅ LiteSpeed stopped and disabled"
else
    echo "ℹ️ LiteSpeed not running"
fi

# Install Nginx if not present
echo "🌐 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt update
    apt install -y nginx
    echo "✅ Nginx installed"
else
    echo "✅ Nginx already installed"
fi

# Install MySQL if not present
echo "🗄️ Installing MySQL..."
if ! command -v mysql &> /dev/null; then
    apt install -y mysql-server mysql-client
    echo "✅ MySQL installed"
else
    echo "✅ MySQL already installed"
fi

# Install Node.js if not present
echo "�� Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo "✅ Node.js installed"
else
    echo "✅ Node.js already installed"
fi

# Install PM2 if not present
echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 already installed"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p /var/log/urban-nucleus
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Copy Nginx configuration
echo "🌐 Setting up Nginx..."
cp nginx-urban-nucleus.conf /etc/nginx/sites-available/urban-nucleus
ln -sf /etc/nginx/sites-available/urban-nucleus /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Start and enable services
echo "🚀 Starting services..."
systemctl start nginx
systemctl enable nginx
systemctl start mysql
systemctl enable mysql

# Install Node.js dependencies
echo "�� Installing Node.js dependencies..."
cd backend
npm install
cd ..

# Start PM2 application
echo "🚀 Starting PM2 application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Quick fix completed!"
echo "�� Website should now be accessible at: http://31.97.239.99"
echo "📊 Check PM2 status: pm2 status"
echo "�� Check Nginx status: systemctl status nginx"
