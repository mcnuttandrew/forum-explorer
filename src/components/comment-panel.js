import React from 'react';
import SearchForUser from './icons/search-for-user.js';
import ExpandButton from './expand-button';
import {classnames, timeSince} from '../utils';
const createMarkup = __html => ({__html});

function renderComment(props, item, idx) {
  const {
    setHoveredComment,
    hoveredComment,
    setSelectedCommentPath,
    unlockAndSearch
  } = props;
  /* eslint-disable react/no-danger */
  const hasChildren = item.get('kids') && item.get('kids').size;
  const userName = item.get('by');
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
        <div style={{position: 'relative', width: '15px'}}>
          <span className="search-user" onClick={() => unlockAndSearch(userName)}>
            <SearchForUser/>
          </span>
        </div>
        <span>{` ${timeSince(item.get('time'))} ago`}</span>
      </div>
      <div
        onClick={e => setSelectedCommentPath(`${item.get('id')}`)}
        className={classnames({
          comment: true,
          'hovered-comment': item.get('id') === hoveredComment,
          'comment-no-expand': !hasChildren
        })}
        dangerouslySetInnerHTML={createMarkup(item.get('text'))}/>
      <div className="flex comment-footer">
        <ExpandButton
          item={item}
          setSelectedCommentPath={setSelectedCommentPath}/>
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
