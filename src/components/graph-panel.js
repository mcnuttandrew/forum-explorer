import React from 'react';
import ReactDOM from 'react-dom';
import debounce from 'lodash.debounce';

import Graph from './graph';

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
    return (
      <div className="panel" ref="graphPanel">
        <Graph
          setSelectedCommentPath={this.props.setSelectedCommentPath}
          selectedMap={this.props.selectedMap}
          data={this.props.data}
          height={this.state.height}
          width={this.state.width}
          />
      </div>
    );
  }
}

export default GraphPanel;
