import React from 'react';
import {connect} from 'react-redux';
import * as actionCreators from '../actions';
import {Map} from 'immutable';

import {DEV_MODE} from '../constants';
import {classnames, getSelectedOption} from '../utils';
import GraphPanel from './graph-panel';
import CommentPanel from './comment-panel';
import Header from './header';

const getId = () => (window.location.search || '?id=17338700').split('?id=')[1];

class RootComponent extends React.Component {
  componentWillMount() {
    this.props.setFoundOrder(this.props.foundOrder);
    this.props.modelData(getId());
  }

  componentDidMount() {
    if (!DEV_MODE) {
      this.props.getItem(getId(), true);
    }
  }

  componentWillReceiveProps(newProps) {
    if (!this.props.toRequest.equals(newProps.toRequest)) {
      newProps.toRequest.forEach(itemId => {
        newProps.startGetItem(itemId);
        newProps.getItem(itemId);
      });
    }
  }

  render() {
    const selectedMap = this.props.itemsToRender
      .reduce((acc, row) => acc.set(row.get('id'), true), Map());

    const showModeling = getSelectedOption(this.props.configs, 2) === 'on';
    return (
      <div
        className={classnames({
          'flex-down': true,
          'full-size': true,
          // TODO update to configs
          'no-model-coloring': !showModeling || !this.props.model.length
        })}>
        <Header
          configs={this.props.configs}
          rootId={this.props.rootId}
          userKarma={this.props.userKarma}
          setConfig={this.props.setConfig}
          logoutLink={this.props.logoutLink}
          username={this.props.username}/>
        {this.props.loading && <div className="flex full-size background-gray centering">
          <h1>
            {`${Math.floor((this.props.responsesObserved / this.props.responsesExpected) * 100)}% loaded`}
          </h1>
        </div>}
        {
          !this.props.loading && <div
            className="flex full-size background-gray main-container">
            <GraphPanel
              commentSelectionLock={this.props.commentSelectionLock}
              configs={this.props.configs}
              data={this.props.data}
              graphLayout={this.props.graphLayout}
              hoveredComment={this.props.hoveredComment}
              model={this.props.model}
              setSelectedCommentPath={this.props.setSelectedCommentPath}
              selectedMap={selectedMap}
              toggleCommentSelectionLock={this.props.toggleCommentSelectionLock}
              />
            <CommentPanel
              setHoveredComment={this.props.setHoveredComment}
              setSelectedCommentPath={this.props.setSelectedCommentPath}
              model={this.props.model}
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
  // TODO alphabetize
  return {
    toRequest: base.get('toRequest'),
    data: base.get('data'),
    itemsToRender: base.get('itemsToRender'),
    itemPath: base.get('itemPath'),
    loading: base.get('loading'),
    hoveredComment: base.get('hoveredComment'),
    commentSelectionLock: base.get('commentSelectionLock'),
    responsesExpected: base.get('responsesExpected'),
    responsesObserved: base.get('responsesObserved'),
    rootId: base.getIn(['data', 0, 'id']),
    model: base.get('model') || [],
    configs: base.get('configs')
  };
}

export default connect(mapStateToProps, actionCreators)(RootComponent);
