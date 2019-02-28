import React from 'react';

import Histogram from './histogram';
import StoryHead from './story-head';
import SearchBox from './search-box';
import {getSelectedOption} from '../utils';
import {COLORS, STROKES} from '../constants/colors';

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
              <div>{'Top Posters (click to search)'}</div>
              <div className="flex tile-top-users">
                {Object.entries(topUsers).map(d => (
                  <div
                    onClick={() => unlockAndSearch(d[0])}
                    className="top-poster" key={d[0]}>
                    <div
                      style={{
                        background: COLORS[d[1].rank],
                        color: STROKES[d[1].rank]
                      }}
                      className="top-poster-card"
                      >{d[1].numPosts}</div>
                    <div>{d[0]}</div>
                  </div>
                ))}
              </div>
              <div style={{background: '#999'}} className="everyone-poster-card">{'Everyone else'}</div>
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
