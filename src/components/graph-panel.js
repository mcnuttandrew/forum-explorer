import React from 'react';
import ReactDOM from 'react-dom';
import debounce from 'lodash.debounce';

import Graph from './graph';
import {getSelectedOption} from '../utils';

class GraphPanel extends React.Component {
  componentDidMount() {
    window.addEventListener('resize', debounce(this.resize.bind(this), 50));
    this.resize();
  }

  resize() {
    const currentNode = ReactDOM.findDOMNode(this.refs.graphPanel);
    this.props.updateGraphPanelDimensions({
      height: currentNode.clientHeight,
      width: currentNode.clientWidth
    });
  }

  render() {
    const {configs, graphPanelDimensions} = this.props;
    return (
      <div className="panel relative" ref="graphPanel">
        <Graph
          {...this.props}
          graphLayout={getSelectedOption(configs, 0)}
          markSize={getSelectedOption(configs, 1)}
          squareLeafs={getSelectedOption(configs, 4) === 'on'}
          height={graphPanelDimensions.get('height')}
          width={graphPanelDimensions.get('width')}
          />
      </div>
    );
  }
}

export default GraphPanel;
