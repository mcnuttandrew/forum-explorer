import {SERVER_DEV_MODE} from '../constants';
import {prepareTree, log} from '../utils';
import {getTreeForId} from './db';

const buildEasyAction = type => payload => dispatch => dispatch({type, payload});
export const clearSelection = buildEasyAction('clear-selection');
export const setFoundOrder = buildEasyAction('set-found-order');
export const setHoveredComment = buildEasyAction('set-hovered-comment');
export const setSearch = buildEasyAction('set-search');
export const setSelectedCommentPath = buildEasyAction('set-comment-path');
export const setTimeFilter = buildEasyAction('set-time-filter');
export const toggleCommentSelectionLock = buildEasyAction('toggle-comment-selection-lock');
export const unlockAndSearch = buildEasyAction('unlock-and-search');
export const updateGraphPanelDimensions = buildEasyAction('update-graph-panel-dimensions');

const serverTemplate = SERVER_DEV_MODE ?
  item => `http://localhost:5000/?item=${item}` :
  item => `https://hn-ex.herokuapp.com/?item=${item}`;

const branchTemplate = SERVER_DEV_MODE ?
  item => `http://localhost:5000/?item=${item}&topics=1&terms=1` :
  item => `https://hn-ex.herokuapp.com/?item=${item}&topics=1&terms=1`;

export const modelData = item => dispatch => {
  fetch(serverTemplate(item), {mode: 'cors'})
  .then(d => d.json())
  .then(payload => dispatch({type: 'model-data', payload}))
  .catch(() => {});
};

export const modelBranches = (dispatch, data, root, tree) => {
  const items = tree.children
    .filter(({descendants}) => descendants >= 15)
    .map(({id}) => id);
  log('modeling branches', items.length);
  let current = 0;
  Promise.all(items.map(item => {
    return fetch(branchTemplate(item), {mode: 'cors'})
    .then(d => d.json())
    .then(d => {
      current += 1;
      log(`modeled ${current} / ${items.length}`);
      return d;
    })
    .then(model => ({item, model: model[0] && model[0][0] || null}));
  }))
  .then(payload => {
    return payload.reduce((acc, {item, model}) => {
      acc[item] = model;
      return acc;
    }, {});
  })
  .then(payload => dispatch({type: 'model-branches', payload}));
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

const itemUrl = id => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
export const getAllItems = root => dispatch => {
  let children = [];
  const getChild = child => fetch(itemUrl(child)).then(response => response.json());
  let depth = 0;
  const doGeneration = generation =>
    Promise.all(generation.map(child => getChild(child)))
    .then(offspring => {
      dispatch({
        type: 'increase-loaded-count',
        payload: {newCount: children.length}
      });
      children = children.concat(offspring.map(d => ({children: [], ...d, depth})));
      depth += 1;
      const newgen = offspring
        .reduce((acc, child) => acc.concat(child && child.kids || []), []);
      if (newgen.length) {
        return doGeneration(newgen);
      }
      return children;
    });

  return Promise.resolve()
    .then(() => doGeneration([root]))
    .then(data => {
      const tree = prepareTree(data, root);
      dispatch({
        type: 'get-all-items',
        payload: {data, root, tree}
      });
      modelBranches(dispatch, data, root, tree);
      getAllUsers(dispatch, data);
    });
};

export const setPageId = payload => dispatch => {
  dispatch({type: 'set-page-id', payload});
  getTreeForId(payload)
    .then(result => dispatch({
      type: 'get-tree-from-cache',
      payload: {
        data: result,
        pageId: payload
      }
    }));
};
