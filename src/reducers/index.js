import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import Immutable, {Map} from 'immutable';
import {DEV_MODE, numUsersToHighlight} from '../constants';
import {graphLayouts} from '../layouts';
import TestData from '../constants/test-data.json';
import {computeTopUsers} from '../utils';

const DEFAULT_CONFIGS = [{
  name: 'graph layout',
  options: graphLayouts,
  defaultOption: 'ring'
}, {
  name: 'dot size',
  options: ['small', 'medium', 'large'],
  defaultOption: 'medium'
}, {
  name: 'color by',
  options: ['nothing', 'top-users', 'topic-modeling'],
  defaultOption: 'top-users'
}, {
  name: 'show graph',
  options: ['on', 'off'],
  defaultOption: 'on'
}]
.map(({name, options, defaultOption}) => ({
  name,
  options: options.map(val => ({name: val, selected: val === defaultOption}))
}));

const DEFAULT_STATE = Immutable.fromJS({
  commentSelectionLock: false,
  configs: DEFAULT_CONFIGS,
  data: DEV_MODE ? TestData : [],
  users: {},
  foundOrderMap: {},
  hoveredComment: null,
  itemsToRender: [],
  itemPath: [],
  loading: !DEV_MODE,
  model: null,
  tree: null,
  topUsers: [],
  // toRequest: [],
  // responsesExpected: 1,
  // responsesObserved: 0,
  searchValue: '',
  searchedMap: {}
})
.set('tree', DEV_MODE ? prepareTree(TestData, null) : [])
.set('topUsers', DEV_MODE ? computeTopUsers(Immutable.fromJS(TestData), numUsersToHighlight) : []);

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
  const itemMap = payload.reduce((acc, row) => {
    acc[row] = true;
    return acc;
  }, {});
  return state
    .set('itemsToRender',
      state.get('data').filter((row, idx) =>
        !idx ||
        (itemMap[row.get('id')] || (row.get('parent') === payload[0])) &&
        !row.get('deleted')
      )
    )
    .set('itemPath', Immutable.fromJS(payload));
};

// const getItem = (state, payload) => {
//   if (!payload) {
//     return state
//       .set('responsesObserved', state.get('responsesObserved') + 1);
//   }
//   const parent = payload.parent ? state.get('data').find(d => d.get('id') === payload.parent) : null;
//   const depth = parent ? parent.get('depth') + 1 : 0;
//
//   const loadingStateChange = state.get('loading') &&
//     state.get('responsesObserved') >= state.get('responsesExpected');
//
  // const metadata = state.getIn(['foundOrderMap', `${payload.id}`]) ||
  //   Map({upvoteLink: null, replyLink: null});
//
//   const evalModel = modelComment(state.get('model') || [], payload.text || '');
//
//   const updatededData = state.get('data').push(Immutable.fromJS({
//     ...payload,
//     depth,
//     upvoteLink: metadata.get('upvoteLink'),
//     replyLink: metadata.get('replyLink'),
//     modeledTopic: evalModel.modelIndex
//   }));
//
//   const requestList = (payload.kids || []).map(id => ({id, type: 'item'}));
//   if (!state.getIn(['users', payload.by])) {
//     requestList.push({type: 'user', id: payload.by});
//   }
//
//   const updatededState = state
//     // how do you do multiple updates simultaneously? I think its with mutable or something?
//     .set('data', updatededData)
//     .set('toRequest', state.get('toRequest').concat(Immutable.fromJS(requestList)))
//     .set('responsesObserved', state.get('responsesObserved') + 1)
//     .set('responsesExpected', parent ? state.get('responsesExpected') : payload.descendants);
//
//   if (loadingStateChange) {
//     const rootId = state.getIn(['data', 0, 'id']);
//     return setCommentPath(updatededState.set('loading', false), [rootId])
//       .set('data', state.get('data').sortBy(d => d.get('time')));
//   }
//   return updatededState;
// };

// const getUser = (state, payload) => state
//   .setIn(['users', payload.id], Immutable.fromJS(payload));

const setHoveredComment = (state, payload) => state
  .set('hoveredComment', payload && payload.get('id') || null);

const toggleCommentSelectionLock = (state, payload) => state
  .set('commentSelectionLock', !state.get('commentSelectionLock'));

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

const setConfig = (state, {rowIdx, valueIdx}) => {
  const rowToUpdate = state
    .getIn(['configs', rowIdx, 'options'])
    .map((d, idx) => d.set('selected', idx === valueIdx));
  return state.setIn(['configs', rowIdx, 'options'], rowToUpdate);
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

  const newState = state
    .set('searchValue', payload)
    .set('searchedMap', searchedMap);

  // Don't clear the selection if the user has locked it
  if (state.get('commentSelectionLock')) {
    return newState;
  }
  const chain = nullSearch ? [] : newState
    .get('data').filter((d, idx) => !idx || searchedMap.get(d.get('id')));

  return setCommentPath(newState, []).set('itemsToRender', chain);
};

const unlockAndSearch = (state, payload) =>
  setSearch(state.set('commentSelectionLock', false), payload);

const getAllUsers = (state, users) => state
  .set('users', users.reduce((acc, row) => acc.set(row.id, row), Map()));

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
  const tree = formToTree(nodesByParentId.root[0]);
  return tree;
}

const getAllItems = (state, {data, root}) => {
  let updatedData = Immutable.fromJS(data).map(row => {
    const metadata = state.getIn(['foundOrderMap', `${row.id}`]) ||
      Map({upvoteLink: null, replyLink: null});
    return row
      .set('upvoteLink', metadata.get('upvoteLink'))
      .set('replyLink', metadata.get('replyLink'));
  });
  if (state.get('model')) {
    updatedData = updatedData.map(row => row.set('modeledTopic',
      modelComment(state.get('model'), row.get('text') || '').modelIndex));
  }
  return state
    .set('loading', false)
    .set('data', updatedData)
    .set('tree', prepareTree(updatedData.toJS(), root))
    .set('topUsers', computeTopUsers(updatedData, numUsersToHighlight));
};

const actionFuncMap = {
  'get-all-items': getAllItems,
  'get-all-users': getAllUsers,
  'model-data': modelData,
  'set-comment-path': setCommentPath,
  'set-config-value': setConfig,
  'set-found-order': setFoundOrder,
  'set-hovered-comment': setHoveredComment,
  'set-search': setSearch,
  'toggle-comment-selection-lock': toggleCommentSelectionLock,
  'unlock-and-search': unlockAndSearch
};

export default createStore(
  combineReducers({
    base: function base(state = DEFAULT_STATE, action) {
      const {type, payload} = action;
      const response = actionFuncMap[type];
      return response ? response(state, payload) : state;
    }
  }),
  applyMiddleware(thunk),
);
