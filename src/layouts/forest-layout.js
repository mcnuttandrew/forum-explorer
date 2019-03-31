
import {scaleLinear} from 'd3-scale';
// import {linkVertical} from 'd3-shape';
import {
  treemapBinary,
  treemapResquarify,
  treemap,
  hierarchy
} from 'd3-hierarchy';

import {
  xRange,
  yRange,
  radialToCartesian,
  flattenData,
  computeDomainForAcessor,
  extractLinksFromFlatNodeList
} from '../utils';
import RingLayout from './ring-layout';
const USE_TREES = true;
const USE_BINARY = false;
const treemapLayout = USE_BINARY ? treemapBinary : treemapResquarify;
const ringEval = RingLayout.layout();

// UTILS
const generateLabels = (branches, branchModel) => {
  const rootLabel = {label: branches.length ? ['conversation', 'root'] : [], key: 'root'};
  return [rootLabel]
    .concat(branches.map((branch, idx) => {
      const model = branchModel[branch.data.data.id];
      return ({
        label: model ? ['subconversation', `about ${model.term}`] : [`subconversation ${idx}`],
        key: branch.key
      });
    }));
};

const weighTree = tree => {
  if (!tree.children || tree.children.length < 1) {
    return 1;
  }
  const weight = tree.children.reduce((acc, child) =>
    acc + weighTree(child), 1);
  tree.weight = weight;
  return weight;
};

const propagateOffsets = tree => (tree.children || []).forEach(child => {
  child.containerGeom = tree.containerGeom;
  child.key = tree.key;
  propagateOffsets(child);
});

function buildScales(range, root, key, {height, width}) {
  const nodes = root.descendants();
  const groupedNodes = nodes.reduce((acc, row) => {
    acc[row.key] = (acc[row.key] || []).concat(row);
    return acc;
  }, {});
  // This controls which direction the coordinates are laid out in
  const directions = Object.entries(groupedNodes).reduce((acc, [rowKey, values]) => {
    const {x0, x1, y0, y1} = values[0].containerGeom;
    if (!USE_TREES || rowKey === 'root') {
      acc[rowKey] = radialToCartesian;
      return acc;
    }
    acc[rowKey] = !((x1 - x0) > (y1 - y0)) ? (x, y) => [x, y] : (x, y) => [y, x];
    return acc;
  }, {});

  const dataDomains = Object.entries(groupedNodes).reduce((acc, [rowKey, values]) => {
    acc[rowKey] = computeDomainForAcessor(values, d =>
      directions[rowKey](d.x, d.y)[key === 'x' ? 0 : 1]);
    return acc;
  }, {});

  return nodes.reduce((acc, row) => {
    if (acc[row.key]) {
      return acc;
    }
    const geom = row.containerGeom;
    const localRange = [geom[`${key}0`], geom[`${key}1`]];
    const domain = dataDomains[row.key];
    const scale = scaleLinear().domain([domain.min, domain.max]).range(localRange);
    const totalDomain = [0, key === 'x' ? width : height];
    const scale2 = scaleLinear().domain(totalDomain).range(range);
    acc[row.key] = v => scale2(scale(v));
    return acc;
  }, {directions});
}

const generateScale = dir => ({height, width, margin}, root) => {
  const isX = dir === 'x';
  const range = isX ? xRange(width, margin) : yRange(height, margin);
  const scales = buildScales(range, root, dir, {height, width});
  return d => scales[d.key](scales.directions[d.key](d.x, d.y)[isX ? 0 : 1]);
};

function generateTreemapLayout(height, width, rootBranch, otherBranches) {
  const rootBranchWeight = rootBranch.slice(1).reduce((acc, row) => {
    return (row.weight || 1) + acc;
  }, 0) + rootBranch.length;
  const structuredInput = hierarchy({children: [{
    weight: rootBranchWeight,
    idx: 0
  }].concat(otherBranches.map((d, idx) => ({
    weight: d.weight,
    idx: idx + 1
  })))}).sum(d => d.weight);
  const treemapingFunction = treemap(treemapLayout)
    .tile(treemapLayout)
    // TODO should be in proportion to the sizing of the container
    .size([width, height])
    .paddingInner(0.05 * width);
  return treemapingFunction(structuredInput).descendants().slice(1);
}

const childThreshold = 15;
const childWithinThreshold = negate => child => {
  const childWithin = !child.children || (child.weight < childThreshold);
  return negate ? !childWithin : childWithin;
};

// THE MAIN LAYOUT CLASS INSTANCE
export const forestLayout = {
  preheirarchyManipulation: tree => {
    // drop the stumps
    const stumps = tree.children.filter(({children}) => (!children || children.length < 1));
    if (stumps.length < 30) {
      return tree;
    }
    tree.data.hiddenNodes = stumps.map(d => ({id: d.data.id, by: d.data.by}));
    tree.children = tree.children.filter(({children}) => !(!children || children.length < 1));
    return tree;
  },
  layout: ({height, width}, branchModel) => data => {
    weighTree(data);
    // break apart the root from heavy branches
    const rootBranch = [data].concat(data.children.filter(childWithinThreshold(false)));
    const otherBranches = data.children.filter(childWithinThreshold(true));

    // generate treemap layout and decorate branch division
    const treeLayout = generateTreemapLayout(height, width, rootBranch, otherBranches);
    treeLayout.forEach(sizing => {
      const idx = sizing.data.idx;

      const containerGeom = ['x0', 'x1', 'y0', 'y1'].reduce((acc, key) => {
        acc[key] = sizing[key];
        return acc;
      }, {});

      if (!idx) {
        data.containerGeom = containerGeom;
        data.key = 'root';
        propagateOffsets(data);
        return;
      }
      otherBranches[idx - 1].containerGeom = containerGeom;
      otherBranches[idx - 1].key = otherBranches[idx - 1].data.id;
      propagateOffsets(otherBranches[idx - 1]);
    });
    // apply ring layout to all the branches
    const cloneChildren = data.children.slice();
    const tempChildren = cloneChildren.slice().filter(childWithinThreshold(false));
    data.children = tempChildren;
    ringEval(data);
    data.children = cloneChildren;
    otherBranches.forEach(branch => ringEval(branch));

    // prepare output content
    const flattenedNodes = flattenData(data);
    const links = extractLinksFromFlatNodeList(flattenedNodes)
      .filter(({source, target}) => source.key === target.key);
    const labels = generateLabels(otherBranches, branchModel);

    return {
      descendants: () => flattenedNodes,
      links: () => links,
      labels: () => labels,
      treeRoot: () => data
    };
  },

  getXScale: generateScale('x'),
  getYScale: generateScale('y'),
  positioning: (xScale, yScale) => d => [xScale(d), yScale(d)],
  // path: (xScale, yScale) => linkVertical().x(d => xScale(d)).y(d => yScale(d)),
  path: (xScale, yScale) => ({source, target}) =>
    `M${xScale(source)} ${yScale(source)}L${xScale(target)} ${yScale(target)}`,
  offset: () => ''
};

export default forestLayout;
