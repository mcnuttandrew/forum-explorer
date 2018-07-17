import {tree} from 'd3-hierarchy';
/* eslint-disable no-unused-vars */
import {linkRadial, linkVertical, linkHorizontal} from 'd3-shape';
/* eslint-enable no-unused-vars */
import {scaleLinear, scaleLog, scalePow} from 'd3-scale';
import {radialToCartesian} from './utils';

function xRange(width, margin) {
  return [margin.left, width - margin.left - margin.right];
}

function yRange(height, margin) {
  return [margin.top, height - margin.top - margin.bottom];
}

function getDomain(root, accessor = d => [d.x, d.y]) {
  return root.descendants().reduce((acc, row) => {
    const pos = accessor(row);
    // console.log(pos)
    return {
      xMin: Math.min(acc.xMin, pos[0]),
      xMax: Math.max(acc.xMax, pos[0]),
      yMin: Math.min(acc.yMin, pos[1]),
      yMax: Math.max(acc.yMax, pos[1])
    };
  }, {
    xMin: Infinity,
    xMax: -Infinity,
    yMin: Infinity,
    yMax: -Infinity
  });
}

const treeLayout = {
  layout: () => tree().size([1, 1]),
  getXScale: ({width, margin}) =>
    scaleLinear().domain([0, 1]).range(xRange(width, margin)),
  getYScale: ({height, margin}) =>
    scaleLinear().domain([0, 1]).range(yRange(height, margin)),
  positioning: (xScale, yScale) => d => [xScale(d.x), yScale(d.y)],
  path: (xScale, yScale) => linkVertical().x(d => xScale(d.x)).y(d => yScale(d.y)),
  offset: () => ''
};

// function recurseBalloon(node) {
//   if (!node.children || !node.children.length) {
//     node.radius = 1;
//     node.theta = 0;
//   }
//   node.children.forEach(recurseBalloon);
//   const estimateCircum = node.children.reduce((acc, child) => acc + child.radius, 0);
//   node.radius = estimateCircum / (2 * Math.PI);
//
//   node.theta = (previousSiblingRadius + node.radius) / node.radius;
//
// }

function countChildren(node) {
  (node.children || []).forEach(countChildren);
  node.count = node.descendants().length;
  // (node.children || []).reduce((acc, child) => acc + (child.count || 1), 0) || 1;
}

const balloonLayout = {
  layout: () => treelayout => {
    let notDone = true;
    let nodeQueue = [];
    let currentNode = treelayout;

    currentNode.count();
    // countChildren(currentNode);
    currentNode.x = 0;
    currentNode.y = 0;
    currentNode.radius = 0.8;
    // currentNode.rotation = 0;
    // console.log('????')
    while (notDone) {
      if (currentNode.children) {
        /* eslint-disable no-loop-func */
        let usedAngle = 0;
        currentNode.children.forEach((child, idx) => {
          const angleFraction = (child.value / currentNode.value) * Math.PI * 2;
          const angle = angleFraction / 2 + usedAngle;// + currentNode.rotation;
          usedAngle += angleFraction;
          child.radius = currentNode.radius * (Math.max(child.value, 2) / currentNode.value);
          child.x = child.radius * Math.cos(angle) + currentNode.x;
          child.y = child.radius * Math.sin(angle) + currentNode.y;
          // child.rotation = currentNode.rotation + Math.PI / 9;
          // child.rotation = Math.atan2(child.x, child.y);

          // const angle = idx / currentNode.children.length * Math.PI * 2 + currentNode.rotation;
          // child.x = 1 / Math.pow(child.depth, 1.5) * Math.cos(angle) + currentNode.x;
          // child.y = 1 / Math.pow(child.depth, 1.5) * Math.sin(angle) + currentNode.y;
          // child.rotation = currentNode.rotation + Math.PI / 8;
        });
        /* eslint-enable no-loop-func */
        nodeQueue = nodeQueue.concat(currentNode.children);
      }
      currentNode = nodeQueue.shift();
      if (!currentNode) {
        notDone = false;
      }
    }
    return treelayout;
  },
  getXScale: ({width, margin}, root) => {
    const {xMin, xMax} = getDomain(root);
    return scaleLinear().domain([xMin, xMax]).range(xRange(width, margin));
  },
  getYScale: ({height, margin}, root) => {
    const {yMin, yMax} = getDomain(root);
    return scaleLinear().domain([yMin, yMax]).range(yRange(height, margin));
  },
  positioning: (xScale, yScale) => d => [xScale(d.x), yScale(d.y)],
  // path: (xScale, yScale) => linkVertical().x(d => xScale(d.x)).y(d => yScale(d.y)),
  path: (xScale, yScale) => d => {
    return `
    M${xScale(d.source.x)} ${yScale(d.source.y)}
    L${xScale(d.target.x)} ${yScale(d.target.y)}
    `;
  },
  offset: () => ''
};

