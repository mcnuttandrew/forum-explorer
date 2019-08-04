const lda = require('lda');
const cheerio = require('cheerio');
function stripAndModel(html, topics, terms) {
  const $ = cheerio.load(html);
  const texts = $('.comment').text()
    .replace(/reply/g, '')
    .split('\n')
    .map(d => d.trim())
    .filter(d => d.length);

  return lda(texts, topics, terms, ['en'], null, null, 10).filter(d => d.length);
}

const recordVisit = (db, itemId) => new Promise((resolve, reject) => {
  const cb = (err, result) => err ? reject(err) : resolve(result);
  db.collection('visits')
    .insertOne({itemId, time: new Date().getTime()}, cb);
});

const recordModel = (db, itemId, model) => new Promise((resolve, reject) => {
  const cb = (err, result) => err ? reject(err) : resolve(result);
  db.collection('models')
    .updateOne({itemId}, {$set: {time: new Date().getTime(), model}}, {upsert: true}, cb);
});

const fetch = (db, collectionName, query, limit) => {
  const collection = db.collection(collectionName);
  return new Promise((resolve, reject) => {
    const cursor = collection.find(query);
    const cb = (err, result) => err ? reject(err) : resolve(result);
    if (limit) {
      cursor.limit(1).toArray(cb);
      return;
    }
    cursor.toArray(cb);
  });
};
const fetchModel = (db, itemId) => fetch(db, 'models', {itemId}, 1);
const fetchAllModels = (db, itemId) => fetch(db, 'models', {}, false);
const fetchVisitsByItem = (db, itemId) => fetch(db, 'visits', {itemId}, false);
const fetchAllVisits = (db, itemId) => fetch(db, 'visits', {}, false);

const sleep = delay => new Promise((resolve, reject) => setTimeout(d => resolve(), delay));
/* eslint-disable */
const log = msg => console.log(`${new Date().getTime()}: ${msg}`);
/* eslint-enable */

module.exports = {
  stripAndModel,
  recordModel,
  fetchModel,
  recordVisit,
  fetchVisitsByItem,
  fetchAllVisits,
  fetchAllModels,
  sleep,
  log
};
