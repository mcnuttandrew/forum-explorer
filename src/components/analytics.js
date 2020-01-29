import React from 'react';
import Header from './header';
import {
  XYPlot,
  LineSeries,
  XAxis,
  YAxis,
  HorizontalGridLines,
  VerticalBarSeries
} from 'react-vis';
import {SERVER_DEV_MODE} from '../constants/environment-configs';

const ANALYTICS_ROUTE = SERVER_DEV_MODE ?
  'http://localhost:5000/analytics' : 'https://hn-ex.herokuapp.com/analytics';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function roundDate(ts){
    let timeStamp = ts;
    // subtract amount of time since midnight
    timeStamp -= timeStamp % (24 * 60 * 60 * 1000); 
    // add on the timezone offset
    timeStamp += new Date().getTimezoneOffset() * 60 * 1000; 
    return (new Date(timeStamp)).getTime();
}

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
        const totalVisit = visits
          .reduce((acc, row) => acc.concat(row.time), []).sort().map((x, y) => ({x, y: y + 1}));
        this.setState({
          models,
          visits,
          loaded: true,
          byDay: Object.entries(totalVisit.reduce((acc, row) => {
            const newTs = roundDate(row.x);
            acc[newTs] = (acc[newTs] || 0) + 1;
            return acc;
          }, {})).sort(([a], [b]) => a - b).map(([x, y]) => ({x: Number(x), y})),
          totalVisit
        });
      });
  }

  renderMainLineSeries(visits, totalVisit) {
    const earliestVisit = totalVisit[0].x;
    const currentTime = new Date().getTime();
    const showTotal = false;
    return (
      <XYPlot
        width={800}
        height={500}
        onMouseLeave={() => this.setState({selectedLine: false})}
        xType="time"
        xDomain={[earliestVisit, currentTime]}
        yType="log">
        <HorizontalGridLines />
        <XAxis />
        <YAxis tickFormat={d => d}/>
        {showTotal && <LineSeries data={totalVisit} />}
        {visits
          .filter(row => row.time[0] > (earliestVisit + 0.5 * DAY))
          .map((row) => {
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
    const {loaded, models, visits, selectedLine, byDay, totalVisit} = this.state;
    if (!loaded) {
      return <div>loading</div>;
    }

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
                <XYPlot height={300} width={500} xType="time">
                  <XAxis />
                  <YAxis />
                  <VerticalBarSeries data={byDay}/>
                </XYPlot>
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
