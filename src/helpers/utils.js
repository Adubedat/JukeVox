import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../server/models/userModel';

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
