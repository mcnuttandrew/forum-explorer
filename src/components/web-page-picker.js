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

export default class WebPagePicker extends React.Component {
  constructor() {
    super();
    this.state = {
      error: false
    };
  }

  render() {
    const {getAllItems, setPageId} = this.props;
    const {error} = this.state;
    return (
      <div>
        WEB PAGE PICKER
        <div>
          <div> Examples </div>
          {examplePages.map(({id, title, by, time, score}, idx) => {
            return (<div className="margin-bottom" key={idx}>
              <div className="comment-title">
                <a onClick={d => {
                  setPageId(id);
                  getAllItems(id);
                }}>
                  {title}
                </a>
              </div>
              <div className="comment-head">
                <span>{`${score} points by `}</span>
                <a href={`https://news.ycombinator.com/user?id=${by}`}>{by}</a>
                <span>{` ${timeSince(time)} ago`}</span>
              </div>

            </div>);
          })}
        </div>
        <div>
          <div>Paste your own</div>
          <input ref="customInput"/>
          <button
            onClick={d => {
              const id = this.refs.customInput.value;
              fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
                .then(({status}) => {
                  if (status === 200) {
                    setPageId(id);
                    getAllItems(id);
                  } else {
                    this.setState({error: 'invalid id'});
                  }
                })
                .catch(() => this.setState({error: 'invalid id'}));
            }}
            >SUBMIT</button>
          {error && <div>{error}</div>}
        </div>
      </div>
    );
  }
}
