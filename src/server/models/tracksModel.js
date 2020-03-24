import moment from 'moment';
import DATETIME_FORMAT from '../constants';
import sql from '../../helpers/database';

const Tracks = function () {

};

Tracks.addTrack = function addTrack(userId, eventId, track) {
  return new Promise((resolve, reject) => {
    const addedAt = moment().format(DATETIME_FORMAT);
    const query = 'INSERT INTO Tracks (EventId, UserId, DeezerSongId, \
      Title, Duration, ArtistName, PictureSmall, PictureBig, AddedAt) \
    VALUES ? ';
    const values = [[eventId, userId, track.id, track.title, track.duration,
      track.artist.name, track.album.cover_small, track.album.cover_big, addedAt]];

    sql.query(query, [values])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Tracks.deleteTrack = function deleteTrack(trackId) {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM Tracks WHERE Id = ?';
    const values = [trackId];

    sql.query(query, [values])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Tracks.getTrack = function getTrack(trackId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM Tracks WHERE Id = ?';
    const values = [trackId];

    sql.query(query, [values])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Tracks.getTracksForEvent = function getTracksForEvent(eventId, userId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT \
      Tracks.*, \
      SUM(Votes.Vote) as VotesSum, \
      (SELECT vote FROM Votes WHERE TrackId = Tracks.Id AND UserId = ?) as UserVote \
    FROM \
      Tracks  \
      LEFT JOIN Votes ON Tracks.Id = Votes.TrackId \
    WHERE Tracks.EventId = ? \
    GROUP BY Tracks.Id \
    ORDER BY VotesSum DESC, AddedAt';

    const values = [userId, eventId];

    sql.query(query, values)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

export default Tracks;
