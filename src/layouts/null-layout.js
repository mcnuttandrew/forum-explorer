import {scaleLinear} from 'd3-scale';
import {linkVertical} from 'd3-shape';
import {xRange, yRange} from '../utils';

// This layout solves a dumb problem that occurs when there are no comments
// in the long run it would be best if this was unnecessary, but is fine for now.
const nullLayout = {
  layout: () => data => ({
    descendants: () => [data],
    links: () => []
  }),
  getXScale: ({width, margin}) => scaleLinear().domain([0, 1]).range(xRange(width, margin)),
  getYScale: ({height, margin}) => scaleLinear().domain([0, 1]).range(yRange(height, margin)),
  positioning: (xScale, yScale) => d => [xScale(0.5), yScale(0.5)],
  path: (xScale, yScale) => linkVertical().x(d => xScale(d.x)).y(d => yScale(d.y)),
  offset: () => ''
};

export default nullLayout;
