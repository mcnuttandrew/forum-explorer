const SECOND = 1000;

const sleep = delay => new Promise((resolve, reject) => setTimeout(resolve, delay));
export const fetchWithRetry = (url, props = {mode: 'cors', maxRetries: 12, delay: SECOND * 5}) => {
  const {maxRetries, delay} = props;
  let currentRerties = 0;
  // recursively retry fetch with delay
  const fetcher = () =>
    fetch(url, props)
    .then(d => {
      if (d.status !== 200 && currentRerties < maxRetries) {
        currentRerties += 1;
        return sleep(delay).then(fetcher);
      }
      return d;
    });
  return fetcher();
};

const hnTemplate = id => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;

const modelFullPageTemplateDevMode = item => `http://localhost:5000/?item=${item}`;
const modelFullPageTemplate = item => `https://hn-ex.herokuapp.com/?item=${item}`;

const modelSingleBranchTemplateDevMode = item => `http://localhost:5000/?item=${item}&topics=1&terms=1`;
const modelSingleBranchTemplate = item => `https://hn-ex.herokuapp.com/?item=${item}&topics=1&terms=1`;

const userTemplate = id => `https://hacker-news.firebaseio.com/v0/user/${id}.json`;

const templates = {
  hnTemplate,
  modelFullPageTemplate,
  modelFullPageTemplateDevMode,
  modelSingleBranchTemplate,
  modelSingleBranchTemplateDevMode,
  userTemplate
};

export const executeRequest = ({template, item}) => {
  const callTemplate = templates[template];
  if (!callTemplate) {
    return Promise.reject();
  }
  return fetchWithRetry(callTemplate(item))
    .then(d => d.json());
};
