const { sendContactFormEmail } = require('../utils/sendEmail');

// Submit Contact Form
exports.submitContactForm = async (req, res, next) => {
  try {
    const { name, email, role, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields.'
      });
    }

    // Send email via configured SMTP / Nodemailer / SendGrid driver
    await sendContactFormEmail({
      name: name.trim(),
      email: email.trim(),
      role: role || 'GENERAL',
      message: message.trim()
    });

    res.status(200).json({
      success: true,
      message: 'Your message has been delivered successfully! Our team will get back to you shortly.'
    });
  } catch (err) {
    console.error('⚠️ Contact Form Delivery Failure:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to deliver contact message. Please try again or email contact@sheenableai.com directly.'
    });
  }
};
