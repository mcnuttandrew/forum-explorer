/* global chrome*/
import {CHILD_THRESHOLD} from '../constants';
import {prepareTree} from '../utils';
import {executeRequest} from '../api-calls';
import {checkForTour, getTreeForId, getSettingsFromDb} from './db';
import {buildLDAModel} from '../client-side-topic-modeling';
const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const buildEasyAction = (type) => (payload) => (dispatch) => dispatch({type, payload});
export const clearSelection = buildEasyAction('clear-selection');
export const finishTour = buildEasyAction('finish-tour');
export const lockAndSearch = buildEasyAction('lock-and-search');
export const setFoundOrder = buildEasyAction('set-found-order');
export const setHoveredComment = buildEasyAction('set-hovered-comment');
export const setSearch = buildEasyAction('set-search');
export const setSelectedCommentPath = buildEasyAction('set-comment-path');
export const setSelectedCommentPathWithGraphComment = buildEasyAction('set-comment-path-with-graph-comment');
export const setSelectedCommentPathWithSelectionClear = buildEasyAction(
  'set-comment-path-with-selection-clear',
);
export const setShowTour = buildEasyAction('show-tour');
export const unsetGraphComment = buildEasyAction('unset-graph-comment');
export const setTimeFilter = buildEasyAction('set-time-filter');
export const toggleCommentSelectionLock = buildEasyAction('toggle-comment-selection-lock');
export const unlockAndSearch = buildEasyAction('unlock-and-search');
export const updateGraphPanelDimensions = buildEasyAction('update-graph-panel-dimensions');

const EXTENSION_MODE = window.origin === 'https://news.ycombinator.com';
const dispatchRequest = EXTENSION_MODE
  ? (details) => new Promise((resolve, reject) => chrome.runtime.sendMessage(details, resolve))
  : (details) => executeRequest(details);

const cleanModels = (models) => models.map((row) => row.map((d) => ({...d, term: d.term.split("'")[0]})));

export const sleep = (sleepTime) => (x) => new Promise((resolve) => setTimeout(() => resolve(x), sleepTime));

export const checkIfTourShouldBeShown = () => (dispatch) =>
  checkForTour().then((payload) => dispatch({type: 'check-if-tour-should-be-shown', payload}));
const modelData = (data) => (dispatch) => {
  return buildLDAModel(data, 5, 15).then((model) => {
    dispatch({type: 'model-data', payload: cleanModels(model)});
  });
};

const collectCommentsFromTree = (tree) => {
  const comments = [tree.data.text];
  tree.children.forEach((child) => {
    collectCommentsFromTree(child).forEach((x) => comments.push(x));
  });
  return comments.filter((x) => x);
};

const modelBranches = (dispatch, data, root, tree) => {
  const items = tree.children.filter((d) => d.descendants >= CHILD_THRESHOLD);
  Promise.all(
    items.map((x) => {
      return buildLDAModel(collectCommentsFromTree(x), 1, 1).then((model) => ({
        model: cleanModels(model)[0][0],
        item: x.id,
      }));
    }),
  )

    .then((payload) => {
      return payload.reduce((acc, {item, model}) => {
        acc[item] = model;
        return acc;
      }, {});
    })
    .then((payload) => dispatch({type: 'model-branches', payload}));
};

export const setConfig = (configCategory, configValue) => (dispatch) =>
  dispatch({
    type: 'set-config-value',
    payload: {configCategory, configValue},
  });

// not currently in use
export function getAllUsers(dispatch, data) {
  const users = Object.keys(
    data.reduce((acc, row) => {
      acc[row.by] = true;
      return acc;
    }, {}),
  );
  Promise.all(users.map((item) => dispatchRequest({template: 'userTemplate', item}))).then((userData) =>
    dispatch({
      type: 'get-all-users',
      payload: userData,
    }),
  );
}

export const getAllItems = (root, ignoreSettingsUpdate) => (dispatch) => {
  let children = [];
  let depth = 0;
  const doGeneration = (generation) =>
    Promise.all(generation.map((item) => dispatchRequest({template: 'hnTemplate', item}))).then(
      (offspring) => {
        dispatch({
          type: 'increase-loaded-count',
          payload: {newCount: children.length},
        });
        children = children.concat(offspring.map((d) => ({children: [], ...d, depth})));
        depth += 1;
        const newgen = offspring.reduce((acc, child) => acc.concat((child && child.kids) || []), []);
        if (newgen.length) {
          return doGeneration(newgen);
        }
        return children;
      },
    );
  return Promise.resolve()
    .then(() => doGeneration([root]))
    .then((data) => {
      modelData(data.filter((x) => x.text).map((x) => x.text))(dispatch);
      const tree = prepareTree(data, root);
      dispatch({
        type: 'get-all-items',
        payload: {data, root, tree, ignoreSettingsUpdate},
      });
      // construct models for the relevant branches
      modelBranches(dispatch, data, root, tree);
      // get all of the users, not current in use
      // getAllUsers(dispatch, data);

      // maybe call getAllItems again if it's a new-ish thread
      const time = tree.data.data.time * 1000;
      const currentTime = new Date().getTime();
      if (currentTime - time > DAY) {
        return;
      }
      setTimeout(() => getAllItems(root, true)(dispatch), 40 * SECOND);
    });
};

export const setPageId = (payload) => (dispatch) => {
  dispatch({type: 'set-page-id', payload});
  getTreeForId(payload).then((result) =>
    dispatch({
      type: 'get-tree-from-cache',
      payload: {
        data: result,
        pageId: payload,
      },
    }),
  );
};

export const getItemsFromCacheOrRedirect = (payload) => (dispatch) => {
  getTreeForId(payload).then((result) => {
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
        pageId: payload,
      },
    });
  });
};

export const getSettingsFromCache = () => (dispatch) =>
  getSettingsFromDb().then((payload) => {
    if (!payload) {
      return;
    }
    dispatch({type: 'get-settings-from-cache', payload});
  });
