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
  // openRequests: [],
  data: DEV_MODE ? TempCopy : [],
  // data: [],
  itemsToRender: [],
  graphLayout: 'ring',
  loading: false
});

export default createStore(
  combineReducers({
    base: function baseReducer(state = DEFAULT_STATE, action) {
      const {type, payload} = action;
      switch (type) {
      case 'start-request':
        return state
          // .set('openRequests', state.get('openRequests').push(payload.itemId))
          .set('responsesExpected', state.get('responsesExpected') + 1)
          .set('toRequest', state.get('toRequest').filter(d => d !== payload.itemId));
      case 'get-item':
        if (!payload) {
          return state.set('responsesObserved', state.get('responsesObserved') + 1);
        }
        return state
          // this data thing is wrong
          // how do you do multiple update simultaneously? I think its with mutable or something?
          .set('data', state.get('data').push(Immutable.fromJS(payload)))
          // .set('openRequests', state.get('openRequests').filter(d => d !== payload.id))
          .set('toRequest', state.get('toRequest').concat(Immutable.fromJS(payload.kids)))
        // console.log('????', updatedState.get('toRequest').size, updatedState.get('openRequests').size)
        // return updatedState
          .set('loading', Boolean(
            state.get('toRequest').size ||
            (state.get('responsesObserved') === state.get('responsesExpected'))
          ));

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
