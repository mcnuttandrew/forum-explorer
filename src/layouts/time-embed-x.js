import {tree} from 'd3-hierarchy';
import {linkHorizontal} from 'd3-shape';
import {scaleLinear, scalePow} from 'd3-scale';
import {getDomain, xRange, yRange} from '../utils';

const getX = d => d.data.time || d.data.data.time;
const getY = d => d.y;

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

    const {xMin, xMax} = getDomain(root, d => {
      return [getX(d), getY(d)];
    });
    const scale = scalePow().exponent(0.5).domain([1, (xMax - xMin)]).range(xRange(width, margin));
    return value => scale(value - xMin + 1);
  },
  getYScale: ({height, margin}, root) => {
    const {yMin, yMax} = getDomain(root, d => [getX(d), getY(d)]);
    return scaleLinear().domain([yMin, yMax]).range(yRange(height, margin));
  },
  positioning: (xScale, yScale) => d => [xScale(getX(d)), yScale(getY(d))],
  path: (xScale, yScale) => linkHorizontal().x(d => xScale(getX(d))).y(d => yScale(getY(d))),
  offset: () => ''
};

export default timeEmbedX;
