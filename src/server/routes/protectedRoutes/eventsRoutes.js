import express from 'express';
import { createEvent } from '../../controller/event/createEvent';

const router = express.Router();

router.route('/')
  .post(createEvent);

export default router;
