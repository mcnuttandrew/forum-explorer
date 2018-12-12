import React from 'react';
class TopicBadge extends React.Component {
  /* eslint-disable no-undef */
  state = {
    termIndex: 0
  }
  /* eslint-enable no-undef */

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
