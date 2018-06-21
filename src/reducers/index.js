import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import {DEV_MODE} from '../constants';
import TempCopy from '../constants/temp-hold.json';

const DEFAULT_STATE = Immutable.fromJS({
  itemId: null,
  toRequest: [],
  responsesExpected: 1,
  responsesObserved: 0,
  data: DEV_MODE ? TempCopy : [],
  // data: [],
  itemsToRender: [],
  itemPath: [],
  hoveredComment: null,
  graphLayout: 'ring',
  loading: false
});

// TODO CLEAN UP TO USE OBJECT STRUCTURING

export default createStore(
  combineReducers({
    base: function baseReducer(state = DEFAULT_STATE, action) {
      const {type, payload} = action;
      switch (type) {
      case 'start-request':
        return state
          .set('toRequest', state.get('toRequest').filter(d => d !== payload.itemId));
      case 'get-item':
        if (!payload) {
          return state.set('responsesObserved', state.get('responsesObserved') + 1);
        }
        const parent = payload.parent ? state.get('data').find(d => d.get('id') === payload.parent) : null;
        const depth = parent ? parent.get('depth') + 1 : 0;

        const updatededData = state.get('data').push(Immutable.fromJS({
          ...payload,
          depth
        }));

        return state
          // how do you do multiple updates simultaneously? I think its with mutable or something?
          .set('data', updatededData)
          .set('toRequest', state.get('toRequest').concat(Immutable.fromJS(payload.kids)))
          .set('responsesObserved', state.get('responsesObserved') + 1)
          .set('responsesExpected', parent ? state.get('responsesExpected') : payload.descendants)
          .set('loading', state.get('responsesObserved') < state.get('responsesExpected'));

      case 'set-comment-path':
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
      case 'set-hovered-comment':
        return state
          .set('hoveredComment', payload && payload.get('id') || null);
      case 'toggle-graph-layout':
        return state
          .set('graphLayout', state.get('graphLayout') === 'ring' ? 'tree' : 'ring');
      default:
        return state;
      }
    }
  }),
  applyMiddleware(thunk),
);
