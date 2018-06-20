import React from 'react';

class CommentPanel extends React.Component {
  render() {
    const {itemsToRender} = this.props;
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
          // console.log(item.get('depth'))
          return (
            <div
              key={idx}
              style={{
                marginLeft: 10 * item.get('depth')
              }}
              className="comment-block">
              <div className="comment-head">
                <span>{item.get('by')}</span>
                <span>N minutes ago</span>
              </div>
              <div className="comment">{item.get('text')}</div>
            </div>
          );
        })}
      </div>
    );
  }
}

export default CommentPanel;
