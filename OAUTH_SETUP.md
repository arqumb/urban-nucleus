# 🔐 OAuth Setup Guide for Google & Facebook Login

This guide will help you set up Google and Facebook OAuth authentication for your Urban Nucleus e-commerce platform.

## 🚀 Quick Start

1. **Update OAuth Configuration** in `oauth-config.js`
2. **Set up Google OAuth** (Google Cloud Console)
3. **Set up Facebook OAuth** (Facebook Developers Console)
4. **Test the Integration**

## 📋 Prerequisites

- Node.js backend running on `31.97.239.99`
- Frontend running on `localhost:5500` (or your preferred port)
- MySQL database with `users` table
- Valid domain for production (localhost works for development)

## 🔑 Google OAuth Setup

### Step 1: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google+ API
   - Google OAuth2 API

### Step 2: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Set **Application Type** to "Web application"
4. Add **Authorized redirect URIs**:
   ```
   http://localhost:5500/login.html
   http://localhost:5500/signup.html
   http://localhost:5500/
   ```
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

### Step 3: Update Configuration
In `oauth-config.js`, replace:
```javascript
CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID'
CLIENT_SECRET: 'YOUR_GOOGLE_CLIENT_SECRET'
```

## 📘 Facebook OAuth Setup

### Step 1: Facebook Developers Console
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add **Facebook Login** product to your app

### Step 2: Configure App Settings
1. Go to **Settings** > **Basic**
2. Copy the **App ID** and **App Secret**
3. Add your domain to **App Domains** (localhost for development)

### Step 3: Configure Facebook Login
1. Go to **Facebook Login** > **Settings**
2. Add **Valid OAuth Redirect URIs**:
   ```
   http://localhost:5500/login.html
   http://localhost:5500/signup.html
   http://localhost:5500/
   ```
3. Set **Client OAuth Login** to **Yes**
4. Set **Web OAuth Login** to **Yes**

### Step 4: Update Configuration
In `oauth-config.js`, replace:
```javascript
APP_ID: 'YOUR_FACEBOOK_APP_ID'
APP_SECRET: 'YOUR_FACEBOOK_APP_SECRET'
```

## 🎯 Testing the Integration

### 1. Test Backend Connection
```bash
# Start your backend server
cd backend
node server.js
```

### 2. Test Frontend
1. Open `oauth-test.html` in your browser
2. Click "Test Backend" to verify backend is running
3. Test Google and Facebook OAuth endpoints
4. Check OAuth configuration status

### 3. Test Login/Signup Pages
1. Open `login.html` or `signup.html`
2. Try logging in with Google or Facebook
3. Check browser console for any errors

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. "Invalid OAuth Client" Error
- **Cause**: Incorrect Client ID or Client Secret
- **Solution**: Double-check credentials in `oauth-config.js`

#### 2. "Redirect URI Mismatch" Error
- **Cause**: Redirect URI not added to OAuth app
- **Solution**: Add exact redirect URIs to Google/Facebook apps

#### 3. CORS Errors
- **Cause**: Backend not allowing frontend domain
- **Solution**: Backend already has CORS configured for `localhost:5500`

#### 4. "App Not Configured" Facebook Error
- **Cause**: Facebook app not properly configured
- **Solution**: Ensure Facebook Login product is added and configured

#### 5. Google OAuth Not Loading
- **Cause**: Google OAuth library not loading
- **Solution**: Check internet connection and Google OAuth script loading

### Debug Steps
1. **Check Browser Console** for JavaScript errors
2. **Check Network Tab** for failed API calls
3. **Verify Backend Logs** for server-side errors
4. **Test OAuth Endpoints** directly with Postman/curl

## 📱 Production Deployment

### Environment Variables
For production, use environment variables instead of hardcoded values:

```javascript
// In oauth-config.js
const OAUTH_CONFIG = {
    GOOGLE: {
        CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET'
    },
    FACEBOOK: {
        APP_ID: process.env.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID',
        APP_SECRET: process.env.FACEBOOK_APP_SECRET || 'YOUR_FACEBOOK_APP_SECRET'
    }
};
```

### Domain Updates
1. Update redirect URIs in Google Cloud Console
2. Update redirect URIs in Facebook Developers Console
3. Update `oauth-config.js` with production URLs

## 🔧 Recent Fixes Applied

### Fixed Issues:
- ✅ **Missing `initializeFacebookAuth` function** - Added to signup.html
- ✅ **Async function handling** - Converted to Promise-based approach
- ✅ **Facebook HTTPS requirement** - Added localhost exception for development
- ✅ **SDK loading checks** - Added proper initialization checks
- ✅ **Error handling** - Improved error messages and fallbacks

### Development vs Production:
- **Development (localhost)**: Both Google and Facebook OAuth work on HTTP
- **Production**: Facebook OAuth requires HTTPS, Google OAuth works on both

## 🎉 Success Indicators

When OAuth is working correctly, you should see:
- ✅ Google/Facebook login buttons appear
- ✅ Clicking buttons opens OAuth popup/redirect
- ✅ Successful authentication redirects to dashboard
- ✅ User data stored in database
- ✅ JWT token generated and stored

## 📞 Support

If you encounter issues:
1. Check this troubleshooting guide
2. Verify all configuration steps completed
3. Test with `oauth-test.html` page
4. Check backend server logs
5. Verify database connection and users table

---

**Happy OAuth Integration! 🚀✨**
