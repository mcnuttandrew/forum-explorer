import {scaleLinear} from 'd3-scale';
import {tree} from 'd3-hierarchy';
import {getDomain, xRange, yRange, radialToCartesian} from '../utils';

export const ringLayout = {
  layout: () => tree().size([2 * Math.PI, 1])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth),

  getXScale: ({width, margin}, root) => {
    const {xMin, xMax} = getDomain(root, d => radialToCartesian(d.x, d.y));
    return scaleLinear().domain([xMin, xMax]).range(xRange(width, margin));
  },
  getYScale: ({height, margin}, root) => {
    const {yMin, yMax} = getDomain(root, d => radialToCartesian(d.x, d.y));
    return scaleLinear().domain([yMin, yMax]).range(yRange(height, margin));
  },
  positioning: (xScale, yScale) => d => {
    const pos = radialToCartesian(d.x, d.y);
    return [xScale(pos[0]), yScale(pos[1])];
  },
  // linkRadial()
  // .angle(d => d.x)
  // .radius(d => pythag(radialPoint(d.x, d.y)))
  path: (xScale, yScale) => d => {
    const sourcePos = radialToCartesian(d.source.x, d.source.y);
    const targetPos = radialToCartesian(d.target.x, d.target.y);
    return `
    M${xScale(sourcePos[0])} ${yScale(sourcePos[1])}
    L${xScale(targetPos[0])} ${yScale(targetPos[1])}
    `;
  },
  offset: ({width, height}) => ''
  // `translate(${width / 2}, ${height / 2})`
};

export default ringLayout;
