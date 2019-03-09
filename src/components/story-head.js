import React from 'react';
import {timeSince} from '../utils';
import ExpandButton from './expand-button';
import ExternalLink from './icons/external-link';

export default function StoryHead(props) {
  const {
    setSelectedCommentPath,
    storyHead,
    unlockAndSearch,
    serializedModel
  } = props;
  const {
    by,
    url,
    title,
    score,
    time,
    type,
    parent
  } = storyHead.toJS();
  return (<div className="comment-block margin-bottom">
    <div className="comment-title">
      <a href={url}>
        {type === 'comment' ? `Comment by ${by}` : title}
      </a>
      {type === 'comment' && <a href={`?id=${parent}`}>
        <span>{' on Parent Comment'}</span>
        <ExternalLink />
      </a>}
    </div>
    <div className="comment-head">
      <span>Topics: </span>
      {serializedModel.map(keyword => {
        return (<span
          className="comment-keyword"
          onClick={() => unlockAndSearch(keyword)}
          key={keyword}> {keyword} </span>);
      })}
    </div>
    <div className="comment-head">
      {score && <span>{`${score} points by `}</span>}
      <a
        href={`https://news.ycombinator.com/user?id=${by}`}
        >{by}</a>
      <span>
        {` ${timeSince(time)} ago`}
      </span>
      <ExpandButton
        item={storyHead}
        setSelectedCommentPath={setSelectedCommentPath}
        useSpan={true} />
    </div>

  </div>);
}
