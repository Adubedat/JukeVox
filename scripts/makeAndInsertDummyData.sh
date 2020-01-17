set -x; 


sh createDummyData.sh  | mysql -u root -D'JukeVox'
