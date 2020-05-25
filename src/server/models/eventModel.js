import { ErrorResponseHandler } from '../../helpers/error';

import sql from '../../helpers/database';

const Event = function () {

};

Event.createNewEvent = function createNewEvent(creatorId, content) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO Events (CreatorId, Name, Description, \
            EventPicture, StartDate, EndDate, Location, Latitude, Longitude, \
            StreamerDevice, IsPrivate, RestrictVotingToEventHours) VALUES ?;';
    const values = [[creatorId, content.name, content.description, content.eventPicture,
      content.startDate, content.endDate, content.location, content.latitude, content.longitude,
      content.streamerDevice, content.isPrivate, content.restrictVotingToEventHours]];

    sql.query(query, [values])
      .then((res) => {
        resolve(res);
      })
      .catch((err) => reject(err));
  });
};

Event.addGuest = function addGuestToEvent(eventId, guestId, hasPlayerControl, guestStatus) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO EventGuests (EventId, GuestId, \
      HasPlayerControl, GuestStatus) VALUES ?;';
    const values = [[eventId, guestId, hasPlayerControl, guestStatus]];

    sql.query(query, [values])
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        if (err.code === 'ER_DUP_ENTRY') {
          const customError = new ErrorResponseHandler(409, 'Guest already invited or attending');
          reject(customError);
        }
        reject(err);
      });
  });
};

Event.getEvent = function getEvent(eventId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM Events WHERE Id = ?';
    sql.query(query, eventId)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Event.getPublicEvents = function getPublicEvents(userId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT \
      Events.*, \
      (SELECT GuestStatus FROM EventGuests WHERE EventId = Events.Id AND GuestId = ?) as GuestStatus, \
      UserProfiles.Username as CreatorUsername \
    FROM \
      Events \
      JOIN UserProfiles ON Events.CreatorId = UserProfiles.Id \
    WHERE IsPrivate = false ORDER BY StartDate;';
    sql.query(query, userId)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Event.getEventsByUser = function getEventsByUser(userId, filters) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT \
        EventGuests.GuestStatus, \
        Events.*, \
        UserProfiles.Username as CreatorUsername \
      FROM \
        Events \
        JOIN EventGuests ON Events.Id = EventGuests.EventId \
        JOIN UserProfiles ON Events.CreatorId = UserProfiles.Id \
      WHERE \
        EventGuests.GuestId = ?';

    filters.forEach((filter) => {
      let conjunction = 'AND (';
      if (filters.indexOf(filter) > 0) {
        conjunction = 'OR';
      }
      query += ` ${conjunction} EventGuests.GuestStatus = '${filter}'`;
    });
    if (filters[0]) {
      query += ')';
    }
    query += ' ORDER BY StartDate;';
    sql.query(query, userId)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Event.updateEvent = function updateEvent(eventId, body) {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE Events SET Name = ?, Description = ?, \
    EventPicture = ?, StartDate = ?, EndDate = ?, Location = ?, \
    Latitude = ?, Longitude = ?, StreamerDevice = ?, isPrivate = ? \
    WHERE Id = ?;';

    const values = [
      body.name,
      body.description,
      body.eventPicture,
      body.startDate,
      body.endDate,
      body.location,
      body.latitude,
      body.longitude,
      body.streamerDevice,
      body.isPrivate,
      eventId,
    ];
    sql.query(query, values)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Event.getEventGuests = function getEventGuests(eventId, filters) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT \
      EventGuests.GuestStatus, \
      UserProfiles.Id, \
      UserProfiles.Username, \
      UserProfiles.ProfilePicture \
    FROM \
      UserProfiles \
      JOIN EventGuests ON UserProfiles.Id = EventGuests.GuestId \
    WHERE \
      EventGuests.EventId = ?';

    filters.forEach((filter) => {
      let conjunction = 'AND (';
      if (filters.indexOf(filter) > 0) {
        conjunction = 'OR';
      }
      query += ` ${conjunction} EventGuests.GuestStatus = '${filter}'`;
    });
    if (filters[0]) {
      query += ');';
    }

    sql.query(query, eventId)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Event.getGuestStatusForEvent = function getGuestStatusForEvent(userId, eventId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT \
        GuestStatus \
      FROM \
        EventGuests \
      WHERE \
        GuestId = ? AND EventId = ?;';

    sql.query(query, [userId, eventId])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Event.updateGuestStatus = function updateGuestStatus(userId, eventId, guestStatus) {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE EventGuests SET GuestStatus = ? \
    WHERE GuestId = ? AND EventId = ?;';

    sql.query(query, [guestStatus, userId, eventId])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Event.changePlayerControllers = function changePlayerControllers(eventId, guestId, hasControl) {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE EventGuests SET HasPlayerControl = ? \
    WHERE GuestId = ? AND EventId = ?;';

    sql.query(query, [hasControl, guestId, eventId])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Event.getPlayerControllers = function getPlayerControllers(eventId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT GuestId FROM EventGuests \
    WHERE EventId = ? AND GuestStatus = "Going" AND HasPlayerControl = true';

    sql.query(query, eventId)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Event.getPlayerControllerStatus = function getPlayerControllerStatus(eventId, guestId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM EventGuests \
    WHERE EventId = ? AND GuestId = ? AND GuestStatus = "Going" AND HasPlayerControl = true';

    sql.query(query, [eventId, guestId])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Event.deleteEventGuest = function deleteEventGuest(eventId, guestId) {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM EventGuests WHERE EventId = ? AND GuestId = ?;';
    const values = [eventId, guestId];

    sql.query(query, values)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

export default Event;
