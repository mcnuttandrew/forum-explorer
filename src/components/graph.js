import React from 'react';
import ReactDOM from 'react-dom';

import {select} from 'd3-selection';
import {tree, stratify} from 'd3-hierarchy';
import {linkRadial, linkVertical} from 'd3-shape';
import {scaleLinear} from 'd3-scale';
import {transition} from 'd3-transition';

const pythag = arr => Math.sqrt(Math.pow(arr[0], 2) + Math.pow(arr[1], 2));

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

function classnames(classObject) {
  return Object.keys(classObject).filter(name => classObject[name]).join(' ');
}

class GraphPanel extends React.Component {
  componentDidMount() {
    this.updateChart(this.props);
  }

  componentWillReceiveProps(newProps) {
    this.updateChart(newProps);
  }

  updateChart(props) {
    const {height, width, setSelectedCommentPath, selectedMap, graphLayout} = props;
    const useRing = graphLayout === 'ring';
    if (!width || !height) {
      return;
    }
    const margin = {
      top: 10,
      left: 10,
      bottom: 10,
      right: 10
    };


    const data = props.data.toJS();
    const svg = select(ReactDOM.findDOMNode(this.refs.chart));

    const treeEval = useRing ? tree().size([2 * Math.PI, 1])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth) : tree().size([1, 1]);

    const root = treeEval(stratify().id(d => d.id).parentId(d => d.parent)(data));
    
    // TRY EXPLORING MIN MAX??!
    
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

    const link = svg.selectAll('.link').data(root.links());
    const path = useRing ? linkRadial()
      .angle(d => d.x)
      .radius(d => pythag(radialPoint(d.x, d.y))) :
      linkVertical().x(d => xScale(d.x)).y(d => yScale(d.y));
    link.enter().append('path')
        .attr('class', 'link')
        // .transition(t)
        .attr('d', path);
    link.transition().attr('d', path);

    const evaluateClassNames = d => classnames({
      node: true,
      'node--internal': d.children,
      'node--leaf': !d.children,
      'node--selected': selectedMap.get(d.data.id)
    });

    const positioning = useRing ?
      d => `translate(${radialPoint(d.x, d.y).join(',')})` :
      d => `translate(${[xScale(d.x), yScale(d.y)].join(',')})`;
    const node = svg.selectAll('.node')
      .data(root.descendants());

    node.enter().append('circle')
        .attr('class', evaluateClassNames)
        .attr('transform', positioning)
        .attr('r', 3.5)
        .on('mouseenter', d => setSelectedCommentPath(extractIdPathToRoot(d)));

    node.merge(node)
        .attr('transform', positioning)
        .attr('class', evaluateClassNames);

  }

  render() {
    const {height, width, graphLayout} = this.props;
    const useRing = graphLayout === 'ring';
    return (
      <svg width={this.props.width} height={this.props.height}>
        <g
          ref="chart"
          transform={useRing ? `translate(${width / 2}, ${height / 2})` : ''}
          ref="chart" />
      </svg>
    );
  }
}

export default GraphPanel;
