import {get, set, clear} from 'idb-keyval';
import Manifest from '../../manifest.json';
import {log} from '../utils';

export function getTreeForId(initId) {
  function recursivelyFind(id) {
    return get(Number(id))
    .then(result => {
      const dataType = typeof result;
      switch (dataType) {
      case 'number':
        return getTreeForId(result);
      case 'object':
      default:
        return result;
      }
    });
  }
  return recursivelyFind(initId);
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
