# Urban Nucleus - Hostinger Deployment Guide

## 🏗️ **Prerequisites**
- Hostinger Business Web Hosting Plan
- Domain name configured
- SSH access enabled

## 📋 **Deployment Steps**

### **1. Upload Files**
```bash
# Compress your project
zip -r urban-nucleus.zip un/

# Upload via File Manager or SCP
scp urban-nucleus.zip username@your-domain.com:~/
```

### **2. Hostinger File Structure**
```
public_html/          # Your website files go here
├── index.html        # Frontend files
├── admin.html
├── style.css
├── main.js
├── backend/          # Backend API
│   ├── server.js
│   └── ...
└── uploads/          # Product images
```

### **3. Environment Variables for Hostinger**
Create `.env` file in backend/:
```env
# Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=your_hostinger_db_user
MYSQL_PASSWORD=your_hostinger_db_password
MYSQL_DATABASE=your_hostinger_database
MYSQL_PORT=3306

# Application Configuration
NODE_ENV=production
PORT=3000
DOMAIN_URL=https://yourdomain.com

# Admin Credentials
ADMIN_EMAIL=bubere908@gmail.com
ADMIN_PASSWORD=@Arqum789

# Payment Gateway
RAZORPAY_KEY_ID=your_live_key_id
RAZORPAY_KEY_SECRET=your_live_key_secret
```

### **4. Package.json for Hostinger**
Ensure your package.json has:
```json
{
  "scripts": {
    "start": "node backend/server.js",
    "install": "cd backend && npm install"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### **5. Database Setup**
1. **Create MySQL Database** in Hostinger Panel
2. **Import your database**:
   ```bash
   mysql -u username -p database_name < urban_nucleus_backup.sql
   ```
3. **Update connection details** in .env

### **6. Node.js Setup**
1. **Enable Node.js** in Hostinger Panel
2. **Set startup file**: `backend/server.js`
3. **Install dependencies**:
   ```bash
   cd public_html && npm install
   ```

### **7. Domain Configuration**
1. **Point domain** to public_html
2. **Enable SSL** in Hostinger Panel
3. **Update DOMAIN_URL** in .env

### **8. Testing**
- ✅ Visit your domain
- ✅ Test admin panel: yourdomain.com/admin.html
- ✅ Test API endpoints
- ✅ Test database connections

## 🔧 **Hostinger-Specific Configurations**

### **Node.js App Configuration**
- **App Root**: `/public_html`
- **Startup File**: `backend/server.js`
- **Node Version**: Latest LTS

### **Database Access**
- **Host**: localhost (internal)
- **Port**: 3306
- **Access**: via cPanel → MySQL Databases

### **File Permissions**
```bash
chmod 755 public_html/
chmod 644 public_html/*.html
chmod 755 public_html/backend/
chmod 644 public_html/backend/*.js
```

## 🚀 **Deployment Commands**

```bash
# 1. Upload files
# 2. SSH into Hostinger
ssh username@your-domain.com

# 3. Navigate to web root
cd public_html

# 4. Install dependencies
npm install

# 5. Start application
npm start
```

## 🔍 **Troubleshooting**

### **Common Issues:**
1. **Node.js not enabled**: Enable in Hostinger Panel
2. **Database connection**: Check credentials in .env
3. **File permissions**: Set correct chmod
4. **Domain pointing**: Ensure DNS is configured

### **Log Files:**
- Application logs: Check Hostinger Panel → Node.js
- Error logs: `/public_html/logs/`

## 📞 **Support**
- Hostinger Documentation: docs.hostinger.com
- Node.js Guide: Hostinger Panel → Tutorials
- Support: Hostinger Live Chat

