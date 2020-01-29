import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import Immutable, {Map} from 'immutable';
import {updateIdInDb, pushSettingsToDb} from '../actions/db';

import {
  DEV_MODE,
  numUsersToHighlight,
  CONFIG_OBJECT,
  GRAPH_LAYOUT_CONFIG,
} from '../constants';
import {computeFullGraphLayout, graphLayouts} from '../layouts';
import TestData from '../constants/test-data.json';
// import TestData from '../constants/really-big-data.json';
import {computeTopUsers, computeHistrogram, prepareTree} from '../utils';

let DEFAULT_STATE = Immutable.fromJS({
  branchModel: {},
  commentSelectionLock: false,
  configs: CONFIG_OBJECT,
  data: DEV_MODE ? TestData : [],
  dfsOrderedData: [],
  users: {},
  foundOrderMap: {},
  graphPanelDimensions: {height: 0, width: 0},
  // this is a hover highlight for the comment panel
  hoveredComment: null,
  // this tells the comment panel that it should scroll this comment into view
  hoveredGraphComment: null,
  histogram: DEV_MODE ? computeHistrogram(TestData) : [],
  itemsToRender: [],
  itemPath: [],
  loading: !DEV_MODE,
  loadedCount: 0,
  model: null,
  pageId: null,
  timeFilter: {min: 0, max: 0},
  showTour: false,
  searchValue: '',
  storyHead: null,
  searchedMap: {},
})
  .set('tree', DEV_MODE ? prepareTree(TestData, null) : null)
  .set(
    'topUsers',
    DEV_MODE
      ? computeTopUsers(Immutable.fromJS(TestData), numUsersToHighlight)
      : [],
  );

DEFAULT_STATE = DEFAULT_STATE.set(
  'fullGraph',
  computeFullGraphLayout(DEFAULT_STATE),
).set('routeTable', prepareRoutesTable(DEFAULT_STATE));

function modelComment(model, text) {
  return model.reduce(
    (acc, row, modelIndex) => {
      const modelScore = row.reduce((score, feature) => {
        return score + (text.includes(feature.term) ? feature.probability : 0);
      }, 0);
      if (modelScore > acc.modelScore) {
        return {modelScore, modelIndex};
      }
      return acc;
    },
    {modelIndex: null, modelScore: -Infinity},
  );
}

const setSelectedCommentPath = (state, payload) => {
  const itemMap = (state.get('routeTable')[payload] || []).reduce(
    (acc, row) => {
      acc[row] = true;
      return acc;
    },
    {},
  );
  return state
    .set(
      'itemsToRender',
      state
        .get('data')
        .filter(
          (row, idx) =>
            !idx ||
            itemMap[row.get('id')] ||
            `${row.get('parent')}` === payload[0],
        )
        .filter(row => !row.get('deleted')),
    )
    .set('itemPath', Immutable.fromJS(payload));
};

const setSelectedCommentPathWithGraphComment = (state, payload) =>
  setSelectedCommentPath(state.set('hoveredGraphComment', payload), payload);

const setSelectedCommentPathWithSelectionClear = (state, payload) =>
  setSelectedCommentPath(state.set('searchValue', ''), payload);

const unsetGraphComment = state => state.set('hoveredGraphComment', null);

const increaseLoadedCount = (state, {newCount}) =>
  state.set('loadedCount', newCount);

const setHoveredComment = (state, payload) =>
  state.set('hoveredComment', (payload && payload.get('id')) || null);

const setFoundOrder = (state, payload) => {
  const foundOrderMap = payload.reduce((acc, content, order) => {
    acc[content.id] = {...content, order};
    return acc;
  }, {});

  return state.set('foundOrderMap', Immutable.fromJS(foundOrderMap));
};

