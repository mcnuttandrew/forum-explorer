import {scaleLinear} from 'd3-scale';
import {getDomain, xRange, yRange} from '../utils';
import {linkVertical} from 'd3-shape';

const computePositionsMutatively = data => {
  // https://llimllib.github.io/pymag-trees/
  const nexts = [...new Array(data.height + 1)].map(_ => 0);
  const minimumWs = (tree, depth = 0) => {
    tree.x = nexts[depth];
    tree.y = depth;
    nexts[depth] += 1;
    (tree.children || []).forEach(child => minimumWs(child, depth + 1));
  };
  minimumWs(data);
};

const flattenData = tree => {
  if (!tree.children || tree.children.length < 1) {
    return [tree];
  }
  return tree.children.reduce((acc, child) =>
    acc.concat(flattenData(child)), [tree]);
};

const extractLinksFromFlatNodeList = nodeList => {
  return nodeList.reduce((acc, target) => {
    const source = target.parent;
    if (!source) {
      return acc;
    }
    return acc.concat({target, source});
  }, []);
};

const computeDomainForAcessor = (data, accessor) => data.reduce((acc, row) => {
  const val = accessor(row);
  return {
    min: Math.min(val, acc.min),
    max: Math.max(val, acc.max)
  };
}, {min: Infinity, max: -Infinity});

export const gridTree = {
  layout: () => data => {
    computePositionsMutatively(data);
    const flattenedNodes = flattenData(data);
    const links = extractLinksFromFlatNodeList(flattenData(data));
    return {
      descendants: () => flattenedNodes,
      links: () => links
    };
  },

  getXScale: ({width, margin}, root) => {
    const nodes = root.descendants();
    const depthDomain = computeDomainForAcessor(nodes, d => d.depth);
    const range = xRange(width, margin);
    const subScales = [...new Array(depthDomain.max + 1)].reduce((acc, _, idx) => {
      const rowNodes = nodes.filter(node => node.depth === idx);
      const rowDomain = computeDomainForAcessor(rowNodes, d => d.x);
      const domain = rowDomain.min === rowDomain.max ? [-1, 1] : [rowDomain.min, rowDomain.max];
      acc[idx] = scaleLinear().domain(domain).range(range);
      return acc;
    }, {});
    return d => subScales[d.depth](d.x);
  },
  getYScale: ({height, margin}, root) => {
    const {yMin, yMax} = getDomain(root, d => [d.x, d.y]);
    const scale = scaleLinear().domain([yMin, yMax]).range(yRange(height, margin));
    return d => scale(d.y);
  },
  positioning: (xScale, yScale) => d => [xScale(d), yScale(d)],
  path: (xScale, yScale) => linkVertical().x(d => xScale(d)).y(d => yScale(d)),
  offset: ({width, height}) => ''
};

export default gridTree;
