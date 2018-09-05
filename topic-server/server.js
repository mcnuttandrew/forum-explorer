/* eslint-disable no-console */
const lda = require('lda');
const express = require('express');
const app = express();
const request = require('request');
const cheerio = require('cheerio');

const log = msg => console.log(`${new Date().getTime()}: ${msg}`);

function dedupeModel(model) {
  return model.reduce((acc, row) => {
    const modelTerm = row[0];
    if (!acc[modelTerm.term]) {
      acc[modelTerm.term] = 0;
    }
    acc[modelTerm.term] += modelTerm.probability;
    return acc;
  }, {});
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const modelCache = {};

app.get('/', (req, res) => {
  const item = req.query && req.query.item;
  if (!item) {
    return res.send('Invalid query');
  }
  log(`request for ${item}`);
  const currentTime = new Date().getTime();
  const fiveMinutes = 5 * 60 * 1000;
  if (modelCache[item] && (modelCache[item].time - currentTime) < fiveMinutes) {
    log(`request for ${item} fulfilled by cache`);
    // TODO: record cache hit, if cache hits happen to many times invalidate the cache
    return res.send(modelCache[item].model);
  }

  request(`https://news.ycombinator.com/item?id=${item}`, (error, response, html) => {
    log(`recieved html for ${item}`);
    if (!error && response.statusCode === 200) {
      const $ = cheerio.load(html);
      const texts = $('.comment').text()
        .replace(/reply/g, '')
        .split('\n')
        .map(d => d.trim())
        .filter(d => d.length);
      log(`building model for ${item}`);
      const model = lda(texts, 5, 15, ['en'], null, null, 10).filter(d => d.length);
      log(`sending model for ${item}`);
      res.send(model);
      modelCache[item] = {
        time: currentTime,
        model
      };
    }
  });
});

app.listen(3000, () => log('listening on 3000'));
/* eslint-enable no-console */
