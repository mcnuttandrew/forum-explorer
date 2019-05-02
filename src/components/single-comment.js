import React from 'react';
import {classnames, timeSince, getSelectedOption} from '../utils';
import {COLORS, STROKES} from '../constants/colors';
import {TABLET_MODE_CONFIG, WEB_PAGE_MODE} from '../constants/index';
const createMarkup = __html => ({__html});

export default function renderComment(props, item, idx) {
  const {
    configs,
    getItemsFromCacheOrRedirect,
    hoveredComment,
    setHoveredComment,
    setSelectedCommentPathWithSelectionClear,
    unlockAndSearch,
    topUsers
  } = props;
  /* eslint-disable react/no-danger */
  const hasChildren = item.get('kids') && item.get('kids').size;
  const userName = item.get('by');
  const userRank = topUsers[userName];
  const isRoot = Number(item.get('id')) === props.pageId;
  // over counts self
  const numDesc = item.get('descendants') - 1;
  const disallowLock = getSelectedOption(configs, TABLET_MODE_CONFIG) === 'on';
  return (
    <div
      ref={`item${item.get('id')}`}
      onMouseEnter={() => setHoveredComment(item)}
      onMouseLeave={() => setHoveredComment(null)}
      key={idx}
      style={{marginLeft: 20 * ((item.get('depth') || 1) - 1)}}
      className={
        classnames({
          'comment-block': true,
          'root-comment': isRoot
        })
      }>
      <div className="comment-head flex">
        {!WEB_PAGE_MODE && <a
          className="up-arrow"
          onClick={() => {
            fetch(`https://news.ycombinator.com/${item.get('upvoteLink')}`, {
              method: 'GET'
            });
          }}
          >
          {'▲ '}
        </a>}
        <a
          href={`https://news.ycombinator.com/user?id=${userName}`}
          >{userName}</a>
        {userRank && <div className="top-poster-id" style={{
          background: COLORS[userRank.rank],
          color: STROKES[userRank.rank]
        }} />}
        <div className="hover-tooltip margin-right">
          <div className="hover-rel-container" >
            <span className="search-user" onClick={() => unlockAndSearch(userName)}>
              <i className="material-icons">perm_identity</i>
            </span>
          </div>
          <span className="tooltiptext">search for user</span>
        </div>
        <div className="hover-tooltip">
          <a onClick={() => getItemsFromCacheOrRedirect(item.get('id'))}>
            <span>{` ${timeSince(item.get('time'))} ago`}</span>
            <span className="search-user" >
              <i className="material-icons">launch</i>
            </span>
          </a>
          <span className="tooltiptext">visualize subthread</span>
        </div>
      </div>
      {isRoot && <div className="root-label comment-head">ROOT COMMENT</div>}
      <div
        onClick={e => {
          if (disallowLock) {
            return;
          }
          // enable users to click links with out trigger selection update
          const tagName = e.target.tagName;
          const bannedTags = {A: true};
          if (bannedTags[tagName]) {
            return;
          }
          setSelectedCommentPathWithSelectionClear(`${item.get('id')}`);
        }}
        className={classnames({
          comment: true,
          'hovered-comment': item.get('id') === hoveredComment,
          'comment-no-expand': !hasChildren
        })}
        dangerouslySetInnerHTML={createMarkup(item.get('text'))}/>
      <div className="flex comment-footer">
        <div
          className="expand-comment margin-left"
          onClick={e => setSelectedCommentPathWithSelectionClear(`${item.get('id')}`)}>
          {hasChildren ? `expand (${numDesc} descendant${numDesc > 1 ? 's' : ''})` : ''}
        </div>
        {!WEB_PAGE_MODE && <a
          onClick={e => e.stopPropagation()}
          href={`https://news.ycombinator.com/${item.get('replyLink')}`}
          className="expand-comment">
          reply
        </a>}
      </div>
    </div>);
    /* eslint-enable react/no-danger */
}
