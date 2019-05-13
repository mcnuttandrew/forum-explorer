const fs = require('fs');
/* eslint-disable no-console, no-undef*/
const location = './src/constants/environment-configs.json';
fs.readFile(location, 'utf8', (err, data) => {
  if (err) {
    console.log('ERROR!', err);
    return;
  }
  const cliArgs = process.argv.reduce((acc, val, index) => {
    acc[index] = val;
    return acc;
  }, {});
  const setToTrue = !cliArgs[2] || (cliArgs[2] === 'true');
  const config = JSON.parse(data);
  config.WEB_PAGE_MODE = setToTrue;
  fs.writeFile(location, JSON.stringify(config, null, 2), (error) => {
    if (error) {
      console.log('WRITE ERROR', error);
      return;
    }
    console.log(`SET TO ${setToTrue ? 'TRUE' : 'FALSE'}`);
  });

});
/* eslint-enable no-console, no-undef*/
