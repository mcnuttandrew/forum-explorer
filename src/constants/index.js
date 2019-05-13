import {graphLayouts} from '../layouts';
import EnvironmentConfig from './environment-configs';
export const DEV_MODE = EnvironmentConfig.DEV_MODE;
export const SERVER_DEV_MODE = EnvironmentConfig.SERVER_DEV_MODE;
export const WEB_PAGE_MODE = EnvironmentConfig.WEB_PAGE_MODE;
export const SHOW_LOGS = EnvironmentConfig.SHOW_LOGS;

export const numUsersToHighlight = 12;

export const STUMP_PRUNE_THRESHOLD = 30;
export const CHILD_THRESHOLD = 15;

export const GRAPH_LAYOUT_CONFIG = 'graph layout';
export const DOT_SIZE_CONFIG = 'dot size';
export const LEAF_SQUARE_CONFIG = 'leafs as squares';
export const TABLET_MODE_CONFIG = 'tablet mode';
export const SHOW_ALL_COMMENTS = 'show all comments';

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
    defaultOption: ('ontouchstart' in document.documentElement) ? 'on' : 'off'
  },
  {
    name: SHOW_ALL_COMMENTS,
    options: ['smart defaults', 'on', 'off'],
    defaultOption: 'smart defaults'
  }
].map(({name, options, defaultOption}) => ({
  name,
  options: options.map(val => ({name: val, selected: val === defaultOption}))
}));

export const TOUR_STEPS = [{
  target: '#graph-panel',
  content: `
  This panel shows the comment graph for the thread you are currently viewing.
  Comments are selected by hovering over them. You can lock the current selection by clicking.

  In the default Forest View large conversations are pulled of off the main node and
  presented as their seperate trees.`
}, {
  target: '#comment-panel',
  content: `
  This is the comment panel, it shows currently selected comments.
  You can change the current selection either by clicking on the comment or on the
  expand link at the bottom of each comment.
  You can also zoom into a subtree by clicking visualize subthread.`
}, {
  target: '.story-head-content-container',
  content: `
  This is the story head, in addition to a link to the article and other metadata,
  it includes summaries of what people are talking about. You can click on these tags
  to search for that term in the thread.`
}, {
  target: '.secondary-header-data-container',
  content: `
  This legend shows the most freqeuent commenters (they're clickable!),
  a histogram of the conversation over time (it's mouseoverable!),
  and a free-text search box.`
}, {
  target: '#settings-link',
  content: `
  This is the settings widget, you can use it to change the type of tree being used
  and a variety of other minor UI tweeks.`
}];
