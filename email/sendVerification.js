const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

function sendVerificationEmail(email, token) {
  const link = `http://localhost:${process.env.PORT || 3000}/verify?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your Email for Pet Login',
    html: `
      <h2>Email Verification</h2>
      <p>Please click the link below to verify your email address:</p>
      <p><a href="${link}">${link}</a></p>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = sendVerificationEmail;
