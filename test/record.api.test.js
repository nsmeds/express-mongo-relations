const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
chai.use(chaiHttp);

const connection = require('../lib/setup-mongoose');
const app = require('../lib/app');

describe('record api', () => {

  before(done => {
    const CONNECTED = 1;
    if (connection.readyState === CONNECTED) dropCollection();
    else connection.on('open', dropCollection);

    function dropCollection(){
      const name = 'records';
      connection.db
        .listCollections({name})
        .next((err, collinfo) => {
          if (!collinfo) return done();
          connection.db.dropCollection(name, done);
        });
    }
  });
  
  const request = chai.request(app);

  const dylan = {
    title: 'Desire',
    year: 1975
  };

  it('/GET all', done => {
    request
      .get('/api/records')
      .then(res => {
        assert.deepEqual(res.body, []);
        done();
      })
      .catch(done);
  });

  it('/POST a new record', done => {
    request
      .post('/api/records')
      .send(dylan)
      .then(res => {
        const record = res.body;
        assert.ok(record._id);
        dylan.__v = 0;
        dylan._id = record._id;
        done();
      })
      .catch(done);
  });

  it('/GET a record by id', done => {
    request
      .get(`/api/records/${dylan._id}`)
      .then(res => {
        assert.deepEqual(res.body, dylan);
        done();
      })
      .catch(done);
  });

  it('/GET all after post', done => {
    request
      .get('/api/records/')
      .then(res => {
        assert.deepEqual(res.body, [dylan]);
        done();
      })
      .catch(done);
  });

  it('/GET records for a specific year', done => {
    request
      .get('/api/records')
      .query({year: 1975})
      .then(res => {
        assert.deepEqual(res.body, [dylan]);
        done();
      })
      .catch(done);
  });

  it('/POST new artist resource', done => {
    request
      .post('/api/artists/')
      .send({name: 'Bob Dylan'})
      .then(res => {
        let newArtistId = res.body._id;
        request
          .put(`/api/records/${dylan._id}`)
          .send({artistId: newArtistId})
          .then(res => {
            request
              .get(`/api/records/${dylan._id}`)
              .then(res => {
                assert.deepEqual(res.body.artistId.name, 'Bob Dylan');
                done();
              });
          });
      })
      .catch(done);
  });

    it('/PUT a new title on a record', done => {
    request
      .put(`/api/records/${dylan._id}`)
      .send({title: 'Blood on the Tracks'})
      .then( (res) => {
        assert.deepEqual(res.body.title, 'Blood on the Tracks');
        done();
      })
      .catch(done);
  });

  it('/DELETE a record', done => {
    request
      .del(`/api/records/${dylan._id}`)
      .then( (deleted) => {
        assert.deepEqual(deleted.text, '{"ok":1,"n":1}');
        done();
      })
      .catch(done);
  });

});