// Razorpay Payment Configuration
// Replace these with your actual Razorpay credentials from dashboard

const PAYMENT_CONFIG = {
    RAZORPAY: {
        // Test Credentials (replace with live credentials for production)
        KEY_ID: 'rzp_test_1234567890',         // Get from Razorpay Dashboard
        KEY_SECRET: 'test_secret_1234567890',     // Get from Razorpay Dashboard
        
        // Webhook secret for verifying webhook signatures
        WEBHOOK_SECRET: 'test_webhook_secret_123',
        
        // Currency
        CURRENCY: 'INR',
        
        // Company details
        COMPANY: {
            NAME: 'Urban Nucleus',
            DESCRIPTION: 'Premium Fashion & Lifestyle',
            LOGO: 'http://31.97.239.99/images/urban-nucleus-logo-backup.svg',  // VPS logo
            THEME_COLOR: '#000000'
        }
    }
};

// Auto-detect environment
const isDevelopment = process.env.NODE_ENV !== 'production';

if (isDevelopment) {
    console.log('🔧 Payment Gateway: Running in DEVELOPMENT mode');
    console.log('💡 Note: Using test Razorpay credentials');
} else {
    console.log('🚀 Payment Gateway: Running in PRODUCTION mode');
    console.log('⚠️  Warning: Ensure live Razorpay credentials are set');
}

module.exports = {
    PAYMENT_CONFIG,
    isDevelopment
};

/*
SETUP INSTRUCTIONS:
===================

1. Create Razorpay Account:
   - Visit: https://dashboard.razorpay.com/signup
   - Complete KYC verification
   - Get your API credentials

2. Update Configuration:
   - Replace 'rzp_test_your_key_id_here' with your actual Key ID
   - Replace 'your_razorpay_secret_here' with your actual Key Secret
   - Set webhook secret from Razorpay Dashboard > Webhooks

3. For Production:
   - Set NODE_ENV=production
   - Use live credentials (starts with rzp_live_)
   - Ensure HTTPS is enabled

4. Test Credentials Available:
   - Key ID: rzp_test_1234567890
   - Key Secret: test_secret_1234567890
   (These are dummy values - use your actual test credentials)
*/
