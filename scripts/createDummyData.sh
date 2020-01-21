for i in 1 2 3 4 5 6 7
do
echo "INSERT INTO UserProfiles (Username, Email, CreatedAt) VALUES ('"$i"', '"$i@$i.$i"', '2020-01-17 15:15:15');"

if [ $i -lt 5 ]
then
echo "INSERT INTO UserAccounts (UserProfileId, Email, EmailConfirmationPin) "
echo "SELECT id, email, $i FROM UserProfiles WHERE Username = '"$i"';"
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