const modelData = (state, payload) => {
  const serializedModel = Object.entries(
    payload.reduce((acc, row) => {
      row.forEach(({term, probability}) => {
        acc[term] = (acc[term] || 0) + probability;
      });
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(d => d[0]);

  return state
    .set('model', payload)
    .set('serialized-model', serializedModel)
    .set(
      'data',
      state.get('data').map(row => {
        const evalModel = modelComment(payload, row.get('text') || '');
        return row.set('modeledTopic', evalModel.modelIndex);
      }),
    );
};

const modelBranches = (state, payload) => {
  const tempState = state.set('branchModel', Immutable.fromJS(payload));
  return tempState.set('fullGraph', computeFullGraphLayout(tempState));
};

const setConfig = (state, {configCategory, configValue}) => {
  const updatedState = state.setIn(['configs', configCategory], configValue);
  pushSettingsToDb(updatedState.get('configs').toJS());
  if (configCategory !== GRAPH_LAYOUT_CONFIG) {
    return updatedState;
  }
  return updatedState.set('fullGraph', computeFullGraphLayout(updatedState));
};

const selectSubset = (state, searchedMap, nullSearch) => {
  const newState = state.set('searchedMap', searchedMap);

  // Don't clear the selection if the user has locked it
  // i'm really confused if this is right
  // if (state.get('commentSelectionLock')) {
  //   return newState;
  // }
  const chain = nullSearch
    ? []
    : newState
        .get('data')
        .filter((d, idx) => !idx || searchedMap.get(d.get('id')));

  return setSelectedCommentPath(newState, []).set('itemsToRender', chain);
};

const setSearch = (state, payload) => {
  if (state.get('searchValue') === payload) {
    return state;
  }
  const nullSearch = payload === '' || !payload.length;
  const searchTerm = payload.toLowerCase();
  const searchedMap = nullSearch
    ? Map()
    : state.get('data').reduce((acc, row) => {
        const searchMatchesUser = (row.get('by') || '')
          .toLowerCase()
          .includes(searchTerm);
        const searchMatchesText = (row.get('text') || '')
          .toLowerCase()
          .includes(searchTerm);
        return acc.set(
          row.get('id'),
          Boolean(searchMatchesText || searchMatchesUser),
        );
      }, Map());
  return selectSubset(
    state.set('searchValue', payload),
    searchedMap,
    nullSearch,
  );
};

const unlockAndSearch = (state, payload) =>
  setSearch(state.set('commentSelectionLock', false), payload);
const lockAndSearch = (state, payload) =>
  setSearch(state.set('commentSelectionLock', true), payload);

const clearSelection = (state, payload) =>
  unlockAndSearch(state.set('searchValue', '!!!!'), '');

const getAllUsers = (state, users) =>
  state.set(
    'users',
    users.reduce((acc, row) => acc.set(row.id, row), Map()),
  );

const updateGraphPanelDimensions = (state, payload) => {
  const tempState = state.set(
    'graphPanelDimensions',
    Immutable.fromJS(payload),
  );
  return tempState.set('fullGraph', computeFullGraphLayout(tempState));
};

function prepareRoutesTable(state) {
  // loop across tree
  const routeTable = {};
  function decorateWithRoutes(node, parentRoute) {
    if (!node) {
      return;
    }
    routeTable[`${node.id}`] = parentRoute.concat(Number(node.id));
    node.children.forEach(child =>
      decorateWithRoutes(child, routeTable[Number(node.id)]),
    );
    routeTable[`${node.id}`] = routeTable[`${node.id}`].concat(
      node.children.map(({id}) => `${id}`),
    );
  }
  decorateWithRoutes(state.get('tree'), []);
  return routeTable;
}

const appropriateDotSize = numComments =>
  numComments > 600 ? 0 : numComments < 20 ? 2 : 1;

function reconcileTreeWithData(tree, data) {
  const treeMap = {};
  const countMap = {};
  function buildMap(node) {
    treeMap[`${node.id}`] = node.children;
    countMap[`${node.id}`] = node.descendants;
    node.children.forEach(child => buildMap(child));
  }
  buildMap(tree);
  return data.map(row => {
    const id = `${row.id}`;
    return {
      ...row,
      children: treeMap[id],
      descendants: countMap[id],
    };
  });
}

const getTreeFromCache = (state, payload) => {
  if (!payload || typeof payload.data !== 'object') {
    return state;
  }
  const {data, pageId} = payload;
  const preppedData = Immutable.fromJS(data);
  const tempState = state
    .set('loading', false)
    .set('searchValue', '')
    .set('pageId', pageId)
    .set('data', preppedData)
    .set('itemsToRender', [])
    .set('commentSelectionLock', false)
    .set('tree', prepareTree(data, pageId))
    .set('topUsers', computeTopUsers(preppedData, numUsersToHighlight))
    .set('histogram', computeHistrogram(data));
  return adjustConfigForState(tempState, data.length);
};

const dfsOnTree = tree =>
  [tree.data].concat(...(tree.children || []).map(child => dfsOnTree(child)));

const getAllItems = (state, {data, root, tree, ignoreSettingsUpdate}) => {
  let updatedData = Immutable.fromJS(reconcileTreeWithData(tree, data))
    .map(row => {
      const id = row.get('id');
      const metadata =
        state.getIn(['foundOrderMap', `${id}`]) ||
        Map({upvoteLink: null, replyLink: null});
      return row
        .set('upvoteLink', metadata.get('upvoteLink'))
        .set('replyLink', metadata.get('replyLink'));
    })
    .filter(row => !row.get('deleted'))
    .sort((a, b) => a.get('time') - a.get('time'));
  if (state.get('model')) {
    updatedData = updatedData.map(row =>
      row.set(
        'modeledTopic',
        modelComment(state.get('model'), row.get('text') || '').modelIndex,
      ),
    );
  }
  // side effect to update indexedDB with updated tree state
  updateIdInDb(root, updatedData.toJS());
  const preppedTree = prepareTree(updatedData.toJS(), root);
  const tempState = state
    .set('loading', false)
    .set('data', updatedData)
    .set('dfsOrderedData', Immutable.fromJS(dfsOnTree(preppedTree).slice(1)))
    .set('pageId', root)
    .set('tree', preppedTree)
    .set('topUsers', computeTopUsers(updatedData, numUsersToHighlight))
    .set('histogram', computeHistrogram(data));

  return adjustConfigForState(tempState, data.length, ignoreSettingsUpdate);
};

function adjustConfigForState(state, dataLength, ignoreSettingsUpdate) {
  const pageId = Number(state.get('pageId'));
  const updatedState = state
    .set('fullGraph', computeFullGraphLayout(state))
    .set(
      'storyHead',
      state.get('data').find(item => Number(item.get('id')) === pageId),
    )
    .set('routeTable', prepareRoutesTable(state));
  if (ignoreSettingsUpdate) {
    return updatedState;
  }
  const updatedConfig = setConfig(updatedState, {
    rowIdx: 1,
    valueIdx: appropriateDotSize(dataLength),
  });
  const treeRoot = state.get('tree');
  const isStory =
    treeRoot &&
    treeRoot.data &&
    treeRoot.data.data &&
    treeRoot.data.data.type === 'story';

  return setConfig(updatedConfig, {
    rowIdx: 0,
    // default to treeY if in a comment, forest otherwise
    valueIdx: isStory
      ? graphLayouts.findIndex(d => d === 'forest')
      : graphLayouts.findIndex(d => d === 'treeY'),
  });
}

const toggleCommentSelectionLock = (state, payload) =>
  setSearch(
    state.set('commentSelectionLock', !state.get('commentSelectionLock')),
    '',
  );

const setPageId = (state, payload) => state.set({pageId: payload});

const setTimeFilter = (state, {min, max}) => {
  const nullSearch = min === max;
  const filter = Immutable.fromJS({min, max});
  const searchedMap = nullSearch
    ? Map()
    : state.get('data').reduce((acc, row) => {
        const time = row.get('time');
        return acc.set(row.get('id'), time >= min && time < max);
      }, Map());
  return selectSubset(state.set('timeFilter', filter), searchedMap, nullSearch);
};

const checkIfTourShouldBeShown = (state, payload) =>
  state.set('showTour', !payload);
const setShowTour = state => state.set('showTour', true);
const finishTour = state =>
  state.set('showTour', false).set('commentSelectionLock', false);

const getSettingsFromCache = (state, payload) => {
  const updatedState = state.set('configs', Immutable.fromJS(payload));
  return updatedState.set('fullGraph', computeFullGraphLayout(updatedState));
};

const actionFuncMap = {
  'clear-selection': clearSelection,
  'check-if-tour-should-be-shown': checkIfTourShouldBeShown,
  'finish-tour': finishTour,
  'get-all-items': getAllItems,
  'get-all-users': getAllUsers,
  'get-tree-from-cache': getTreeFromCache,
  'get-settings-from-cache': getSettingsFromCache,
  'increase-loaded-count': increaseLoadedCount,
  'lock-and-search': lockAndSearch,
  'model-data': modelData,
  'model-branches': modelBranches,
  'set-comment-path': setSelectedCommentPath,
  'set-comment-path-with-graph-comment': setSelectedCommentPathWithGraphComment,
  'set-comment-path-with-selection-clear': setSelectedCommentPathWithSelectionClear,
  'set-config-value': setConfig,
  'set-found-order': setFoundOrder,
  'set-hovered-comment': setHoveredComment,
  'set-page-id': setPageId,
  'set-search': setSearch,
  'set-time-filter': setTimeFilter,
  'show-tour': setShowTour,
  'toggle-comment-selection-lock': toggleCommentSelectionLock,
  'unlock-and-search': unlockAndSearch,
  'unset-graph-comment': unsetGraphComment,
  'update-graph-panel-dimensions': updateGraphPanelDimensions,
};
const NULL_ACTION = (state, payload) => state;

export default createStore(
  combineReducers({
    base: (state = DEFAULT_STATE, {type, payload}) => {
      return (actionFuncMap[type] || NULL_ACTION)(state, payload);
    },
  }),
  applyMiddleware(thunk),
);
