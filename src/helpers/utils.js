import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../server/models/userModel';

async function checkTokenIsUnique(token) {
  const response = await User.getUserAccount(['ConfirmationToken'], [token]);
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

export async function generateUsername() {
  const username = `user_${Math.floor(Math.random() * 100000000000000)}`;
  const [userProfile] = await User.getUserProfile(['Username'], [username]);
  if (userProfile !== undefined) {
    return generateUsername();
  }
  return username;
}
