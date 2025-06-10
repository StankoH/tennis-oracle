import mailer from '../utils/mailer.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

const transporter = mailer;
dotenv.config();

const sendResetPasswordEmail = async (email, user) => {
    console.log('[MAILER] Verification email for reseting password sent to:', email);
  const token = jwt.sign(
    { email: email, id: user._id }, 
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log('[MAILER] Preview token:', token);

  const verificationLink = `http://localhost:4200/reset-password?token=${token}`;

  console.log('[MAILER] Preview link:', verificationLink);
  await transporter.sendMail({
    from: '"Bonzobyte" <noreply@bonzobyte.com>',
    to: email,
    subject: "Please verify resseting your password",
    html: `
      <h3>Welcome to Bonzobyte!</h3>
      <p>Please confirm you are resseting password by clicking the link below:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>If you didn’t register, just ignore this message.</p>
    `
  });

  //console.log('[MAILER] Verification email sent to:', email);
//   console.log('[MAILER] Preview token:', token);
};

export default sendResetPasswordEmail;
