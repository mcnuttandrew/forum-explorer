import React from 'react';

// function decorateWithDepth(items) {
//   const currentNode = items.getIn([0, 'id']);
//   const currentDepth = 0;
//   return items
//     .sortBy(d => Number(d.get('id')))
//     .map(item => {
//       if (item.get('type') === 'story') {
//         return item.set('depth', currentDepth);
//       }
//       // LEFT OFF HERE
//       if () {
//
//       }
//       item.
//     })
// }

class CommentPanel extends React.Component {
  render() {
    const {itemsToRender} = this.props;
    console.log(itemsToRender.toJS())
    return (
      <div className="panel overflow-y" >
        {itemsToRender.map(item => {
          const depth = 1;
          return (
            <div
              style={{
                marginLeft: 10 * depth
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
