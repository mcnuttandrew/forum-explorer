import React from 'react';
import ReactDOM from 'react-dom';
import debounce from 'lodash.debounce';

import Graph from './graph';
import TopicBadge from './topic-badge';

class GraphPanel extends React.Component {
  state = {
    height: 0,
    width: 0
  }

  componentDidMount() {
    window.addEventListener('resize', debounce(this.resize.bind(this), 50));
    this.resize();
  }

  resize() {
    const currentNode = ReactDOM.findDOMNode(this.refs.graphPanel);
    this.setState({
      height: currentNode.clientHeight,
      width: currentNode.clientWidth
    });
  }

  render() {
    const {model} = this.props;
    return (
      <div className="panel" ref="graphPanel">
        <div className="flex">
          {(model || []).map((d, i) => <TopicBadge modelIndex={i} model={d} key={i}/>)}
        </div>
        <Graph
          {...this.props}
          height={this.state.height}
          width={this.state.width}
          />
      </div>
    );
  }
}

export default GraphPanel;
