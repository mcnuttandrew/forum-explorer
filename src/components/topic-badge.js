import React from 'react';
const COLORS = [
  // 'red',
  // 'green',
  // 'blue',
  // 'yellow',
  // 'orange'
  '#BA0009',
  '#DAD2D8',
  '#0F8B8D',
  '#EC9A29',
  '#143642'
];

class TopicBadge extends React.Component {
  state = {
    termIndex: 0
  }
  
  render() {
    const {model, modelIndex} = this.props;
    const {termIndex} = this.state;
    return (
      <div
        onClick={() => {
          this.setState({
            termIndex: (termIndex + 1) % model.length
          });
        }}
        className={`topic-badge topic-badge-${modelIndex}`}>
        {model[termIndex].term}
      </div>
    );
  }
}

export default TopicBadge;
