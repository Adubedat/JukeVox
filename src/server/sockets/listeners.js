import jwt from 'jsonwebtoken';
import {
  joinEvent, leaveEvent, changeStatusOfMusic, updateStatusOfMusicFromOwner, emitOwnerIsHere, pingOwner,
} from './socketControllers/eventSocketController';
import logger from '../../helpers/logger';

export default function initListeners(io) {
  io.use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
      jwt.verify(socket.handshake.query.token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return next(new Error('Authentication error'));
        }
        socket.decoded = decoded;

        next();
      });
    } else {
      next(new Error('Authentication error'));
    }
  })
    .on('connection', (socket) => {
      // connection now authenticated to receive further events
      const { userId } = socket.decoded;

      logger.info(`User ${userId} connected to socket`,
        { userAgent: socket.handshake.headers['user-agent'], IP: socket.handshake.address });

      socket.on('join_event', (data) => {
        const { eventId } = data;
        logger.info(`User ${userId} called 'join_event' socket event with eventId = ${eventId}`,
          { userAgent: socket.handshake.headers['user-agent'], IP: socket.handshake.address });
        if (eventId === undefined) {
          socket.emit('exception', {
            code: 401, message: 'Missing data', event: 'join_event', eventId,
          });
        } else {
          joinEvent(userId, eventId, socket, io);
        }
      });

      socket.on('leave_event', (data) => {
        const { eventId, status } = data;
        logger.info(`User ${userId} called 'leave_event' socket event with eventId = ${eventId}, status = ${status}`,
          { userAgent: socket.handshake.headers['user-agent'], IP: socket.handshake.address });
        if (eventId === undefined || status === undefined) {
          socket.emit('exception', {
            code: 401, message: 'Missing data', event: 'leave_event', eventId,
          });
        } else {
          leaveEvent(userId, eventId, status, socket, io);
        }
      });

      socket.on('remote_controller', (data) => {
        const { eventId, status } = data;
        logger.info(`User ${userId} called 'remote_controller' socket event with eventId = ${eventId}, status = ${status}`,
          { userAgent: socket.handshake.headers['user-agent'], IP: socket.handshake.address });
        if (eventId === undefined || status === undefined) {
          socket.emit('exception', {
            code: 401, message: 'Missing data', event: 'remote_controller', eventId,
          });
        } else {
          changeStatusOfMusic(userId, eventId, status, socket, io);
        }
      });

      socket.on('owner_music_status_change', (data) => {
        const { eventId, status } = data;
        logger.info(`User ${userId} called 'owner_music_status_change' socket event with eventId = ${eventId}, status = ${status}`,
          { userAgent: socket.handshake.headers['user-agent'], IP: socket.handshake.address });
        if (eventId === undefined || status === undefined) {
          socket.emit('exception', {
            code: 401, message: 'Missing data', event: 'owner_music_status_change', eventId,
          });
        } else {
          updateStatusOfMusicFromOwner(userId, eventId, status, socket, io);
        }
      });

      socket.on('owner_is_here', (data) => {
        const {
          eventId, ownerInRoom, ownerDeezerConnected, playerStatus,
        } = data;
        logger.info(`User ${userId} called 'owner_is_here' socket event with eventId = ${eventId}, ownerInRoom = ${ownerInRoom},
          ownerDeezerConnected = ${ownerDeezerConnected}, playerStatus = ${playerStatus}`,
        { userAgent: socket.handshake.headers['user-agent'], IP: socket.handshake.address });
        if (eventId === undefined || ownerInRoom === undefined || ownerDeezerConnected === undefined || playerStatus === undefined) {
          socket.emit('exception', {
            code: 401, message: 'Missing data', event: 'owner_is_here', eventId,
          });
        } else {
          emitOwnerIsHere(userId, eventId, ownerInRoom, ownerDeezerConnected, playerStatus, socket, io);
        }
      });

      socket.on('can_i_play', (data) => {
        const { eventId } = data;
        logger.info(`User ${userId} called 'can_i_play' socket event with eventId = ${eventId}`,
          { userAgent: socket.handshake.headers['user-agent'], IP: socket.handshake.address });
        if (eventId === undefined) {
          socket.emit('exception', {
            code: 401, message: 'Missing data', event: 'can_i_play', eventId,
          });
        } else {
          pingOwner(userId, eventId, socket, io);
        }
      });

      socket.on('disconnect', () => {
        logger.info(`User ${userId} disconnected`,
          { userAgent: socket.handshake.headers['user-agent'], IP: socket.handshake.address });
      });
    });
}
