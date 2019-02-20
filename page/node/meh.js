const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const redis = require('redis');

const app = express();
const rclient = redis.createClient();
rclient.on('connect', () => {
  console.log('Connected to redis!');
  rclient.set('pep8request-counter', 0);
});
rclient.on('error', (err) => {
  console.log('Error connecting to redis: ' + err);
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json({limit: '5mb'}));
app.use(express.static(path.join(__dirname, '../public')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/meh.html'))
});

app.post('/2pep', (req, res) => {
  console.log('got this txt: ' + req.body.txt);
  rclient.incr('pep8request-counter', (err, uniqueID) => {
    console.log('Got this id ' + uniqueID);
    rSubClient = redis.createClient();
    rSubClient.subscribe('pep8result#' + uniqueID.toString());
    rSubClient.on('message', (chan, msg) => {
        var job = JSON.parse(msg);
        console.log('Job #' + uniqueID.toString() + ' done!');
        res.send(msg);
      });
    rSubClient.on('connect', () => {
      rclient.lpush('pep8jobs', 
        JSON.stringify({'id': uniqueID,
                        'lines': req.body.txt
        }));
    })
  });
})

const server = app.listen(9000, () => console.log('Listening on port 9000...'));