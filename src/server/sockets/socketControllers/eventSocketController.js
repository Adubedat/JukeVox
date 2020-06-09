import Event from '../../models/eventModel';

export async function joinEvent(userId, eventId, socket, io) {
  try {
    const event = await Event.getEvent(eventId);
    if (event[0] === undefined) {
      socket.emit('exception', {
        code: 404, message: 'Event not found', event: 'join_event', eventId,
      });
      return;
    }

    const guestStatusResponse = await Event.getGuestStatusForEvent(userId, eventId);
    if (guestStatusResponse[0] == null || guestStatusResponse[0].GuestStatus !== 'Going') {
      socket.emit('exception', {
        code: 403, message: 'Forbidden. User not going', event: 'join_event', eventId,
      });
      return;
    }

    socket.join(eventId);
    socket.emit('success', {
      code: 200, message: 'Successfully joined event', event: 'join_event', eventId,
    });
  } catch (err) {
    console.log(err);
    socket.emit('exception', {
      code: 500, message: 'Internal Server Error', event: 'join_event', eventId,
    });
  }
}

export async function changeStatusOfMusic(userId, eventId, status, socket, io) {
  try {
    const playerController = await Event.getPlayerControllerStatus(eventId, userId);
    if (playerController[0] == null || playerController[0].HasPlayerControl !== 1) {
      socket.emit('exception', {
        code: 403, message: 'Forbidden. User not remote controller', event: 'remote_controller', eventId,
      });
      return;
    }

    io.to(eventId).emit('music_status_change', { data: { userId, eventId, status } });

    socket.emit('success', {
      code: 200, message: 'Successfully changed control', event: 'remote_controller', eventId,
    });
  } catch (err) {
    console.log(err);
    socket.emit('exception', {
      code: 500, message: 'Internal Server Error', event: 'remote_controller', eventId,
    });
  }
}

export async function updateStatusOfMusicFromOwner(userId, eventId, status, socket, io) {
  try {
    const event = await Event.getEvent(eventId);
    if (event[0] == null || event[0].CreatorId !== userId) {
      socket.emit('exception', {
        code: 403, message: 'Forbidden. User not owner', event: 'owner_music_status_change', eventId,
      });
      return;
    }

    io.to(eventId).emit('update_player_status', { data: { userId, eventId, status } });

    socket.emit('success', {
      code: 200, message: 'Successfully updated status', event: 'owner_music_status_change', eventId,
    });
  } catch (err) {
    console.log(err);
    socket.emit('exception', {
      code: 500, message: 'Internal Server Error', event: 'owner_music_status_change', eventId,
    });
  }
}

export async function emitOwnerIsHere(userId, eventId, ownerInRoom, ownerDeezerConnected, playerStatus, socket, io) {
  try {
    const event = await Event.getEvent(eventId);
    if (event[0] == null || event[0].CreatorId !== userId) {
      socket.emit('exception', {
        code: 403, message: 'Forbidden. User not owner', event: 'owner_is_here', eventId,
      });
      return;
    }

    io.to(eventId).emit('owner_is_in_room', {
      data: {
        userId, eventId, ownerInRoom, ownerDeezerConnected, playerStatus,
      },
    });

    socket.emit('success', {
      code: 200, message: 'Successfully emited owner_is_in_room', event: 'owner_is_here', eventId,
    });
  } catch (err) {
    console.log(err);
    socket.emit('exception', {
      code: 500, message: 'Internal Server Error', event: 'owner_is_here', eventId,
    });
  }
}

export async function pingOwner(userId, eventId, socket, io) {
  try {
    const guestStatusResponse = await Event.getGuestStatusForEvent(userId, eventId);
    if (guestStatusResponse[0] == null || guestStatusResponse[0].GuestStatus !== 'Going') {
      socket.emit('exception', {
        code: 403, message: 'Forbidden. User not going', event: 'can_i_play', eventId,
      });
      return;
    }

    io.to(eventId).emit('looking_for_owner', { data: { userId, eventId } });

    socket.emit('success', {
      code: 200, message: 'Successfully pinged for owner', event: 'can_i_play', eventId,
    });
  } catch (err) {
    console.log(err);
    socket.emit('exception', {
      code: 500, message: 'Internal Server Error', event: 'can_i_play', eventId,
    });
  }
}

export async function leaveEvent(userId, eventId, socket, io) {
  try {
    socket.leave(eventId);
    console.log(`User ${userId} just left the event ${eventId}`);
    socket.emit('success', {
      code: 200, message: 'Successfully left event', event: 'leave_event', eventId,
    });
  } catch (err) {
    console.log(err);
    socket.emit('exception', {
      code: 500, message: 'Internal Server Error', event: 'leave_event', eventId,
    });
  }
}
