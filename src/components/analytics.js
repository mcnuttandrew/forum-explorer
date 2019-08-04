import React from 'react';

export default class AnalyticsPage extends React.Component {
  constructor() {
    super();
    this.state = {
      loaded: false,
      models: [],
      visits: []
    };
  }

  componentDidMount() {
    // caches results from the front page in IndexedDB, that way subseqeunt visits have faster loadeds
    // first call HN and ask for the top results
    fetch('https://hn-ex.herokuapp.com/analytics')
      .then(d => d.json())
      .then(({models, visits}) => {
        this.setState({models, visits, loaded: true});
      });
  }

  render() {
    const {loaded} = this.state;
    if (!loaded) {
      return <div>loading</div>;
    }
    return (
      <div className="background-gray picker-container">
        <div className="flex-down">
          HELLO!
        </div>
      </div>
    );
  }
}
