import { ErrorResponseHandler } from '../../helpers/error';

import sql from '../../helpers/database';

const Event = function () {

};

Event.createNewEvent = function createNewEvent(creatorId, content) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO Events (CreatorId, Name, Description, \
            EventPicture, StartDate, EndDate, Location, Latitude, Longitude, \
            StreamerDevice, IsPrivate) VALUES ?;';
    const values = [[creatorId, content.name, content.description, content.eventPicture,
      content.startDate, content.endDate, content.location, content.latitude, content.longitude,
      content.streamerDevice, content.isPrivate]];

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
        // TODO: Check if this is best practice. Also see if useful printing console log in the error handling
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

Event.getPublicEvents = function getPublicEvents() {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM Events WHERE IsPrivate = false';
    sql.query(query)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Event.getEventsByUser = function getEventsByUser(userId, filters) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT \
        EventGuests.GuestStatus, \
        Events.* \
      FROM \
        Events \
        JOIN EventGuests ON Events.Id = EventGuests.EventId \
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
      query += ');';
    }
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

export default Event;
