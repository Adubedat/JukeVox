import 'core-js/stable';
import 'regenerator-runtime/runtime';

const chai = require('chai');
const chaiHttp = require('chai-http');
// const user = require('../src/server/routes/userRoute');
const server = require('../server');

const should = chai.should();

chai.use(chaiHttp);

describe('Users', () => {
  beforeEach((done) => {
    // TODO: Before each test, clear the DB
    done();
  });

  /*
   * Test the GET route
  */

  describe('/GET users', () => {
    it('should GET all the users', (done) => {
      chai.request(server)
        .get('/users/search')
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});
