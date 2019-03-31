import {histogram} from 'd3-array';
import {scaleLinear} from 'd3-scale';
import Immutable from 'immutable';

import {SHOW_LOGS} from './constants/index';

export function area(points) {
  const segmentSum = points
  .reduce((acc, row, index) => {
    const nextRow = points[(index + 1) % points.length];
    return acc + (row[0] * nextRow[1] - nextRow[0] * row[1]);
  }, 0);
  return 0.5 * Math.abs(segmentSum);
}

export function classnames(classObject) {
  return Object.keys(classObject).filter(name => classObject[name]).join(' ');
}

const contractedTime = {
  years: 'yrs',
  months: 'mnths',
  days: 'days',
  hours: 'hrs',
  minutes: 'min',
  seconds: 's'
};

/* eslint-disable complexity */
export function timeSince(date, contractTime) {
  const seconds = Math.floor((new Date() - date * 1000) / 1000);
  let interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return `${interval} ${contractTime ? contractedTime.years : 'years'}`;
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return `${interval} ${contractTime ? contractedTime.months : 'months'}`;
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return `${interval} ${contractTime ? contractedTime.days : 'days'}`;
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return `${interval} ${contractTime ? contractedTime.hours : 'hours'}`;
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return `${interval} ${contractTime ? contractedTime.minutes : 'minutes'}`;
  }
  return `${Math.floor(seconds)} ${contractTime ? contractedTime.seconds : 'seconds'}`;
}
/* eslint-enable complexity */

// includes dumb d3 rotation
export const radialToCartesian = (angle, radius) => [
  radius * Math.cos(angle - Math.PI / 2),
  radius * Math.sin(angle - Math.PI / 2)
];

export function xRange(width, margin) {
  return [margin.left, width - margin.left - margin.right];
}

export function yRange(height, margin) {
  return [margin.top, height - margin.top - margin.bottom];
}

export function getDomain(root, accessor = d => [d.x, d.y]) {
  return root.descendants().reduce((acc, row) => {
    const pos = accessor(row);

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

export function getSelectedOption(configs, optionIdx) {
  return configs
  .getIn([optionIdx, 'options'])
  .filter(row => row.get('selected'))
  .getIn([0, 'name']);
}

export function computeTopUsers(data, numUsers) {
  // first execute count by user
  const counts = data.reduce((acc, row) => {
    acc[row.get('by')] = (acc[row.get('by')] || 0) + 1;
    return acc;
  }, {});
  // sort the user-count pairs by their counts
  const posters = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  // create a map between user name and data about them
  return posters.slice(0, numUsers).reduce((acc, [userName, numPosts], idx) => {
    if (numPosts <= 1) {
      return acc;
    }
    acc[userName] = {rank: idx, numPosts};
    return acc;
  }, {});
}

export const flattenData = tree => {
  if (!tree.children || tree.children.length < 1) {
    return [tree];
  }
  return tree.children.reduce((acc, child) =>
    acc.concat(flattenData(child)), [tree]);
};

export const computeDomainForAcessor = (data, accessor) => data.reduce((acc, row) => {
  const val = accessor(row);
  return {
    min: Math.min(val, acc.min),
    max: Math.max(val, acc.max)
  };
}, {min: Infinity, max: -Infinity});

export const extractLinksFromFlatNodeList = nodeList => nodeList.reduce((acc, target) => {
  const source = target.parent;
  if (!source) {
    return acc;
  }
  return acc.concat({target, source});
}, []);

export const elbow = ({source, target}) =>
  `M${source.x},${source.y}V${target.y}H${target.x}`;

export const computeHistrogram = data => {
  const {min, max} = data.reduce((acc, {time}) => ({
    min: time ? Math.min(acc.min, time) : acc.min,
    max: time ? Math.max(acc.max, time) : acc.max
  }), {min: Infinity, max: -Infinity});
  const xScale = scaleLinear().domain([min, max]).range([0, 100]);
  return Immutable.fromJS(histogram().domain(xScale.domain())
    .thresholds(xScale.ticks(15))(data.map(({time}) => time))
    .map(bin => ({x0: bin.x0, x: bin.x1, y: bin.length})));
};

export function prepareTree(data, root) {
  const maxDepth = data.reduce((acc, row) => Math.max(acc, row.depth), 0);
  const nodesByParentId = data.reduce((acc, child) => {
    if (child.parent && !acc[child.parent]) {
      acc[child.parent] = [];
    }
    acc[!child.parent ? 'root' : child.parent].push(child);
    return acc;
  }, {root: []});
  const formToTree = node => {
    const isLeaf = !nodesByParentId[node.id];
    const newNode = {
      descendants: 1,
      depth: node.depth,
      height: maxDepth - node.depth - 1,
      id: `${node.id}`,
      data: node,
      parent: node.parent || null,
      children: (nodesByParentId[node.id] || [])
        .map(child => formToTree(child))
    };
    newNode.descendants = newNode.children
      .reduce((acc, {descendants}) => acc + descendants, isLeaf ? 0 : 1);
    return newNode;
  };
  if (root && nodesByParentId[root] && nodesByParentId[root].length > 1 || !nodesByParentId.root.length) {
    nodesByParentId.root = [{
      depth: 0,
      id: root,
      children: [root]
    }];
  }
  nodesByParentId.root[0].data = {...data.find(row => row.id === Number(root))};
  return formToTree(nodesByParentId.root[0]);
}

export function log(...args) {
  if (SHOW_LOGS) {
    /* eslint-disable no-console */
    console.log(...args);
    /* eslint-enable no-console */
  }
}
