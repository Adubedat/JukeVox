import Database from '../../helpers/database';

const sql = new Database();

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

export default Friendships;
