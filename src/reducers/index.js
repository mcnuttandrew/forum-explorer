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
  foundOrderMap: {},
  model: null
});

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
    return state
      .set('responsesObserved', state.get('responsesObserved') + 1);
  }
  const parent = payload.parent ? state.get('data').find(d => d.get('id') === payload.parent) : null;
  const depth = parent ? parent.get('depth') + 1 : 0;

  const loadingStateChange = state.get('loading') &&
    state.get('responsesObserved') >= state.get('responsesExpected');

  const metadata = state.getIn(['foundOrderMap', `${payload.id}`]) ||
    Map({upvoteLink: null, replyLink: null});

  const evalModel = modelComment(state.get('model') || [], payload.text || '');

  const updatededData = state.get('data').push(Immutable.fromJS({
    ...payload,
    depth,
    upvoteLink: metadata.get('upvoteLink'),
    replyLink: metadata.get('replyLink'),
    modeledTopic: evalModel.modelIndex
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

const modelData = (state, payload) => {
  console.log(payload)
  return state
    .set('model', payload)
    .set('data', state.get('data').map(row => {
      const evalModel = modelComment(payload, row.get('text') || '');
      return row.set('modeledTopic', evalModel);
    }));
};

const actionFuncMap = {
  'model-data': modelData,
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
