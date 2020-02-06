import Database from '../../helpers/database';

const sql = new Database();

const Event = function () {

};

Event.createNewEvent = function createNewEvent(creatorId, content) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO Events (CreatorId, Name, Description, \
            EventPicture, StartDate, EndDate, Latitude, Longitude, \
            StreamerDevice, IsPrivate) VALUES ?';
    const values = [[creatorId, content.name, content.description, content.eventPicture,
      content.startDate, content.endDate, content.latitude, content.longitude,
      content.streamerDevice, content.isPrivate]];

    sql.query(query, [values])
      .then((res) => {
        resolve(res);
      })
      .catch((err) => reject(err));
  });
};

export default Event;
