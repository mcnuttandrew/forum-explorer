import React from 'react';
import ReactDOM from 'react-dom';

import {select} from 'd3-selection';
import {stratify} from 'd3-hierarchy';
import {voronoi} from 'd3-voronoi';
/* eslint-disable no-unused-vars */
import {scaleLinear} from 'd3-scale';
import {transition} from 'd3-transition';
/* eslint-enable no-unused-vars */
import debounce from 'lodash.debounce';

import {layouts} from '../layouts';
import {classnames} from '../utils';

function extractIdPathToRoot(node) {
  const nodes = [];
  let currentNode = node;
  const hasParent = true;
  while (hasParent) {
    nodes.push(currentNode.data.id);
    if (!currentNode.parent) {
      return nodes;
    }
    currentNode = currentNode.parent;
  }
}

class Graph extends React.Component {
  componentDidMount() {
    this.updateChart(this.props);
    this.debounceChartUpdate = debounce(this.updateChart, 50);
  }

  componentWillReceiveProps(newProps) {
    this.debounceChartUpdate(newProps);
  }

  updateChart(props) {
    const {
      height,
      width,
      graphLayout
    } = props;

    if (!width || !height || !props.data.size) {
      return;
    }

    const data = props.data.toJS();
    // forcing the root node to be null necessary in order to run stratify
    data[0].parent = null;

    const stratifyMap = stratify().id(d => d.id).parentId(d => d.parent);
    const treeEval = layouts[graphLayout].layout();
    const root = treeEval(stratifyMap(data));

    const xScale = layouts[graphLayout].getXScale(props, root);
    const yScale = layouts[graphLayout].getYScale(props, root);

    const positioning = layouts[graphLayout].positioning(xScale, yScale);
    const nodes = root.descendants();

    this.renderLinks(props, root, xScale, yScale);
    this.renderNodes(props, nodes, positioning, xScale);
    this.renderVoronoi(props, nodes, positioning);
  }

  renderLinks(props, root, xScale, yScale) {
    const {selectedMap, graphLayout} = props;
    const linesG = select(ReactDOM.findDOMNode(this.refs.lines));
    const link = linesG.selectAll('.link').data(root.links());
    const evalLineClasses = d => {
      return classnames({
        link: true,
        'link-selected': selectedMap.get(d.target.data.id)
      });
    };
    const path = layouts[graphLayout].path(xScale, yScale);
    link.enter().append('path')
        .attr('class', evalLineClasses)
        .attr('d', path);
    link.transition()
      .attr('d', path)
      .attr('class', evalLineClasses);

  }

  renderNodes(props, nodes, positioning, xScale) {
    const {hoveredComment, toggleCommentSelectionLock, selectedMap} = props;
    const nodesG = select(ReactDOM.findDOMNode(this.refs.nodes));
    const translateFunc = arr => `translate(${arr.join(',')})`;
    const evalCircClasses = d => {
      return classnames({
        node: true,
        'node-internal': d.children,
        'node-leaf': !d.children,
        'node-selected': selectedMap.get(d.data.id),
        'node-hovered': d.data.id === hoveredComment,
        [`node-topic-modeled-${d.data.modeledTopic}`]: true
      });
    };
    const node = nodesG.selectAll('.node').data(nodes);

    node.enter().append('circle')
        .attr('class', evalCircClasses)
        .attr('transform', d => translateFunc(positioning(d)))
        .attr('r', d => d.depth ? 7 : 10)
        .on('click', toggleCommentSelectionLock);

    node.transition()
        .attr('transform', d => translateFunc(positioning(d)))
        .attr('class', evalCircClasses);
  }

  renderVoronoi(props, nodes, positioning) {
    const {width, height, setSelectedCommentPath, toggleCommentSelectionLock} = props;
    const voronoiEval = voronoi().extent([[-width, -height], [width + 1, height + 1]]);
    const polygonsG = select(ReactDOM.findDOMNode(this.refs.polygons));
    const polygon = polygonsG.selectAll('.polygon').data(
      voronoiEval.polygons(nodes.map(d => [...positioning(d), d])).filter(d => d.length)
    );
    polygon.enter().append('path')
      .attr('class', 'polygon')
      .attr('fill', 'black')
      .attr('opacity', 0)
      .attr('d', d => `M${d.join('L')}Z`)
      .on('mouseenter', d => setSelectedCommentPath(extractIdPathToRoot(d.data[2])))
      .on('click', toggleCommentSelectionLock);
    polygon.transition()
      .attr('d', d => `M${d.join('L')}Z`);
  }

  render() {
    const {
      commentSelectionLock,
      graphLayout,
      height,
      width,
      toggleCommentSelectionLock
    } = this.props;

    const translation = layouts[graphLayout].offset(this.props);
    return (
      <svg
        width={width}
        height={height}
        className={classnames({
          locked: commentSelectionLock
        })}>
        <g ref="lines" transform={translation} />
        <g ref="polygons" transform={translation} />
        <g ref="nodes" transform={translation}/>
        {
          commentSelectionLock && <rect
          className="click-away-block"
          onClick={toggleCommentSelectionLock}
          width={width}
          height={height}
          x="0"
          y="0"
          fill="red"
          opacity="0"
          />
        }
        <text x={20} y={height - 20} className="legend">
          click to un/lock selection
        </text>
      </svg>
    );
  }
}
Graph.defaultProps = {
  margin: {
    top: 10,
    left: 10,
    bottom: 10,
    right: 10
  }
};
export default Graph;
