import argon2 from 'argon2';
import { validateEmail, validatePassword, validateUsername } from '../../../helpers/validation';
import User from '../../models/userModel';
import { generateUniqueToken } from '../../../helpers/utils';
import { sendEmailConfirmationLink } from '../../../helpers/sendMailWithTemplate';

export default async function createUser(req, res, next) {
  const { username, email, password } = req.body;

  try {
    await validateUsername(username);
    await validateEmail(email);
    validatePassword(password);
    const hash = await argon2.hash(password);
    const [token, userProfile] = await Promise.all([generateUniqueToken(),
      User.createUserProfile(username, email)]);
    const userAccount = await User.createUserAccount(userProfile.insertId, email, hash, token);
    await sendEmailConfirmationLink(email, username, userAccount.emailConfirmationString);
    res.status(201).send({
      message: 'User created. Please check your mail!',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
}
