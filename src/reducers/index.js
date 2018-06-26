import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import {DEV_MODE} from '../constants';
import {timeSince} from '../utils';
import TestData from '../constants/test-data.json';

const DEFAULT_STATE = Immutable.fromJS({
  itemId: null,
  toRequest: [],
  responsesExpected: 1,
  responsesObserved: 0,
  data: DEV_MODE ? TestData : [],
  itemsToRender: [],
  itemPath: [],
  hoveredComment: null,
  graphLayout: 'ring',
  loading: !DEV_MODE,
  commentSelectionLock: false,
  foundOrderMap: {}
});

const startRequest = (state, payload) => state
  .set('toRequest', state.get('toRequest').filter(d => d !== payload.itemId));

const getItem = (state, payload) => {
  if (!payload) {
    return state;
    // .set('responsesObserved', state.get('responsesObserved') + 1);
  }
  const parent = payload.parent ? state.get('data').find(d => d.get('id') === payload.parent) : null;
  const depth = parent ? parent.get('depth') + 1 : 0;
  const scoreKey = `${payload.by} ${timeSince(payload.time)} ago`;

  const updatededData = state.get('data').push(Immutable.fromJS({
    ...payload,
    depth,
    estimateScore: state.getIn(['foundOrderMap', scoreKey]) || Infinity
  }));

  return state
    // how do you do multiple updates simultaneously? I think its with mutable or something?
    .set('data', updatededData)
    .set('toRequest', state.get('toRequest').concat(Immutable.fromJS(payload.kids)))
    .set('responsesObserved', state.get('responsesObserved') + 1)
    .set('responsesExpected', parent ? state.get('responsesExpected') : payload.descendants)
    .set('loading', state.get('responsesObserved') < state.get('responsesExpected'));
};

const setCommentPath = (state, payload) => {
  const itemMap = payload.path.reduce((acc, row) => {
    acc[row] = true;
    return acc;
  }, {});
  return state
    .set('itemsToRender',
      state.get('data').filter(row =>
        itemMap[row.get('id')] || (row.get('parent') === payload.path[0])
      )
    )
    .set('itemPath', Immutable.fromJS(payload.path));
};

const setHoveredComment = (state, payload) => {
  return state
    .set('hoveredComment', payload && payload.get('id') || null);
};

const toggleGraphLayout = (state, payload) => {
  return state
    .set('graphLayout', state.get('graphLayout') === 'ring' ? 'tree' : 'ring');
};

const toggleCommentSelectionLock = (state, payload) => {
  return state
    .set('commentSelectionLock', !state.get('commentSelectionLock'));
};

const setFoundOrder = (state, payload) => {
  const foundOrderMap = payload.reduce((acc, text, idx) => {
    acc[text] = idx;
    return acc;
  }, {});
  return state.set('foundOrderMap', Immutable.fromJS(foundOrderMap));
};

const actionFuncMap = {
  'start-request': startRequest,
  'get-item': getItem,
  'set-comment-path': setCommentPath,
  'set-hovered-comment': setHoveredComment,
  'set-found-order': setFoundOrder,
  'toggle-graph-layout': toggleGraphLayout,
  'toggle-comment-selection-lock': toggleCommentSelectionLock
};

function base(state = DEFAULT_STATE, action) {
  const {type, payload} = action;
  const response = actionFuncMap[type];
  return response ? response(state, payload) : state;
}

export default createStore(
  combineReducers({base}),
  applyMiddleware(thunk),
);
