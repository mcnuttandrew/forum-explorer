const buildEasyAction = type => payload => dispatch => dispatch({type, payload});
export const setHoveredComment = buildEasyAction('set-hovered-comment');
export const toggleCommentSelectionLock = buildEasyAction('toggle-comment-selection-lock');
export const setFoundOrder = buildEasyAction('set-found-order');
export const setSearch = buildEasyAction('set-search');
export const startGetItem = buildEasyAction('start-request');
export const setSelectedCommentPath = buildEasyAction('set-comment-path');

export function modelData(item) {
  return dispatch => {
    fetch(`http://localhost:3000/?item=${item}`, {
      mode: 'cors'
    })
    .then(d => d.json())
    .then(payload => dispatch({type: 'model-data', payload}))
    .catch(() => {});
  };
}

export function getItem(itemId, isRoot) {
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
