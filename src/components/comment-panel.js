import React from 'react';

import {classnames, timeSince} from '../utils';
const createMarkup = __html => ({__html});

function expandCallback(item, itemPath, setSelectedCommentPath) {
  return e => {
    const path = itemPath.toJS();
    const itemIdx = path.findIndex(id => id === item.get('id'));
    const newPath = itemIdx >= 0 ? path.slice(itemIdx) : [item.get('id')].concat(path);
    setSelectedCommentPath(newPath);
  };
}

function expandButton(item, itemPath, setSelectedCommentPath) {
  return (item.get('kids') && item.get('kids').size && <div
    onClick={expandCallback(item, itemPath, setSelectedCommentPath)}
    className="expand-comment">
    expand
  </div> || <div />);
}

function renderStoryHead(props, item, idx) {
  const {setSelectedCommentPath, itemPath} = props;
  return (<div key={idx} className="comment-block">
    <div className="comment-title">
      <a href={item.get('url')}>
        {item.get('title')}
      </a>
    </div>
    <div className="comment-head">
      <span>Topics: </span>
      {props.serializedModel.map(keyword => {
        return (<span 
          className="comment-keyword"
          onClick={() => props.setSearch(keyword)}
          key={keyword}> {keyword} </span>);
      })}
    </div>
    <div className="comment-head">
      <span>{`${item.get('score')} points by `}</span>
      <a
        href={`https://news.ycombinator.com/user?id=${item.get('by')}`}
        >{item.get('by')}</a>
      <span>{` ${timeSince(item.get('time'))} ago`}</span>
    </div>
    {expandButton(item, itemPath, setSelectedCommentPath)}
  </div>);
}

function renderComment(props, item, idx) {
  const {
    itemPath,
    setHoveredComment,
    hoveredComment,
    setSelectedCommentPath,
    model
  } = props;
  /* eslint-disable react/no-danger */

  const subModel = model[item.get('modeledTopic')];
  const modeledTopic = subModel && subModel[0] && subModel[0].term;
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
        {modeledTopic && <span
          className={classnames({
            'topic-box': true,
            [`topic-box-${item.get('modeledTopic')}`]: true
          })}
          title={`This comment is related to the content topic "${modeledTopic}"`}
          >
          {'▇ '}
        </span>}
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

class CommentPanel extends React.Component {
  render() {
    return (
      <div
        className={classnames({
          'overflow-y': true,
          panel: this.props.showGraph
        })}>
        {this.props.itemsToRender
        //   .sort((a, b) => {
        //   return a.get('depth') === b.get('depth') ?
        //   (a.get('estimateScore') - b.get('estimateScore')) :
        //   (a.get('depth') - b.get('depth'));
        // })
        .map((item, idx) => {
          const component = item.get('type') === 'story' ? renderStoryHead : renderComment;
          return component(this.props, item, idx);
        })}
      </div>
    );
  }
}

export default CommentPanel;
