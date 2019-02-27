import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import Immutable, {Map} from 'immutable';

import {DEV_MODE, numUsersToHighlight} from '../constants';
import {graphLayouts, computeFullGraphLayout} from '../layouts';
import TestData from '../constants/test-data.json';
// import TestData from '../constants/really-big-data.json';
import {computeTopUsers, computeHistrogram} from '../utils';

const DEFAULT_CONFIGS = [{
  name: 'graph layout',
  options: graphLayouts,
  defaultOption: 'forest'
}, {
  name: 'dot size',
  options: ['small', 'medium', 'large'],
  defaultOption: 'medium'
}, {
  name: 'color by',
  options: ['nothing', 'top-users'],
  defaultOption: 'top-users'
}, {
  name: 'show graph',
  options: ['on', 'off'],
  defaultOption: 'on'
}, {
  name: 'leafs as squares',
  options: ['on', 'off'],
  defaultOption: 'on'
}]
.map(({name, options, defaultOption}) => ({
  name,
  options: options.map(val => ({name: val, selected: val === defaultOption}))
}));

let DEFAULT_STATE = Immutable.fromJS({
  branchModel: {},
  commentSelectionLock: false,
  configs: DEFAULT_CONFIGS,
  data: DEV_MODE ? TestData : [],
  users: {},
  foundOrderMap: {},
  graphPanelDimensions: {height: 0, width: 0},
  hoveredComment: null,
  histogram: DEV_MODE ? computeHistrogram(TestData) : [],
  itemsToRender: [],
  itemPath: [],
  loading: !DEV_MODE,
  loadedCount: 0,
  model: null,
  pageId: null,
  timeFilter: {min: 0, max: 0},
  searchValue: '',
  searchedMap: {}
})
.set('tree', DEV_MODE ? prepareTree(TestData, null) : null)
.set('topUsers', DEV_MODE ? computeTopUsers(Immutable.fromJS(TestData), numUsersToHighlight) : []);

DEFAULT_STATE = DEFAULT_STATE
  .set('fullGraph', computeFullGraphLayout(DEFAULT_STATE))
  .set('routeTable', prepareRoutesTable(DEFAULT_STATE));

function modelComment(model, text) {
  return model.reduce((acc, row, modelIndex) => {
    const modelScore = row.reduce((score, feature) => {
      return score + (text.includes(feature.term) ? feature.probability : 0);
    }, 0);
    if (modelScore > acc.modelScore) {
      return {modelScore, modelIndex};
    }
    return acc;
  }, {modelIndex: null, modelScore: -Infinity});
}

const setCommentPath = (state, payload) => {
  const itemMap = (state.get('routeTable')[payload] || []).reduce((acc, row) => {
    acc[row] = true;
    return acc;
  }, {});
  return state
    .set('itemsToRender',
      state.get('data').filter((row, idx) =>
        !idx ||
        (
          itemMap[row.get('id')] ||
          (`${row.get('parent')}` === payload[0])
        )
      )
      .filter((row) => !row.get('deleted'))
    )
    .set('itemPath', Immutable.fromJS(payload));
};

const increaseLoadedCount = (state, {newCount}) =>
  state.set('loadedCount', newCount);

const setHoveredComment = (state, payload) => state
  .set('hoveredComment', payload && payload.get('id') || null);

const setFoundOrder = (state, payload) => {
  const foundOrderMap = payload.reduce((acc, content, order) => {
    acc[content.id] = {...content, order};
    return acc;
  }, {});

  return state.set('foundOrderMap', Immutable.fromJS(foundOrderMap));
};

const modelData = (state, payload) => {
  const serializedModel = Object.entries(payload.reduce((acc, row) => {
    row.forEach(({term, probability}) => {
      acc[term] = (acc[term] || 0) + probability;
    });
    return acc;
  }, {})).sort((a, b) => b[1] - a[1])
    .slice(0, 10).map(d => d[0]);

  return state
    .set('model', payload)
    .set('serialized-model', serializedModel)
    .set('data', state.get('data').map(row => {
      const evalModel = modelComment(payload, row.get('text') || '');
      return row.set('modeledTopic', evalModel.modelIndex);
    }));
};

const modelBranches = (state, payload) => {
  const tempState = state.set('branchModel', Immutable.fromJS(payload));
  return tempState.set('fullGraph', computeFullGraphLayout(tempState));
};

const setConfig = (state, {rowIdx, valueIdx}) => {
  const rowToUpdate = state
    .getIn(['configs', rowIdx, 'options'])
    .map((d, idx) => d.set('selected', idx === valueIdx));
  const updatedState = state.setIn(['configs', rowIdx, 'options'], rowToUpdate);
  if (rowIdx !== 0) {
    return updatedState;
  }
  return updatedState.set('fullGraph', computeFullGraphLayout(updatedState));
};

const selectSubset = (state, searchedMap, nullSearch) => {
  const newState = state.set('searchedMap', searchedMap);

  // Don't clear the selection if the user has locked it
  if (state.get('commentSelectionLock')) {
    return newState;
  }
  const chain = nullSearch ? [] : newState
    .get('data').filter((d, idx) => !idx || searchedMap.get(d.get('id')));

  return setCommentPath(newState, []).set('itemsToRender', chain);
};

