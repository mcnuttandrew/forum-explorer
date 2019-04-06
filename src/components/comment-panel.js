import React from 'react';
import {classnames, timeSince, getSelectedOption} from '../utils';
import {COLORS, STROKES} from '../constants/colors';
import {GRAPH_LAYOUT_CONFIG, STUMP_PRUNE_THRESHOLD} from '../constants';
const createMarkup = __html => ({__html});

function renderComment(props, item, idx) {
  const {
    getItemsFromCacheOrRedirect,
    hoveredComment,
    setHoveredComment,
    setSelectedCommentPath,
    unlockAndSearch,
    topUsers
  } = props;
  /* eslint-disable react/no-danger */
  const hasChildren = item.get('kids') && item.get('kids').size;
  const userName = item.get('by');
  const userRank = topUsers[userName];
  const isRoot = Number(item.get('id')) === props.pageId;
  return (
    <div
      onMouseEnter={() => setHoveredComment(item)}
      onMouseLeave={() => setHoveredComment(null)}
      key={idx}
      style={{marginLeft: 20 * ((item.get('depth') || 1) - 1)}}
      className={
        classnames({
          'comment-block': true,
          'root-comment': isRoot
        })
      }>
      <div className="comment-head flex">
        <a
          className="up-arrow"
          onClick={() => {
            fetch(`https://news.ycombinator.com/${item.get('upvoteLink')}`, {
              method: 'GET'
            });
          }}
          >
          {'▲ '}
        </a>
        <a
          href={`https://news.ycombinator.com/user?id=${userName}`}
          >{userName}</a>
        {userRank && <div className="top-poster-id" style={{
          background: COLORS[userRank.rank],
          color: STROKES[userRank.rank]
        }} />}
        <div className="hover-tooltip margin-right">
          <div className="hover-rel-container" >
            <span className="search-user" onClick={() => unlockAndSearch(userName)}>
              <i className="material-icons">perm_identity</i>
            </span>
          </div>
          <span className="tooltiptext">search for user</span>
        </div>
        <div className="hover-tooltip">
          <a onClick={() => getItemsFromCacheOrRedirect(item.get('id'))}>
            <span>{` ${timeSince(item.get('time'))} ago`}</span>
            <span className="search-user" >
              <i className="material-icons">launch</i>
            </span>
          </a>
          <span className="tooltiptext">visualize subthread</span>
        </div>
      </div>
      {isRoot && <div className="root-label comment-head">ROOT COMMENT</div>}
      <div
        onClick={e => {
          // enable users to click links with out trigger selection update
          const tagName = e.target.tagName;
          const bannedTags = {A: true};
          if (bannedTags[tagName]) {
            return;
          }
          setSelectedCommentPath(`${item.get('id')}`);
        }}
        className={classnames({
          comment: true,
          'hovered-comment': item.get('id') === hoveredComment,
          'comment-no-expand': !hasChildren
        })}
        dangerouslySetInnerHTML={createMarkup(item.get('text'))}/>
      <div className="flex comment-footer">
        <div
          className="expand-comment margin-left"
          onClick={e => setSelectedCommentPath(`${item.get('id')}`)}>
          {hasChildren ? `expand (${hasChildren} ${hasChildren > 1 ? 'children' : 'child'})` : ''}
        </div>
        <a
          onClick={e => e.stopPropagation()}
          href={`https://news.ycombinator.com/${item.get('replyLink')}`}
          className="expand-comment">
          reply
        </a>
      </div>
    </div>);
    /* eslint-enable react/no-danger */
}
/* eslint-disable max-len */
const longPruneExplanation = 'For particularly large conversations we remove single comments from the graph view for legibility, but the are still around!';
/* eslint-enable max-len */

class CommentPanel extends React.PureComponent {
  render() {
    const {itemsToRender, configs} = this.props;
    const data = itemsToRender
      .filter(item => item.get('type') !== 'story' || item.get('text'));
      // figure out if view is at root on forest mode with sufficently large comment chain
    const isForest = getSelectedOption(configs, GRAPH_LAYOUT_CONFIG) === 'forest';
    const singleComments = data.filter(d => !d.get('descendants'));
    const viewingRoot = data.every(d => d.get('depth') === 0 || d.get('depth') === 1);
    const splitComments = isForest && (singleComments.size > STUMP_PRUNE_THRESHOLD) && viewingRoot;
    // if its not behave as normal
    // if it is, then grab all the single comments and the branch comments, separate them
    const buildComment = (item, idx) => (renderComment(this.props, item, idx));
    return (
      <div className="overflow-y panel" ref="commentPanel">
        {!itemsToRender.size && <div
          className="comments-help">
          <h1>Forum Explorer</h1>
          <div>Visualize threaded async conversations in new and dynamic ways</div>
          <h3>Usage</h3>
          <div>Mouse over graph to select comments</div>
          <div>Click graph to lock/unlock selection</div>
        </div>}
        {!splitComments && data.map(buildComment)}
        {splitComments && <div className="comment-root-prune-explanation">
          <h3>{'Branched Conversation'}</h3>
          <h5>
            {longPruneExplanation}
            Scroll down or click <a
              className="expand-comment"
              onClick={d => this.refs.singleComments.scrollIntoView()}>here.</a>
          </h5>
        </div>}
        {splitComments && data.filter(d => d.get('descendants')).map(buildComment)}
        {splitComments && <div
          ref="singleComments"
          className="comment-root-prune-explanation single-comments-division margin-top-huge">
          <h3>{'Single Comments'}</h3>
        </div>}
        {splitComments && singleComments.map(buildComment)}
      </div>
    );
  }
}

export default CommentPanel;
