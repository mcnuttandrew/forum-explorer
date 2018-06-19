import React from 'react';
import ReactDOM from 'react-dom';

import {select} from 'd3-selection';
import {tree, stratify} from 'd3-hierarchy';
import {linkRadial} from 'd3-shape';
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
    const {height, width, setSelectedCommentPath, selectedMap} = props;
    if (!width || !height) {
      return;
    }
    const xScale = scaleLinear().domain([0, 1]).range([0, width / 2]);
    const yScale = scaleLinear().domain([0, 1]).range([0, height / 2]);
    const radialPoint = (angle, radius) => [
      xScale(radius * Math.cos(angle - Math.PI / 2)),
      yScale(radius * Math.sin(angle - Math.PI / 2))
    ];
    const t = transition().duration(750);

    const data = props.data.toJS();
    const svg = select(ReactDOM.findDOMNode(this.refs.chart));

    const treeEval = tree().size([2 * Math.PI, 1])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    const root = treeEval(stratify().id(d => d.id).parentId(d => d.parent)(data));

    const link = svg.selectAll('.link').data(root.links());

    link.enter().append('path')
        .attr('class', 'link')
        // .transition(t)
        .attr('d', linkRadial()
          .angle(d => d.x)
          .radius(d => pythag(radialPoint(d.x, d.y)))
        );
    link.transition()
        .attr('d', linkRadial()
          .angle(d => d.x)
          .radius(d => pythag(radialPoint(d.x, d.y)))
        );

    const evaluateClassNames = d => classnames({
      node: true,
      'node--internal': d.children,
      'node--leaf': !d.children,
      'node--selected': selectedMap.get(d.data.id)
    });

    const node = svg.selectAll('.node')
      .data(root.descendants());

    node.enter().append('circle')
        .attr('class', evaluateClassNames)
        .attr('transform', d => `translate(${radialPoint(d.x, d.y).join(',')})`)
        .attr('r', 3)
        .on('mouseenter', d => setSelectedCommentPath(extractIdPathToRoot(d)));

    node.merge(node)
        .attr('transform', d => `translate(${radialPoint(d.x, d.y).join(',')})`)
        .attr('class', evaluateClassNames);

  }

  render() {
    const {height, width} = this.props;
    return (
      <svg width={this.props.width} height={this.props.height}>
        <g ref="chart" transform={`translate(${width / 2}, ${height / 2})`} ref="chart" />
      </svg>
    );
  }
}

export default GraphPanel;
