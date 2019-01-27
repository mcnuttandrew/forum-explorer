import React from 'react';

export function expandCallback(item, itemPath, setSelectedCommentPath) {
  const itemId = `${item.get('id')}`;
  return e => {
    const path = itemPath.reverse().toJS();
    const itemIdx = path.findIndex(id => id === itemId);
    // root
    if (itemIdx === 0) {
      setSelectedCommentPath([itemId]);
      return;
    }
    // leaf
    if (itemIdx === -1) {
      setSelectedCommentPath([itemId].concat(path));
      return;
    }
    // branch
    setSelectedCommentPath(path.reverse().slice(itemIdx));
  };
}

export const expandButton = (item, itemPath, setSelectedCommentPath) =>
  (item.get('kids') && item.get('kids').size && <div
    onClick={expandCallback(item, itemPath, setSelectedCommentPath)}
    className="expand-comment">
    expand
  </div> || <div />);
