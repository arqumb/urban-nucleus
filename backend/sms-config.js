// SMS Service Configuration
// Copy this file to sms-config.js and fill in your actual credentials

module.exports = {
  // MSG91 Configuration (Indian SMS Service)
  MSG91: {
    authKey: '465889AqDpdyft68aa2ed9P1', // Your actual Auth Key
    templateId: '68aa3022b3d5127c5c31c1e8', // Your actual Template ID
    senderId: 'URBNUC', // Your sender ID (6 characters max)
    countryCode: '91', // India country code
    enabled: true // SMS service is now enabled!
  },
  
  // Twilio Configuration (Alternative SMS Service)
  TWILIO: {
    accountSid: 'YOUR_TWILIO_ACCOUNT_SID',
    authToken: 'YOUR_TWILIO_AUTH_TOKEN',
    fromNumber: '+1234567890', // Your Twilio phone number
    countryCode: '91', // India country code
    enabled: false // Set to true when you have credentials
  },
  
  // AWS SNS Configuration (Alternative SMS Service)
  AWS_SNS: {
    accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
    region: 'us-east-1',
    countryCode: '91', // India country code
    enabled: false // Set to true when you have credentials
  }
};

// ========== SETUP INSTRUCTIONS ==========

/*
MSG91 SETUP (Recommended for India):
1. Go to https://msg91.com/
2. Sign up and verify your account
3. Get your Auth Key from dashboard
4. Create a template with variables:
   - VAR1: OTP code
   - VAR2: Brand name
5. Get your Template ID
6. Update the MSG91 section above
7. Set enabled: true

TWILIO SETUP:
1. Go to https://www.twilio.com/
2. Sign up and get Account SID & Auth Token
3. Buy a phone number
4. Update the TWILIO section above
5. Set enabled: true

AWS SNS SETUP:
1. Go to AWS Console
2. Create IAM user with SNS permissions
3. Get Access Key ID & Secret Access Key
4. Update the AWS_SNS section above
5. Set enabled: true
*/
