import React from 'react';
import ReactDOM from 'react-dom';

import {select} from 'd3-selection';
/* eslint-disable no-unused-vars */
import {transition} from 'd3-transition';
/* eslint-enable no-unused-vars */
import debounce from 'lodash.debounce';
import HexOver from 'hex-over';

import {layouts} from '../layouts';
import {classnames, area} from '../utils';
import {numUsersToHighlight} from '../constants';
import {
  COLORS,
  COLORS_UNDER_OPACITY,
  NODE_COLOR_UNDER_OPACITY,
  NODE_COLOR,
  OPACITY
} from '../constants/colors';

const nodeSizes = {
  small: 4,
  medium: 7,
  large: 10
};

const rootSizes = {
  small: 15,
  medium: 15,
  large: 19
};

const DURATION = 400;

class Graph extends React.Component {
  componentDidMount() {
    this.updateChart(this.props);
    this.debounceChartUpdate = debounce(this.updateChart, 20);
  }

  componentWillReceiveProps(newProps) {
    this.debounceChartUpdate(newProps);
  }

  updateChart(props) {
    const {
      disallowLock,
      fullGraph,
      height,
      width,
      markSize
    } = props;

    if (!width || !height || !fullGraph) {
      return;
    }
    const {xScale, yScale, layout, positioning, nodes, labels, voronois} = fullGraph;
    this.renderLinks(props, layout, xScale, yScale);
    this.renderNodes(props, nodes, positioning, markSize);
    this.renderVoronoi(props, nodes, positioning, voronois);
    this.renderLabels(props, labels, nodes, positioning, voronois);
    this.renderRootAnnotation(props, layout, xScale, yScale);
  }

