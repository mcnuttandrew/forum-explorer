import Immutable from 'immutable';
import {hierarchy} from 'd3-hierarchy';
import {getSelectedOption} from './utils';

import balloonLayout from './layouts/balloon-layout.js';
import forestLayout from './layouts/forest-layout.js';
import gridTreeLayout from './layouts/grid-tree-layout.js';
import orbitLayout from './layouts/orbit-layout.js';
import treeLayout from './layouts/tree-layout.js';
import ringLayout from './layouts/ring-layout.js';
import timeEmbedX from './layouts/time-embed-x.js';
import timeEmbedY from './layouts/time-embed-y.js';
import nullLayout from './layouts/null-layout';

export const layouts = {
  balloon: balloonLayout,
  gridTree: gridTreeLayout,
  orbit: orbitLayout,
  timeX: timeEmbedX,
  ring: ringLayout,
  timeY: timeEmbedY,
  tree: treeLayout,
  forest: forestLayout,
  null: nullLayout
};

// this is imported into the reducer and used to order the layouts
export const graphLayouts = [
  'ring',
  'tree',
  'orbit',
  // time layouts are currently busted
  // 'timeX',
  // 'timeY',
  'balloon',
  'gridTree',
  'forest'
];

export const computeGraphLayout = state => {
  const useNullLayout = state.get('data').size <= 1;
  const graphLayout = getSelectedOption(state.get('configs'), 0);
  const {height, width} = state.get('graphPanelDimensions').toJS();
  const tree = state.get('tree');
  if (!tree) {
    return {descendants: () => [], links: () => []};
  }
  const usedLayout = layouts[useNullLayout ? 'null' : graphLayout];
  const treeEval = usedLayout.layout({height, width});
  const preppedTree = usedLayout.preheirarchyManipulation ?
    usedLayout.preheirarchyManipulation(Immutable.fromJS(tree).toJS()) : tree;
  return treeEval(hierarchy(preppedTree));
};
