import React from 'react';
import Header from './header';
import {
  XYPlot,
  LineSeries,
  XAxis,
  YAxis,
  HorizontalGridLines
} from 'react-vis';
import {SERVER_DEV_MODE} from '../constants/environment-configs';

const ANALYTICS_ROUTE = SERVER_DEV_MODE ?
  'http://localhost:5000/analytics' : 'https://hn-ex.herokuapp.com/analytics';

export default class AnalyticsPage extends React.Component {
  constructor() {
    super();
    this.state = {
      loaded: false,
      models: [],
      visits: [],
      selectedLine: null
    };
  }

  componentDidMount() {
    fetch(ANALYTICS_ROUTE)
      .then(d => d.json())
      .then(({models, visits}) => {
        this.setState({
          models,
          visits,
          loaded: true
        });
      });
  }

  renderMainLineSeries(visits, totalVisit) {
    return (
      <XYPlot
        width={800}
        height={500}
        onMouseLeave={() => this.setState({selectedLine: false})}
        xType="time"

        yType="log">
        <HorizontalGridLines />
        <XAxis />
        <YAxis tickFormat={d => d}/>
        <LineSeries data={totalVisit} />
        {visits.map((row) => {
          return (<LineSeries
            onSeriesMouseOver={() => this.setState({selectedLine: row.itemId})}
            key={row.itemId}
            data={row.time.map((x, y) => ({x, y: y + 1}))} />);
        })}
      </XYPlot>
    );
  }

  renderSelectedLineInfo(selectedLine, visits) {
    const {time, data} = visits;
    const {by, title} = data.item || ({by: null, title: null});
    return (
      <div className="flex-down">
        <div>{`${title ? `${title} (${selectedLine})` : `${selectedLine}`}: ${time.length} visits`}</div>
        <div>{by && `Author ${by}`}</div>
      </div>
    );
  }

  render() {
    const {loaded, models, visits, selectedLine} = this.state;
    if (!loaded) {
      return <div>loading</div>;
    }
    const totalVisit = visits
      .reduce((acc, row) => acc.concat(row.time), []).sort().map((x, y) => ({x, y: y + 1}));
    return (
      <div className="flex-down full-size">
        <div className="background-gray picker-container">
          <div className="flex-down">
            <Header />
            <h3>ANALYTICS PAGE</h3>
            <h5>Metrics are purely collected from the server side.</h5>
            <div className="flex">
              <div className="flex-down">
                <h3> {`Cached models: ${models.length}`} </h3>
                <h3> {`Visits total: ${totalVisit.length}`} </h3>
                {this.renderMainLineSeries(visits, totalVisit)}
              </div>
            </div>
            {selectedLine &&
              this.renderSelectedLineInfo(selectedLine, visits.find(row => row.itemId === selectedLine))}
          </div>
        </div>
      </div>
    );
  }
}
