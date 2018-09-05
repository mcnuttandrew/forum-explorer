import {scaleLinear} from 'd3-scale';
import {tree} from 'd3-hierarchy';
import {linkVertical} from 'd3-shape';
import {xRange, yRange} from '../utils';

const treeLayout = {
  layout: () => tree().size([1, 1]),
  getXScale: ({width, margin}) =>
    scaleLinear().domain([0, 1]).range(xRange(width, margin)),
  getYScale: ({height, margin}) =>
    scaleLinear().domain([0, 1]).range(yRange(height, margin)),
  positioning: (xScale, yScale) => d => [xScale(d.x), yScale(d.y)],
  path: (xScale, yScale) => linkVertical().x(d => xScale(d.x)).y(d => yScale(d.y)),
  offset: () => ''
};

export default treeLayout;
