const fs = require('fs');
const fetch = require('node-fetch');

const range = [19113658, 19000658];
let currentTop = range[0];
const batchSize = 1000;

const itemUrl = id => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
const getChild = child => fetch(itemUrl(child)).then(response => response.json());

const wstream = fs.createWriteStream('myOutput.txt');
function writeToFile(batch) {
  return Promise.resolve()
    .then(() => {
      batch.forEach(row => {
        wstream.write(`${JSON.stringify(row)},`);
      });
    });

}

function sleep() {
  const sleepAmount = Math.floor(1000 * Math.random());
  return new Promise((resolve, reject) => setTimeout(() => resolve(), sleepAmount));
}

function grabBatch() {
  return Promise.all([...new Array(batchSize)]
    .map((_, idx) => currentTop + idx)
    .map(item => getChild(item)))
    .then(items => writeToFile(items))
    .then(sleep)
    .then(() => {
      const percentDone = Math.floor(100 * (currentTop - range[1]) / (range[0] - range[1]));
      /* eslint-disable no-console */
      console.log(`Percent ${percentDone}`);
      /* eslint-enable no-console */
      currentTop -= batchSize;
    })
    .then(() => {
      if (currentTop > range[1]) {
        return grabBatch();
      }
      return Promise.resolve();
    });
}

grabBatch();
