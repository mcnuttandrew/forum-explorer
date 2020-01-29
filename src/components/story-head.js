import React from 'react';
import {timeSince} from '../utils';
import ExpandButton from './expand-button';

export default class StoryHead extends React.PureComponent {
  render() {
    const {
      dataSize,
      getItemsFromCacheOrRedirect,
      setSelectedCommentPath,
      storyHead,
      serializedModel,
      lockAndSearch,
    } = this.props;
    const {by, parent, score, title, time, type, url} = storyHead.toJS();
    return (
      <div className="comment-block margin-bottom story-head-content-container">
        <div className="comment-title">
          <a href={url}>{type === 'comment' ? `Comment by ${by}` : title}</a>
          {type === 'comment' && (
            <a onClick={() => getItemsFromCacheOrRedirect(parent)}>
              <span>{' on Parent Comment. (return parent ↰)'}</span>
            </a>
          )}
        </div>
        <div className="comment-head">
          <span>Topics: </span>
          {serializedModel.length > 0 &&
            serializedModel.map(keyword => {
              return (
                <span
                  className="comment-keyword"
                  onClick={() => lockAndSearch(keyword)}
                  key={keyword}
                >
                  {' '}
                  {keyword}{' '}
                </span>
              );
            })}
          {dataSize > 1 && !serializedModel.length && <span>LOADING</span>}
          {dataSize === 1 && (
            <span>{"Can't model thread, not enough comments"}</span>
          )}
        </div>
        <div className="comment-head">
          {score && <span>{`${score} points by `}</span>}
          <a href={`https://news.ycombinator.com/user?id=${by}`}>{by}</a>
          <span>{` ${timeSince(time)} ago`}</span>
          <ExpandButton
            item={storyHead}
            setSelectedCommentPath={setSelectedCommentPath}
            useSpan={true}
          />
        </div>
      </div>
    );
  }
}