const timeEmbedY = {
  layout: () => tree().size([1, 1]),
  getXScale: ({width, margin}, root) => {
    const {xMin, xMax} = getDomain(root, d => [d.x, d.data.time]);
    return scaleLinear().domain([xMin, xMax]).range(xRange(width, margin));
  },
  getYScale: ({height, margin}, root) => {
    const {yMin, yMax} = getDomain(root, d => [d.x, d.data.time]);
    return scaleLog().domain([yMin, yMax]).range(yRange(height, margin));
  },
  positioning: (xScale, yScale) => d => [xScale(d.x), yScale(d.data.time)],
  path: (xScale, yScale) => linkVertical().x(d => xScale(d.x)).y(d => yScale(d.data.time)),
  offset: () => ''
};

const timeEmbedX = {
  layout: () => {
    const layout = tree().size([1, 1]);
    return input => {
      const root = layout(input);
      root.descendants().forEach(node => {
        const hold = node.x;
        node.x = node.y;
        node.y = hold;
      });
      return root;
    };
  },
  getXScale: ({width, margin}, root) => {
    const {xMin, xMax} = getDomain(root, d => [d.data.time, d.y]);
    const scale = scalePow().exponent(0.2).domain([1, (xMax - xMin)]).range(xRange(width, margin));
    return value => {
      return scale(value - xMin + 1);
    };
  },
  getYScale: ({height, margin}, root) => {
    const {yMin, yMax} = getDomain(root, d => [d.data.time, d.y]);
    return scaleLinear().domain([yMin, yMax]).range(yRange(height, margin));
  },
  positioning: (xScale, yScale) => d => [xScale(d.data.time), yScale(d.y)],
  path: (xScale, yScale) => linkHorizontal().x(d => xScale(d.data.time)).y(d => yScale(d.y)),
  offset: () => ''
};

const ringLayout = {
  layout: () => tree().size([2 * Math.PI, 1])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth),

  // getXScale: ({width}) => scaleLinear().domain([0, 1]).range([0, width / 2]),
  // getYScale: ({height}) => scaleLinear().domain([0, 1]).range([0, height / 2]),
  getXScale: ({width, margin}, root) => {
    const {xMin, xMax} = getDomain(root, d => radialToCartesian(d.x, d.y));
    return scaleLinear().domain([xMin, xMax]).range(xRange(width, margin));
  },
  getYScale: ({height, margin}, root) => {
    const {yMin, yMax} = getDomain(root, d => radialToCartesian(d.x, d.y));
    // console.log(yMin, yMax)
    return scaleLinear().domain([yMin, yMax]).range(yRange(height, margin));
  },
  positioning: (xScale, yScale) => d => {
    const pos = radialToCartesian(d.x, d.y);
    return [xScale(pos[0]), yScale(pos[1])];
  },
  // linkRadial()
  // .angle(d => d.x)
  // .radius(d => pythag(radialPoint(d.x, d.y)))
  path: (xScale, yScale) => d => {
    const sourcePos = radialToCartesian(d.source.x, d.source.y);
    const targetPos = radialToCartesian(d.target.x, d.target.y);
    return `
    M${xScale(sourcePos[0])} ${yScale(sourcePos[1])}
    L${xScale(targetPos[0])} ${yScale(targetPos[1])}
    `;
  },
  offset: ({width, height}) => '',//`translate(${width / 2}, ${height / 2})`
};

export const layouts = {
  tree: treeLayout,
  balloon: balloonLayout,
  ring: ringLayout,
  timeX: timeEmbedX,
  timeY: timeEmbedY
};

// this is imported into the reducer and used to order the layouts
export const graphLayouts = ['timeX', 'timeY', 'ring', 'balloon', 'tree'];
