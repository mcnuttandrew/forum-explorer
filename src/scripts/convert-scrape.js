const fs = require('fs');
/* eslint-disable no-console */
fs.readFile('myOutput.txt', (err, data) => {
  if (err) {
    console.log('error');
    return;
  }
  const content = JSON.parse(`[${data.slice(0, data.length - 1)}]`);
  console.log(`Loaded ${content.length} rows`);
  fs.writeFile('converted-scrape.json', JSON.stringify(content), 'utf8', (error, x) => {
    if (error) {
      console.log('error');
      return;
    }
    console.log('DONE!');
  });
});
/* eslint-enable no-console */
