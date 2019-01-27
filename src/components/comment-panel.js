import React from 'react';
import {expandButton, expandCallback} from './expand-button';
import {classnames, timeSince} from '../utils';
const createMarkup = __html => ({__html});

function renderComment(props, item, idx) {
  const {
    itemPath,
    setHoveredComment,
    hoveredComment,
    setSelectedCommentPath
  } = props;
  /* eslint-disable react/no-danger */

  const hasChildren = item.get('kids') && item.get('kids').size;
  return (
    <div
      onMouseEnter={() => setHoveredComment(item)}
      onMouseLeave={() => setHoveredComment(null)}
      key={idx}
      style={{marginLeft: 20 * ((item.get('depth') || 1) - 1)}}
      className="comment-block">
      <div className="comment-head">
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
          href={`https://news.ycombinator.com/user?id=${item.get('by')}`}
          >{item.get('by')}</a>
        <span>{` ${timeSince(item.get('time'))} ago`}</span>
      </div>
      <div
        onClick={expandCallback(item, itemPath, setSelectedCommentPath)}
        className={classnames({
          comment: true,
          'hovered-comment': item.get('id') === hoveredComment,
          'comment-no-expand': !hasChildren
        })}
        dangerouslySetInnerHTML={createMarkup(item.get('text'))}/>
      <div className="flex comment-footer">
        {expandButton(item, itemPath, setSelectedCommentPath)}
        <a
          onClick={e => {
            e.stopPropagation();
          }}
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
        .filter(item => item.get('type') !== 'story')
        .map((item, idx) => (renderComment(this.props, item, idx)))}
      </div>
    );
  }
}

export default CommentPanel;
