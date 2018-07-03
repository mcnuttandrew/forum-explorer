import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import Immutable, {Map} from 'immutable';
import {DEV_MODE} from '../constants';
import {graphLayouts} from '../layouts';
import TestData from '../constants/test-data.json';

const DEFAULT_STATE = Immutable.fromJS({
  // TODO i think itemId is unused
  itemId: null,
  toRequest: [],
  responsesExpected: 1,
  responsesObserved: 0,
  data: DEV_MODE ? TestData : [],
  itemsToRender: [],
  itemPath: [],
  hoveredComment: null,
  graphLayout: graphLayouts[0],
  loading: !DEV_MODE,
  commentSelectionLock: false,
  foundOrderMap: {}
});

const startRequest = (state, payload) => state
  .set('toRequest', state.get('toRequest').filter(d => d !== payload.itemId));

const setCommentPath = (state, payload) => {
  const itemMap = payload.path.reduce((acc, row) => {
    acc[row] = true;
    return acc;
  }, {});
  return state
    .set('itemsToRender',
      state.get('data').filter(row =>
        (itemMap[row.get('id')] || (row.get('parent') === payload.path[0])) &&
        !row.get('deleted')
      )
    )
    .set('itemPath', Immutable.fromJS(payload.path));
};

const getItem = (state, payload) => {
  if (!payload) {
    return state;
  }
  const parent = payload.parent ? state.get('data').find(d => d.get('id') === payload.parent) : null;
  const depth = parent ? parent.get('depth') + 1 : 0;

  const loadingStateChange = state.get('loading') &&
    state.get('responsesObserved') >= state.get('responsesExpected');

  const metadata = state.getIn(['foundOrderMap', `${payload.id}`]) ||
    Map({upvoteLink: null, replyLink: null});
  const updatededData = state.get('data').push(Immutable.fromJS({
    ...payload,
    depth,
    upvoteLink: metadata.get('upvoteLink'),
    replyLink: metadata.get('replyLink')
  }));

  const updatededState = state
    // how do you do multiple updates simultaneously? I think its with mutable or something?
    .set('data', updatededData)
    .set('toRequest', state.get('toRequest').concat(Immutable.fromJS(payload.kids)))
    .set('responsesObserved', state.get('responsesObserved') + 1)
    .set('responsesExpected', parent ? state.get('responsesExpected') : payload.descendants);

  if (loadingStateChange) {
    const rootId = state.getIn(['data', 0, 'id']);
    return setCommentPath(updatededState.set('loading', false), {path: [rootId]});
  }
  return updatededState;
};

const setHoveredComment = (state, payload) => {
  return state
    .set('hoveredComment', payload && payload.get('id') || null);
};

const toggleGraphLayout = (state, payload) => {
  const currentIndex = graphLayouts.findIndex(d => state.get('graphLayout') === d);
  return state.set('graphLayout', graphLayouts[(currentIndex + 1) % graphLayouts.length]);
};

const toggleCommentSelectionLock = (state, payload) => {
  return state
    .set('commentSelectionLock', !state.get('commentSelectionLock'));
};

const setFoundOrder = (state, payload) => {
  const foundOrderMap = payload.reduce((acc, content, order) => {
    acc[content.id] = {...content, order};
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
