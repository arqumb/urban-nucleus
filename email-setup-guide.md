# 📧 Email Setup Guide for URBAN NUCLEUS

## **🎯 Goal: Configure Professional Email for Password Resets**

Your store will send beautiful, branded password reset emails from `urban.nucleus@gmail.com`

---

## **📋 Prerequisites Checklist:**

- [ ] Access to `urban.nucleus@gmail.com` Gmail account
- [ ] Backend server running on `31.97.239.99`
- [ ] Frontend running on `localhost:5500`

---

## **🚀 Step-by-Step Setup:**

### **Step 1: Enable 2-Factor Authentication**

1. **Go to Google Account:**
   - Visit [myaccount.google.com](https://myaccount.google.com)
   - Sign in with `urban.nucleus@gmail.com`

2. **Navigate to Security:**
   - Click "Security" in left sidebar
   - Find "2-Step Verification" → Click "Get Started"

3. **Complete Setup:**
   - Follow verification process (usually phone number)
   - Confirm 2FA is enabled

### **Step 2: Generate App Password**

1. **Go to App Passwords:**
   - Return to Security section
   - Find "App passwords" (appears after 2FA)

2. **Create App Password:**
   - Select "Mail" from dropdown
   - Select "Other (Custom name)"
   - Name: `URBAN NUCLEUS Store`
   - Click "Generate"

3. **Copy the Password:**
   - You'll get: `abcd efgh ijkl mnop` (16 characters)
   - **Copy this immediately** - you won't see it again!

### **Step 3: Update Email Configuration**

1. **Open `backend/email-config.js`**

2. **Replace the placeholder:**
   ```javascript
   // Change this line:
   pass: 'YOUR_16_CHAR_APP_PASSWORD_HERE'
   
   // To your actual App Password (no spaces):
   pass: 'abcdefghijklmnop'
   ```

3. **Save the file**

### **Step 4: Test the Setup**

1. **Restart your backend server:**
   ```bash
   cd backend
   node server.js
   ```

2. **Check console for:**
   ```
   Email server is ready to send messages
   ```

3. **Test forgot password:**
   - Go to `login.html`
   - Click "Forgot password?"
   - Enter any email
   - Submit form

4. **Check backend console for:**
   - Reset token generation
   - Email sending attempt
   - Success/error messages

---

## **🎨 Email Template Features:**

### **Professional Design:**
- **Branded Header**: URBAN NUCLEUS logo and tagline
- **Modern Layout**: Clean, responsive design
- **Brand Colors**: Purple gradient theme
- **Professional Typography**: Poppins font family

### **Security Features:**
- **1-Hour Expiry**: Clear security notice
- **Secure Reset Button**: Professional call-to-action
- **Fallback Link**: Copy-paste option
- **Brand Verification**: Official store email

---

## **🔧 Troubleshooting:**

### **Common Issues & Solutions:**

#### **1. "Email configuration error"**
**Problem:** Gmail authentication failed
**Solution:** 
- Verify 2FA is enabled
- Check App Password is correct (16 characters, no spaces)
- Ensure you're using App Password, not regular password

#### **2. "Invalid credentials"**
**Problem:** Wrong email or password
**Solution:**
- Double-check `urban.nucleus@gmail.com` spelling
- Verify App Password is copied correctly
- Check for extra spaces in password

#### **3. "Service not found"**
**Problem:** Nodemailer service error
**Solution:**
- Ensure `gmail` service is specified
- Check internet connection
- Verify Gmail account is active

#### **4. "Rate limit exceeded"**
**Problem:** Too many email attempts
**Solution:**
- Wait 1 hour before trying again
- Check Gmail sending limits
- Consider upgrading to business account

---

## **📱 Testing Checklist:**

### **Frontend Testing:**
- [ ] Forgot password link works
- [ ] Form submits without errors
- [ ] Loading states display correctly
- [ ] Success/error messages show properly

### **Backend Testing:**
- [ ] Server starts without errors
- [ ] Email configuration loads
- [ ] Reset tokens generate successfully
- [ ] Email sending works (or graceful fallback)

### **Email Testing:**
- [ ] Check spam folder
- [ ] Verify sender is `urban.nucleus@gmail.com`
- [ ] Test reset link functionality
- [ ] Confirm 1-hour expiry works

---

## **🚀 Production Deployment:**

### **When Moving to Live Domain:**

1. **Update `email-config.js`:**
   ```javascript
   resetUrl: {
     baseUrl: 'https://yourdomain.com', // Change from localhost
     path: '/reset-password.html'
   }
   ```

2. **Consider Email Service Upgrade:**
   - **SendGrid**: Professional email delivery
   - **Mailgun**: Reliable transactional emails
   - **Amazon SES**: Cost-effective for high volume

3. **Environment Variables:**
   ```bash
   EMAIL_USER=urban.nucleus@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_SERVICE=gmail
   ```

---

## **✅ Success Indicators:**

### **You'll Know It's Working When:**
- ✅ Backend console shows "Email server is ready"
- ✅ Forgot password form submits successfully
- ✅ Reset tokens generate in console
- ✅ Beautiful emails arrive in inbox
- ✅ Password reset flow works end-to-end

### **Expected Console Output:**
```
Starting server...
MySQL connected successfully!
Email server is ready to send messages
Password reset link generated
Reset token: abc123def456...
Reset URL: http://localhost:5500/reset-password.html?token=...
```

---

## **🎉 Ready to Test!**

Your email system is now configured for professional password reset emails. Users will receive beautiful, branded emails that build trust and provide a seamless recovery experience.

**Next Steps:**
1. Complete the Gmail setup above
2. Test the forgot password flow
3. Verify emails are being sent
4. Enjoy professional password recovery! 🚀

---

## **📞 Need Help?**

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all steps were completed
3. Check backend console for error messages
4. Ensure Gmail account is properly configured

Your URBAN NUCLEUS store deserves professional email functionality! ✨

