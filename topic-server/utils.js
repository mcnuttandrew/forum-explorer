const lda = require('lda');
const cheerio = require('cheerio');
const {query} = require('./db');
const fetch = require('node-fetch');

const getTime = () => new Date().getTime();
const sleep = (delay) => new Promise((resolve, reject) => setTimeout((d) => resolve(), delay));
/* eslint-disable */
const log = (msg) => console.log(`${new Date().getTime()}: ${msg}`);
const hnTemplate = (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;

function stripAndModel(html, topics, terms) {
  const $ = cheerio.load(html);
  const texts = $('.comment')
    .text()
    .replace(/reply/g, '')
    .split('\n')
    .map((d) => d.trim())
    .filter((d) => d.length);

  return lda(texts, topics, terms, ['en'], null, null, 10).filter((d) => d.length);
}

const fetchModel = (itemId, numTopics, numTerms) => {
  const getModel = 'SELECT * FROM models WHERE item_id=$1 AND num_topics=$2 AND num_terms=$3;';
  return query(getModel, [itemId, numTopics, numTerms]);
};

const recordModel = (itemId, numTopics, numTerms, model) => {
  const createModel = `
INSERT INTO models 
(item_id, num_topics, num_terms, model, visits, data) 
VALUES ($1, $2, $3, $4, $5, $6);
  `;
  const updateModel = `
UPDATE models
SET model=$1
WHERE item_id=$2 AND num_topics=$3 AND num_terms=$4;
`;
  const checkedModel = JSON.stringify(model);
  const visits = JSON.stringify([getTime()]);
  return fetchModel(itemId, numTopics, numTerms).then((result) => {
    // if there's nothing there then create it
    if (!result.rows.length) {
      return fetch(hnTemplate(itemId))
        .then((d) => d.json())
        .then((data) => {
          return query(createModel, [
            itemId,
            numTopics,
            numTerms,
            checkedModel,
            visits,
            JSON.stringify(data),
          ]);
        });
    }
    // if there's something there, then update it
    return query(updateModel, [checkedModel, itemId, numTopics, numTerms]);
  });
};

const recordVisit = (itemId, numTopics, numTerms) =>
  fetchModel(itemId, numTopics, numTerms).then((result) => {
    if (!result.rows.length) {
      return recordModel(itemId, numTopics, numTerms, []);
    }
    // get visit from result
    const updatedVisits = [...result.rows[0].visits, getTime()];
    // from this get the result
    query(
      `
      UPDATE models
      SET visits=$1
      WHERE item_id=$2 AND num_topics=$3 AND num_terms=$4;
      `,
      [JSON.stringify(updatedVisits), itemId, numTopics, numTerms],
    );
  });

const fetchAll = () => query('SELECT * FROM models;');

module.exports = {
  fetchAll,
  fetchModel,
  recordModel,
  recordVisit,
  hnTemplate,
  log,
  sleep,
  stripAndModel,
};
