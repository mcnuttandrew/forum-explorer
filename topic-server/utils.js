const lda = require('lda');
const cheerio = require('cheerio');

const getTime = () => new Date().getTime();
const sleep = delay =>
  new Promise((resolve, reject) => setTimeout(d => resolve(), delay));
/* eslint-disable */
const log = msg => console.log(`${new Date().getTime()}: ${msg}`);
/* eslint-enable */
const hnTemplate = id =>
  `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
const cleanItem = item =>
  ['by', 'id', 'parent', 'time', 'title'].reduce((acc, key) => {
    acc[key] = item[key];
    return acc;
  }, {});

function stripAndModel(html, topics, terms) {
  const $ = cheerio.load(html);
  const texts = $('.comment')
    .text()
    .replace(/reply/g, '')
    .split('\n')
    .map(d => d.trim())
    .filter(d => d.length);

  return lda(texts, topics, terms, ['en'], null, null, 10).filter(
    d => d.length,
  );
}

const record = (db, collectionName, query, update) =>
  new Promise((resolve, reject) => {
    const cb = (err, result) => (err ? reject(err) : resolve(result));
    db.collection(collectionName).updateOne(query, update, {upsert: true}, cb);
  });
const recordModel = (db, itemId, model) =>
  record(db, 'models', {itemId}, {$set: {time: getTime(), model}});
const recordVisit = (db, itemId) =>
  record(db, 'visits', {itemId}, {$push: {time: getTime()}});
const recordItemData = (db, item) =>
  record(
    db,
    'itemData',
    {itemId: item.id},
    {$set: {time: getTime(), item: cleanItem(item)}},
  );

const fetch = (db, collectionName, query, limit) => {
  const collection = db.collection(collectionName);
  return new Promise((resolve, reject) => {
    const cursor = collection.find(query);
    const cb = (err, result) => (err ? reject(err) : resolve(result));
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
const fetchItemData = (db, itemId) => fetch(db, 'itemData', {itemId}, 1);

module.exports = {
  fetchAllVisits,
  fetchAllModels,
  fetchItemData,
  fetchModel,
  fetchVisitsByItem,
  hnTemplate,
  log,
  sleep,
  stripAndModel,
  recordItemData,
  recordModel,
  recordVisit,
};
