import {scaleLinear} from 'd3-scale';
import {getDomain, xRange, yRange} from '../utils';

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

// function countChildren(node) {
//   (node.children || []).forEach(countChildren);
//   node.count = node.descendants().length;
//   // (node.children || []).reduce((acc, child) => acc + (child.count || 1), 0) || 1;
// }

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

    while (notDone) {
      if (currentNode.children) {
        /* eslint-disable no-loop-func */
        let usedAngle = 0;
        currentNode.children.forEach((child, idx) => {
          const angleFraction = (child.value / currentNode.value) * Math.PI * 2;
          const angle = angleFraction / 2 + usedAngle;
          // + currentNode.rotation;
          usedAngle += angleFraction;
          child.radius =
            currentNode.radius * (Math.max(child.value, 2) / currentNode.value);
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
    return scaleLinear()
      .domain([xMin, xMax])
      .range(xRange(width, margin));
  },
  getYScale: ({height, margin}, root) => {
    const {yMin, yMax} = getDomain(root);
    return scaleLinear()
      .domain([yMin, yMax])
      .range(yRange(height, margin));
  },
  positioning: (xScale, yScale) => d => [xScale(d.x), yScale(d.y)],
  // path: (xScale, yScale) => linkVertical().x(d => xScale(d.x)).y(d => yScale(d.y)),
  path: (xScale, yScale) => d => {
    return `
    M${xScale(d.source.x)} ${yScale(d.source.y)}
    L${xScale(d.target.x)} ${yScale(d.target.y)}
    `;
  },
  offset: () => '',
};

export default balloonLayout;
