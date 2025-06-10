import nodemailer from 'nodemailer';

// Konfiguracija transportera za Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tennisoraclenoreply@gmail.com',
    pass: 'sjxx bjwj nrof ghkc' // app password iz Gmaila
  }
});

// Funkcija za slanje verifikacijskog maila
const sendVerificationEmail = async (to, token) => {
  const verificationLink = `https://tennisoracle.com/verify?token=${token}`;

  await transporter.sendMail({
    from: '"Tennis Oracle" <tennisoraclenoreply@gmail.com>',
    to,
    subject: 'Verifikacija računa',
    html: `<p>Klikni ovdje da potvrdiš svoj račun: <a href="${verificationLink}">${verificationLink}</a></p>`
  });
};

export default transporter;