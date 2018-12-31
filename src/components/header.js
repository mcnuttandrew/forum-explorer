import React from 'react';
import {classnames} from '../utils';

function tooltip(configs, setConfig, toggleTooltip) {
  return (
    <div
      className="tooltip">
      <div className="tooltip-header">
        <div
          className="tooltip-close"
          onClick={toggleTooltip}>X</div>
      </div>
      {configs.map((row, rowIdx) => {
        return (<div
          className="tooltip-row"
          key={row.get('name')}>
          <div className="tooltip-row-name">{row.get('name')}</div>
          <div className="tooltip-row-options-container">
            {row.get('options').map((option, valueIdx) => {
              return (<div
                key={`${option.get('name')}-${row.get('name')}`}
                className={classnames({
                  'tooltip-row-option': true,
                  'tooltip-row-option-selected': option.get('selected')
                })}
                onClick={() => setConfig(rowIdx, valueIdx)}
                >{option.get('name')}</div>);
            })}
          </div>
        </div>);
      })}
    </div>
  );
}

function headerLinks(username) {
  return [
    {name: 'new', link: 'newest'},
    username ? {name: 'threads', link: `threads?id=${username}`} : false,
    {name: 'comments', link: 'newcomments'},
    {name: 'show'},
    {name: 'ask'},
    {name: 'jobs'},
    {name: 'submit'}
  ]
  .filter(d => d)
  .map(({name, link}) => {
    const url = link || name;
    return <a className="header-link" href={url} key={url}>{name}</a>;
  });
}

class Header extends React.Component {
  /* eslint-disable no-undef */
  state = {
    tooltipOpen: false
  }
  /* eslint-enable no-undef */

  render() {
    const {tooltipOpen} = this.state;
    const {
      rootId,
      username,
      setConfig,
      logoutLink,
      userKarma,
      configs
    } = this.props;

    const toggleTooltip = () => this.setState({tooltipOpen: !tooltipOpen});

    return (
      <div className="header" >
        <a href="https://news.ycombinator.com">
          <img src="y18.gif" className="logo"/>
        </a>
        <a
          href="https://news.ycombinator.com/news"
          className="header-link site-title">Hacker News</a>
        {headerLinks(username)}
        <a onClick={toggleTooltip}>settings</a>
        {tooltipOpen && <div onClick={toggleTooltip} className="tooltip-background" />}
        {tooltipOpen && <div className="tooltip-container">
          {tooltip(configs, setConfig, toggleTooltip)}
        </div>}
        <div className="right-links-container">
          {username ?
            <div>
              <a
                className="header-link"
                href={`https://news.ycombinator.com/user?id=${username}`}
                >{`${username} (${userKarma})`}</a>
              <a
                href={logoutLink}
                className="header-link"
                >logout</a>
            </div> :
            <a
              className="header-link"
              href={`https://news.ycombinator.com/login?goto=item%3Fid%3D${rootId}`}>login</a>
          }
        </div>
      </div>
    );
  }
}

export default Header;
