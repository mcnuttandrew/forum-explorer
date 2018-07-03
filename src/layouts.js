import {tree} from 'd3-hierarchy';
/* eslint-disable no-unused-vars */
import {linkRadial, linkVertical} from 'd3-shape';
/* eslint-enable no-unused-vars */
import {scaleLinear} from 'd3-scale';
import {radialToCartesian} from './utils';

const treeLayout = {
  layout: () => tree().size([1, 1]),
  getXScale: ({width, margin}) =>
    scaleLinear().domain([0, 1]).range([margin.left, width - margin.left - margin.right]),
  getYScale: ({height, margin}) =>
    scaleLinear().domain([0, 1]).range([margin.top, height - margin.top - margin.bottom]),
  positioning: (xScale, yScale) => d => [xScale(d.x), yScale(d.y)],
  path: (xScale, yScale) => linkVertical().x(d => xScale(d.x)).y(d => yScale(d.y)),
  offset: () => ''
};

const balloonLayout = {
  layout: () => treelayout => {
    let notDone = true;
    let nodeQueue = [];
    let currentNode = treelayout;
    // decorateWithSize(currentNode);
    currentNode.count();
    currentNode.x = 0;
    currentNode.y = 0;
    currentNode.radius = 0.8;
    currentNode.rotation = 0;
    while (notDone) {
      if (currentNode.children) {
        /* eslint-disable no-loop-func */
        let usedAngle = 0;
        currentNode.children.forEach((child, idx) => {
          const angleFraction = child.value / currentNode.value * Math.PI * 2;
          const angle = angleFraction + usedAngle;// + currentNode.rotation;
          usedAngle += angleFraction;
          child.radius = currentNode.radius / Math.sqrt(2);
          child.x = child.radius * Math.cos(angle) + currentNode.x;
          child.y = child.radius * Math.sin(angle) + currentNode.y;
          // child.rotation = currentNode.rotation + Math.PI / 9;
          child.rotation = Math.atan2(child.x, child.y);

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
  getXScale: ({width, margin}) =>
    scaleLinear().domain([-1, 1]).range([margin.left, width - margin.left - margin.right]),
  getYScale: ({height, margin}) =>
    scaleLinear().domain([-1, 1]).range([margin.top, height - margin.top - margin.bottom]),
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

const ringLayout = {
  layout: () => tree().size([2 * Math.PI, 1])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth),

  getXScale: ({width}) => scaleLinear().domain([0, 1]).range([0, width / 2]),
  getYScale: ({height}) => scaleLinear().domain([0, 1]).range([0, height / 2]),

  positioning: (xScale, yScale) => {
    const radialPoint = (angle, radius) => [
      xScale(radius * Math.cos(angle - Math.PI / 2)),
      yScale(radius * Math.sin(angle - Math.PI / 2))
    ];
    return d => radialPoint(d.x, d.y);
    // linkRadial()
    // .angle(d => d.x)
    // .radius(d => pythag(radialPoint(d.x, d.y)))
  },
  path: (xScale, yScale) => d => {
    const sourcePos = radialToCartesian(d.source.x, d.source.y);
    const targetPos = radialToCartesian(d.target.x, d.target.y);
    return `
    M${xScale(sourcePos[0])} ${yScale(sourcePos[1])}
    L${xScale(targetPos[0])} ${yScale(targetPos[1])}
    `;
  },
  offset: ({width, height}) => `translate(${width / 2}, ${height / 2})`
};

export const layouts = {
  tree: treeLayout,
  balloon: balloonLayout,
  ring: ringLayout
};

// this is imported into the reducer and used to order the layouts
export const graphLayouts = ['ring', 'balloon', 'tree'];
