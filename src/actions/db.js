import {get, set, clear} from 'idb-keyval';
import Manifest from '../../manifest.json';
import {log, prepareTree} from '../utils';

const recursivelyFind = id => get(Number(id))
  .then(d => typeof d === 'number' ? recursivelyFind(d) : d);

function computeNodesInSubtree(tree, initId) {
  const mapOfAllowedIds = {};
  let depthOfRoot = 0;
  function dfsAndMarkId({children, id, depth}, parentIsInTree) {
    const nodeId = `${id}`;

    if (parentIsInTree || (nodeId === `${initId}`)) {
      mapOfAllowedIds[nodeId] = true;
    }
    if ((nodeId === `${initId}`)) {
      depthOfRoot = depth;
    }
    (children || []).forEach(child => dfsAndMarkId(child, mapOfAllowedIds[nodeId]));
  }
  dfsAndMarkId(tree, false);
  return {mapOfAllowedIds, depthOfRoot};
}

export function getTreeForId(initId) {
  return recursivelyFind(initId)
    .then(result => {
      // if there was a cache miss then dont do anything
      if (typeof result !== 'object') {
        return result;
      }
      // prepare a tree to parse to across of the cache hit
      const tree = prepareTree(result, initId);
      // do a DFS across this tree and mark which nodes are in the sub tree
      const {depthOfRoot, mapOfAllowedIds} = computeNodesInSubtree(tree, initId);
      // filter them and adjust their height as appropriate
      return result
        .filter(({id}) => mapOfAllowedIds[id])
        .map(d => ({...d, depth: d.depth - depthOfRoot}));
    });
}

export function updateIdInDb(id, data) {
  set(Number(id), data);
  data.forEach(row => {
    if (Number(row.id) === Number(id)) {
      return;
    }
    if (!row.id) {
      return;
    }
    set(Number(row.id), Number(id));
  });
}

export function maybeRefreshDB() {
  const currentVersion = Manifest.version;
  // check for a version number in the db
  get('db-version')
    .then(result => {
      // if one is not present then set the current one
      if (!result) {
        log('no version found, setting');
        return set('db-version', currentVersion);
      }
      // if one is present and it's the same as the current one take no action
      if (result === currentVersion) {
        log('up to date');
        return;
      }
      // if one is present and it's different then flash the database and refresh the page
      if (result !== currentVersion) {
        log('version mismatch, reset', result, currentVersion);
        clear()
          .then(() => set('db-version', currentVersion))
          .then(() => location.reload());
      }
      // unclear what an else branch would mean
      log('else branch', result, currentVersion);
      return;
    });
}

// these two functions are used for caching the the front page items
export function getPageSingleItems(ids) {
  return Promise.all(ids.map(id => get(`${id}-single`)))
    .then(results => results.filter(d => d));
}

export function setPageSingleItems(data) {
  return Promise.all(data.map(row => set(`${row.id}-single`, row)));
}
