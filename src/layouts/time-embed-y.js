import {scaleLinear, scaleLog} from 'd3-scale';
import {tree} from 'd3-hierarchy';
import {linkVertical} from 'd3-shape';
import {getDomain, xRange, yRange} from '../utils';

const getX = d => d.x;
const getY = d => d.data.time || d.data.data.time;

const timeEmbedY = {
  layout: () => tree().size([1, 1]),
  getXScale: ({width, margin}) =>
    scaleLinear()
      .domain([0, 1])
      .range(xRange(width, margin)),
  getYScale: ({height, margin}, root) => {
    const {yMin, yMax} = getDomain(root, d => [getX(d), getY(d)]);
    const scale1 = scaleLinear()
      .domain([yMin, yMax])
      .range([1, yMax - yMin]);
    const scale2 = scaleLog()
      .domain([1, yMax - yMin])
      .range(yRange(height, margin));
    return x => scale2(scale1(x));
  },
  positioning: (xScale, yScale) => d => [xScale(d.x), yScale(getY(d))],
  path: (xScale, yScale) =>
    linkVertical()
      .x(d => xScale(d.x))
      .y(d => yScale(getY(d))),
  offset: () => '',
};

export default timeEmbedY;
