import {scaleLinear} from 'd3-scale';
import {tree} from 'd3-hierarchy';
import {linkHorizontal} from 'd3-shape';
import {xRange, yRange} from '../utils';

const transposeTreeLayout = {
  layout: () => tree().size([1, 1]),
  getXScale: ({width, margin}) =>
    scaleLinear().domain([0, 1]).range(xRange(width, margin)),
  getYScale: ({height, margin}) =>
    scaleLinear().domain([0, 1]).range(yRange(height, margin)),
  positioning: (xScale, yScale) => d => [xScale(d.y), yScale(d.x)],
  path: (xScale, yScale) => linkHorizontal().x(d => xScale(d.y)).y(d => yScale(d.x)),
  offset: () => ''
};

export default transposeTreeLayout;
