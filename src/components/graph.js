import React from 'react';
import ReactDOM from 'react-dom';

import {select} from 'd3-selection';
import {tree, stratify} from 'd3-hierarchy';
import {voronoi} from 'd3-voronoi';
import {linkRadial, linkVertical} from 'd3-shape';
import {scaleLinear} from 'd3-scale';
import {transition} from 'd3-transition';

import {classnames} from '../utils';

// const pythag = arr => Math.sqrt(Math.pow(arr[0], 2) + Math.pow(arr[1], 2));
//
// // not used but still useful maybe
// function getDomain(root) {
//   root.descendants().reduce((acc, row) => {
//     const pos = radialToCartesian(row.x, row.y);
//     return {
//       xMin: Math.min(acc.xMin, pos[0]),
//       xMax: Math.max(acc.xMax, pos[0]),
//       yMin: Math.min(acc.yMin, pos[1]),
//       yMax: Math.max(acc.yMax, pos[1])
//     };
//   }, {
//     xMin: Infinity,
//     xMax: -Infinity,
//     yMin: Infinity,
//     yMax: -Infinity
//   });
// }

// includes dumb d3 rotation
const radialToCartesian = (angle, radius) => [
  radius * Math.cos(angle - Math.PI / 2),
  radius * Math.sin(angle - Math.PI / 2)
];

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

class GraphPanel extends React.Component {
  componentDidMount() {
    this.updateChart(this.props);
  }

  componentWillReceiveProps(newProps) {
    this.updateChart(newProps);
  }

  updateChart(props) {
    const {
      height,
      width,
      setSelectedCommentPath,
      selectedMap,
      graphLayout,
      hoveredComment,
      margin
    } = props;
    const useRing = graphLayout === 'ring';
    if (!width || !height || !props.data.size) {
      return;
    }

    const data = props.data.toJS();
    const treeEval = useRing ? tree().size([2 * Math.PI, 1])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth) : tree().size([1, 1]);

    const root = treeEval(stratify().id(d => d.id).parentId(d => d.parent)(data));

    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const xScale = scaleLinear().domain([0, 1])
      .range(useRing ? [0, width / 2] : [margin.left, plotWidth]);
    const yScale = scaleLinear().domain([0, 1])
      .range(useRing ? [0, height / 2] : [margin.top, plotHeight]);
    const radialPoint = (angle, radius) => [
      xScale(radius * Math.cos(angle - Math.PI / 2)),
      yScale(radius * Math.sin(angle - Math.PI / 2))
    ];

    const positioning = useRing ?
      d => radialPoint(d.x, d.y) :
      d => [xScale(d.x), yScale(d.y)];
    const nodes = root.descendants();

    this.renderLinks(root, selectedMap, useRing, xScale, yScale);
    this.renderNodes(nodes, positioning, selectedMap, hoveredComment);
    this.renderVoronoi(nodes, width, height, positioning, setSelectedCommentPath);
  }

  renderLinks(root, selectedMap, useRing, xScale, yScale) {
    const linesG = select(ReactDOM.findDOMNode(this.refs.lines));
    const link = linesG.selectAll('.link').data(root.links());
    const evalLineClasses = d => {
      return classnames({
        link: true,
        'link-selected': selectedMap.get(d.target.data.id)
      });
    };
    const path = useRing ?
      // linkRadial()
      // .angle(d => d.x)
      // .radius(d => pythag(radialPoint(d.x, d.y)))
      d => {
        const sourcePos = radialToCartesian(d.source.x, d.source.y);
        const targetPos = radialToCartesian(d.target.x, d.target.y);
        return `
          M${xScale(sourcePos[0])} ${yScale(sourcePos[1])}
          L${xScale(targetPos[0])} ${yScale(targetPos[1])}
          `;
      } :
      linkVertical().x(d => xScale(d.x)).y(d => yScale(d.y));
    link.enter().append('path')
        .attr('class', evalLineClasses)
        .attr('d', path);
    link.transition()
      .attr('d', path)
      .attr('class', evalLineClasses);

  }

  renderNodes(nodes, positioning, selectedMap, hoveredComment) {
    const nodesG = select(ReactDOM.findDOMNode(this.refs.nodes));
    const translateFunc = arr => `translate(${arr.join(',')})`;
    const evalCircClasses = d => {
      return classnames({
        node: true,
        'node-internal': d.children,
        'node-leaf': !d.children,
        'node-selected': selectedMap.get(d.data.id),
        'node-hovered': d.data.id === hoveredComment
      });
    };
    const node = nodesG.selectAll('.node').data(nodes);

    node.enter().append('circle')
        .attr('class', evalCircClasses)
        .attr('transform', d => translateFunc(positioning(d)))
        .attr('r', 3.5);

    node.transition()
        .attr('transform', d => translateFunc(positioning(d)))
        .attr('class', evalCircClasses);
  }

  renderVoronoi(nodes, width, height, positioning, setSelectedCommentPath) {
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
      .on('mouseenter', d => setSelectedCommentPath(extractIdPathToRoot(d.data[2])));
    polygon.transition()
      .attr('d', d => `M${d.join('L')}Z`);
  }

  render() {
    const {height, width, graphLayout} = this.props;
    const useRing = graphLayout === 'ring';
    return (
      <svg width={this.props.width} height={this.props.height}>
        <g
          ref="lines"
          transform={useRing ? `translate(${width / 2}, ${height / 2})` : ''} />
        <g
          ref="nodes"
          transform={useRing ? `translate(${width / 2}, ${height / 2})` : ''}/>
        <g
          ref="polygons"
          transform={useRing ? `translate(${width / 2}, ${height / 2})` : ''} />
      </svg>
    );
  }
}
GraphPanel.defaultProps = {
  margin: {
    top: 10,
    left: 10,
    bottom: 10,
    right: 10
  }
};
export default GraphPanel;
