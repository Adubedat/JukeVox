/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import moment from 'moment';
import DATETIME_FORMAT from '../../src/server/constants';
import sql from '../../src/helpers/database';
import logger from '../../src/helpers/logger';

import { generateJwt } from '../../src/helpers/utils';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../server');

const should = chai.should();
const { expect } = chai;

chai.use(chaiHttp);

describe('Events', () => {
  beforeEach(async () => {
    await sql.query('DELETE FROM TrackHistory');
    await sql.query('DELETE FROM Votes');
    await sql.query('DELETE FROM Tracks');
    await sql.query('DELETE FROM EventGuests;');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  after(async () => {
    await sql.query('DELETE FROM TrackHistory');
    await sql.query('DELETE FROM Votes');
    await sql.query('DELETE FROM Tracks');
    await sql.query('DELETE FROM EventGuests;');
    await sql.query('DELETE FROM Events;');
    await sql.query('DELETE FROM UserProfiles;');
  });

  async function addVote(trackId, userId, vote) {
    const query = 'INSERT INTO Votes (TrackId, UserId, Vote) VALUES ? ON DUPLICATE KEY UPDATE Vote = ?;';
    const values = [[trackId, userId, vote]];

    const voteInTable = await sql.query(query, [values, vote]).catch((err) => logger.error(err));
    return voteInTable;
  }

  async function addTrack(eventId, userId, day = 10) {
    const content = {
      deezerSongId: day,
      title: 'Song title',
      duration: 345,
      artistName: 'eminem',
      addedAt: `2031-05-${day} 05:05:05`,
    };

    const query = 'INSERT INTO Tracks (EventId, UserId, DeezerSongId, \
      Title, Duration, ArtistName, AddedAt) VALUES ?;';
    const values = [[eventId, userId, content.deezerSongId, content.title,
      content.duration, content.artistName, content.addedAt]];
    const track = await sql.query(query, [values])
      .catch((err) => logger.error(err));

    return track;
  }

  async function addEvent(creatorId) {
    const startDate = moment().add(3, 'd').format(DATETIME_FORMAT);
    const endDate = moment().add(4, 'd').format(DATETIME_FORMAT);

    const content = {
      name: 'House warming',
      description: 'All come over on wednesday for our housewarming!',
      startDate,
      endDate,
      location: '46 tests street',
      latitude: 48.8915482,
      longitude: 2.3170656,
      streamerDevice: 'abcd',
      isPrivate: true,
      eventPicture: 'defaultPicture1',
    };

    const eventQuery = 'INSERT INTO Events (CreatorId, Name, Description, \
        EventPicture, StartDate, EndDate, Location, Latitude, Longitude, \
        StreamerDevice, IsPrivate) VALUES ?;';
    const eventValues = [[creatorId, content.name, content.description, content.eventPicture,
      content.startDate, content.endDate, content.location, content.latitude, content.longitude,
      content.streamerDevice, content.isPrivate]];
    const event = await sql.query(eventQuery, [eventValues])
      .catch((err) => logger.error(err));
    return event;
  }

  async function addEventGuest(eventId, guestId, guestStatus) {
    const eventGuestQuery = 'insert into EventGuests (EventId, GuestId, HasPlayerControl, GuestStatus) VALUES ?';
    const eventGuestValues = [[eventId, guestId, false, guestStatus]];
    const eventGuest = await sql.query(eventGuestQuery, [eventGuestValues])
      .catch((err) => logger.error(err));
    return eventGuest;
  }

  async function addUserProfile(userNumber) {
    const userProfileQuery = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
    const userProfileValues = [[`Daniel${userNumber}`, `${userNumber}daniel@mail.com`, moment().format(DATETIME_FORMAT)]];
    const userProfile = await sql.query(userProfileQuery, [userProfileValues])
      .catch((err) => logger.error(err));
    return userProfile;
  }

  async function addTrackToHistory(trackId, eventId, day) {
    const trackHistoryQuery = 'INSERT INTO TrackHistory (TrackId, EventID, PlayedAt) \
    VALUES ?;';
    const trackHistoryValues = [[trackId, eventId, `2031-05-${day} 05:05:05`]];
    const trackInHistory = await sql.query(trackHistoryQuery, [trackHistoryValues])
      .catch((err) => logger.error(err));
    return trackInHistory;
  }

  describe('GET /api/events/:eventId/tracks/nextTrack', () => {
    it('should GET the next track for an event', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);

      // Order of dateAdded: Track1, track1bis, track4, track2, track3
      const track1 = await addTrack(event.insertId, user.insertId, 1);
      const track1bis = await addTrack(event.insertId, user.insertId, 1);
      const track2 = await addTrack(event.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);

      // Order of votes: track2, track1, track1bis... others
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}/tracks/nextTrack`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql('Successfully got the next track');
      res.body.data[0].should.have.all.keys('Id', 'EventId', 'UserId', 'DeezerSongId', 'Title', 'Duration',
        'ArtistName', 'PictureSmall', 'PictureBig', 'AddedAt', 'VotesSum');
      res.body.data.should.have.lengthOf(1);
      res.body.data[0].Id.should.be.eql(track2.insertId);
      res.body.data[0].VotesSum.should.be.eql(5);
    });

    it('should GET the next track for an event (oldest if equal votes)', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);

      // Order of dateAdded: Track1, track1bis, track4, track2, track3
      const track1 = await addTrack(event.insertId, user.insertId, 1);
      const track1bis = await addTrack(event.insertId, user.insertId, 1);
      const track2 = await addTrack(event.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);

      // Order of votes: track2, track1, track1bis... others
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      await addTrackToHistory(track2.insertId, event.insertId, '10');
      await addTrackToHistory(track1.insertId, event.insertId, '11');
      await addTrackToHistory(track1bis.insertId, event.insertId, '12');


      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}/tracks/nextTrack`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql('Successfully got the next track');
      res.body.data[0].should.have.all.keys('Id', 'EventId', 'UserId', 'DeezerSongId', 'Title', 'Duration',
        'ArtistName', 'PictureSmall', 'PictureBig', 'AddedAt', 'VotesSum');
      res.body.data.should.have.lengthOf(1);
      res.body.data[0].Id.should.be.eql(track4.insertId);
    });

    it('should GET the next track for an event (check if added to TH)', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);

      // Order of dateAdded: Track1, track1bis, track4, track2, track3
      const track1 = await addTrack(event.insertId, user.insertId, 1);
      const track1bis = await addTrack(event.insertId, user.insertId, 1);
      const track2 = await addTrack(event.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);

      // Order of votes: track2, track1, track1bis... others
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      await addTrackToHistory(track2.insertId, event.insertId, '10');
      await addTrackToHistory(track1.insertId, event.insertId, '11');
      await addTrackToHistory(track1bis.insertId, event.insertId, '12');


      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}/tracks/nextTrack`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.message.should.be.eql('Successfully got the next track');
      res.body.data[0].should.have.all.keys('Id', 'EventId', 'UserId', 'DeezerSongId', 'Title', 'Duration',
        'ArtistName', 'PictureSmall', 'PictureBig', 'AddedAt', 'VotesSum');
      res.body.data.should.have.lengthOf(1);
      res.body.data[0].Id.should.be.eql(track4.insertId);

      const tracksHistory = await sql.query('SELECT * FROM TrackHistory');

      tracksHistory.should.have.lengthOf(4);
      tracksHistory[3].TrackId.should.be.eql(track4.insertId);
    });

    it('should not GET the next track if the event does not exist', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);

      // Order of dateAdded: Track1, track1bis, track4, track2, track3
      const track1 = await addTrack(event.insertId, user.insertId, 1);
      const track1bis = await addTrack(event.insertId, user.insertId, 1);
      const track2 = await addTrack(event.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);

      // Order of votes: track2, track1, track1bis... others
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      await addTrackToHistory(track2.insertId, event.insertId, '10');
      await addTrackToHistory(track1.insertId, event.insertId, '11');
      await addTrackToHistory(track1bis.insertId, event.insertId, '12');


      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId + 1}/tracks/nextTrack`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('No event with this ID');

      const tracksHistory = await sql.query('SELECT * FROM TrackHistory');

      tracksHistory.should.have.lengthOf(3);
    });

    it('should not GET the next track if user != creator of event', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user2.insertId);
      const event = await addEvent(user.insertId);

      // Order of dateAdded: Track1, track1bis, track4, track2, track3
      const track1 = await addTrack(event.insertId, user.insertId, 1);
      const track1bis = await addTrack(event.insertId, user.insertId, 1);
      const track2 = await addTrack(event.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);

      // Order of votes: track2, track1, track1bis... others
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      await addTrackToHistory(track2.insertId, event.insertId, '10');
      await addTrackToHistory(track1.insertId, event.insertId, '11');
      await addTrackToHistory(track1bis.insertId, event.insertId, '12');


      await addEventGuest(event.insertId, user.insertId, 'Going');
      await addEventGuest(event.insertId, user2.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}/tracks/nextTrack`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Forbidden');

      const tracksHistory = await sql.query('SELECT * FROM TrackHistory');

      tracksHistory.should.have.lengthOf(3);
    });

    it('should not GET the next track if the JWT is invalid', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);

      // Order of dateAdded: Track1, track1bis, track4, track2, track3
      const track1 = await addTrack(event.insertId, user.insertId, 1);
      const track1bis = await addTrack(event.insertId, user.insertId, 1);
      const track2 = await addTrack(event.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);

      // Order of votes: track2, track1, track1bis... others
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      await addTrackToHistory(track2.insertId, event.insertId, '10');
      await addTrackToHistory(track1.insertId, event.insertId, '11');
      await addTrackToHistory(track1bis.insertId, event.insertId, '12');


      await addEventGuest(event.insertId, user.insertId, 'Going');
      await addEventGuest(event.insertId, user2.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}/tracks/nextTrack`)
        .set({ Authorization: `Bearer ${jwt}a` });

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Invalid authorization token');

      const tracksHistory = await sql.query('SELECT * FROM TrackHistory');

      tracksHistory.should.have.lengthOf(3);
    });

    it('should not GET the next track if there are no more tracks to play', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);

      // Order of dateAdded: Track1, track1bis, track4, track2, track3
      const track1 = await addTrack(event.insertId, user.insertId, 1);
      const track1bis = await addTrack(event.insertId, user.insertId, 1);
      const track2 = await addTrack(event.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);

      // Order of votes: track2, track1, track1bis... others
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      await addTrackToHistory(track2.insertId, event.insertId, '10');
      await addTrackToHistory(track1.insertId, event.insertId, '11');
      await addTrackToHistory(track1bis.insertId, event.insertId, '12');
      await addTrackToHistory(track4.insertId, event.insertId, '12');
      await addTrackToHistory(track3.insertId, event.insertId, '12');


      await addEventGuest(event.insertId, user.insertId, 'Going');
      await addEventGuest(event.insertId, user2.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}/tracks/nextTrack`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('No tracks left to play');

      const tracksHistory = await sql.query('SELECT * FROM TrackHistory');

      tracksHistory.should.have.lengthOf(5);
    });

    it('should not GET the next track if there are no tracks', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);


      await addEventGuest(event.insertId, user.insertId, 'Going');
      await addEventGuest(event.insertId, user2.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}/tracks/nextTrack`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('No tracks left to play');
    });
  });
});
