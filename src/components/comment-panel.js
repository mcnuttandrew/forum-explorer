import React from 'react';

import {classnames} from '../utils';
const createMarkup = __html => ({__html});

class CommentPanel extends React.Component {
  render() {
    const {
      itemsToRender,
      itemPath,
      setHoveredComment,
      hoveredComment,
      setSelectedCommentPath
    } = this.props;

    return (
      <div className="panel overflow-y" >
        {itemsToRender.map((item, idx) => {
          if (item.get('type') === 'story') {
            return (<div key={idx} className="comment-block">
              <div className="comment-title">
                <a href={item.get('url')}>
                  {item.get('title')}
                </a>
              </div>
              <div className="comment-head">
                {`${item.get('score')} point by ${item.get('by')} N day ago`}
              </div>
            </div>);
          }
          return (
            <div
              onMouseEnter={() => setHoveredComment(item)}
              onMouseLeave={() => setHoveredComment(null)}
              key={idx}
              style={{marginLeft: 20 * (item.get('depth') || 0)}}
              className="comment-block">
              <div className="comment-head">
                {`${item.get('by')} N Minutes ago`}
              </div>
              <div
                className={classnames({
                  comment: true,
                  'hovered-comment': item.get('id') === hoveredComment
                })}
                dangerouslySetInnerHTML={createMarkup(item.get('text'))}/>
              <div
                onClick={() => {
                  console.log(itemPath.toJS())
                  const path = itemPath.toJS();
                  const itemIndx = path.findIndex(d => d === item.get('id'));
                  if (itemIndx >= 0) {
                    setSelectedCommentPath(itemPath.reverse().slice(0, itemIndx + 1).reverse());
                    return;
                  }
                  setSelectedCommentPath(itemPath.concat(item.get('id')));
                }}
                className="comment-head">
                <a>Expand</a>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

export default CommentPanel;
