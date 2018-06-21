import React from 'react';
import {connect} from 'react-redux';
import * as actionCreators from '../actions';
import {Map} from 'immutable';

import {DEV_MODE} from '../constants';
import GraphPanel from './graph-panel';
import CommentPanel from './comment-panel';
import Header from './header';

class RootComponent extends React.Component {
  componentDidMount() {
    const rootItem = (window.location.search || '?id=17338700').split('?id=')[1];
    if (!DEV_MODE) {
      
      this.props.getItem(rootItem, true);
    }
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
        <Header toggleGraphLayout={this.props.toggleGraphLayout}/>
        {this.props.loading && <div className="flex full-size background-gray centering">
          <h1>LOADING</h1>
        </div>}
        {
          !this.props.loading && <div className="flex full-size background-gray">
            <GraphPanel 
            graphLayout={this.props.graphLayout}
            data={this.props.data} 
            setSelectedCommentPath={this.props.setSelectedCommentPath}
            selectedMap={
              this.props.itemsToRender.reduce((acc, row) => acc.set(row.get('id'), true), Map())
            }
            hoveredComment={this.props.hoveredComment}
            />
            <CommentPanel 
              setHoveredComment={this.props.setHoveredComment}
              setSelectedCommentPath={this.props.setSelectedCommentPath}
              itemPath={this.props.itemPath}
              itemsToRender={
                this.props.itemsToRender.size ? this.props.itemsToRender : this.props.data
              }/>
          </div>
        }
      </div>
    );
  }
}

function mapStateToProps({base}) {
  return {
    openRequests: base.get('openRequests'),
    toRequest: base.get('toRequest'),
    data: base.get('data'),
    itemsToRender: base.get('itemsToRender'),
    itemPath: base.get('itemPath'),
    graphLayout: base.get('graphLayout'),
    loading: base.get('loading'),
    hoveredComment: base.get('hoveredComment')
  };
}

export default connect(mapStateToProps, actionCreators)(RootComponent);
