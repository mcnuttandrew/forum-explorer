import React from 'react';
import ReactDOM from 'react-dom';

import {select} from 'd3-selection';
import {hierarchy} from 'd3-hierarchy';
import {voronoi} from 'd3-voronoi';
/* eslint-disable no-unused-vars */
import {transition} from 'd3-transition';
/* eslint-enable no-unused-vars */
import debounce from 'lodash.debounce';

import {layouts} from '../layouts';
import {classnames} from '../utils';
import {numUsersToHighlight} from '../constants';

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

const nodeSizes = {
  small: 3,
  medium: 7,
  large: 10
};

const rootSizes = {
  small: 7,
  medium: 10,
  large: 14
};

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
      graphLayout,
      markSize,
      tree
    } = props;

    if (!width || !height || !tree) {
      return;
    }

    const treeEval = layouts[graphLayout].layout({height, width});
    const root = treeEval(hierarchy(tree));
    const labels = root.labels && root.labels() || [];

    const xScale = layouts[graphLayout].getXScale(props, root);
    const yScale = layouts[graphLayout].getYScale(props, root);

    const positioning = layouts[graphLayout].positioning(xScale, yScale);
    const nodes = root.descendants();

    this.renderLinks(props, root, xScale, yScale);
    this.renderNodes(props, nodes, positioning, markSize);
    this.renderSelectedNodes(props, nodes, positioning, markSize);
    this.renderVoronoi(props, nodes, positioning);
    this.renderLabels(props, labels, positioning);
  }

  renderLinks(props, root, xScale, yScale) {
    const {selectedMap, graphLayout} = props;
    const linesG = select(ReactDOM.findDOMNode(this.refs.lines));
    const link = linesG.selectAll('.link').data(root.links());
    const evalLineClasses = d => {
      return classnames({
        link: true,
        'link-selected': selectedMap.get(d.target.data.data.id)
      });
    };
    const path = layouts[graphLayout].path(xScale, yScale);
    link.enter().append('path')
        .attr('class', evalLineClasses)
        .attr('d', path);
    link.transition()
      .attr('d', path)
      .attr('class', evalLineClasses);
    link.exit().remove();

  }

  renderNodes(props, nodes, positioning, markSize) {
    this.renderAnyNodes(props, nodes, positioning, markSize, false);
  }

  renderSelectedNodes(props, nodes, positioning, markSize) {
    this.renderAnyNodes(props, nodes, positioning, markSize, true);
  }

  renderAnyNodes(props, nodes, positioning, markSize, useSelectedNodes) {
    const {
      hoveredComment,
      toggleCommentSelectionLock,
      selectedMap,
      searchedMap,
      topUsers
    } = props;
    const ref = useSelectedNodes ? this.refs.selectedNodes : this.refs.nodes;
    const nodesG = select(ReactDOM.findDOMNode(ref));
    const translateFunc = arr => `translate(${arr.join(',')})`;
    const showSelected = searchedMap
      .reduce((acc, val, key) => acc + val ? 1 : 0, 0) > 0;
    const evalCircClasses = d => {
      const tops = [...new Array(numUsersToHighlight)].reduce((acc, _, i) => {
        const idx = i + 1;
        if (!topUsers[d.data.data.by] || topUsers[d.data.data.by].rank !== idx) {
          return acc;
        }
        acc[`node-highlighted-top-${idx}`] = true;
        return acc;
      }, {});
      return classnames({
        node: true,
        'node-internal': d.children,
        'node-leaf': !d.children,
        'node-selected': selectedMap.get(d.data.data.id),
        'node-searched': searchedMap.get(d.data.data.id),
        'node-hovered': d.data.data.id === hoveredComment,
        ...tops
      });
    };
    const node = nodesG.selectAll('.node').data(nodes);
    const setCircSize = d => {
      const selected = searchedMap.get(Number(d.data.id));
      if (useSelectedNodes && (!showSelected || !selected)) {
        return 0;
      }
      const scalingFactor = false && (!d.children || !d.children.length) ? 1 : 1.75;
      return scalingFactor * (d.depth ? nodeSizes[markSize] : rootSizes[markSize]);
    };
    node.enter().append('rect')
        .attr('class', evalCircClasses)
        .attr('transform', d => translateFunc(positioning(d)))
        .attr('height', setCircSize)
        .attr('width', setCircSize)
        .attr('x', d => -setCircSize(d) / 2)
        .attr('y', d => -setCircSize(d) / 2)
        .attr('rx', d => (!d.children || !d.children.length) ? 20 : 20)
        .on('click', toggleCommentSelectionLock);

    node.transition()
        .attr('transform', d => translateFunc(positioning(d)))
        .attr('height', setCircSize)
        .attr('width', setCircSize)
        .attr('x', d => -setCircSize(d) / 2)
        .attr('y', d => -setCircSize(d) / 2)
        .attr('rx', d => (!d.children || !d.children.length) ? 20 : 20)
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

  renderLabels(props, labels, positioning) {
    const labelsG = select(ReactDOM.findDOMNode(this.refs.labels));
    const translateFunc = arr => `translate(${arr.join(',')})`;
    const label = labelsG.selectAll('.label').data(labels);
    label.enter().append('text')
        .attr('class', 'label')
        .attr('transform', d => translateFunc(positioning(d)))
        .text(d => d.label);

    label.transition()
        .attr('transform', d => translateFunc(positioning(d)))
        .text(d => d.label);
    label.exit().remove();
  }

  render() {
    const {
      commentSelectionLock,
      graphLayout,
      height,
      width,
      toggleCommentSelectionLock,
      searchValue
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
          searchValue && <rect
          className="fade-block"
          onClick={toggleCommentSelectionLock}
          width={width}
          height={height}
          x="0"
          y="0"
          fill="#f6f6f0"
          opacity="0.7"
          />
        }
        <g ref="labels" transform={translation} className="unselectable"/>
        <g ref="selectedNodes" transform={translation}/>
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
        <text x={20} y={height - 20} className="legend unselectable">
          click to un/lock selection
        </text>
      </svg>
    );
  }
}
Graph.defaultProps = {
  margin: {
    top: 30,
    left: 30,
    bottom: 30,
    right: 30
  }
};
export default Graph;
