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
      newProps.toRequest.forEach(request => {
        newProps.startGetItem(request.get('id'));
        if (request.get('type') === 'item') {
          newProps.getItem(request.get('id'));
        } else {
          newProps.getUser(request.get('id'));
        }
      });
    }
  }

  render() {
    const selectedMap = this.props.itemsToRender
      .reduce((acc, row) => acc.set(row.get('id'), true), Map());

    const colorBy = getSelectedOption(this.props.configs, 2);
    const showGraph = getSelectedOption(this.props.configs, 3) === 'on';

    return (
      <div
        className={classnames({
          'flex-down': true,
          'full-size': true,
          // TODO update to configs
          'topic-model-coloring': colorBy === 'topic-modeling' && this.props.model.length,
          'top-user-coloring': colorBy === 'top-users'
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
            {showGraph && <GraphPanel
              commentSelectionLock={this.props.commentSelectionLock}
              configs={this.props.configs}
              data={this.props.data}
              graphLayout={this.props.graphLayout}
              hoveredComment={this.props.hoveredComment}
              model={this.props.model}
              setSelectedCommentPath={this.props.setSelectedCommentPath}
              selectedMap={selectedMap}
              toggleCommentSelectionLock={this.props.toggleCommentSelectionLock}
              searchValue={this.props.searchValue}
              setSearch={this.props.setSearch}
              unlockAndSearch={this.props.unlockAndSearch}
              />}
            <CommentPanel
              setHoveredComment={this.props.setHoveredComment}
              setSelectedCommentPath={this.props.setSelectedCommentPath}
              model={this.props.model}
              serializedModel={this.props.serializedModel}
              setSearch={this.props.setSearch}
              showGraph={showGraph}
              itemPath={this.props.itemPath}
              itemsToRender={
                this.props.itemsToRender.size ? this.props.itemsToRender : this.props.data
              }
              unlockAndSearch={this.props.unlockAndSearch}
              />
          </div>
        }
      </div>
    );
  }
}

function mapStateToProps({base}) {
  return {
    commentSelectionLock: base.get('commentSelectionLock'),
    configs: base.get('configs'),
    data: base.get('data').filter(d => !d.get('deleted')),
    hoveredComment: base.get('hoveredComment'),
    itemsToRender: base.get('itemsToRender'),
    itemPath: base.get('itemPath'),
    loading: base.get('loading'),
    model: base.get('model') || [],
    serializedModel: base.get('serialized-model') || [],
    responsesExpected: base.get('responsesExpected'),
    responsesObserved: base.get('responsesObserved'),
    rootId: base.getIn(['data', 0, 'id']),
    searchValue: base.get('searchValue'),
    toRequest: base.get('toRequest'),
    users: base.get('users')
  };
}

export default connect(mapStateToProps, actionCreators)(RootComponent);
