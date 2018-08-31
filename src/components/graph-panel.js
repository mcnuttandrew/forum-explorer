import React from 'react';
import ReactDOM from 'react-dom';
import debounce from 'lodash.debounce';

import Graph from './graph';

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
]

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
          {model && model.map((d, i) => {
            return (
              <div 
                key={`${d}-${i}`}
                className={`topic-badge topic-badge-${i}`}>
                {d[0].term}
              </div>
            );
          })}
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
