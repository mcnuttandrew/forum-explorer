import React from 'react';

import Histogram from './histogram';
import StoryHead from './story-head';
import SearchBox from './search-box';
import {getSelectedOption} from '../utils';

class SecondaryHeader extends React.Component {
  render() {
    const {
      configs,
      histogram,
      topUsers,
      setSelectedCommentPath,
      itemPath,
      storyHead,
      unlockAndSearch,
      serializedModel,
      setSearch,
      setTimeFilter,
      searchValue,
      showData
    } = this.props;
    const colorByTopUsers = getSelectedOption(configs, 2);
    if (!storyHead) {
      return <div />;
    }
    return (
      <div className="secondary-header background-gray flex" >
        <StoryHead
          setSelectedCommentPath={setSelectedCommentPath}
          itemPath={itemPath}
          storyHead={storyHead}
          unlockAndSearch={unlockAndSearch}
          serializedModel={serializedModel}/>
        {showData && <div className="secondary-header-data-container">
          <div className="flex">
            <Histogram histogram={histogram} setTimeFilter={setTimeFilter}/>
            {colorByTopUsers && <div className="top-posters">
              <span>{'Top Posters (click to search)'}</span>
              <div className="flex tile-top-users">
                {Object.entries(topUsers).map(d => {
                  return (
                    <div
                      onClick={() => unlockAndSearch(d[0])}
                      className="top-poster" key={d[0]}>
                      <div
                        className={`top-poster-card top-poster-${d[1].rank}`}
                        >{d[1].numPosts}</div>
                      <div>{d[0]}</div>
                    </div>
                  );
                })}
              </div>
            </div>}
          </div>
          <SearchBox setSearch={setSearch} searchValue={searchValue}/>
        </div>}
        {!showData && <div className="secondary-header-data-container">
          {'No comments on this post'}
        </div>}
      </div>
    );
  }
}

export default SecondaryHeader;
