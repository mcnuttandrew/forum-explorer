import React from 'react';
import ReactDOM from 'react-dom';
import debounce from 'lodash.debounce';

import Graph from './graph';
import {getSelectedOption} from '../utils';
import {
  GRAPH_LAYOUT_CONFIG,
  DOT_SIZE_CONFIG,
  LEAF_SQUARE_CONFIG,
  TABLET_MODE_CONFIG
} from '../constants/index';

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
    const {
      configs,
      graphPanelDimensions,
      searchValue,
      timeFilter
    } = this.props;
    const tabletMode = getSelectedOption(configs, TABLET_MODE_CONFIG) === 'on';
    return (
      <div className="panel relative" ref="graphPanel">
        <Graph
          {...this.props}
          duration={tabletMode ? 0 : 400}
          graphLayout={getSelectedOption(configs, GRAPH_LAYOUT_CONFIG)}
          markSize={getSelectedOption(configs, DOT_SIZE_CONFIG)}
          squareLeafs={getSelectedOption(configs, LEAF_SQUARE_CONFIG) === 'on'}
          disallowLock={tabletMode}
          muteUnselected={searchValue || (timeFilter.min !== timeFilter.max)}
          height={graphPanelDimensions.get('height')}
          width={graphPanelDimensions.get('width')}
          />
      </div>
    );
  }
}

export default GraphPanel;
