import sql from '../../helpers/database';

const Friendships = function () {

};

Friendships.createFriendship = function createFriendship(requesterId, addresseeId) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO Friendships (RequesterId, AddresseeId) VALUES ?';
    const values = [[requesterId, addresseeId]];

    sql.query(query, [values])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Friendships.deleteFriendship = function deleteFriendship(requesterId, addresseeId) {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM Friendships WHERE RequesterId = ? AND AddresseeId = ?';
    const values = [requesterId, addresseeId];

    sql.query(query, values)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Friendships.getFriends = function getFriends(requesterId) {
  return new Promise((resolve, reject) => {
    const query = ' \
        SELECT \
            users.Id, \
            users.Username, \
            users.ProfilePicture \
        FROM \
            UserProfiles users \
            JOIN \
            (SELECT * FROM Friendships WHERE RequesterId = ?) AS friendships \
            ON \
            friendships.AddresseeId = users.Id;';

    const values = [requesterId];

    sql.query(query, values)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

export default Friendships;
