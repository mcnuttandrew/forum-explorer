import {SERVER_DEV_MODE} from '../constants';

const buildEasyAction = type => payload => dispatch => dispatch({type, payload});
export const setHoveredComment = buildEasyAction('set-hovered-comment');
export const toggleCommentSelectionLock = buildEasyAction('toggle-comment-selection-lock');
export const unlockAndSearch = buildEasyAction('unlock-and-search');
export const setFoundOrder = buildEasyAction('set-found-order');
export const setSearch = buildEasyAction('set-search');
// export const startGetItem = buildEasyAction('start-request');
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

export const setConfig = (rowIdx, valueIdx) => dispatch => dispatch({
  type: 'set-config-value',
  payload: {rowIdx, valueIdx}
});

const userUrl = id => `https://hacker-news.firebaseio.com/v0/user/${id}.json`;
function getAllUsers(dispatch, data) {
  const getChild = id => fetch(userUrl(id)).then(response => response.json());
  const users = Object.keys(data.reduce((acc, row) => {
    acc[row.by] = true;
    return acc;
  }, {}));
  Promise.all(users.map(getChild))
    .then(userData => dispatch({
      type: 'get-all-users',
      payload: userData
    }));
}

function prepareTree(data, maxDepth) {
  const nodesByParentId = data.reduce((acc, child) => {
    if (child.parent && !acc[child.parent]) {
      acc[child.parent] = [];
    }
    acc[!child.parent ? 'root' : child.parent].push(child);
    return acc;
  }, {root: []});
  const formToTree = node => ({
    depth: node.depth,
    height: maxDepth - node.depth - 1,
    id: `${node.id}`,
    data: node,
    parent: null,
    children: (nodesByParentId[node.id] || [])
      .map(child => formToTree(child))
      .map(child => {
        child.parent = `${child.data.parent}`;
        return child;
      })
  });

  return {
    data,
    tree: formToTree(nodesByParentId.root[0])
  };
}

const itemUrl = id => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
export const getAllItems = root => {
  let children = [];
  const getChild = child => fetch(itemUrl(child)).then(response => response.json());
  let depth = 0;
  const doGeneration = generation =>
    Promise.all(generation.map(child => getChild(child)))
    .then(offspring => {
      children = children.concat(offspring.map(d => ({...d, depth})));
      depth += 1;
      const newgen = offspring
        .reduce((acc, child) => acc.concat(child.kids || []), []);
      if (newgen.length) {
        return doGeneration(newgen);
      }
      return children;
    });

  return dispatch => Promise.resolve()
    .then(() => doGeneration([root]))
    .then(data => data.sort((a, b) => a.time - b.time))
    .then(data => {
      dispatch({
        type: 'get-all-items',
        payload: prepareTree(data, depth)
      });
      getAllUsers(dispatch, data);
    });
};
