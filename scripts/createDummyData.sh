# UserProfiles, UserAccounts, ProviderAccounts
for i in 1 2 3 4 5 6 7
do
echo "INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ('"$i"', '"$i@$i.$i"', '2020-01-17 15:15:15');"

if [ $i -lt 5 ]
then
echo "INSERT INTO UserAccounts (UserProfileId, Email) "
echo "SELECT id, email FROM UserProfiles WHERE Username = '"$i"';"
fi

if [ $i = 1 ] || [ $i = 2 ] || [ $i = 5 ] || [ $i = 7 ]
then
echo "INSERT INTO ProviderAccounts (UserProfileId, Provider, ProviderId) "
echo "SELECT id, 'Google', $i FROM UserProfiles WHERE Username = '"$i"';"
fi

if [ $i = 2 ] || [ $i = 4 ] || [ $i = 6 ] || [ $i = 7 ]
then
echo "INSERT INTO ProviderAccounts (UserProfileId, Provider, ProviderId) "
echo "SELECT id, 'Facebook', $i FROM UserProfiles WHERE Username = '"$i"';"
fi
done

# Events
echo "INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (1, 'testEvent', '2020-03-20 14:12:12', '2021-12-12 12:12:12', 'test street', 30.24, 30.35);"
echo "INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (1, '2testEvent', '2020-03-22 14:12:12', '2021-12-22 12:12:12', '2test street', 30.24, 30.35);"

# EventGuests event 1
echo "INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (1, 1, 'Going');"
echo "INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (1, 2, 'Going');"

# EventGuests event 2
echo "INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (2, 1, 'Going');"
echo "INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (2, 2, 'Going');"

# Tracks event 1
echo "INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (1, 1, 101, 'test track title', 345, 'test artist', '2020-03-20 14:01:05');"
echo "INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (1, 1, 202, '2 test track title', 345, 'test artist', '2020-03-20 14:02:05');"
echo "INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (1, 1, 303, '3 test track title', 345, 'test artist', '2020-03-20 14:03:05');"
echo "INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (1, 1, 404, '4 test track title', 345, 'test artist', '2020-03-20 14:04:05');"

# Tracks event 2 
echo "INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (2, 1, 101, 'test track title', 345, 'test artist', '2020-03-20 14:01:05');"
echo "INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (2, 1, 202, '2 test track title', 345, 'test artist', '2020-03-20 14:02:05');"
echo "INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (2, 1, 303, '3 test track title', 345, 'test artist', '2020-03-20 14:03:05');"
echo "INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (2, 1, 404, '4 test track title', 345, 'test artist', '2020-03-20 14:04:05');"

# Votes event 1
echo "INSERT INTO Votes (TrackId, UserId, Vote) VALUES (1, 1, 1);"
echo "INSERT INTO Votes (TrackId, UserId, Vote) VALUES (1, 2, 1);"
echo "INSERT INTO Votes (TrackId, UserId, Vote) VALUES (2, 1, 1);"

# Votes event 2
echo "INSERT INTO Votes (TrackId, UserId, Vote) VALUES (5, 1, 1);"
echo "INSERT INTO Votes (TrackId, UserId, Vote) VALUES (5, 2, 1);"
echo "INSERT INTO Votes (TrackId, UserId, Vote) VALUES (6, 1, 1);"

# Track History
echo "INSERT INTO TrackHistory (TrackId, EventId, PlayedAt) VALUES (1, 1, '2020-03-26 15:15:15')"