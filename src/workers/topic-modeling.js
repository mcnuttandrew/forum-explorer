// import lda from 'lda';
const lda = require('lda');
/* eslint-disable consistent-this */
module.exports = function worker(self) {
  const sendMessage = msg => self.postMessage(msg);
  self.addEventListener('message', event => {
    // console.log(event);
    console.log(event.data)
    new Promise((resolve, reject) => resolve())
    .then(() => lda(event.data, 2, 5))
    .then(model => {
      console.log(model)
      sendMessage(model);
    });
  });
};
