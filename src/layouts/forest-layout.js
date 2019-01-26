import RingLayout from './ring-layout';
import {scaleLinear} from 'd3-scale';
import {
  getDomain,
  xRange,
  yRange,
  radialToCartesian,
  flattenData,
  computeDomainForAcessor
} from '../utils';
import {linkVertical} from 'd3-shape';

import {
  treemapSquarify,
  treemap,
  hierarchy
} from 'd3-hierarchy';

const ringEval = RingLayout.layout();
const extractLinksFromFlatNodeList = nodeList => {
  return nodeList.reduce((acc, target) => {
    const source = target.parent;
    if (!source) {
      return acc;
    }
    return acc.concat({target, source});
  }, []);
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

function buildScales(range, root, key) {
  const nodes = root.descendants();
  const groupedNodes = nodes.reduce((acc, row) => {
    acc[row.key] = (acc[row.key] || []).concat(row);
    return acc;
  }, {});
  const domains = Object.entries(groupedNodes).reduce((acc, [rowKey, values]) => {
    acc[rowKey] = computeDomainForAcessor(values, d =>
      radialToCartesian(d.x, d.y)[key === 'x' ? 0 : 1]);
    return acc;
  }, {});

  return nodes.reduce((acc, row) => {
    if (acc[row.key]) {
      return acc;
    }
    const geom = row.containerGeom;
    const localRange = key === 'x' ? [geom.x0, geom.x1] : [geom.y0, geom.y1];
    const domain = domains[row.key];
    const scale = scaleLinear().domain([domain.min, domain.max]).range(localRange);
    const scale2 = scaleLinear().domain([0, 1]).range(range);
    acc[row.key] = v => {
      return scale2(scale(v));
    };
    return acc;
  }, {});
}

export const forestLayout = {
  layout: ({height, width}) => data => {
    const ratio = height / width;
    weighTree(data);
    const childThreshold = 20;
    const rootBranch = [data].concat(data.children.filter(child =>
      !child.children || (child.weight < childThreshold)));
    const otherBranches = data.children.filter(child =>
      child.children && (child.weight >= childThreshold));

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
    const treemapingFunction = treemap(treemapSquarify)
      .tile(treemapSquarify)
      // TODO should be in proportion to the sizing of the container
      .size([1, ratio])
      .padding(0.05);
    const treeLayout = treemapingFunction(structuredInput).descendants().slice(1);
    treeLayout.forEach(sizing => {
      const idx = sizing.data.idx;

      const containerGeom = ['x0', 'x1', 'y0', 'y1'].reduce((acc, key) => {
        acc[key] = sizing[key];
        return acc;
      }, {});

      if (!idx) {
        data.containerGeom = containerGeom;
        propagateOffsets(data);
        return;
      }
      otherBranches[idx - 1].containerGeom = containerGeom;
      otherBranches[idx - 1].key = `${Math.floor(Math.random() * 1000)}`;
      propagateOffsets(otherBranches[idx - 1]);
    });
    // apply ring layout to all the branches
    const cloneChildren = data.children.slice();
    const tempChildren = cloneChildren.slice().filter(child =>
      !child.children || (child.weight < childThreshold));
    data.children = tempChildren;
    ringEval(data);
    data.children = cloneChildren;
    otherBranches.forEach(branch => ringEval(branch));

    const flattenedNodes = flattenData(data);
    const links = extractLinksFromFlatNodeList(flattenedNodes)
      .filter(({source, target}) => source.key === target.key);
    const labels = [{x: 0, y: 0, label: 'root'}].concat(otherBranches.map((branch, idx) => {
      return {
        label: `branch ${idx}`,
        key: branch.key,
        x: -Math.PI * 2 / 3,
        y: 1,
      };
    }));
    return {
      descendants: () => flattenedNodes,
      links: () => links,
      labels: () => labels
    };
  },

  getXScale: ({width, margin}, root) => {
    const scales = buildScales(xRange(width, margin), root, 'x');
    return d => scales[d.key](radialToCartesian(d.x, d.y)[0]);
  },
  // BUG: yScale requires width instead of height for some reason
  getYScale: ({width, margin}, root) => {
    const scales = buildScales(yRange(width, margin), root, 'y');
    return d => scales[d.key](radialToCartesian(d.x, d.y)[1]);
  },
  positioning: (xScale, yScale) => d => [xScale(d), yScale(d)],
  path: (xScale, yScale) => d => {
    return `
    M${xScale(d.source)} ${yScale(d.source)}
    L${xScale(d.target)} ${yScale(d.target)}
    `;
  },
  offset: ({width, height}) => ''
};

export default forestLayout;
