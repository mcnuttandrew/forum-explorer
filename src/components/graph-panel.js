import React from 'react';
import ReactDOM from 'react-dom';
import debounce from 'lodash.debounce';

import Graph from './graph';
import TopicBadge from './topic-badge';
import SearchBox from './search-box';
import {getSelectedOption, computeTopUsers} from '../utils';
import {numUsersToHighlight} from '../constants';

class GraphPanel extends React.Component {
  /* eslint-disable no-undef */
  state = {
    height: 0,
    width: 0
  }
  /* eslint-enable no-undef */

  componentDidMount() {
    window.addEventListener('resize', debounce(this.resize.bind(this), 50));
    this.resize();
  }

  resize() {
    const currentNode = ReactDOM.findDOMNode(this.refs.graphPanel);
    this.setState({
      height: currentNode.clientHeight,
      width: currentNode.clientWidth
    });
  }

  render() {
    const {
      configs,
      model,
      setSearch,
      searchValue,
      unlockAndSearch
    } = this.props;

    const showTopics = getSelectedOption(configs, 2) === 'on';
    const modelToMap = showTopics ? (model || []) : [];
    // HACK this should live in the reducer somewhere
    const topUsers = computeTopUsers(this.props.data, numUsersToHighlight);
    const colorByTopUsers = getSelectedOption(configs, 2);
    return (
      <div className="panel relative" ref="graphPanel">
        <div className="flex">
          <SearchBox setSearch={setSearch} searchValue={searchValue}/>
          {modelToMap.map((d, i) => <TopicBadge modelIndex={i} model={d} key={i}/>)}
        </div>
        <Graph
          {...this.props}
          topUsers={topUsers}
          graphLayout={getSelectedOption(configs, 0)}
          markSize={getSelectedOption(configs, 1)}
          height={this.state.height}
          width={this.state.width}
          />
        {colorByTopUsers && <div className="top-posters">
          <span>Top Posters</span>
          {Object.entries(topUsers).map(d => {
            return (
              <span
                onClick={() => unlockAndSearch(d[0])}
                className={`top-poster-${d[1].rank}`}
                key={d[0]}>{d[0]} - {d[1].numPosts} posts</span>
            );
          })}
        </div>}
      </div>
    );
  }
}

export default GraphPanel;
