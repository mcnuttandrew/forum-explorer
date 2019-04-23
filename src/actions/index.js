/* global chrome*/
import {CHILD_THRESHOLD, SERVER_DEV_MODE} from '../constants';
import {prepareTree, log} from '../utils';
import {executeRequest} from '../api-calls';
import {getTreeForId} from './db';
const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

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

const EXTENSION_MODE = window.origin === 'https://news.ycombinator.com';
function dispatchRequest(details) {
  if (EXTENSION_MODE) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(details, resolve);
    });
  }
  return executeRequest(details);
}

export const modelData = item => dispatch => {
  dispatchRequest({
    template: SERVER_DEV_MODE ? 'modelFullPageTemplateDevMode' : 'modelFullPageTemplate',
    item
  })
    .then(payload => dispatch({type: 'model-data', payload}))
    .catch(() => {});
};

export const modelBranches = (dispatch, data, root, tree) => {
  const items = tree.children
    .filter((d) => d.descendants >= CHILD_THRESHOLD)
    .map(({id}) => id);
  log('modeling branches', items.length);
  let current = 0;
  Promise.all(items.map(item => {
    return dispatchRequest({
      template: SERVER_DEV_MODE ? 'modelSingleBranchTemplateDevMode' : 'modelSingleBranchTemplate',
      item
    })
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

// not currently in use
export function getAllUsers(dispatch, data) {
  const users = Object.keys(data.reduce((acc, row) => {
    acc[row.by] = true;
    return acc;
  }, {}));
  Promise.all(users.map(item => dispatchRequest({template: 'userTemplate', item})))
    .then(userData => dispatch({
      type: 'get-all-users',
      payload: userData
    }));
}

export const getAllItems = root => dispatch => {
  let children = [];
  let depth = 0;
  const doGeneration = generation =>
    Promise.all(generation.map(item => dispatchRequest({template: 'hnTemplate', item})))
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
      // construct models for the relevant branches
      modelBranches(dispatch, data, root, tree);
      // get all of the users, not current in use
      // getAllUsers(dispatch, data);

      // maybe call getAllItems again if it's a new-ish thread
      const time = tree.data.data.time * 1000;
      const currentTime = new Date().getTime();
      if ((currentTime - time) > DAY) {
        return;
      }
      setTimeout(() => getAllItems(root)(dispatch), 30 * SECOND);
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

export const getItemsFromCacheOrRedirect = payload => dispatch => {
  getTreeForId(payload)
    .then(result => {
      // redirect if not found
      if (!result) {
        window.location.href = `?id=${payload}`;
        return;
      }
      // if found pull from cache & update the location url
      window.history.pushState('', '', `?id=${payload}`);
      dispatch({
        type: 'get-tree-from-cache',
        payload: {
          data: result,
          pageId: payload
        }
      });
    });
};
