import React from 'react';
import {timeSince} from '../utils';
import ExpandButton from './expand-button';

export default function StoryHead(props) {
  const {
    setSelectedCommentPath,
    storyHead,
    unlockAndSearch,
    serializedModel
  } = props;
  console.log(JSON.stringify(storyHead.toJS(), null, 2))
  return (<div className="comment-block margin-bottom">
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
      <ExpandButton
        item={storyHead}
        setSelectedCommentPath={setSelectedCommentPath}
        useSpan={true} />
    </div>

  </div>);
}
