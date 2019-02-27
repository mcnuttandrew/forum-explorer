import React from 'react';

export default function ExpandButton({
  item, 
  setSelectedCommentPath, 
  useSpan
}) {
  if (!(item.get('kids') && item.get('kids').size)) {
    return useSpan ? <span /> : <div />;
  }
  const props = {
    onClick: e => setSelectedCommentPath(`${item.get('id')}`),
    className: 'expand-comment margin-left'
  };
  return useSpan ? <span {...props}>expand</span> : <div {...props}>expand</div>;
};
