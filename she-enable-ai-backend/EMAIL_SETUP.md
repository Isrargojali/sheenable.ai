# Email Configuration Guide

This guide explains how to set up email sending for SheEnableAI signup verification and password reset.

## Overview

The email system supports **3 different delivery methods**:

1. **SendGrid** (Production Recommended) ✅
2. **Gmail SMTP** (Development) 
3. **Custom SMTP Server** (Enterprise)

When no email service is configured, emails log to the console in development mode.

---

## Option 1: SendGrid (Recommended for Production)

SendGrid is a professional email delivery service perfect for production.

### Setup Steps

1. **Create a SendGrid Account**
   - Go to https://sendgrid.com/
   - Sign up for a free account
   - Verify your sender identity (domain or email)

2. **Generate API Key**
   - Navigate to Settings → API Keys
   - Click "Create API Key"
   - Select "Full Access"
   - Copy the API key

3. **Add to .env**
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx_xxxxxxxxxxxx
   FROM_EMAIL=noreply@yourdomain.com
   FROM_NAME=SheEnableAI
   ```

4. **Verify Sender Domain** (Production)
   - In SendGrid: Settings → Sender Authentication
   - Verify your domain or single sender email
   - This ensures reliable delivery

### Testing

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "CANDIDATE",
    "gender": "female"
  }'
```

Check SendGrid dashboard → Activity Feed to see email delivery status.

---

## Option 2: Gmail SMTP (For Development)

Use Gmail's SMTP server for testing emails in development.

### Setup Steps

1. **Enable 2-Step Verification**
   - Go to https://myaccount.google.com/
   - Click "Security" (left sidebar)
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Go to https://support.google.com/accounts/answer/185833
   - Select "Mail" and "Windows Computer" (or your OS)
   - Google generates a 16-character password
   - Copy this password

3. **Add to .env**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   ```

4. **Test Connection**
   ```bash
   npm run dev
   # Create an account or resend OTP
   # Check console for email logs
   ```

### Troubleshooting

- **"Invalid login credentials"** → Check your app password is 16 characters with spaces
- **"SMTP error: 454"** → Gmail blocked less secure apps. Use app password instead
- **Email not received** → Check spam folder or Gmail activity logs

---

## Option 3: Custom SMTP Server

For enterprise setups or company mail servers.

### Setup Steps

1. **Get SMTP Details from Your Host**
   - SMTP Host (e.g., mail.company.com)
   - SMTP Port (usually 587 or 465)
   - Email username and password
   - Whether SSL/TLS is required

2. **Add to .env**
   ```env
   SMTP_HOST=mail.company.com
   SMTP_PORT=587
   SMTP_SECURE=false
   EMAIL_USER=your-email@company.com
   EMAIL_PASS=your-password
   FROM_EMAIL=noreply@company.com
   FROM_NAME=SheEnableAI
   ```

3. **Test Connection**
   ```bash
   npm run dev
   # Verify emails appear in logs or recipient inbox
   ```

---

## Email Templates

### 1. OTP Verification Email
Sent when a candidate/employer signs up.

**Includes:**
- 6-digit verification code
- 10-minute expiration time
- Security warning

### 2. Password Reset Email
Sent when user requests password reset.

**Includes:**
- Password reset link (valid for 1 hour)
- Clickable button for convenience
- Security notice

### 3. Welcome Email
Sent after email verification succeeds.

**Includes:**
- Confirmation of account type
- Link to dashboard
- Next steps guidance

---

## Development Mode

When **no email service is configured**, the system logs emails to console:

```
📧 [DEV MODE] Email would be sent to: test@example.com
📝 Subject: Your SheEnableAI Verification Code
💡 Configure SENDGRID_API_KEY for production or EMAIL_USER/EMAIL_PASS for real emails
```

**Advantages:**
- ✅ No dependencies on external services
- ✅ Emails visible in console for debugging
- ✅ Perfect for local development

**Disadvantages:**
- ❌ No actual emails sent
- ❌ Can't test real email clients
- ❌ Need to copy OTP manually from logs

### Enable Dev OTP Display

In development mode (`NODE_ENV=development`), the register/resend endpoints return the OTP:

```json
{
  "success": true,
  "userId": "...",
  "devOtp": "123456"
}
```

The UI can display this for quick testing.

---

## Production Checklist

- [ ] SendGrid account created and verified
- [ ] API key added to `.env`
- [ ] Sender domain verified in SendGrid
- [ ] `FROM_EMAIL` matches verified domain
- [ ] `FRONTEND_URL` set to production domain
- [ ] `NODE_ENV=production`
- [ ] Test account signup → verify email → reset password
- [ ] Monitor SendGrid dashboard for bounce/delivery issues

---

## Monitoring & Troubleshooting

### Check Email Delivery

**SendGrid:**
- Dashboard → Activity Feed → View delivery status

**Gmail:**
- Gmail → Settings → Labels → "Sent Mail" (check for bounces)

### Common Issues

| Issue | Solution |
|-------|----------|
| Emails go to spam | Verify domain in SendGrid, add SPF/DKIM records |
| Rate limiting | Check if SendGrid rate limits exceeded or Gmail daily limits |
| Template errors | Check browser console for HTML rendering issues |
| Slow delivery | Gmail may delay in dev; SendGrid is faster |

---

## Testing Checklist

1. **Signup Flow**
   - [ ] User receives OTP email
   - [ ] OTP is valid for 10 minutes
   - [ ] Resend OTP works
   - [ ] Welcome email after verification

2. **Password Reset**
   - [ ] Forgot password sends reset link
   - [ ] Reset link valid for 1 hour
   - [ ] Password changes after reset
   - [ ] Old password no longer works

3. **Security**
   - [ ] OTP not exposed in API responses (except dev mode)
   - [ ] Passwords always hashed
   - [ ] Tokens expire correctly

---

## Support

For issues or questions:
1. Check `.env` configuration
2. Review server logs for detailed errors
3. Test with a simple email first
4. Check email provider's dashboard for delivery status

Happy coding! 🚀
