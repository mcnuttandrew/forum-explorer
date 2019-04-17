/* eslint-disable no-console */
const lda = require('lda');
const express = require('express');
const app = express();
const request = require('request');
const cheerio = require('cheerio');
/* eslint-disable */
const PORT = process.env.PORT || 5000;
/* eslint-enable */
const sleep = delay => new Promise((resolve, reject) => setTimeout(d => resolve(), delay));
const log = msg => console.log(new Date().getTime(), ...msg);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const modelCache = {};
const inProgress = {};

function stripAndModel(html, topics, terms) {
  const $ = cheerio.load(html);
  const texts = $('.comment').text()
    .replace(/reply/g, '')
    .split('\n')
    .map(d => d.trim())
    .filter(d => d.length);

  return lda(texts, topics, terms, ['en'], null, null, 10).filter(d => d.length);
}

function parseAndModel(req, res) {
  const item = req.query && req.query.item;
  const topics = req.query && req.query.topics || 5;
  const terms = req.query && req.query.terms || 15;
  const cacheId = `${item}-${topics}-${terms}`;
  if (!item) {
    res.send('Invalid query');
    return;
  }
  log(`request for ${item}`);
  const currentTime = new Date().getTime();
  const fiveMinutes = 5 * 60 * 1000;
  const cacheItem = modelCache[cacheId];
  if (cacheItem && ((cacheItem.time - currentTime) < fiveMinutes)) {
    log(`request for ${item} fulfilled by cache`);
    // TODO: record cache hit, if cache hits happen to many times invalidate the cache
    res.send(modelCache[cacheId].model);
    return;
  }

  res.status(204).send('NONE FOUND, BUILDING');
  if (inProgress[cacheId]) {
    return;
  }
  inProgress[cacheId] = true;
  const startTime = new Date().getTime();
  const hnURL = `https://news.ycombinator.com/item?id=${item}`;

  sleep(Math.floor(Math.random() * 2000)).then(
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
    // res.send(model);
    inProgress[cacheId] = false;
    modelCache[cacheId] = {
      time: currentTime,
      model
    };
  })
  .catch(error => {
    inProgress[cacheId] = false;
    log('error', error, cacheId);
  });
}

app.get('/', (req, res) => parseAndModel(req, res));

app.listen(PORT, () => log(`listening on ${PORT}`));
/* eslint-enable no-console */
