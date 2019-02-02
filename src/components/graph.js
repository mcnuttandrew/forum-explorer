import React from 'react';
import ReactDOM from 'react-dom';

import {select} from 'd3-selection';
import {voronoi} from 'd3-voronoi';
/* eslint-disable no-unused-vars */
import {transition} from 'd3-transition';
/* eslint-enable no-unused-vars */
import debounce from 'lodash.debounce';

import {layouts} from '../layouts';
import {classnames, area} from '../utils';
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

// const rootSizes = {
//   small: 7,
//   medium: 10,
//   large: 14
// };

const rootSizes = {
  small: 7,
  medium: 15,
  large: 19
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
      data,
      height,
      width,
      graphLayout,
      markSize,
      treeLayout
    } = props;

    if (!width || !height || !treeLayout) {
      return;
    }
    const layoutToUse = data.size > 1 ? graphLayout : 'null';
    const xScale = layouts[layoutToUse].getXScale(props, treeLayout);
    const yScale = layouts[layoutToUse].getYScale(props, treeLayout);

    const positioning = layouts[layoutToUse].positioning(xScale, yScale);
    const nodes = treeLayout.descendants();
    const labels = treeLayout.labels && treeLayout.labels() || [];

    this.renderLinks(props, treeLayout, xScale, yScale);
    this.renderNodes(props, nodes, positioning, markSize);
    this.renderSelectedNodes(props, nodes, positioning, markSize);
    // probably could get some speed up by not recomputing the voronoi all the time
    const voronoiEval = voronoi().extent([[0, 0], [width + 1, height + 1]]);
    const voronois = voronoiEval.polygons(nodes.map(d => [...positioning(d), d])).filter(d => d.length);
    this.renderVoronoi(props, nodes, positioning, voronois);
    this.renderLabels(props, labels, nodes, positioning, voronois);

    this.renderRootAnnotation(props, treeLayout, xScale, yScale);
  }

  renderRootAnnotation(props, treeLayout, xScale, yScale) {

    const translateFunc = d => `translate(${d.x}, ${d.y})`;
    const treeRoot = treeLayout.treeRoot && treeLayout.treeRoot();
    const annotations = !treeRoot ? [] : [
      {x: xScale(treeRoot), y: yScale(treeRoot), label: `+${treeRoot.data.data.hiddenNodes.length}`}
    ];
    console.log(treeLayout.treeRoot && treeLayout.treeRoot())
    const rootAnnotation = select(ReactDOM.findDOMNode(this.refs.rootAnnotation))
      .selectAll('.root-annotation').data(annotations);
    rootAnnotation.enter().append('text')
        .attr('class', 'root-annotation')
        .attr('transform', d => translateFunc(d))
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .text(d => d.label);
    rootAnnotation.transition()
      .attr('class', 'root-annotation')
      .attr('transform', d => translateFunc(d))
      .text(d => d.label);
    rootAnnotation.exit().remove();
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
      squareLeafs,
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
        const user = d.data.data.by || (d.data.data.data && d.data.data.data.by);
        if (!topUsers[user] || topUsers[user].rank !== idx) {
          return acc;
        }
        acc[`node-highlighted-top-${idx}`] = true;
        return acc;
      }, {});
      return classnames({
        'node-root': d.data.data.id === 'root',
        node: true,
        'node-internal': d.children,
        'node-leaf': !d.children,
        'node-selected': selectedMap.get(d.data.data.id),
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
      const scalingSizes = squareLeafs ? [1, 1.75] : [1.75, 1.75];
      const scalingFactor = (!d.children || !d.children.length) ? scalingSizes[0] : scalingSizes[1];
      return scalingFactor * (d.depth ? nodeSizes[markSize] : rootSizes[markSize]);
    };
    const circleness = squareLeafs ? [0, 20] : [20, 20];
    node.enter().append('rect')
        .attr('class', evalCircClasses)
        .attr('transform', d => translateFunc(positioning(d)))
        .attr('height', setCircSize)
        .attr('width', setCircSize)
        .attr('x', d => -setCircSize(d) / 2)
        .attr('y', d => -setCircSize(d) / 2)
        .attr('rx', d => (!d.children || !d.children.length) ? circleness[0] : circleness[1])
        .on('click', toggleCommentSelectionLock);

    node.transition()
        .attr('transform', d => translateFunc(positioning(d)))
        .attr('height', setCircSize)
        .attr('width', setCircSize)
        .attr('x', d => -setCircSize(d) / 2)
        .attr('y', d => -setCircSize(d) / 2)
        .attr('rx', d => (!d.children || !d.children.length) ? circleness[0] : circleness[1])
        .attr('class', evalCircClasses);
  }

  renderVoronoi(props, nodes, positioning, voronois) {
    const {setSelectedCommentPath, toggleCommentSelectionLock} = props;
    const polygonsG = select(ReactDOM.findDOMNode(this.refs.polygons));
    const polygon = polygonsG.selectAll('.polygon').data(voronois);
    polygon.enter().append('path')
      .attr('class', 'polygon')
      .attr('fill', 'black')
      .attr('stroke', 'white')
      .attr('opacity', 0.1)
      .attr('d', d => `M${d.join('L')}Z`)
      .on('mouseenter', d => setSelectedCommentPath(extractIdPathToRoot(d.data[2])))
      .on('click', toggleCommentSelectionLock);
    polygon.transition()
      .attr('d', d => `M${d.join('L')}Z`);
  }

  renderLabels(props, labels, nodes, positioning, voronois) {
    const labelMap = labels.reduce((acc, row) => {
      acc[row.key] = row.label;
      return acc;
    }, {});
    const biggestVoronois = voronois
      .reduce((acc, row) => {
        const data = row.data[2];
        const key = data.key;
        const polygonArea = area(row);
        if (!acc[key] || acc[key].polygonArea < polygonArea) {
          acc[key] = {
            data,
            polygonArea,
            centroid: row
              .reduce((mem, d) => [mem[0] + d[0], mem[1] + d[1]], [0, 0])
              .map(d => d / row.length),
            label: labelMap[key]
          };
        }
        return acc;
      }, {});

    const labelsG = select(ReactDOM.findDOMNode(this.refs.labels));
    const translateFunc = arr => `translate(${arr.join(',')})`;

    const label = labelsG.selectAll('.label').data(Object.values(biggestVoronois));
    label.enter().append('g')
        .attr('class', 'label')
        .attr('transform', d => translateFunc(d.centroid));

    label.transition()
        .attr('transform', d => translateFunc(d.centroid));
    label.exit().remove();

    const subLabels = label.selectAll('text').data(d => d.label || '');
    subLabels.enter().append('text').text(d => d)
      .attr('transform', (d, idx) => `translate(0, ${idx * 11})`);
    subLabels.transition().text(d => d)
      .attr('transform', (d, idx) => `translate(0, ${idx * 11})`);
    subLabels.exit().remove();

  }

  render() {
    const {
      commentSelectionLock,
      graphLayout,
      height,
      width,
      toggleCommentSelectionLock,
      muteUnselected
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
          muteUnselected && <rect
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
        <g ref="rootAnnotation" transform={translation} className="unselectable"/>
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
    top: 20,
    left: 20,
    bottom: 20,
    right: 20
  }
};
export default Graph;
