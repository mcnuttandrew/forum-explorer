import React from 'react';
import StoryHead from './story-head';
import SearchBox from './search-box';
import {getSelectedOption} from '../utils';

class SecondaryHeader extends React.Component {
  render() {
    const {
      configs,
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
    return (
      <div className="secondary-header background-gray flex" >
        <StoryHead
          setSelectedCommentPath={setSelectedCommentPath}
          itemPath={itemPath}
          storyHead={storyHead}
          unlockAndSearch={unlockAndSearch}
          serializedModel={serializedModel}/>
        <div >

          {colorByTopUsers && <div className="top-posters">
            <span>{'Top Posters (click to search)'}</span>
            <div className="flex">
              {Object.entries(topUsers).map(d => {
                return (
                  <span
                    onClick={() => unlockAndSearch(d[0])}
                    className={`top-poster-${d[1].rank}`}
                    key={d[0]}>{d[0]} - {d[1].numPosts} posts</span>
                );
              })}
            </div>
          </div>}
          <SearchBox setSearch={setSearch} searchValue={searchValue}/>
        </div>
      </div>
    );
  }
}

export default SecondaryHeader;
