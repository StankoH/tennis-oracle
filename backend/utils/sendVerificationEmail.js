import mailer from '../utils/mailer.js';
import jwt from 'jsonwebtoken';

const transporter = mailer;

const sendVerificationEmail = async (email, user) => {
    console.log('[MAILER] Verification email sent to:', email);
  const token = jwt.sign(
    { email: email, id: user._id }, // sad je "email" dostupan
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log('[MAILER] Preview token:', token);

  const verificationLink = `http://localhost:4200/verify?token=${token}`;

  console.log('[MAILER] Preview link:', verificationLink);
  await transporter.sendMail({
    from: '"Bonzobyte" <noreply@bonzobyte.com>',
    to: email,
    subject: "Please verify your email address",
    html: `
      <h3>Welcome to Bonzobyte!</h3>
      <p>Please confirm your email address by clicking the link below:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>If you didn’t register, just ignore this message.</p>
    `
  });

  //console.log('[MAILER] Verification email sent to:', email);
//   console.log('[MAILER] Preview token:', token);
};

export default sendVerificationEmail;
