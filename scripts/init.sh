set -x;

mysql -h localhost -u root < createDatabase.sql;
mysql -h localhost -u root < createTestDatabase.sql;
