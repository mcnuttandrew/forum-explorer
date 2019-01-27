import React from 'react';
import {classnames, timeSince} from '../utils';
import {expandButton} from './expand-button';

export default function StoryHead(props) {
  const {
    setSelectedCommentPath,
    itemPath,
    storyHead,
    unlockAndSearch,
    serializedModel
  } = props;
  return (<div className="comment-block">
    <div className="comment-title">
      <a href={storyHead.get('url')}>
        {storyHead.get('title')}
      </a>
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
      <span>{`${storyHead.get('score')} points by `}</span>
      <a
        href={`https://news.ycombinator.com/user?id=${storyHead.get('by')}`}
        >{storyHead.get('by')}</a>
      <span>
        {` ${timeSince(storyHead.get('time'))} ago`}
      </span>
    </div>
    {expandButton(storyHead, itemPath, setSelectedCommentPath)}
  </div>);
}
