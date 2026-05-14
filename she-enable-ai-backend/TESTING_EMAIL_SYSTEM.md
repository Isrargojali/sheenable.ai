# Email System Testing Guide

This guide provides step-by-step instructions to test the signup OTP and password reset email features.

---

## 🚀 Quick Start (Development Mode)

**No email setup needed!** Emails appear in your server console.

### Step 1: Start Backend Server
```bash
cd she-enable-ai-backend
npm run dev
```

You should see:
```
🚀 Server running in development mode on port 5000
```

### Step 2: Test Signup (Candidate)

Make a POST request or use the signup form:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@example.com",
    "password": "TestPass123!",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "CANDIDATE",
    "gender": "female"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "userId": "507f1f77bcf86cd799439011",
  "message": "Account created! Check your email for the verification code. If you don't see it, click \"Resend Code\".",
  "devOtp": "123456"
}
```

**In Server Console:**
```
📧 [DEV MODE] Email would be sent to: candidate@example.com
📝 Subject: Your SheEnableAI Verification Code
💡 Configure SENDGRID_API_KEY for production or EMAIL_USER/EMAIL_PASS for real emails

✅ OTP email sent to candidate@example.com
```

### Step 3: Verify OTP

Use the `devOtp` from response (`123456`) or check console:

```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "code": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "candidate@example.com",
      "role": "CANDIDATE",
      "firstName": "Jane",
      "lastName": "Doe",
      "isVerified": true
    }
  }
}
```

**In Server Console:**
```
✅ Email sent to candidate@example.com via SendGrid
📧 [DEV MODE] Email would be sent to: candidate@example.com
📝 Subject: Welcome to SheEnableAI - Your Account is Active!
```

---

## 🔑 Test Password Reset

### Step 1: Request Password Reset

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": null,
  "message": "If that email is registered, a password reset link has been sent"
}
```

**In Server Console:**
```
✅ Password reset email sent to candidate@example.com

📧 [DEV MODE] Email would be sent to: candidate@example.com
📝 Subject: SheEnableAI - Reset Your Password
```

### Step 2: Extract Reset Token

In development, the reset link is in the console logs. In production, it's sent via email.

**Example link:**
```
http://localhost:8080/auth/reset-password?token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
```

Extract the token: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...`

### Step 3: Reset Password

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "newPassword": "NewPass456!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Password reset successful. Please log in."
}
```

### Step 4: Login with New Password

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@example.com",
    "password": "NewPass456!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "candidate@example.com",
      "firstName": "Jane",
      "lastName": "Doe"
    }
  }
}
```

---

## 📧 Test with Real Email (Gmail)

### Prerequisites

1. Gmail account with 2-step verification enabled
2. Gmail App Password generated (16 characters)
3. See `EMAIL_SETUP.md` for detailed setup

### Step 1: Configure Environment

Update `.env` in `she-enable-ai-backend/`:

```env
NODE_ENV=development
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
FROM_EMAIL=noreply@sheenableai.com
FROM_NAME=SheEnableAI
```

### Step 2: Restart Backend

```bash
npm run dev
```

### Step 3: Test Signup

Use the same curl command as before. This time, check your Gmail inbox!

You should see:
1. OTP verification email with 6-digit code
2. Welcome email after verification
3. Password reset email

### Checking Gmail

- **Inbox:** Check for emails from "SheEnableAI <noreply@sheenableai.com>"
- **Spam:** Sometimes emails get filtered (mark as not spam)
- **Gmail Activity:** Settings → Security → Review recent activity

---

## 🧪 Test Scenarios

### Scenario 1: Signup → Verify → Login
- ✅ Sign up new user
- ✅ Receive OTP (or copy from console/API)
- ✅ Verify email
- ✅ Receive welcome email
- ✅ Login with credentials

### Scenario 2: Forgot Password
- ✅ Signup and verify account
- ✅ Click "Forgot password" on login page
- ✅ Receive password reset email
- ✅ Click reset link
- ✅ Set new password
- ✅ Login with new password

### Scenario 3: Resend OTP
- ✅ Signup with email
- ✅ Don't verify immediately
- ✅ Click "Resend Code"
- ✅ Receive new OTP
- ✅ Verify with new code

### Scenario 4: Invalid/Expired Codes
- ✅ Try invalid OTP code → error message
- ✅ Wait 10+ minutes → OTP expires → error message
- ✅ Try expired reset link (>1 hour) → error message

### Scenario 5: Employer Signup
- ✅ Sign up as employer
- ✅ Enter company name and size
- ✅ Receive OTP email
- ✅ Verify email
- ✅ Receive welcome email for employer

### Scenario 6: Security
- ✅ Resend OTP generates new code (old one invalid)
- ✅ Password hashed in database (not plain text)
- ✅ Reset link expires after 1 hour
- ✅ OTP expires after 10 minutes

---

## 🐛 Troubleshooting

### Email not appearing in console

**Solution:** Make sure `NODE_ENV=development` in .env

### "SMTP error: 535" (Gmail)

**Solution:** 
- Check app password is 16 characters with spaces
- Regenerate app password
- Verify 2-step verification is enabled

### Reset link not working

**Solution:**
- Make sure `FRONTEND_URL` in backend .env matches your frontend URL
- Check reset link hasn't expired (1 hour)
- Verify token wasn't modified

### OTP code always same

**Solution:** OTP is generated fresh each time. If you see same code twice, that's a bug. Check server logs.

### Email delivery in production

**SendGrid Dashboard:**
- Go to https://app.sendgrid.com/
- Click "Mail Send" → "Activity Feed"
- Filter by recipient email
- Check delivery status

---

## 📋 Test Checklist

- [ ] Backend starts without errors
- [ ] Dev mode: OTP appears in console
- [ ] Signup returns `devOtp` in development
- [ ] OTP email HTML is readable
- [ ] Welcome email has dashboard link
- [ ] Password reset email has reset link
- [ ] Can verify OTP and login
- [ ] Can reset password with link
- [ ] Invalid OTP shows error
- [ ] Expired OTP shows error
- [ ] Old password doesn't work after reset
- [ ] Employer signup shows employer welcome email
- [ ] Can resend OTP multiple times
- [ ] Rate limiting prevents abuse
- [ ] Server logs are clear (no errors)

---

## 📊 Performance Notes

**Expected Response Times:**
- Signup: <500ms (without email delivery)
- Verify OTP: <300ms
- Forgot Password: <500ms (without email delivery)
- Reset Password: <300ms
- Resend OTP: <500ms

**Email Delivery (Real Service):**
- With SendGrid: 1-3 seconds typically
- With Gmail: 2-5 seconds typically
- Retries add 1-2 seconds per attempt

---

## 🎯 Next Steps

1. ✅ Test all flows in development
2. ✅ Test with real email service (Gmail)
3. ✅ Deploy backend to production
4. ✅ Configure SendGrid for production
5. ✅ Test full production flow
6. ✅ Monitor email delivery
7. ✅ Setup error alerts

---

## Support

If emails aren't working:
1. Check server logs for error messages
2. Verify `.env` configuration
3. Check email provider dashboard
4. Review `EMAIL_SETUP.md` for setup steps
5. Test with `curl` commands above

Happy testing! 🎉
