import Database from '../../helpers/database';

const sql = new Database();

const Votes = function () {

};

Votes.addVote = function addVote(trackId, userId, vote) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO Votes (TrackId, UserId, Vote) VALUES ?;';
    const values = [[trackId, userId, vote]];

    sql.query(query, [values])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

export default Votes;
