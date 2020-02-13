set -x;

DIR=$( dirname "$0")

mysql -h 127.0.0.1 -P 3306 -u root -proot < $DIR/createDatabase.sql;
mysql -h 127.0.0.1 -P 3306 -u root -proot < $DIR/createTestDatabase.sql;
