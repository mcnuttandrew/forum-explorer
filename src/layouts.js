import balloonLayout from './layouts/balloon-layout.js';
import orbitLayout from './layouts/orbit-layout.js';
import treeLayout from './layouts/tree-layout.js';
import ringLayout from './layouts/ring-layout.js';
import timeEmbedX from './layouts/time-embed-x.js';
import timeEmbedY from './layouts/time-embed-y.js';

export const layouts = {
  balloon: balloonLayout,
  orbit: orbitLayout,
  timeX: timeEmbedX,
  ring: ringLayout,
  timeY: timeEmbedY,
  tree: treeLayout
};

// this is imported into the reducer and used to order the layouts
export const graphLayouts = ['orbit', 'timeX', 'timeY', 'ring', 'balloon', 'tree'];