  renderRootAnnotation(props, treeLayout, xScale, yScale) {

    const translateFunc = d => `translate(${d.x}, ${d.y})`;
    const treeRoot = treeLayout.treeRoot && treeLayout.treeRoot();
    const annotations = !treeRoot ? [] : [
      {
        x: xScale(treeRoot),
        y: yScale(treeRoot),
        label: treeRoot.data.hiddenNodes ?
          `+${treeRoot.data.hiddenNodes.length}` : ''
      }
    ];

    const rootAnnotation = select(ReactDOM.findDOMNode(this.refs.rootAnnotation))
      .selectAll('.root-annotation').data(annotations);
    rootAnnotation.enter().append('text')
        .attr('class', 'root-annotation')
        .attr('transform', d => translateFunc(d))
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .text(d => d.label);
    rootAnnotation.transition()
      .duration(DURATION)
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
        'link-selected': selectedMap.get(d.target.data.id)
      });
    };
    const path = layouts[graphLayout].path(xScale, yScale);
    link.enter().append('path')
        .attr('class', evalLineClasses)
        .attr('d', path);
    link.transition()
      .duration(DURATION)
      .attr('d', path)
      .attr('class', evalLineClasses);
    link.exit().remove();
  }

  renderNodes(props, nodes, positioning, markSize) {
    const {
      muteUnselected,
      hoveredComment,
      selectedMap,
      squareLeafs,
      topUsers
    } = props;
    const nodesG = select(ReactDOM.findDOMNode(this.refs.nodes));
    const translateFunc = arr => `translate(${arr.join(',')})`;
    const evalCircClasses = d => classnames({
      'node-root': d.data.id === 'root',
      node: true,
      'node-internal': d.children,
      'node-leaf': !d.children,
      'node-selected': selectedMap.get(d.data.id),
      'node-hovered': d.data.id === hoveredComment
    });
    const isSelected = d => selectedMap.get(d.data.id);
    const computeFill = d => {
      const data = d.data;
      const user = data.by || (data && data.by) || (data && data.data && data.data.by);
      const position = topUsers[user];
      if (position && (position.rank < numUsersToHighlight)) {
        return muteUnselected ?
          (isSelected(d) ? COLORS[position.rank] : COLORS_UNDER_OPACITY[position.rank]) :
          COLORS[position.rank];
      }
      return muteUnselected ? (isSelected(d) ? NODE_COLOR : NODE_COLOR_UNDER_OPACITY) : NODE_COLOR;
    };
    const computeStroke = d => muteUnselected ?
      (HexOver('#000', '#f6f6f0', isSelected(d) ? 1 : OPACITY)) : '#555';

    const node = nodesG.selectAll('.node').data(nodes);
    const setCircSize = d => {
      const scalingSizes = squareLeafs ? [1, 1.75] : [1.75, 1.75];
      const scalingFactor = (!d.children || !d.children.length) ? scalingSizes[0] : scalingSizes[1];
      return scalingFactor * (d.depth ? nodeSizes[markSize] : rootSizes[markSize]);
    };
    const circleness = squareLeafs ? [0, 20] : [20, 20];
    node.enter().append('rect')
        .attr('class', evalCircClasses)
        .attr('fill', computeFill)
        .attr('stroke', computeStroke)
        .attr('transform', d => translateFunc(positioning(d)))
        .attr('height', setCircSize)
        .attr('width', setCircSize)
        .attr('x', d => -setCircSize(d) / 2)
        .attr('y', d => -setCircSize(d) / 2)
        .attr('rx', d => (!d.children || !d.children.length) ? circleness[0] : circleness[1]);

    node.transition()
        .duration(DURATION)
        .attr('fill', computeFill)
        .attr('stroke', computeStroke)
        .attr('transform', d => translateFunc(positioning(d)))
        .attr('height', setCircSize)
        .attr('width', setCircSize)
        .attr('x', d => -setCircSize(d) / 2)
        .attr('y', d => -setCircSize(d) / 2)
        .attr('rx', d => (!d.children || !d.children.length) ? circleness[0] : circleness[1])
        .attr('class', evalCircClasses);
    node.exit().remove();
  }

  renderVoronoi(props, nodes, positioning, voronois) {
    const {
      disallowLock,
      setSelectedCommentPathWithGraphComment, 
      toggleCommentSelectionLock
    } = props;
    const polygonsG = select(ReactDOM.findDOMNode(this.refs.polygons));
    const polygon = polygonsG.selectAll('.polygon').data(voronois);
    const makeSelection = d => setSelectedCommentPathWithGraphComment(d.data[2].data.id);
    polygon.enter().append('path')
      .attr('class', 'polygon')
      .attr('fill', 'black')
      .attr('stroke', 'white')
      .attr('opacity', 0)
      .attr('d', d => `M${d.join('L')}Z`)
      .on('mouseenter', disallowLock ? () => {} : makeSelection)
      .on('click', disallowLock ? makeSelection: toggleCommentSelectionLock);
    polygon.transition()
      .duration(DURATION)
      .attr('d', d => `M${d.join('L')}Z`);
    polygon.exit().remove();
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
        .duration(DURATION)
        .attr('transform', d => translateFunc(d.centroid));
    label.exit().remove();

    const subLabels = label.selectAll('text').data(d => d.label || '');
    subLabels.enter().append('text').text(d => d)
      .attr('transform', (d, idx) => `translate(0, ${idx * 11})`);
    subLabels.transition().duration(DURATION).text(d => d)
      .attr('transform', (d, idx) => `translate(0, ${idx * 11})`);
    subLabels.exit().remove();

  }

  render() {
    const {
      commentSelectionLock,
      disallowLock,
      graphLayout,
      height,
      width,
      toggleCommentSelectionLock,
      muteUnselected,
      unsetGraphComment
    } = this.props;

    const translation = layouts[graphLayout].offset(this.props);
    return (
      <svg
        width={width}
        height={height}
        onMouseOut={unsetGraphComment}
        className={classnames({locked: commentSelectionLock})}>
        <g
          opacity={muteUnselected ? 0.7 : 1}
          ref="lines"
          transform={translation} />
        <g ref="nodes" transform={translation}/>
        <g ref="labels" transform={translation} className="unselectable"/>
        <g ref="rootAnnotation" transform={translation} className="unselectable"/>
        <g ref="polygons" className="polygon-container" transform={translation} />
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
        {!disallowLock && <text x={width - 5} y={8} className="legend unselectable">
          {`click to ${commentSelectionLock ? 'un' : '' }lock selection`}
        </text>}
      </svg>
    );
  }
}
Graph.defaultProps = {
  margin: {
    top: 10,
    left: 20,
    bottom: 5,
    right: 20
  }
};
export default Graph;
