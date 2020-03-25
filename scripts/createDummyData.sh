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

echo "INSERT INTO Events (CreatorId, Name, StartDate, EndDate, Location, Latitude, Longitude) VALUES (1, 'testEvent', '2020-03-20 14:12:12', '2021-12-12 12:12:12', 'test street', 30.24, 30.35);"

echo "INSERT INTO EventGuests (EventId, GuestId, GuestStatus) VALUES (1, 1, 'Going');"

echo "INSERT INTO Tracks (EventId, UserId, DeezerSongId, Title, Duration, ArtistName, AddedAt) VALUES (1, 1, 102929, 'test track title', 345, 'test artist', '2020-03-20 14:15:05');"

#Votes
echo "INSERT INTO Votes (TrackId, UserId, Vote) VALUES (1, 1, 1);"
echo "INSERT INTO Votes (TrackId, UserId, Vote) VALUES (1, 2, 1);"