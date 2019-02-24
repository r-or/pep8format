const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const redis = require('redis');

const app = express();
const rclient = redis.createClient({host: 'redis', port: 6379});
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
  res.sendFile(path.join(__dirname, '../public/meh.html'));
  rclient.incr('page-counter', (err, cnt) => {
    console.log('Page count: ' + cnt.toString());
  });
});

app.post('/2pep', (req, res) => {
  rclient.incr('pep8request-counter', (err, uniqueID) => {
    const rSubClient = redis.createClient({host: 'redis', port: 6379});
    rSubClient.subscribe('pep8result#' + uniqueID.toString());
    rSubClient.on('message', (chan, msg) => {
        var job = JSON.parse(msg);
        console.log('Job #' + uniqueID.toString() + ' done!');
        res.send(msg);
      });
    rSubClient.on('connect', () => {
      rclient.lpush('pep8jobs',
        JSON.stringify({'id': uniqueID,
                        'lines': req.body.txt,
                        'select': req.body.sel
      }));
      console.log('Submitted job #' + uniqueID.toString() + '!');
    });
    rSubClient.on('error', (err) => {
      console.log('Subclient #' + uniqueID.toString() + ': error connecting to redis: ' + err);
    });
  });
})

const server = app.listen(9000, () => console.log('Listening on port 9000...'));
