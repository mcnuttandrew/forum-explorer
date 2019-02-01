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
      searchValue
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
        <div className="secondary-header-data-container">
          <div className="flex">
            <Histogram histogram={histogram}/>
            {colorByTopUsers && <div className="top-posters">
              <span>{'Top Posters (click to search)'}</span>
              <div className="flex tile-top-users">
                {Object.entries(topUsers).map(d => {
                  return (
                    <div
                      onClick={() => unlockAndSearch(d[0])}
                      className={`top-poster top-poster-${d[1].rank}`}
                      key={d[0]}>{d[0]}: {d[1].numPosts}</div>
                  );
                })}
              </div>
            </div>}
          </div>
          <SearchBox setSearch={setSearch} searchValue={searchValue}/>
        </div>
      </div>
    );
  }
}

export default SecondaryHeader;
