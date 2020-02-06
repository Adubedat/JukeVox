import { ErrorResponseHandler } from '../../../helpers/error';
import Event from '../../models/eventModel';


export async function createEvent(req, res, next) {
  const { userId } = req.decoded;
  try {
    // TODO: verify all fields in req.body are correct
    // TODO: check if any unknown fields in req.body
    const response = await Event.createNewEvent(userId, req.body);
    // TODO: Check response is valid
    res.status(200).send({
      statusCode: 200,
      message: 'Event successfully created!',
      data: response[0],
    });
  } catch (err) {
    next(err);
  }
}

export async function getEvent(req, res, next) {

}
