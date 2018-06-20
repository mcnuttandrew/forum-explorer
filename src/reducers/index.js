import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import TempCopy from '../constants/temp-hold.json';

const DEFAULT_STATE = Immutable.fromJS({
  count: 0,
  itemId: null,
  toRequest: [],
  openRequests: [],
  data: TempCopy,
  // data: [],
  itemsToRender: [],
  graphLayout: 'ring'
});

export default createStore(
  combineReducers({
    base: function baseReducer(state = DEFAULT_STATE, action) {
      const {type, payload} = action;
      console.log(type)
      switch (type) {
      case 'start-request':
        return state
          .set('openRequests', state.get('openRequests').push(payload.itemId))
          .set('toRequest', state.get('toRequest').filter(d => d !== payload.itemId));
      case 'get-item':
        if (!payload) {
          return state;
        }
        return state
          // this data thing is wrong
          // how do you do multiple update simultaneously? I think its with mutable or something?
          .set('data', state.get('data').push(Immutable.fromJS(payload)))
          .set('openRequests', state.get('openRequests').filter(d => d !== payload.id))
          .set('toRequest', state.get('toRequest').concat(Immutable.fromJS(payload.kids)));

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
