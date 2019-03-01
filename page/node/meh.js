const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const redis = require('redis');
const fs = require('fs');
const https = require('https');
const helmet = require('helmet');

const app = express();
const rclient = redis.createClient({host: 'redis', port: 6379});
rclient.on('connect', () => {
  console.log('Connected to redis!');
  rclient.set('pep8request-counter', 0);
});
rclient.on('error', (err) => {
  console.log('Error connecting to redis: ' + err);
});

// certs
const credentials = {
  key: fs.readFileSync('/certs/live/pep8format.com/privkey.pem', 'utf8'),
  ca: fs.readFileSync('/certs/live/pep8format.com/chain.pem', 'utf8'),
  cert: fs.readFileSync('/certs/live/pep8format.com/cert.pem', 'utf8')
};

// static files
const staticfileoptions = {
  root: path.join(__dirname, '..', 'public/'),
  dotfiles: 'allow'
};

// middlewares
app.use((req, res, next) => {
	if (!req.secure) {
		return res.redirect(['https://', req.get('Host'), req.url].join(''));
	}
	next();
});
app.use(helmet());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json({limit: '5mb'}));
app.use(express.static(staticfileoptions['root'], staticfileoptions));

// root page
app.get('/', (req, res) => {
  res.sendFile('meh.html', staticfileoptions, (err) => {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    } else {
      rclient.incr('page-counter', (err, cnt) => {
        console.log('Page count: ' + cnt.toString());
      });
    }
  });
});

// explicit router for cert challenge -- TODO
/*app.get('/.well-known/acme-challenge*', (req, res) => {
  res.sendFile(req.url, staticfileoptions, (err) => {
    if (err) {
      console.log("Error while trying acme-challenge:");
      console.log(err);
      res.status(err.status).end();
    }
  });
});*/

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

app.use((req, res, next) => {
  res.status(404).end();
})

app.listen(9080, () => {
  console.log('HTTP listening on port 9080...')
});
https.createServer(credentials, app).listen(9443, () => {
  console.log('HTTPS listening on port 9443...');
});
