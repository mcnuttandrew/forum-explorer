import React from 'react';
import {XYPlot, VerticalRectSeries, XAxis, LabelSeries} from 'react-vis';
import {timeSince} from '../utils';
export default class Histogram extends React.Component {
  constructor() {
    super();
    this.state = {
      hoveredRow: false
    };
  }

  render() {
    const {hoveredRow} = this.state;
    const {histogram} = this.props;
    const totalComments = histogram.reduce((acc, {y}) => acc + y, 0);
    const maxComments = histogram.reduce((acc, {y}) => Math.max(acc, y), 0);
    return (
      <XYPlot height={50} width={165}
        margin={{
          top: 0,
          right: 0,
          left: 15,
          bottom: 10
        }}
        onMouseLeave={() => this.setState({hoveredRow: false})}
        xDomain={[histogram[0].x0, histogram[histogram.length - 1].x]}>

        <XAxis tickFormat={timeSince} tickTotal={3}/>
        <VerticalRectSeries
          onValueMouseOver={(row) => this.setState({hoveredRow: row})}
          data={histogram}
          getColor={({x0}) => x0 === hoveredRow.x0 ? '#ff6600' : 'rgb(215, 205, 190)'}
          colorType="literal"/>
        <LabelSeries style={{pointerEvents: 'none'}}
          data={[{
            x: histogram[2].x,
            y: 0,
            label: `${hoveredRow ? hoveredRow.y : totalComments}`,
            style: {
              fontSize: 32,
              dominantBaseline: 'auto',
              opacity: 0.4
            }
          }, {
            x: histogram[histogram.length - 2].x,
            y: maxComments * 0.6,
            label: hoveredRow ? 'comments' : 'total comments',
            style: {
              fontSize: 12,
              dominantBaseline: 'auto',
              opacity: 0.2
            }
          }
          ]} />

      </XYPlot>
    );
  }
}
