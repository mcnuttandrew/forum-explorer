import {tree} from 'd3-hierarchy';
import {linkHorizontal} from 'd3-shape';
import {scaleLinear, scalePow} from 'd3-scale';
import {getDomain, xRange, yRange} from '../utils';

const timeEmbedX = {
  layout: () => {
    const layout = tree().size([1, 1]);
    return input => {
      const root = layout(input);
      root.descendants().forEach(node => {
        const hold = node.x;
        node.x = node.y;
        node.y = hold;
      });
      return root;
    };
  },
  getXScale: ({width, margin}, root) => {
    const {xMin, xMax} = getDomain(root, d => [d.data.time, d.y]);
    const scale = scalePow().exponent(0.2).domain([1, (xMax - xMin)]).range(xRange(width, margin));
    return value => {
      return scale(value - xMin + 1);
    };
  },
  getYScale: ({height, margin}, root) => {
    const {yMin, yMax} = getDomain(root, d => [d.data.time, d.y]);
    return scaleLinear().domain([yMin, yMax]).range(yRange(height, margin));
  },
  positioning: (xScale, yScale) => d => [xScale(d.data.time), yScale(d.y)],
  path: (xScale, yScale) => linkHorizontal().x(d => xScale(d.data.time)).y(d => yScale(d.y)),
  offset: () => ''
};

export default timeEmbedX;
