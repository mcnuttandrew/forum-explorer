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
    const {histogram, setTimeFilter} = this.props;
    const totalComments = histogram.reduce((acc, {y}) => acc + y, 0);
    const maxComments = histogram.reduce((acc, {y}) => Math.max(acc, y), 0);
    const binWidth = histogram[0].x - histogram[0].x0;
    const binMin = histogram[0].x0;
    return (
      <XYPlot height={50} width={165}
        margin={{
          top: 0,
          right: 0,
          left: 15,
          bottom: 10
        }}
        onMouseLeave={() => {
          this.setState({hoveredRow: false});
          setTimeFilter({min: 0, max: 0});
        }}
        xDomain={[
          binMin - binWidth / 2,
          histogram[histogram.length - 1].x
        ]}>

        <XAxis tickFormat={timeSince} tickTotal={3}/>
        <VerticalRectSeries
          data={histogram}
          getColor={({x0}) => x0 === hoveredRow.x0 ? '#ff6600' : 'rgb(215, 205, 190)'}
          colorType="literal"/>
        <VerticalRectSeries
          onValueMouseOver={(row) => {
            this.setState({hoveredRow: row});
            setTimeFilter({min: row.x0, max: row.x});
          }}
          data={histogram}
          opacity={0}
          getY={d => maxComments}
          colorType="literal"/>
        <LabelSeries style={{pointerEvents: 'none'}}
          data={[{
            x: binWidth * 2 + binMin,
            y: 0,
            label: `${hoveredRow ? hoveredRow.y : totalComments}`,
            style: {
              fontSize: 32,
              dominantBaseline: 'auto',
              opacity: 0.4
            }
          }, {
            x: binWidth * 2 + binMin,
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
