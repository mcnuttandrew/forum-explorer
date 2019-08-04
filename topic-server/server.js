/* eslint-disable no-console */
const MongoClient = require('mongodb').MongoClient;
const {
  fetchAllModels,
  fetchAllVisits,
  log,
  recordModel,
  recordVisit,
  fetchModel,
  stripAndModel,
  sleep
} = require('./utils');
const express = require('express');
const app = express();
const request = require('request');

/* eslint-disable */
const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGOLAB_URI || 'mongodb://localhost:27017';
const MONGO_DB = 'FEX_DB';
/* eslint-enable */

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const inProgress = {};

function parseAndModel(req, res) {
  const db = req.app.locals.db;

  const item = req.query && req.query.item;
  const topics = req.query && req.query.topics || 5;
  const terms = req.query && req.query.terms || 15;
  const cacheId = `${item}-${topics}-${terms}`;
  const requestConfig = {item, topics, terms, cacheId};
  if (!item) {
    res.send('Invalid query');
    return;
  }
  recordVisit(db, item);
  log(`request for ${item}`);

  if (inProgress[cacheId]) {
    res.status(204).send('BUILDING');
    return;
  }
  fetchModel(db, item)
    .then(model => {
      const currentTime = new Date().getTime();
      const fiveMinutes = 5 * 60 * 1000;
      if (model && model.length === 1 && (model[0].time - currentTime) < fiveMinutes) {
        // TODO: record cache hit, if cache hits happen to many times invalidate the cache
        log(`request for ${item} fulfilled by cache`);
        res.send(model[0].model);
        return;
      }

      res.status(204).send('NONE FOUND, BUILDING');
      return buildModel(requestConfig, db);
    })
    .catch(error => {
      inProgress[cacheId] = false;
      console.log(error);
      log(`error ${error}`);
    });
}

function buildModel(requestConfig, db) {
  const {item, topics, terms, cacheId} = requestConfig;
  inProgress[cacheId] = true;
  const startTime = new Date().getTime();
  const hnURL = `https://news.ycombinator.com/item?id=${item}`;

  return sleep(Math.floor(Math.random() * 2000))
  .then(
    () => new Promise((resolve, reject) => request(hnURL, (error, response, html) => {
      log(`recieved html for ${item}`);
      if (!error && response.statusCode === 200) {
        return resolve(html);
      }

      return reject(JSON.stringify({
        code: `https://news.ycombinator.com/item?id=${item}`,
        error,
        html,
        item,
        status: 'error',
        statusCode: response.statusCode
      }, null, 2));
    }))
  )
  .then(html => {
    log(`building model for ${item}`);
    const model = stripAndModel(html, topics, terms);
    const endTime = new Date().getTime();
    log(`modeling for ${item} complete. took ${(endTime - startTime) / 1000} seconds. caching model`);
    inProgress[cacheId] = false;
    recordModel(db, item, model);
  });
}

app.get('/analytics', (req, res) =>
  Promise.all([
    fetchAllModels(req.app.locals.db),
    fetchAllVisits(req.app.locals.db)
  ])
  .then(([models, visits]) => {
    res.send(JSON.stringify({models, visits}, null, 2));
  }));

app.get('/', (req, res) => parseAndModel(req, res));

MongoClient.connect(MONGO_URL, {}, (err, client) => {
  if (err) {
    log(`Failed to connect to the database. ${err.stack}`);
  }
  app.locals.db = client.db(MONGO_DB);
  app.listen(PORT, () => {
    log(`Node.js app is listening at http://localhost:${PORT}`);
  });
});
/* eslint-enable no-console */
