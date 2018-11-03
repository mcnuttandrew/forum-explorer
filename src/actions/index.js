import {SERVER_DEV_MODE} from '../constants';

const buildEasyAction = type => payload => dispatch => dispatch({type, payload});
export const setHoveredComment = buildEasyAction('set-hovered-comment');
export const toggleCommentSelectionLock = buildEasyAction('toggle-comment-selection-lock');
export const setFoundOrder = buildEasyAction('set-found-order');
export const setSearch = buildEasyAction('set-search');
export const startGetItem = buildEasyAction('start-request');
export const setSelectedCommentPath = buildEasyAction('set-comment-path');

const serverTemplate = SERVER_DEV_MODE ?
  item => `http://localhost:3000/?item=${item}` :
  item => `https://hn-ex.herokuapp.com/?item=${item}`;

export function modelData(item) {
  return dispatch => {
    fetch(serverTemplate(item), {mode: 'cors'})
    .then(d => d.json())
    .then(payload => dispatch({type: 'model-data', payload}))
    .catch(() => {});
  };
}

export function getItem(itemId, isRoot) {
  if (!itemId) {
    return dispatch => dispatch({type: 'no-get-item'});
  }
  return dispatch => {
    fetch(`https://hacker-news.firebaseio.com/v0/item/${itemId}.json`)
    .then(response => response.json())
    .then((result) => {
      dispatch({
        type: 'get-item',
        payload: result,
        isRoot
      });
    })
    .catch(() => {
      dispatch({
        type: 'get-item',
        payload: null,
        isRoot
      });
    });
  };
}

export function setConfig(rowIdx, valueIdx) {
  return dispatch => dispatch({
    type: 'set-config-value',
    payload: {rowIdx, valueIdx}
  });
}
