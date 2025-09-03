// OAuth Configuration
// Replace these placeholder values with your actual OAuth credentials

const OAUTH_CONFIG = {
    // Google OAuth Configuration
    GOOGLE: {
        CLIENT_ID: '1009074923316-qf8mb0viffso7mel9v7st5eso4tbnse9.apps.googleusercontent.com', // Get this from Google Cloud Console
        CLIENT_SECRET: 'YOUR_GOOGLE_CLIENT_SECRET', // Get this from Google Cloud Console
        REDIRECT_URI: 'http://31.97.239.99/login.html', // VPS redirect URI
        SCOPES: ['email', 'profile']
    },
    

};

// Auto-detect protocol and update redirect URIs
(function() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port || (protocol === 'https:' ? '3443' : '5500');
    
    // Only Google OAuth setup needed
    if (protocol === 'https:') {
        OAUTH_CONFIG.GOOGLE.REDIRECT_URI = `https://${hostname}:${port}/login.html`;
    } else {
        OAUTH_CONFIG.GOOGLE.REDIRECT_URI = `http://${hostname}:${port}/login.html`;
    }
})();

// Instructions for setting up OAuth:

/*
GOOGLE OAUTH SETUP: ✅ COMPLETED
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable Google+ API and Google OAuth2 API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
5. Set Application Type to "Web application"
6. Add authorized redirect URIs:
   - http://31.97.239.99/login.html
   - http://31.97.239.99/signup.html
7. Copy the Client ID and Client Secret
8. ✅ Client ID configured: 1009074923316-qf8mb0viffso7mel9v7st5eso4tbnse9.apps.googleusercontent.com

NOTE: Facebook OAuth has been removed from this system.
Only Google OAuth is now supported for social login.
*/

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OAUTH_CONFIG;
} else {
    window.OAUTH_CONFIG = OAUTH_CONFIG;
}
