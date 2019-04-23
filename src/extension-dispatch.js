import {executeRequest} from './api-calls';
/* global chrome*/
// Chrome blocks cross origin requests from the content-script
// in order to get around this we redirect through the background script
// which uses the same api calls (see above) as the website and dev mode
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
