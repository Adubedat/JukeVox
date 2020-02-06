import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../server/models/userModel';
import ErrorResponseHandler from './error';

async function checkTokenIsUnique(token) {
  const response = await User.getUserAccount(['EmailConfirmationString'], [token]);
  if (response.length > 0) {
    return false;
  }
  return true;
}

export async function generateUniqueToken() {
  const token = crypto.randomBytes(24).toString('hex');
  if (!(await checkTokenIsUnique(token))) {
    return generateUniqueToken();
  }
  return token;
}

export function generateJwt(userId) {
  const payload = {
    userId,
  };
  const expiresIn = 3600 * 24 * 365; // one year
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}


// TODO: sending the email is async. We should wait for it in order to catch errors before
// returning the 200 status code.
// TODO: Make it a generic function sendEmail

export function sendConfirmationEmail(email, emailConfirmationString) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  const message = {
    from: 'noreply@domain.com',
    to: email,
    subject: 'Confirm your email',
    text: `Please click the following link to validate your email : http://localhost:5000/users/verify/${emailConfirmationString}`,
    html: `<p>Please click the following link to validate your email : http://localhost:5000/users/verify/${emailConfirmationString}</p>`,
  };

  transporter.sendMail(message, (err, info) => {
    if (err) {
      console.log(err);
      throw new ErrorResponseHandler(500, 'Internal server Error');
    }
    return console.log('Message sent: %s', info.messageId);
  });
}
