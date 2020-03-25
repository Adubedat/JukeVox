import sql from '../../helpers/database';

const Votes = function () {

};

Votes.addVote = function addVote(trackId, userId, vote) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO Votes (TrackId, UserId, Vote) VALUES ? ON DUPLICATE KEY UPDATE Vote = ?;';
    const values = [[trackId, userId, vote]];

    sql.query(query, [values, vote])
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

Votes.getVotesSumForTrack = function getVotesSumForTrack(trackId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT TrackId, SUM(Vote) AS SumOfVotesForTrack FROM Votes WHERE TrackId = ?;';

    sql.query(query, trackId)
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });
};

export default Votes;
