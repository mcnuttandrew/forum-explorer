import Immutable from 'immutable';
import {hierarchy} from 'd3-hierarchy';
import {voronoi} from 'd3-voronoi';

import {getSelectedOption} from './utils';
import {GRAPH_LAYOUT_CONFIG} from './constants/index';

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
  // time layouts are currently busted
  // 'timeX',
  // 'timeY',
  // orbit and bloon are not good enough for release
  // 'orbit',
  // 'balloon',
  'gridTree',
  'forest'
];

export const computeGraphLayout = state => {
  const useNullLayout = state.get('data').size <= 1;
  const graphLayout = getSelectedOption(state.get('configs'), GRAPH_LAYOUT_CONFIG);
  const {height, width} = state.get('graphPanelDimensions').toJS();
  const tree = state.get('tree');
  if (!tree) {
    return {descendants: () => [], links: () => []};
  }
  const usedLayout = layouts[useNullLayout ? 'null' : graphLayout];
  const treeEval = usedLayout.layout({height, width}, state.get('branchModel').toJS());
  const preppedTree = usedLayout.preheirarchyManipulation ?
    usedLayout.preheirarchyManipulation(Immutable.fromJS(tree).toJS()) : tree;
  // footwork required to address hierarchy weirdness in which data is not seen
  // as something to be preserved and so it can be shoved it a data: {data: } situation
  // after hierarchy traversal. hierarchy is necessary to get the linkages so uhhh don't touch
  const preTree = hierarchy(preppedTree);
  preTree.each(d => {
    d.data = d.data.data;
  });
  return treeEval(preTree);
};

export const computeFullGraphLayout = state => {
  const useNullLayout = state.get('data').size <= 1;
  const graphLayout = getSelectedOption(state.get('configs'), GRAPH_LAYOUT_CONFIG);
  const usedLayout = layouts[useNullLayout ? 'null' : graphLayout];
  const windowProps = {
    margin: {
      top: 20,
      left: 20,
      bottom: 20,
      right: 20
    },
    ...state.get('graphPanelDimensions').toJS()
  };

  const layout = computeGraphLayout(state);
  const xScale = usedLayout.getXScale(windowProps, layout);
  const yScale = usedLayout.getYScale(windowProps, layout);

  const positioning = usedLayout.positioning(xScale, yScale);
  const nodes = layout.descendants();
  const labels = layout.labels && layout.labels() || [];

  // probably could get some speed up by not recomputing the voronoi all the time
  const voronoiEval = voronoi().extent([[0, 0], [windowProps.width + 1, windowProps.height + 1]]);
  const voronois = voronoiEval.polygons(nodes.map(d => [...positioning(d), d])).filter(d => d.length);
  return {
    labels,
    nodes,
    positioning,
    voronois,
    layout,
    xScale,
    yScale
  };
};
