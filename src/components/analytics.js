import React from 'react';
import Header from './header';
import {XYPlot, LineSeries, XAxis, YAxis, HorizontalGridLines, VerticalBarSeries} from 'react-vis';
import {SERVER_DEV_MODE} from '../constants/environment-configs';

const ANALYTICS_ROUTE = SERVER_DEV_MODE
  ? 'http://localhost:5000/analytics'
  : 'https://hn-ex.herokuapp.com/analytics';

function roundDate(ts) {
  let timeStamp = ts;
  // subtract amount of time since midnight
  timeStamp -= timeStamp % (24 * 60 * 60 * 1000);
  // add on the timezone offset
  timeStamp += new Date().getTimezoneOffset() * 60 * 1000;
  return new Date(timeStamp).getTime();
}

export default class AnalyticsPage extends React.Component {
  constructor() {
    super();
    this.state = {
      loaded: false,
      models: [],
      selectedLine: null,
    };
  }

  componentDidMount() {
    fetch(ANALYTICS_ROUTE)
      .then((d) => d.json())
      .then((models) => {
        const totalVisit = models
          .reduce((acc, row) => acc.concat(row.visits), [])
          .sort()
          .map((x, y) => ({x, y: y + 1}));
        const byDay = Object.entries(
          totalVisit.reduce((acc, row) => {
            const newTs = roundDate(row.x);
            acc[newTs] = (acc[newTs] || 0) + 1;
            return acc;
          }, {}),
        )
          .sort(([a], [b]) => a - b)
          .map(([x, y]) => ({x: Number(x), y}));
        this.setState({
          models,
          loaded: true,
          byDay,
          totalVisit,
        });
      });
  }

  renderMainLineSeries(models, totalVisit) {
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
        yType="log"
      >
        <HorizontalGridLines />
        <XAxis />
        <YAxis tickFormat={(d) => d} />
        {showTotal && <LineSeries data={totalVisit} />}
        {models
          .filter((row) => row.model && row.model[0] && row.model[0].length > 1)
          .map((row) => {
            const coords = row.visits.map((x, y) => ({x, y: y + 1}));
            return (
              <LineSeries
                onSeriesMouseOver={() => this.setState({selectedLine: row.item_id})}
                key={row.item_id}
                data={coords}
              />
            );
          })}
      </XYPlot>
    );
  }

  renderSelectedLineInfo(selectedLine, model) {
    const {visits, data} = model;
    const {by, title} = data || {by: null, title: null};
    return (
      <div className="flex-down">
        <div>{`${title ? `${title} (${selectedLine})` : `${selectedLine}`}: ${visits.length} visits`}</div>
        <div>{by && `Author ${by}`}</div>
      </div>
    );
  }

  render() {
    const {loaded, models, selectedLine, byDay, totalVisit} = this.state;
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
                {byDay.length > 1 && (
                  <XYPlot height={300} width={500} xType="time">
                    <XAxis />
                    <YAxis />
                    <VerticalBarSeries data={byDay} />
                  </XYPlot>
                )}
                {this.renderMainLineSeries(models, totalVisit)}
              </div>
            </div>
            {selectedLine &&
              this.renderSelectedLineInfo(
                selectedLine,
                models.find((row) => row.item_id === selectedLine),
              )}
          </div>
        </div>
      </div>
    );
  }
}
