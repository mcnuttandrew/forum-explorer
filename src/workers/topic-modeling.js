// import lda from 'lda';
// const lda = require('lda');
const lda = require('../lda-fork/lda');
/* eslint-disable consistent-this */
module.exports = function worker(self) {
  const sendMessage = msg => self.postMessage(msg);
  self.addEventListener('message', event => {
    const strings = event.data.map(row => row.trim().replace(/reply$/, '').trim());
    console.log('preparing model')
    new Promise((resolve, reject) => resolve())
    .then(() => lda(strings, 5, 1, ['en'], null, null, 10))
    .then(model => {
      const dedupedModel = model.reduce((acc, row) => {
        console.log(acc, row)
        const modelTerm = row[0];
        if (!acc[modelTerm.term]) {
          acc[modelTerm.term] = 0;
        }
        acc[modelTerm.term] += modelTerm.probability;
        return acc;
      }, {});
      console.log(model, dedupedModel, Object.entries(dedupedModel))

      sendMessage(Object.entries(dedupedModel));
    });
  });
};