const setSearch = (state, payload) => {
  const nullSearch = (payload === '' || !payload.length);
  const searchTerm = payload.toLowerCase();
  const searchedMap = nullSearch ? Map() :
    state.get('data').reduce((acc, row) => {
      const searchMatchesUser = (row.get('by') || '').toLowerCase().includes(searchTerm);
      const searchMatchesText = (row.get('text') || '').toLowerCase().includes(searchTerm);
      return acc.set(row.get('id'), Boolean(searchMatchesText || searchMatchesUser));
    }, Map());
  return selectSubset(state.set('searchValue', payload), searchedMap, nullSearch);
};

const unlockAndSearch = (state, payload) =>
  setSearch(state.set('commentSelectionLock', false), payload);

const getAllUsers = (state, users) => state
  .set('users', users.reduce((acc, row) => acc.set(row.id, row), Map()));

const updateGraphPanelDimensions = (state, payload) => {
  const tempState = state.set('graphPanelDimensions', Immutable.fromJS(payload));
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
    node.children.forEach(child => decorateWithRoutes(child, routeTable[Number(node.id)]));
    routeTable[`${node.id}`] = routeTable[`${node.id}`].concat(node.children.map(({id}) => `${id}`));
  }
  decorateWithRoutes(state.get('tree'), []);
  return routeTable;
}

function prepareTree(data, root) {
  const maxDepth = data.reduce((acc, row) => Math.max(acc, row.depth), 0);
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
    parent: node.parent || null,
    children: (nodesByParentId[node.id] || [])
      .map(child => formToTree(child))
  });
  if (root && nodesByParentId[root] && nodesByParentId[root].length > 1 || !nodesByParentId.root.length) {
    nodesByParentId.root = [{
      depth: 0,
      id: root,
      children: [root]
    }];
  }
  nodesByParentId.root[0].data = {...data.find(row => row.id === Number(root))};
  return formToTree(nodesByParentId.root[0]);
}

const appropriateDotSize = numComments => (numComments > 600) ? 0 : (numComments < 20 ? 2 : 1);

const getAllItems = (state, {data, root}) => {
  let updatedData = Immutable.fromJS(data).map(row => {
    const metadata = state.getIn(['foundOrderMap', `${row.id}`]) ||
      Map({upvoteLink: null, replyLink: null});
    return row
      .set('upvoteLink', metadata.get('upvoteLink'))
      .set('replyLink', metadata.get('replyLink'));
  }).filter(row => !row.get('deleted'))
    .sort((a, b) => a.get('time') - a.get('time'));
  if (state.get('model')) {
    updatedData = updatedData.map(row => row.set('modeledTopic',
      modelComment(state.get('model'), row.get('text') || '').modelIndex));
  }
  const tempState = state
    .set('loading', false)
    .set('data', updatedData)
    .set('pageId', root)
    .set('tree', prepareTree(updatedData.toJS(), root))
    .set('topUsers', computeTopUsers(updatedData, numUsersToHighlight))
    .set('histogram', computeHistrogram(data));

  return setConfig(
    tempState
      .set('fullGraph', computeFullGraphLayout(tempState))
      .set('routeTable', prepareRoutesTable(tempState))
    , {rowIdx: 1, valueIdx: appropriateDotSize(data.length)});
};

const toggleCommentSelectionLock = (state, payload) => setSearch(state
  .set('commentSelectionLock', !state.get('commentSelectionLock')), '');

const setPageId = (state, payload) => state.set({pageId: payload});

const setTimeFilter = (state, {min, max}) => {
  const nullSearch = min === max;
  const filter = Immutable.fromJS({min, max});
  const searchedMap = nullSearch ? Map() :
    state.get('data').reduce((acc, row) => {
      const time = row.get('time');
      return acc.set(row.get('id'), time >= min && time < max);
    }, Map());
  return selectSubset(state.set('timeFilter', filter), searchedMap, nullSearch);
};

const actionFuncMap = {
  'get-all-items': getAllItems,
  'get-all-users': getAllUsers,
  'increase-loaded-count': increaseLoadedCount,
  'model-data': modelData,
  'model-branches': modelBranches,
  'set-comment-path': setCommentPath,
  'set-config-value': setConfig,
  'set-found-order': setFoundOrder,
  'set-hovered-comment': setHoveredComment,
  'set-page-id': setPageId,
  'set-search': setSearch,
  'set-time-filter': setTimeFilter,
  'toggle-comment-selection-lock': toggleCommentSelectionLock,
  'unlock-and-search': unlockAndSearch,
  'update-graph-panel-dimensions': updateGraphPanelDimensions
};
const NULL_ACTION = (state, payload) => state;

export default createStore(
  combineReducers({
    base: (state = DEFAULT_STATE, {type, payload}) =>
      (actionFuncMap[type] || NULL_ACTION)(state, payload)
  }),
  applyMiddleware(thunk),
);
