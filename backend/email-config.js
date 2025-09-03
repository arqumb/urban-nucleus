// Email Configuration for URBAN NUCLEUS
// This file contains email settings and can be easily updated

const emailConfig = {
  // Gmail Configuration
  gmail: {
    service: 'gmail',
    auth: {
      user: 'urban.nucleus@gmail.com',
      pass: 'xlzplotqvwjzvoin' // Gmail App Password - 16 characters, no spaces
    }
  },
  
  // Alternative: SendGrid Configuration (for production)
  sendgrid: {
    service: 'sendgrid',
    auth: {
      user: 'apikey',
      pass: 'YOUR_SENDGRID_API_KEY' // Replace with your SendGrid API key
    }
  },
  
  // Alternative: Mailgun Configuration
  mailgun: {
    service: 'mailgun',
    auth: {
      user: 'postmaster@your-domain.mailgun.org',
      pass: 'YOUR_MAILGUN_API_KEY'
    }
  },
  
  // Email Templates
  templates: {
    from: 'urban.nucleus@gmail.com',
    fromName: 'URBAN NUCLEUS',
    replyTo: 'urban.nucleus@gmail.com'
  },
  
  // Reset URL Configuration
  resetUrl: {
    baseUrl: 'http://31.97.239.99', // VPS domain
    path: '/reset-password.html'
  }
};

module.exports = emailConfig;
