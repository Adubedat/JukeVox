import moment from 'moment';
import DATETIME_FORMAT from '../constants';
import sql from '../../helpers/database';

const Tracks = function () {

};

Tracks.addTrack = function addTrack(userId, eventId, content) {
  return new Promise((resolve, reject) => {
    const addedAt = moment().format(DATETIME_FORMAT);
    const query = 'INSERT INTO Tracks (EventId, UserId, DeezerSongId, \
      Title, Duration, ArtistName, PictureSmall, PictureBig, AddedAt) \
    VALUES ? ';
    const values = [[eventId, userId, content.deezerSongId, content.title, content.duration,
      content.artistName, content.pictureSmall, content.pictureBig, addedAt]];

    sql.query(query, [values])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

export default Tracks;
