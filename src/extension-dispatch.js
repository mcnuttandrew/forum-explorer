import {executeRequest} from './api-calls';
/* global chrome*/

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  executeRequest(request)
    .then(data => sendResponse(data))
    .catch(error => {
      /* eslint-disable no-console */
      console.log(error, 'fuck', request);
      /* eslint-enable no-console */
    });
  return true;
});
