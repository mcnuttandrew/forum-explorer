import hexOver from 'hex-over';

const PAIRS = [
  {fill: '#a6cee3', stroke: '#fff'},
  {fill: '#1f78b4', stroke: '#fff'},
  {fill: '#b2df8a', stroke: '#fff'},
  {fill: '#33a02c', stroke: '#fff'},
  {fill: '#fb9a99', stroke: '#fff'},
  {fill: '#e31a1c', stroke: '#fff'},
  {fill: '#fdbf6f', stroke: '#fff'},
  {fill: '#ff7f00', stroke: '#fff'},
  {fill: '#cab2d6', stroke: '#fff'},
  {fill: '#6a3d9a', stroke: '#fff'},
  {fill: '#b15928', stroke: '#fff'},
  {fill: '#ffff99', stroke: '#000'},
];

const BACKGROUND = '#f6f6f0';
export const OPACITY = 0.2;
export const NODE_COLOR = '#999';
export const NODE_COLOR_UNDER_OPACITY = hexOver(
  NODE_COLOR,
  BACKGROUND,
  OPACITY,
);
export const COLORS = PAIRS.map(({fill}) => fill);
export const STROKES = PAIRS.map(({stroke}) => stroke);
export const COLORS_UNDER_OPACITY = COLORS.map(color =>
  hexOver(color, BACKGROUND, OPACITY),
);
