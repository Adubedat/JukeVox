import Friendships from '../../models/friendshipsModel';

export default async function getMeFriends(req, res, next) {
  const { userId } = req.decoded;

  try {
    const friends = await Friendships.getFriends(userId);
    res.status(200).send({
      message: 'OK',
      statusCode: 200,
      friends,
    });
  } catch (err) {
    next(err);
  }
}
