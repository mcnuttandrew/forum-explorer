import React from 'react';
import {connect} from 'react-redux';
import * as actionCreators from '../actions';
import {Map} from 'immutable';

import GraphPanel from './graph-panel';
import CommentPanel from './comment-panel';
import Header from './header';

class RootComponent extends React.Component {
  componentDidMount() {
    const rootItem = (window.location.search || '?id=17338700').split('?id=')[1];
    // this.props.getItem(rootItem);
  }
  
  componentWillReceiveProps(newProps) {
    if (!this.props.toRequest.equals(newProps.toRequest)) {
      newProps.toRequest.forEach(itemId => {
        newProps.startGetItem(itemId);
        newProps.getItem(itemId);
      })
    }
  }
  
  render() {
    return (
      <div className="flex-down full-size" >
        <Header />
        <div className="flex full-size">
          <GraphPanel 
            data={this.props.data} 
            setSelectedCommentPath={this.props.setSelectedCommentPath}
            selectedMap={
              this.props.itemsToRender.reduce((acc, row) => acc.set(row.get('id'), true), Map())
            }
            />
          <CommentPanel 
            itemsToRender={this.props.itemsToRender}/>
        </div>
      </div>
    );
  }
}

function mapStateToProps({base}) {
  return {
    openRequests: base.get('openRequests'),
    toRequest: base.get('toRequest'),
    data: base.get('data'),
    itemsToRender: base.get('itemsToRender')
  };
}

export default connect(mapStateToProps, actionCreators)(RootComponent);
