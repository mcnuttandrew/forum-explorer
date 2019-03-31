import React from 'react';
import {classnames, timeSince} from '../utils';
import {COLORS, STROKES} from '../constants/colors';
const createMarkup = __html => ({__html});

function renderComment(props, item, idx) {
  const {
    setHoveredComment,
    hoveredComment,
    setSelectedCommentPath,
    unlockAndSearch,
    topUsers
  } = props;
  /* eslint-disable react/no-danger */
  const hasChildren = item.get('kids') && item.get('kids').size;
  const userName = item.get('by');
  const userRank = topUsers[userName];
  return (
    <div
      onMouseEnter={() => setHoveredComment(item)}
      onMouseLeave={() => setHoveredComment(null)}
      key={idx}
      style={{marginLeft: 20 * ((item.get('depth') || 1) - 1)}}
      className="comment-block">
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
          <span className="tooltiptext">click to search for user</span>
        </div>
        <div className="hover-tooltip">
          <a href={`?id=${item.get('id')}`}>
            <span>{` ${timeSince(item.get('time'))} ago`}</span>
            <span className="search-user" >
              <i className="material-icons">launch</i>
            </span>
          </a>
          <span className="tooltiptext">link to page for comment</span>
        </div>
      </div>
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
          onClick={e => setSelectedCommentPath(`${item.get('id')}`)}>
          {hasChildren ? `expand (${hasChildren} children)` : ''}
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

class CommentPanel extends React.PureComponent {
  render() {
    return (
      <div
        className={classnames({
          'overflow-y': true,
          panel: this.props.showGraph
        })}>
        {this.props.itemsToRender
        .filter(item => item.get('type') !== 'story' || item.get('text'))
        .map((item, idx) => (renderComment(this.props, item, idx)))}
      </div>
    );
  }
}

export default CommentPanel;
