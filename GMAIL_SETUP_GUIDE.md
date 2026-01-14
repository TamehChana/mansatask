# Gmail SMTP Setup Guide

This guide will help you set up Gmail SMTP for sending email notifications from the Payment Link Platform.

---

## 📋 Prerequisites

- A Gmail account
- Access to your Google Account settings

---

## 🔐 Step 1: Enable 2-Step Verification

Gmail requires 2-Step Verification to be enabled before you can generate an App Password.

1. **Go to your Google Account**
   - Visit: https://myaccount.google.com/
   - Sign in with your Gmail account

2. **Navigate to Security Settings**
   - Click on **"Security"** in the left sidebar
   - Or go directly to: https://myaccount.google.com/security

3. **Enable 2-Step Verification**
   - Scroll down to **"How you sign in to Google"** section
   - Find **"2-Step Verification"**
   - Click on it
   - Click **"Get Started"** or **"Turn On"**
   - Follow the prompts to set up 2-Step Verification
   - You'll need:
     - Your phone number
     - A verification code sent to your phone
   - Complete the setup process

**Note:** If 2-Step Verification is already enabled, skip to Step 2.

---

## 🔑 Step 2: Generate App Password

Once 2-Step Verification is enabled, you can generate an App Password.

1. **Go to App Passwords**
   - Visit: https://myaccount.google.com/apppasswords
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords

2. **Sign In (if prompted)**
   - You may need to sign in again

3. **Select App and Device**
   - **App:** Select **"Mail"** from the dropdown
   - **Device:** Select **"Other (Custom name)"**
   - Enter a name like: **"Payment Link Platform"** or **"NestJS Email Service"**
   - Click **"Generate"**

4. **Copy the App Password**
   - Google will display a **16-character password**
   - It will look like: `abcd efgh ijkl mnop`
   - **Important:** Copy this password immediately - you won't be able to see it again!
   - Remove the spaces when using it (it should be: `abcdefghijklmnop`)

---

## ⚙️ Step 3: Configure Environment Variables

Add the following to your `.env` file in the `backend` directory:

```env
# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM=your-email@gmail.com
```

### Replace the values:

- **EMAIL_USER**: Your Gmail address (e.g., `john.doe@gmail.com`)
- **EMAIL_PASS**: The 16-character App Password you generated (without spaces)
- **EMAIL_FROM**: Usually the same as EMAIL_USER (the "from" address for emails)

### Example:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=john.doe@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=john.doe@gmail.com
```

**Note:** In the `.env` file, you can keep the spaces in the App Password or remove them - both work.

---

## ✅ Step 4: Verify Setup

1. **Restart your backend server** (if it's running)
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Check the logs** when the server starts
   - You should see: `Email transporter connection verified`
   - If you see an error, check your credentials

3. **Test email sending** (optional)
   - Make a test payment that succeeds
   - Check if the email is sent to the customer

---

## 🔒 Security Best Practices

1. **Never commit `.env` file to Git**
   - Make sure `.env` is in your `.gitignore`
   - Use `.env.example` for documentation

2. **Keep App Passwords secure**
   - Don't share your App Password
   - If compromised, revoke it and generate a new one

3. **Use different App Passwords for different environments**
   - Development: One App Password
   - Production: Another App Password

4. **Revoke unused App Passwords**
   - Regularly check your App Passwords
   - Revoke any you're not using

---

## 🐛 Troubleshooting

### Error: "Invalid login credentials"

**Possible causes:**
- App Password is incorrect (check for typos)
- 2-Step Verification is not enabled
- Using regular Gmail password instead of App Password

**Solution:**
- Verify 2-Step Verification is enabled
- Generate a new App Password
- Make sure you're using the App Password, not your regular password

### Error: "Connection timeout"

**Possible causes:**
- Firewall blocking port 587
- Network issues

**Solution:**
- Check firewall settings
- Try using port 465 with `secure: true` (requires code change)

### Error: "Email transporter verification failed"

**Possible causes:**
- Incorrect SMTP settings
- Gmail account restrictions

**Solution:**
- Double-check all environment variables
- Verify Gmail account is active
- Check if "Less secure app access" is needed (deprecated, use App Passwords instead)

---

## 📝 Quick Reference

| Setting | Value |
|---------|-------|
| SMTP Host | `smtp.gmail.com` |
| SMTP Port | `587` (TLS) or `465` (SSL) |
| Security | TLS (port 587) or SSL (port 465) |
| Authentication | Required (App Password) |
| 2-Step Verification | Required |

---

## 🔄 Revoking an App Password

If you need to revoke an App Password:

1. Go to: https://myaccount.google.com/apppasswords
2. Find the App Password you want to revoke
3. Click the **"X"** or **"Revoke"** button
4. Generate a new one if needed

---

## 📚 Additional Resources

- [Google Account Security](https://myaccount.google.com/security)
- [App Passwords Help](https://support.google.com/accounts/answer/185833)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)

---

## ✅ Checklist

- [ ] 2-Step Verification enabled on Google Account
- [ ] App Password generated
- [ ] App Password copied (16 characters)
- [ ] Environment variables added to `.env` file
- [ ] Backend server restarted
- [ ] Email transporter connection verified in logs
- [ ] Test email sent successfully

---

**Need Help?** If you encounter any issues, check the troubleshooting section above or refer to Google's official documentation.



