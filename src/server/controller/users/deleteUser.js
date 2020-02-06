import User from '../../models/userModel';


export default async function deleteUser(req, res, next) {
  const { userId } = req.decoded;

  try {
    await Promise.all([
      User.deleteUserAccount(userId),
      User.deleteUserProviders(userId),
      User.updateUserProfile(userId, null, null, null),
    ]);
    res.send({
      message: 'User deleted',
      statusCode: 200,
    });
  } catch (err) {
    next(err);
  }
}
