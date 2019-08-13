/* eslint-disable no-console */
const MongoClient = require('mongodb').MongoClient;
const {
  fetchAllModels,
  fetchAllVisits,
  fetchModel,
  fetchItemData,
  log,
  hnTemplate,
  recordModel,
  recordVisit,
  recordItemData,
  stripAndModel,
  sleep
} = require('./utils');
const fetch = require('node-fetch');
const express = require('express');
const app = express();
const request = require('request');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const fiveMinutes = 5 * MINUTE;
/* eslint-disable */
const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGO_DB = process.env.MONGODB || 'FEX_DB';
/* eslint-enable */

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const inProgress = {};

function shouldRetrieveModelFromCache(model, itemData) {
  const currentTime = new Date().getTime();
  if (!(model && model.length === 1)) {
    return false;
  }
  const inLastFiveMinutes = Math.abs(model[0].time - currentTime) < fiveMinutes;
  const olderThanTwoDays = itemData && (Math.abs(itemData.time - currentTime) > (2 * DAY));
  return inLastFiveMinutes || olderThanTwoDays;
}

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
  fetch(hnTemplate(item))
    .then(d => d.json())
    .then(d => recordItemData(db, d));
  // only record visits to the full model
  if (!(Number(topics) === 1 && Number(terms) === 1)) {
    recordVisit(db, item);
  }
  log(`request for ${cacheId}`);

  if (inProgress[cacheId]) {
    res.status(204).send('BUILDING');
    return;
  }
  Promise.all([
    fetchModel(db, cacheId),
    fetchItemData(db, item)
  ])
    .then(([model, itemData]) => {
      if (shouldRetrieveModelFromCache(model, itemData)) {
        log(`request for ${cacheId} fulfilled by cache`);
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
      log(`recieved html for ${cacheId}`);
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
    log(`building model for ${cacheId}`);
    const model = stripAndModel(html, topics, terms);
    const endTime = new Date().getTime();
    log(`modeling for ${cacheId} complete. took ${(endTime - startTime) / 1000} seconds. caching model`);
    inProgress[cacheId] = false;
    recordModel(db, cacheId, model);
  });
}

app.get('/analytics', (req, res) => {
  // todo add in memory caching over this endpoint with a 5 minute memory
  // todo adjust query to filter out really old data
  log('analytics call');
  const db = req.app.locals.db;
  const combineVisitAndData = row => fetchItemData(db, Number(row.itemId))
    .then(data => ({...row, data: data.length && data[0]}));
  Promise.all([
    fetchAllModels(db),
    fetchAllVisits(db)
      .then(rows => Promise.all(rows.map(combineVisitAndData)))
  ])
  .then(([models, visits]) => {
    res.send(JSON.stringify({models, visits}, null, 2));
  });
});

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
