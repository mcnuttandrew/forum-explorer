import React from 'react';
import ReactDOM from 'react-dom';
import debounce from 'lodash.debounce';

import Graph from './graph';
// import SearchBox from './search-box';
import {getSelectedOption} from '../utils';

class GraphPanel extends React.Component {
  /* eslint-disable no-undef */
  state = {
    height: 0,
    width: 0
  }
  /* eslint-enable no-undef */

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
    const {configs} = this.props;
    return (
      <div className="panel relative" ref="graphPanel">
        <Graph
          {...this.props}
          graphLayout={getSelectedOption(configs, 0)}
          markSize={getSelectedOption(configs, 1)}
          height={this.state.height}
          width={this.state.width}
          />
      </div>
    );
  }
}

export default GraphPanel;
