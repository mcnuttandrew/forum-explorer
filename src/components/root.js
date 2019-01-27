import React from 'react';
import {connect} from 'react-redux';
import * as actionCreators from '../actions';
import {Map} from 'immutable';

import {DEV_MODE} from '../constants';
import {classnames, getSelectedOption} from '../utils';
import GraphPanel from './graph-panel';
import CommentPanel from './comment-panel';
import Header from './header';
import SecondaryHeader from './secondary-header';

const getId = () => (window.location.search || '?id=17338700').split('?id=')[1];

class RootComponent extends React.Component {
  componentWillMount() {
    this.props.setFoundOrder(this.props.foundOrder);
    this.props.modelData(getId());
  }

  componentDidMount() {
    if (!DEV_MODE) {
      this.props.getAllItems(getId());
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
          'top-user-coloring': colorBy === 'top-users'
        })}>
        <Header
          configs={this.props.configs}
          rootId={this.props.rootId}
          userKarma={this.props.userKarma}
          setConfig={this.props.setConfig}
          logoutLink={this.props.logoutLink}
          username={this.props.username}/>
        <SecondaryHeader
          configs={this.props.configs}
          topUsers={this.props.topUsers}
          setSelectedCommentPath={this.props.setSelectedCommentPath}
          itemPath={this.props.itemPath}
          storyHead={this.props.storyHead}
          unlockAndSearch={this.props.unlockAndSearch}
          serializedModel={this.props.serializedModel}
          setSearch={this.props.setSearch}
          searchValue={this.props.searchValue} />
        {this.props.loading && <div className="flex full-size background-gray centering">
          <h1> Loading, {this.props.loadedCount} so far</h1>
        </div>}
        {
          !this.props.loading && <div
            className="flex full-size background-gray main-container">
            {showGraph && <GraphPanel
              {...this.props}
              selectedMap={selectedMap}
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
    loadedCount: base.get('loadedCount'),
    loading: base.get('loading'),
    model: base.get('model') || [],
    serializedModel: base.get('serialized-model') || [],
    rootId: base.getIn(['data', 0, 'id']),
    searchValue: base.get('searchValue'),
    searchedMap: base.get('searchedMap'),
    storyHead: base.get('data').filter(item => item.get('type') === 'story').get(0),
    topUsers: base.get('topUsers'),
    tree: base.get('tree'),
    users: base.get('users')
  };
}

export default connect(mapStateToProps, actionCreators)(RootComponent);
