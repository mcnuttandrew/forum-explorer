import React from 'react';
import {connect} from 'react-redux';
import * as actionCreators from '../actions';
import {Map} from 'immutable';

import {DEV_MODE, WEB_PAGE_MODE} from '../constants';
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

    const showLoading = (getIdPure() || this.props.pageId || !WEB_PAGE_MODE) && this.props.loading;
    const showDashboard = !this.props.loading;
    const showPicker = !getIdPure() && !DEV_MODE && WEB_PAGE_MODE && !this.props.pageId;
    return (
      <div
        className="flex-down full-size">
        <Header
          configs={this.props.configs}
          rootId={this.props.pageId}
          userKarma={this.props.userKarma}
          setConfig={this.props.setConfig}
          logoutLink={this.props.logoutLink}
          username={this.props.username}/>
        <SecondaryHeader
          clearSelection={this.props.clearSelection}
          configs={this.props.configs}
          getItemsFromCacheOrRedirect={this.props.getItemsFromCacheOrRedirect}
          histogram={this.props.histogram}
          itemPath={this.props.itemPath}
          serializedModel={this.props.serializedModel}
          showData={this.props.data.size > 1}
          searchValue={this.props.searchValue}
          setSearch={this.props.setSearch}
          setSelectedCommentPath={this.props.setSelectedCommentPath}
          setTimeFilter={this.props.setTimeFilter}
          storyHead={this.props.storyHead}
          topUsers={this.props.topUsers}
          unlockAndSearch={this.props.unlockAndSearch} />
        {showPicker && <WebPagePicker
          getAllItems={this.props.getAllItems}
          setPageId={this.props.setPageId}/>}
        {showLoading && <div className="flex full-size background-gray centering">
          <h1> Loading, {this.props.loadedCount} so far</h1>
        </div>}
        {
          showDashboard && <div
            className="flex full-size background-gray main-container">
            <GraphPanel
              {...this.props}
              selectedMap={selectedMap}
              />
            <CommentPanel
              configs={this.props.configs}
              getItemsFromCacheOrRedirect={this.props.getItemsFromCacheOrRedirect}
              hoveredGraphComment={this.props.hoveredGraphComment}
              itemPath={this.props.itemPath}
              itemsToRender={this.props.itemsToRender}
              model={this.props.model}
              pageId={this.props.pageId}
              serializedModel={this.props.serializedModel}
              setHoveredComment={this.props.setHoveredComment}
              setSelectedCommentPath={this.props.setSelectedCommentPath}
              setSearch={this.props.setSearch}
              topUsers={this.props.topUsers}
              unlockAndSearch={this.props.unlockAndSearch}
              />
          </div>
        }
      </div>
    );
  }
}

function mapStateToProps({base}) {
  const pageId = Number(base.get('pageId'));
  return {
    commentSelectionLock: base.get('commentSelectionLock'),
    configs: base.get('configs'),
    data: base.get('data').filter(d => !d.get('deleted')),
    fullGraph: base.get('fullGraph'),
    graphPanelDimensions: base.get('graphPanelDimensions'),
    histogram: base.get('histogram'),
    hoveredComment: base.get('hoveredComment'),
    hoveredGraphComment: base.get('hoveredGraphComment'),
    itemsToRender: base.get('itemsToRender'),
    itemPath: base.get('itemPath'),
    loadedCount: base.get('loadedCount'),
    loading: base.get('loading'),
    model: base.get('model') || [],
    pageId,
    serializedModel: base.get('serialized-model') || [],
    searchValue: base.get('searchValue'),
    searchedMap: base.get('searchedMap'),
    storyHead: base.get('storyHead'),
    // storyHead: base.get('data').find(item => item.get('id') === pageId),
    timeFilter: base.get('timeFilter').toJS(),
    topUsers: base.get('topUsers'),
    users: base.get('users')
  };
}

export default connect(mapStateToProps, actionCreators)(RootComponent);
