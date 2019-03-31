import React from 'react';
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
  small: 3,
  medium: 7,
  large: 10
};

const rootSizes = {
  small: 15,
  medium: 15,
  large: 19
};

class Graph extends React.PureComponent {
  generateRootAnnotation() {
    const {fullGraph} = this.props;
    const {layout, xScale, yScale} = fullGraph;
    const treeRoot = layout.treeRoot && layout.treeRoot();
    if (!treeRoot) {
      return null;
    }
    return (<text
      transform={`translate(${xScale(treeRoot)}, ${yScale(treeRoot)})`}
      className="root-annotation"
      textAnchor="middle"
      fontSize="10">
      {treeRoot.data.data.hiddenNodes ?
        `+${treeRoot.data.data.hiddenNodes.length}` : ''}
    </text>);
  }

  generateLines() {
    const {selectedMap, graphLayout, fullGraph} = this.props;
    const {xScale, yScale, layout} = fullGraph;
    const evalLineClasses = d => {
      return classnames({
        link: true,
        'link-selected': selectedMap.get(d.target.data.data.id)
      });
    };
    const path = layouts[graphLayout].path(xScale, yScale);
    return layout.links().map((d, idx) => {
      return <path d={path(d)} className={evalLineClasses(d)} key={`line-${idx}`}/>;
    });
  }

  generateNodes() {
    const {
      muteUnselected,
      hoveredComment,
      toggleCommentSelectionLock,
      selectedMap,
      squareLeafs,
      topUsers,
      fullGraph,
      markSize
    } = this.props;
    const {positioning, nodes} = fullGraph;
    const translateFunc = arr => `translate(${arr.join(',')})`;
    const evalCircClasses = d => classnames({
      'node-root': d.data.data.id === 'root',
      node: true,
      'node-internal': d.children,
      'node-leaf': !d.children,
      'node-selected': selectedMap.get(d.data.data.id),
      'node-hovered': d.data.data.id === hoveredComment
    });
    const isSelected = d => selectedMap.get(d.data.data.id);
    const computeFill = d => {
      const data = d.data.data;
      const user = data.by || (data.data && data.data.by);
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

    // const node = nodesG.selectAll('.node').data(nodes);
    const setCircSize = d => {
      const scalingSizes = squareLeafs ? [1, 1.75] : [1.75, 1.75];
      const scalingFactor = (!d.children || !d.children.length) ? scalingSizes[0] : scalingSizes[1];
      return scalingFactor * (d.depth ? nodeSizes[markSize] : rootSizes[markSize]);
    };
    const circleness = squareLeafs ? [0, 20] : [20, 20];
    return nodes.map((d, idx) => {
      return (<rect
        key={`node-${idx}`}
        transform={translateFunc(positioning(d))}
        className={evalCircClasses(d)}
        fill={computeFill(d)}
        stroke={computeStroke(d)}
        height={setCircSize(d)}
        width={setCircSize(d)}
        rx={(!d.children || !d.children.length) ? circleness[0] : circleness[1]}
        x={-setCircSize(d) / 2}
        y={-setCircSize(d) / 2}
        onClick={toggleCommentSelectionLock}/>);
    });
  }

  generatePolygons() {
    const {setSelectedCommentPath, toggleCommentSelectionLock, fullGraph} = this.props;
    const {voronois} = fullGraph;
    return voronois.map((d, idx) => {
      return (<path
        key={`voronoi-${idx}`}
        className="polygon"
        fill="black"
        stroke="white"
        opacity="0"
        onMouseEnter={() => setSelectedCommentPath(d.data[2].data.id)}
        onClick={toggleCommentSelectionLock}/>);
    });
  }

  generateLabels() {
    const {fullGraph} = this.props;
    const {labels, voronois} = fullGraph;
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

    const translateFunc = arr => `translate(${arr.join(',')})`;
    return Object.values(biggestVoronois).map((d, jdx) => {
      return (<g className="label" transform={translateFunc(d.centroid)} key={`label-${jdx}`}>
        {(d.label || []).map((label, idx) => (<text
          key={`label-${jdx}-${label}`}
          transform={`translate(0, ${idx * 11})`}>{label}</text>))}
      </g>);
    });
  }

  render() {
    const {
      commentSelectionLock,
      graphLayout,
      height,
      width,
      toggleCommentSelectionLock,
      muteUnselected,
      fullGraph
    } = this.props;
    const translation = layouts[graphLayout].offset(this.props);
    if (!fullGraph) {
      return <svg/>;
    }
    return (
      <svg
        width={width}
        height={height}
        className={classnames({locked: commentSelectionLock})}>
        <g
          opacity={muteUnselected ? 0.7 : 1}
          ref="lines"
          transform={translation}>
          {this.generateLines()}
        </g>
        <g ref="polygons" transform={translation}>
          {this.generatePolygons()}
        </g>
        <g ref="nodes" transform={translation}>
          {this.generateNodes()}
        </g>
        <g ref="labels" transform={translation} className="unselectable">
          {this.generateLabels()}
        </g>
        <g ref="rootAnnotation" transform={translation} className="unselectable">
          {this.generateRootAnnotation()}
        </g>
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
