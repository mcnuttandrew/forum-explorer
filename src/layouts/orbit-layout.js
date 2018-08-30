import {scaleLinear} from 'd3-scale';
import {pie} from 'd3-shape';
import {getDomain, xRange, yRange} from '../utils';

// code cribbed from elijah meeks d3.layout.orbit
// function tickRadianFunction() {
//   return 1;
// }
const tickRadianFunction = d => d.depth;

function orbitStart(flattenedNodes, orbitalRings) {
  flattenedNodes.forEach(node => {
    const parent = node.parent;
    if (parent) {
      const angle = node.angle + tickRadianFunction(node);
      node.x = parent.x + (parent.ring / 2) * Math.sin(angle);
      node.y = parent.y + (parent.ring / 2) * Math.cos(angle);
    }
  });

  orbitalRings.forEach(ring => {
    ring.x = ring.source.x;
    ring.y = ring.source.y;
  });
}

const orbitSize = [100, 100];
const getChildren = d => d.children;
const orbitDepthAdjust = () => 5;
function calculateNodes(orbitNodes, flattenedNodes, orbitalRings) {
  orbitNodes.x = orbitSize[0] / 2;
  orbitNodes.y = orbitSize[1] / 2;
  orbitNodes.deltaX = x => x;
  orbitNodes.deltaY = y => y;
  orbitNodes.ring = orbitSize[0] / 2;
  orbitNodes.depth = 0;

  flattenedNodes.push(orbitNodes);

  traverseNestedData(orbitNodes);

  function traverseNestedData(node) {
    if (getChildren(node)) {
      const thisPie = pie().value(d => getChildren(d) ? 4 : 1);
      const piedValues = thisPie(getChildren(node));

      orbitalRings.push({source: node, x: node.x, y: node.y, r: node.ring / 2});

      for (let x = 0; x < getChildren(node).length; x++) {
        const child = getChildren(node)[x];
        child.angle = ((piedValues[x].endAngle - piedValues[x].startAngle) / 2) + piedValues[x].startAngle;

        child.parent = node;
        child.depth = node.depth + 1;

        child.x = child.parent.x + (child.parent.ring / 2) * Math.sin(child.angle);
        child.y = child.parent.y + (child.parent.ring / 2) * Math.cos(child.angle);

        child.deltaX = dx => dx;
        child.deltaY = dy => dy;
        child.ring = child.parent.ring / orbitDepthAdjust(node);

        flattenedNodes.push(child);
        traverseNestedData(child);
      }
    }
  }
}

const orbitLayout = {
  layout: () => data => {
    const flattenedNodes = [];
    const orbitalRings = [];
    calculateNodes(data, flattenedNodes, orbitalRings);
    orbitStart(flattenedNodes, orbitalRings);
    const links = flattenedNodes.reduce((acc, target) => {
      const source = target.parent;
      if (!source) {
        return acc;
      }
      return acc.concat({target, source});
    }, []);
    return {
      descendants: () => flattenedNodes,
      links: () => links
    };
  },

  getXScale: ({width, margin}, root) => {
    const {xMin, xMax} = getDomain(root, d => [d.x, d.y]);
    return scaleLinear().domain([xMin, xMax]).range(xRange(width, margin));
  },
  getYScale: ({height, margin}, root) => {
    const {yMin, yMax} = getDomain(root, d => [d.x, d.y]);
    return scaleLinear().domain([yMin, yMax]).range(yRange(height, margin));
  },
  positioning: (xScale, yScale) => d => [xScale(d.x), yScale(d.y)],
  path: (xScale, yScale) => d => `
  M${xScale(d.source.x)} ${yScale(d.source.y)}
  L${xScale(d.target.x)} ${yScale(d.target.y)}
  `,
  offset: ({width, height}) => ''
};

export default orbitLayout;
