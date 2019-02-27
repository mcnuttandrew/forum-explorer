import React from 'react';
import {connect} from 'react-redux';
import * as actionCreators from '../actions';
import {Map} from 'immutable';

import {DEV_MODE, WEB_PAGE_MODE} from '../constants';
import {classnames, getSelectedOption} from '../utils';
import GraphPanel from './graph-panel';
import CommentPanel from './comment-panel';
import Header from './header';
import SecondaryHeader from './secondary-header';
import WebPagePicker from './web-page-picker';

const getId = () => (window.location.search || '?id=17338700').split('?id=')[1];
const getIdPure = () => window.location.search && window.location.search.split('?id=')[1];

class RootComponent extends React.Component {
  componentWillMount() {
    const id = getId();
    if (WEB_PAGE_MODE && !getIdPure()) {
      return;
    }
    this.props.setPageId(id);
    this.props.setFoundOrder(this.props.foundOrder);
    this.props.modelData(id);
  }

  componentDidMount() {
    if (WEB_PAGE_MODE && !getIdPure()) {
      return;
    }
    if (!DEV_MODE) {
      this.props.getAllItems(getId());
    }
  }

  render() {
    const selectedMap = this.props.itemsToRender
      .reduce((acc, row) => acc.set(row.get('id'), true), Map());

    const colorBy = getSelectedOption(this.props.configs, 2);
    const showGraph = getSelectedOption(this.props.configs, 3) === 'on';

    const showLoading = (getIdPure() || this.props.pageId || !WEB_PAGE_MODE) && this.props.loading;
    const showDashboard = !this.props.loading;
    const showPicker = !getIdPure() && !DEV_MODE && WEB_PAGE_MODE && !this.props.pageId;
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
          rootId={this.props.pageId}
          userKarma={this.props.userKarma}
          setConfig={this.props.setConfig}
          logoutLink={this.props.logoutLink}
          username={this.props.username}/>
        <SecondaryHeader
          configs={this.props.configs}
          histogram={this.props.histogram}
          topUsers={this.props.topUsers}
          setSelectedCommentPath={this.props.setSelectedCommentPath}
          itemPath={this.props.itemPath}
          storyHead={this.props.storyHead}
          unlockAndSearch={this.props.unlockAndSearch}
          showData={this.props.data.size > 1}
          serializedModel={this.props.serializedModel}
          setSearch={this.props.setSearch}
          setTimeFilter={this.props.setTimeFilter}
          searchValue={this.props.searchValue} />
        {showPicker && <WebPagePicker
          getAllItems={this.props.getAllItems}
          setPageId={this.props.setPageId}/>}
        {showLoading && <div className="flex full-size background-gray centering">
          <h1> Loading, {this.props.loadedCount} so far</h1>
        </div>}
        {
          showDashboard && <div
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
    fullGraph: base.get('fullGraph'),
    graphPanelDimensions: base.get('graphPanelDimensions'),
    histogram: base.get('histogram').toJS(),
    hoveredComment: base.get('hoveredComment'),
    itemsToRender: base.get('itemsToRender'),
    itemPath: base.get('itemPath'),
    loadedCount: base.get('loadedCount'),
    loading: base.get('loading'),
    model: base.get('model') || [],
    pageId: base.get('pageId'),
    serializedModel: base.get('serialized-model') || [],
    searchValue: base.get('searchValue'),
    searchedMap: base.get('searchedMap'),
    storyHead: base.get('data').filter(item => item.get('type') === 'story').get(0),
    timeFilter: base.get('timeFilter').toJS(),
    topUsers: base.get('topUsers'),
    users: base.get('users')
  };
}

export default connect(mapStateToProps, actionCreators)(RootComponent);
