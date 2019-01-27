import balloonLayout from './layouts/balloon-layout.js';
import forestLayout from './layouts/forest-layout.js';
import gridTreeLayout from './layouts/grid-tree-layout.js';
import orbitLayout from './layouts/orbit-layout.js';
import treeLayout from './layouts/tree-layout.js';
import ringLayout from './layouts/ring-layout.js';
import timeEmbedX from './layouts/time-embed-x.js';
import timeEmbedY from './layouts/time-embed-y.js';

export const layouts = {
  balloon: balloonLayout,
  gridTree: gridTreeLayout,
  orbit: orbitLayout,
  timeX: timeEmbedX,
  ring: ringLayout,
  timeY: timeEmbedY,
  tree: treeLayout,
  forest: forestLayout
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
