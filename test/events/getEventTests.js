/* eslint-env node, mocha */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import moment from 'moment';
import DATETIME_FORMAT from '../../src/server/constants';
import sql from '../../src/helpers/database';

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

    const voteInTable = await sql.query(query, [values, vote]).catch((err) => console.log(err));
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
      .catch((err) => console.log(err));

    return track;
  }

  async function addEvent(creatorId, isPrivate = true) {
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
      isPrivate,
      eventPicture: 'defaultPicture1',
    };

    const eventQuery = 'INSERT INTO Events (CreatorId, Name, Description, \
        EventPicture, StartDate, EndDate, Location, Latitude, Longitude, \
        StreamerDevice, IsPrivate) VALUES ?;';
    const eventValues = [[creatorId, content.name, content.description, content.eventPicture,
      content.startDate, content.endDate, content.location, content.latitude, content.longitude,
      content.streamerDevice, content.isPrivate]];
    const event = await sql.query(eventQuery, [eventValues])
      .catch((err) => console.log(err));
    return event;
  }

  async function addEventGuest(eventId, guestId, guestStatus) {
    const eventGuestQuery = 'insert into EventGuests (EventId, GuestId, HasPlayerControl, GuestStatus) VALUES ?';
    const eventGuestValues = [[eventId, guestId, false, guestStatus]];
    const eventGuest = await sql.query(eventGuestQuery, [eventGuestValues])
      .catch((err) => console.log(err));
    return eventGuest;
  }

  async function addUserProfile(userNumber) {
    const userProfileQuery = 'INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ?';
    const userProfileValues = [[`Daniel${userNumber}`, `${userNumber}daniel@mail.com`, moment().format(DATETIME_FORMAT)]];
    const userProfile = await sql.query(userProfileQuery, [userProfileValues])
      .catch((err) => console.log(err));
    return userProfile;
  }

  async function addTrackToHistory(trackId, eventId, day) {
    const trackHistoryQuery = 'INSERT INTO TrackHistory (TrackId, EventID, PlayedAt) \
    VALUES ?;';
    const trackHistoryValues = [[trackId, eventId, `2031-05-${day} 05:05:05`]];
    const trackInHistory = await sql.query(trackHistoryQuery, [trackHistoryValues])
      .catch((err) => console.log(err));
    return trackInHistory;
  }

  describe('GET /events/:eventId', () => {
    it('should GET an event', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      const track1 = await addTrack(event.insertId, user.insertId);
      await addTrack(event.insertId, user2.insertId);
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);

      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'Tracks', 'CurrentTrack', 'TrackHistory');
      res.body.data.Tracks[0].should.have.all.keys('Id', 'EventId', 'UserId', 'DeezerSongId', 'Title', 'Duration',
        'ArtistName', 'PictureSmall', 'PictureBig', 'AddedAt', 'VotesSum', 'UserVote');
      res.body.data.Tracks.should.have.lengthOf(2);
      res.body.data.Tracks[0].VotesSum.should.eql(2);
      res.body.data.Tracks[0].UserVote.should.eql(1);
      res.body.data.Tracks[0].Title.should.eql('Song title');
      expect(res.body.data.Tracks[1].VotesSum).to.equal(null);
    });

    it('should GET an event if the event is public and user not attending', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user2.insertId);
      const event = await addEvent(user.insertId, false);
      const track1 = await addTrack(event.insertId, user.insertId);
      await addVote(track1.insertId, user.insertId, 1);


      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'Tracks', 'CurrentTrack', 'TrackHistory');
      res.body.data.Tracks[0].should.have.all.keys('Id', 'EventId', 'UserId', 'DeezerSongId', 'Title', 'Duration',
        'ArtistName', 'PictureSmall', 'PictureBig', 'AddedAt', 'VotesSum', 'UserVote');
      res.body.data.Tracks.should.have.lengthOf(1);
    });

    it('should GET an event (check tracks are in order)', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      const track1 = await addTrack(event.insertId, user.insertId, 1);
      const track1bis = await addTrack(event.insertId, user.insertId, 1);
      const track2 = await addTrack(event.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'Tracks', 'CurrentTrack', 'TrackHistory');
      res.body.data.Tracks[0].should.have.all.keys('Id', 'EventId', 'UserId', 'DeezerSongId', 'Title', 'Duration',
        'ArtistName', 'PictureSmall', 'PictureBig', 'AddedAt', 'VotesSum', 'UserVote');
      res.body.data.Tracks.should.have.lengthOf(5);
      res.body.data.Tracks[0].VotesSum.should.eql(5);
      res.body.data.Tracks[0].Id.should.eql(track2.insertId);
      res.body.data.Tracks[1].Id.should.eql(track1.insertId);
      res.body.data.Tracks[2].Id.should.eql(track1bis.insertId);
      res.body.data.Tracks[3].Id.should.eql(track4.insertId);
      res.body.data.Tracks[4].Id.should.eql(track3.insertId);
    });

    it('should GET an event (check track history)', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      const track1 = await addTrack(event.insertId, user.insertId, 1);
      const track1bis = await addTrack(event.insertId, user.insertId, 1);
      const track2 = await addTrack(event.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      const trackInHistory1 = await addTrackToHistory(track2.insertId, event.insertId, '10');
      const trackInHistory2 = await addTrackToHistory(track1.insertId, event.insertId, '11');

      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'Tracks', 'CurrentTrack', 'TrackHistory');
      res.body.data.Tracks[0].should.have.all.keys('Id', 'EventId', 'UserId', 'DeezerSongId', 'Title', 'Duration',
        'ArtistName', 'PictureSmall', 'PictureBig', 'AddedAt', 'VotesSum', 'UserVote');
      res.body.data.Tracks.should.have.lengthOf(3);
      res.body.data.TrackHistory.should.have.lengthOf(2);
      res.body.data.TrackHistory[0].TrackId.should.be.eql(track1.insertId);
      res.body.data.TrackHistory[1].TrackId.should.be.eql(track2.insertId);
    });

    it('should GET an event (check empty track history)', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      const event2 = await addEvent(user.insertId);
      const track1 = await addTrack(event2.insertId, user.insertId, 1);
      const track1bis = await addTrack(event.insertId, user.insertId, 1);
      const track2 = await addTrack(event2.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      const trackInHistory1 = await addTrackToHistory(track3.insertId, event.insertId, '10');
      const trackInHistory2 = await addTrackToHistory(track4.insertId, event.insertId, '11');

      await addEventGuest(event.insertId, user.insertId, 'Going');
      await addEventGuest(event2.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event2.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event2.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'Tracks', 'CurrentTrack', 'TrackHistory');
      res.body.data.Tracks[0].should.have.all.keys('Id', 'EventId', 'UserId', 'DeezerSongId', 'Title', 'Duration',
        'ArtistName', 'PictureSmall', 'PictureBig', 'AddedAt', 'VotesSum', 'UserVote');
      res.body.data.Tracks.should.have.lengthOf(2);
      res.body.data.TrackHistory.should.have.lengthOf(0);
    });

    it('should GET an event (check that current track is correct)', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      const track1 = await addTrack(event.insertId, user.insertId, 1);
      const track1bis = await addTrack(event.insertId, user.insertId, 1);
      const track2 = await addTrack(event.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      const trackInHistory1 = await addTrackToHistory(track2.insertId, event.insertId, '09');
      const trackInHistory2 = await addTrackToHistory(track1.insertId, event.insertId, '11');
      const trackInHistory3 = await addTrackToHistory(track1bis.insertId, event.insertId, '10');

      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'Tracks', 'CurrentTrack', 'TrackHistory');
      res.body.data.Tracks[0].should.have.all.keys('Id', 'EventId', 'UserId', 'DeezerSongId', 'Title', 'Duration',
        'ArtistName', 'PictureSmall', 'PictureBig', 'AddedAt', 'VotesSum', 'UserVote');
      res.body.data.Tracks.should.have.lengthOf(2);
      res.body.data.TrackHistory.should.have.lengthOf(3);
      res.body.data.CurrentTrack.should.have.lengthOf(1);
      res.body.data.CurrentTrack[0].Id.should.be.eql(track1.insertId);
    });

    it('should GET an event (check that tracks are removed from track list if in history)', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      const track1 = await addTrack(event.insertId, user.insertId, 1);
      const track1bis = await addTrack(event.insertId, user.insertId, 1);
      const track2 = await addTrack(event.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      const trackInHistory1 = await addTrackToHistory(track2.insertId, event.insertId, '09');
      const trackInHistory2 = await addTrackToHistory(track1.insertId, event.insertId, '11');
      const trackInHistory3 = await addTrackToHistory(track1bis.insertId, event.insertId, '10');

      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'Tracks', 'CurrentTrack', 'TrackHistory');
      res.body.data.Tracks[0].should.have.all.keys('Id', 'EventId', 'UserId', 'DeezerSongId', 'Title', 'Duration',
        'ArtistName', 'PictureSmall', 'PictureBig', 'AddedAt', 'VotesSum', 'UserVote');
      res.body.data.Tracks.should.have.lengthOf(2);
      res.body.data.TrackHistory.should.have.lengthOf(3);
      res.body.data.CurrentTrack.should.have.lengthOf(1);
      res.body.data.CurrentTrack[0].Id.should.be.eql(track1.insertId);
      res.body.data.Tracks[0].Id.should.be.eql(track4.insertId);
      res.body.data.Tracks[1].Id.should.be.eql(track3.insertId);
    });

    it('should GET an event (check that current track is correct even if empty)', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      const event2 = await addEvent(user.insertId);
      const track1 = await addTrack(event2.insertId, user.insertId, 1);
      const track1bis = await addTrack(event2.insertId, user.insertId, 1);
      const track2 = await addTrack(event2.insertId, user.insertId, 3);
      const track3 = await addTrack(event.insertId, user.insertId, 30);
      const track4 = await addTrack(event.insertId, user2.insertId, 2);
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1bis.insertId, user.insertId, 1);
      await addVote(track1bis.insertId, user2.insertId, 1);
      await addVote(track2.insertId, user2.insertId, 5);

      const trackInHistory1 = await addTrackToHistory(track2.insertId, event2.insertId, '09');
      const trackInHistory2 = await addTrackToHistory(track1.insertId, event2.insertId, '11');
      const trackInHistory3 = await addTrackToHistory(track1bis.insertId, event2.insertId, '10');

      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'Tracks', 'CurrentTrack', 'TrackHistory');
      res.body.data.Tracks[0].should.have.all.keys('Id', 'EventId', 'UserId', 'DeezerSongId', 'Title', 'Duration',
        'ArtistName', 'PictureSmall', 'PictureBig', 'AddedAt', 'VotesSum', 'UserVote');
      res.body.data.Tracks.should.have.lengthOf(2);
      res.body.data.TrackHistory.should.have.lengthOf(0);
      res.body.data.CurrentTrack.should.have.lengthOf(0);
    });

    it('should not GET an event with invalid jwt', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      const track1 = await addTrack(event.insertId, user.insertId);
      await addTrack(event.insertId, user2.insertId);
      await addVote(track1.insertId, user.insertId, 1);
      await addVote(track1.insertId, user2.insertId, 1);

      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}a` });

      res.should.have.status(401);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.be.eql('Invalid authorization token');
    });

    it('should GET an event and have correct votes sum with negative vote', async () => {
      const user = await addUserProfile('user1');
      const user2 = await addUserProfile('user2');
      const user3 = await addUserProfile('user3');
      const user4 = await addUserProfile('user4');
      const user5 = await addUserProfile('user5');
      const user6 = await addUserProfile('user6');
      const user7 = await addUserProfile('user7');

      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      const track1 = await addTrack(event.insertId, user.insertId);
      await addVote(track1.insertId, user.insertId, -1);
      await addVote(track1.insertId, user2.insertId, 1);
      await addVote(track1.insertId, user3.insertId, -1);
      await addVote(track1.insertId, user4.insertId, -1);
      await addVote(track1.insertId, user5.insertId, -1);
      await addVote(track1.insertId, user6.insertId, 1);
      await addVote(track1.insertId, user7.insertId, -1);


      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'Tracks', 'CurrentTrack', 'TrackHistory');
      res.body.data.Tracks[0].should.have.all.keys('Id', 'EventId', 'UserId', 'DeezerSongId', 'Title', 'Duration',
        'ArtistName', 'PictureSmall', 'PictureBig', 'AddedAt', 'VotesSum', 'UserVote');
      res.body.data.Tracks.should.have.lengthOf(1);
      res.body.data.Tracks[0].VotesSum.should.eql(-3);
      res.body.data.Tracks[0].UserVote.should.eql(-1);
      res.body.data.Tracks[0].Title.should.eql('Song title');
    });

    it('should GET an event (user is invited)', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      await addEventGuest(event.insertId, user.insertId, 'Invited');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'Tracks', 'CurrentTrack', 'TrackHistory');
    });

    it('should GET an event (user is not going)', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);
      await addEventGuest(event.insertId, user.insertId, 'NotGoing');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.should.have.property('data');
      res.body.data.should.have.property('Id');
      res.body.message.should.be.eql(`Event with Id: ${event.insertId}`);
      res.body.data.Name.should.be.eql('House warming');
      res.body.data.should.have.all.keys('RestrictVotingToEventHours', 'CreatorId', 'Name', 'Description', 'EventPicture', 'StartDate',
        'EndDate', 'Location', 'Latitude', 'Longitude', 'StreamerDevice', 'IsPrivate', 'Id', 'Tracks', 'CurrentTrack', 'TrackHistory');
    });

    it('should not GET an event with unknown id', async () => {
      const user = await addUserProfile();
      const jwt = generateJwt(user.insertId);
      const event = await addEvent(user.insertId);

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId + 1}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(404);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('No event found with this ID');
    });

    it('should not GET an event if the guest is not on the guest list', async () => {
      const user = await addUserProfile(1);
      const user2 = await addUserProfile(2);
      const jwt = generateJwt(user2.insertId);
      const event = await addEvent(user.insertId);
      await addEventGuest(event.insertId, user.insertId, 'Going');

      const res = await chai.request(server)
        .get(`/api/events/${event.insertId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      res.should.have.status(403);
      res.body.should.be.a('object');
      res.body.should.have.property('statusCode');
      res.body.should.have.property('message');
      res.body.message.should.eql('Forbidden');
    });
  });
});
