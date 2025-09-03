# 🔒 Local HTTPS Setup for Facebook OAuth Development

## 🚨 Why HTTPS is Required

Facebook OAuth **requires HTTPS** since 2018, even for localhost development. This is a security policy that cannot be bypassed.

## 🚀 Quick HTTPS Setup

### Method 1: Using mkcert (Recommended)

#### Step 1: Install mkcert
```bash
# Windows (using Chocolatey)
choco install mkcert

# macOS
brew install mkcert

# Linux
sudo apt install mkcert
```

#### Step 2: Generate Local CA
```bash
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

This creates:
- `localhost+2.pem` (certificate)
- `localhost+2-key.pem` (private key)

#### Step 3: Update Backend Server
Add HTTPS support to your `backend/server.js`:

```javascript
const https = require('https');
const fs = require('fs');

// HTTPS options
const httpsOptions = {
  key: fs.readFileSync('../localhost+2-key.pem'),
  cert: fs.readFileSync('../localhost+2.pem')
};

// Create HTTPS server
const httpsServer = https.createServer(httpsOptions, app);
httpsServer.listen(3443, () => {
  console.log('HTTPS Server running on https://localhost:3443');
});
```

#### Step 4: Update OAuth Configuration
In `oauth-config.js`, update redirect URIs:
```javascript
REDIRECT_URI: 'https://localhost:3443/login.html'
```

### Method 2: Using Live Server with HTTPS

#### Step 1: Install Live Server
```bash
npm install -g live-server
```

#### Step 2: Create SSL Certificate
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes
```

#### Step 3: Run with HTTPS
```bash
live-server --https=./cert.pem --key=./key.pem --port=5500
```

### Method 3: Using ngrok (Temporary Solution)

#### Step 1: Install ngrok
Download from [ngrok.com](https://ngrok.com/)

#### Step 2: Expose Local Server
```bash
ngrok http 5500
```

#### Step 3: Use ngrok URL
Update OAuth redirect URIs to use the ngrok URL (e.g., `https://abc123.ngrok.io`)

## 🔧 Alternative: Disable Facebook OAuth on HTTP

If you prefer to keep HTTP development, you can disable Facebook OAuth and show a clear message:

```javascript
// In your OAuth handlers
function handleFacebookSignIn() {
  if (window.location.protocol === 'http:') {
    showMessage('Facebook login requires HTTPS. Please use a secure connection or set up local HTTPS development.', 'error');
    return;
  }
  // ... rest of Facebook OAuth code
}
```

## 📱 Production Deployment

For production, you **must** use HTTPS:

1. **Get SSL Certificate** (Let's Encrypt is free)
2. **Update OAuth Redirect URIs** to your production HTTPS domain
3. **Configure Web Server** (Apache/Nginx) for HTTPS

## 🎯 Testing HTTPS Setup

1. **Start HTTPS backend**: `node server.js` (with HTTPS config)
2. **Access via HTTPS**: `https://localhost:3443`
3. **Test Facebook OAuth**: Should work without errors
4. **Update OAuth config**: Use HTTPS URLs

## ⚠️ Important Notes

- **HTTP + Facebook OAuth**: ❌ Impossible (Facebook policy)
- **HTTPS + Facebook OAuth**: ✅ Required for Facebook
- **HTTP + Google OAuth**: ✅ Works fine
- **HTTPS + Google OAuth**: ✅ Works fine

## 🔍 Troubleshooting

### Certificate Errors
- **"Not Secure" warning**: Normal for self-signed certificates
- **"Invalid Certificate"**: Check certificate file paths
- **Port conflicts**: Use different ports for HTTP/HTTPS

### Facebook OAuth Still Failing
- **Check protocol**: Must be `https://`
- **Check domain**: Must match OAuth app settings
- **Check port**: Must be included in redirect URIs

---

**For Facebook OAuth development, HTTPS is mandatory. Choose the setup method that works best for your workflow!** 🔒✨


