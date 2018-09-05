import React from 'react';
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
        {model[termIndex] && model[termIndex].term || ''}
      </div>
    );
  }
}

export default TopicBadge;
