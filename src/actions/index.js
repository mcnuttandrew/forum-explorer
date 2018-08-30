export function modelData(item) {
  return dispatch => {
    fetch(`http://localhost:3000/?item=${item}`, {
      mode: 'cors'
    })
    .then(d => d.json())
    .then(d => console.log(d));
  };
}

export function startGetItem(itemId) {
  return dispatch => dispatch({type: 'start-request', payload: {itemId}});
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

export function setSelectedCommentPath(path) {
  return dispatch => {
    dispatch({
      type: 'set-comment-path',
      payload: {path}
    });
  };
}

export function toggleGraphLayout() {
  return dispatch => dispatch({type: 'toggle-graph-layout'});
}

export function setHoveredComment(payload) {
  return dispatch => dispatch({type: 'set-hovered-comment', payload});
}

export function toggleCommentSelectionLock() {
  return dispatch => dispatch({type: 'toggle-comment-selection-lock'});
}

export function setFoundOrder(payload) {
  return dispatch => dispatch({type: 'set-found-order', payload});
}
