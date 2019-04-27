import React from 'react';
import {timeSince} from '../utils';

const examplePages = [{
  time: 1548796218,
  score: 1320,
  descendants: 675,
  by: 'timebomb0',
  title: 'Instacart paying 80 cents an hour because worker received a large tip',
  id: 19029801
}, {
  time: 1551284990,
  score: 241,
  descendants: 278,
  by: 'thebent',
  title: 'Cancer Complication: Confusing Bills, Maddening Errors And Endless Phone Calls',
  id: 19264243
}, {
  time: 1551274310,
  score: 48,
  descendants: 21,
  by: 'lainon',
  title: 'Why neutrons and protons are modified inside nuclei',
  id: 19263086
}];

function renderPost({id, title, by, time, score, descendants}, idx) {
  return (<div className="margin-bottom" key={idx}>
    <div className="comment-title">
      <a href={`?id=${id}`}>
        {title}
      </a>
    </div>
    <div className="comment-head">
      <span>{`${score} points by `}</span>
      <a href={`https://news.ycombinator.com/user?id=${by}`}>{by}</a>
      <span>{` ${timeSince(time)} ago - ${descendants} comments`}</span>
    </div>

  </div>);
}

export default class WebPagePicker extends React.Component {
  constructor() {
    super();
    this.state = {
      error: false,
      mostRecentPosts: []
    };
  }

  componentDidMount() {
    fetch('https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty')
      .then(d => d.json())
      .then(d => Promise.all(d.map(item =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${item}.json`)
          .then(result => result.json()))
      ))
      .then(mostRecentPosts => this.setState({mostRecentPosts}));
  }

  render() {
    const {error, mostRecentPosts} = this.state;
    return (
      <div className="background-gray picker-container">
        <h2>Forum Explorer</h2>
        <p>{
          /* eslint-disable max-len */
          'This is the demo site for the ForumExplorer project. It provides a principled rethinking of the way in which we interact with async threaded conversations on the internet through the use of visualization. We focus on HackerNews because of its active community and advantageous api.'
        }</p>
        <p>{
          'The normal operation mode for this project is as a chrome extension, but here we present a demo of the functionality. This page is fully functional and presents exactly the same interface as the chrome extension. No personal data is collected: not in the chrome extension, not in this demo page. We use IndexedDB for caching and make use of a cloud micro-service for our topic modeling, but no information is persisted at that location.'
          /* eslint-enable max-len */
        }</p>
        <div>
          <h3> Some Interesting Examples </h3>
          {examplePages.map(renderPost)}
        </div>
        <div>
          <div>
            <h3>Paste your own </h3>
            <h5>(grab just the id from the url of the page you are interested in, eg 19263649)</h5>
          </div>
          <input ref="customInput"/>
          <button
            onClick={d => {
              const id = this.refs.customInput.value;
              fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
                .then(({status}) => {
                  if (status === 200) {
                    window.location.replace(`${window.location.href}?id=${id}`);
                  } else {
                    this.setState({error: 'invalid id'});
                  }
                })
                .catch(() => this.setState({error: 'invalid id'}));
            }}
            >SUBMIT</button>
          {error && <div>{error}</div>}
        </div>
        <div>
          <h3>Most recent posts </h3>
          {mostRecentPosts.length !== 0 && <div className="most-recent-posts">
            {mostRecentPosts.map(renderPost)}
          </div>}
          {!mostRecentPosts.length && <div>
            {'  Loading'}
          </div>}
        </div>
      </div>
    );
  }
}
