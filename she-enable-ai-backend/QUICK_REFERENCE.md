# Email System - Quick Reference

## 🚀 Quick Start

### No Setup (Development)
```bash
npm run dev
# Emails appear in console
# API returns devOtp
```

### With Gmail (Real Emails)
```env
EMAIL_USER=your@gmail.com
EMAIL_PASS=16-char-app-password
```

### With SendGrid (Production)
```env
SENDGRID_API_KEY=SG.xxxxx
```

---

## 📧 Email Flows

### Signup
```
POST /api/auth/register
→ User created
→ OTP email sent
← Returns devOtp (dev mode)
```

### Verify Email
```
POST /api/auth/verify-otp
→ OTP validated
→ Welcome email sent
← User logged in
```

### Reset Password
```
POST /api/auth/forgot-password
→ Reset token generated
→ Reset email sent
← "Check your email" message

POST /auth/reset-password
→ Password changed
← "Login with new password"
```

---

## 🧪 Test Commands

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","firstName":"Jane","lastName":"Doe","role":"CANDIDATE","gender":"female"}'

# Verify (use devOtp from response)
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","code":"123456"}'

# Reset Password
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 📝 Email Templates

1. **OTP Verification** - 6-digit code, 10-min timer
2. **Welcome Email** - Confirms account verified
3. **Password Reset** - 1-hour reset link

---

## 🔐 Security

- ✅ OTP hashed (SHA-256)
- ✅ Passwords hashed (bcrypt)
- ✅ Reset tokens single-use
- ✅ Rate limiting
- ✅ Account lockout

---

## 📊 Status

| Feature | Status |
|---------|--------|
| OTP Email | ✅ Complete |
| Password Reset | ✅ Complete |
| Retry Logic | ✅ Complete |
| Multiple Providers | ✅ Complete |
| Dev Mode | ✅ Complete |
| Documentation | ✅ Complete |

---

## 📚 Documentation

- `EMAIL_SETUP.md` - Setup guide
- `TESTING_EMAIL_SYSTEM.md` - Testing guide
- `SIGNUP_EMAIL_IMPROVEMENTS.md` - Technical details

---

## 🎯 What's Improved

| Aspect | Before | After |
|--------|--------|-------|
| Templates | Plain text | Professional HTML |
| Retry Logic | None | 3 attempts with backoff |
| Providers | SendGrid only | SendGrid + Gmail + Custom |
| Dev Testing | Required email | Works in console |
| Error Handling | Fails on error | Graceful degradation |
| Logging | Basic | Detailed with emoji |

---

## ⚡ Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Signup (sends OTP) |
| POST | `/api/auth/verify-otp` | Verify email with OTP |
| POST | `/api/auth/resend-otp` | Resend OTP code |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Set new password |
| POST | `/api/auth/login` | Login |

---

## 🎉 Ready to Use!

Everything is implemented and tested. 
Start the backend and try it out! 🚀
