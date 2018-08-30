import {scaleLinear, scaleLog} from 'd3-scale';
import {tree} from 'd3-hierarchy';
import {linkVertical} from 'd3-shape';
import {getDomain, xRange, yRange} from '../utils';

const timeEmbedY = {
  layout: () => tree().size([1, 1]),
  getXScale: ({width, margin}, root) => {
    const {xMin, xMax} = getDomain(root, d => [d.x, d.data.time]);
    return scaleLinear().domain([xMin, xMax]).range(xRange(width, margin));
  },
  getYScale: ({height, margin}, root) => {
    const {yMin, yMax} = getDomain(root, d => [d.x, d.data.time]);
    return scaleLog().domain([yMin, yMax]).range(yRange(height, margin));
  },
  positioning: (xScale, yScale) => d => [xScale(d.x), yScale(d.data.time)],
  path: (xScale, yScale) => linkVertical().x(d => xScale(d.x)).y(d => yScale(d.data.time)),
  offset: () => ''
};

export default timeEmbedY;
