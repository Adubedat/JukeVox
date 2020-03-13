set -x; 


sh createDummyData.sh  | mysql -u root -proot -D'JukeVox'
