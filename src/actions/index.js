import {SERVER_DEV_MODE} from '../constants';

const buildEasyAction = type => payload => dispatch => dispatch({type, payload});
export const setHoveredComment = buildEasyAction('set-hovered-comment');
export const toggleCommentSelectionLock = buildEasyAction('toggle-comment-selection-lock');
export const unlockAndSearch = buildEasyAction('unlock-and-search');
export const setFoundOrder = buildEasyAction('set-found-order');
export const setSearch = buildEasyAction('set-search');
export const startGetItem = buildEasyAction('start-request');
export const setSelectedCommentPath = buildEasyAction('set-comment-path');

const serverTemplate = SERVER_DEV_MODE ?
  item => `http://localhost:3000/?item=${item}` :
  item => `https://hn-ex.herokuapp.com/?item=${item}`;

export const modelData = item => dispatch => {
  fetch(serverTemplate(item), {mode: 'cors'})
  .then(d => d.json())
  .then(payload => dispatch({type: 'model-data', payload}))
  .catch(() => {});
};

const generateHNcall = getType => (itemId, isRoot) => {
  if (!itemId) {
    return dispatch => dispatch({type: `no-get-${getType}`});
  }
  const common = {type: `get-${getType}`, isRoot};
  return dispatch => {
    fetch(`https://hacker-news.firebaseio.com/v0/${getType}/${itemId}.json`)
    .then(response => response.json())
    .then(payload => dispatch({...common, payload}))
    .catch(() => dispatch({...common, payload: null}));
  };
};

export const getItem = generateHNcall('item');
export const getUser = generateHNcall('user');

export const setConfig = (rowIdx, valueIdx) => dispatch => dispatch({
  type: 'set-config-value',
  payload: {rowIdx, valueIdx}
});
