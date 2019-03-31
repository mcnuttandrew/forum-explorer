import {get, set} from 'idb-keyval';

export function getTreeForId(id) {
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
