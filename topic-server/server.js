/* eslint-disable no-process-env */
/* eslint-disable no-undef */
/* eslint-disable no-console */
const {fetchAll, fetchModel, recordModel, recordVisit, log, stripAndModel, sleep} = require('./utils');
const express = require('express');
const app = express();
const request = require('request');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const fiveMinutes = 5 * MINUTE;

const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const inProgress = {};

function shouldRetrieveModelFromCache(result) {
  if (!result.rows.length) {
    return false;
  }
  const model = result.rows[0];
  const currentTime = new Date().getTime();
  const modelCreationTime = new Date(model.created_at).getTime();
  return Math.abs(modelCreationTime - currentTime) < fiveMinutes;
}

function parseAndModel(req, res) {
  const itemId = req.query && req.query.item;
  const numTopics = (req.query && req.query.topics) || 5;
  const numTerms = (req.query && req.query.terms) || 15;
  const cacheId = `${itemId}-${numTopics}-${numTerms}`;
  const requestConfig = {itemId, numTopics, numTerms, cacheId};
  if (!itemId) {
    res.send('Invalid query');
    return;
  }

  // only record visits to the full model
  if (!(Number(numTopics) === 1 && Number(numTerms) === 1)) {
    recordVisit(itemId, numTopics, numTerms);
  }
  log(`request for ${cacheId}`);

  if (inProgress[cacheId]) {
    res.status(204).send('BUILDING');
    return;
  }

  fetchModel(itemId, numTopics, numTerms)
    .then((model) => {
      if (shouldRetrieveModelFromCache(model)) {
        log(`request for ${cacheId} fulfilled by cache`, model.rows[0].model);
        res.send(model.rows[0].model);
        return;
      }

      res.status(204).send('NONE FOUND, BUILDING');
      return buildModel(requestConfig);
    })
    .catch((error) => {
      inProgress[cacheId] = false;
      console.log(error);
      log(`error ${error}`);
    });
}

function buildModel(requestConfig) {
  const {itemId, numTopics, numTerms, cacheId} = requestConfig;
  inProgress[cacheId] = true;
  const startTime = new Date().getTime();
  const hnURL = `https://news.ycombinator.com/item?id=${itemId}`;

  return sleep(Math.floor(Math.random() * 2000))
    .then(
      () =>
        new Promise((resolve, reject) =>
          request(hnURL, (error, response, html) => {
            log(`recieved html for ${cacheId}`);
            if (!error && response.statusCode === 200) {
              return resolve(html);
            }
            const rejectItem = {
              code: `https://news.ycombinator.com/item?id=${itemId}`,
              error,
              html,
              itemId,
              status: 'error',
              statusCode: response.statusCode,
            };
            return reject(JSON.stringify(rejectItem, null, 2));
          }),
        ),
    )
    .then((html) => {
      log(`building model for ${cacheId}`);
      const model = stripAndModel(html, numTopics, numTerms);
      const endTime = new Date().getTime();
      log(`modeling for ${cacheId} complete. took ${(endTime - startTime) / 1000} seconds. caching model`);
      inProgress[cacheId] = false;
      recordModel(itemId, numTopics, numTerms, model);
    });
}

app.get('/analytics', (req, res) => {
  log('analytics call');
  fetchAll().then((models) => {
    res.send(JSON.stringify(models.rows, null, 2));
  });
});

app.get('/', (req, res) => parseAndModel(req, res));

app.listen(PORT, () => {
  log(`Node.js app is listening at http://localhost:${PORT}`);
});
