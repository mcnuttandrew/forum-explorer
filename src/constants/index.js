import {graphLayouts} from '../layouts';
export const DEV_MODE = false;
export const SERVER_DEV_MODE = false;
export const WEB_PAGE_MODE = false;
export const SHOW_LOGS = false;

export const numUsersToHighlight = 12;

export const STUMP_PRUNE_THRESHOLD = 30;
export const CHILD_THRESHOLD = 15;

export const GRAPH_LAYOUT_CONFIG = 'graph layout';
export const DOT_SIZE_CONFIG = 'dot size';
export const LEAF_SQUARE_CONFIG = 'leafs as squares';
export const TABLET_MODE_CONFIG = 'tablet mode';

export const DEFAULT_CONFIGS = [
  {
    name: GRAPH_LAYOUT_CONFIG,
    options: graphLayouts,
    defaultOption: 'forest'
  },
  {
    name: DOT_SIZE_CONFIG,
    options: ['small', 'medium', 'large'],
    defaultOption: 'medium'
  },
  // {
  //   name: 'color by',
  //   options: ['nothing', 'top-users'],
  //   defaultOption: 'top-users'
  // },
  // {
  //   name: 'show graph',
  //   options: ['on', 'off'],
  //   defaultOption: 'on'
  // },
  {
    name: LEAF_SQUARE_CONFIG,
    options: ['on', 'off'],
    defaultOption: 'on'
  },
  {
    name: TABLET_MODE_CONFIG,
    options: ['on', 'off'],
    defaultOption: 'off'
  }
].map(({name, options, defaultOption}) => ({
  name,
  options: options.map(val => ({name: val, selected: val === defaultOption}))
}));
