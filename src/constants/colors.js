import {computeOver} from 'hex-over';

const PAIRS = [
  {fill: '#a6cee3', stroke: 'white'},
  {fill: '#1f78b4', stroke: 'white'},
  {fill: '#b2df8a', stroke: 'white'},
  {fill: '#33a02c', stroke: 'white'},
  {fill: '#fb9a99', stroke: 'white'},
  {fill: '#e31a1c', stroke: 'white'},
  {fill: '#fdbf6f', stroke: 'white'},
  {fill: '#ff7f00', stroke: 'white'},
  {fill: '#cab2d6', stroke: 'white'},
  {fill: '#6a3d9a', stroke: 'white'},
  {fill: '#b15928', stroke: 'white'},
  {fill: '#ffff99', stroke: 'black'}
];

export const NODE_COLOR = '#999';
export const NODE_COLOR_UNDER_OPACITY = computeOver('#999', '#f6f6f0', 0.4);
export const COLORS = PAIRS.map(({fill}) => fill);
export const STROKES = PAIRS.map(({stroke}) => stroke);
export const COLORS_UNDER_OPACITY = COLORS.map(color => computeOver(color, '#f6f6f0', 0.4));
