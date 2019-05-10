import React from 'react';
import {WEB_PAGE_MODE} from '../constants';
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
  const regularLinks = [
    {name: 'new', link: 'newest'},
    username ? {name: 'threads', link: `threads?id=${username}`} : false,
    {name: 'comments', link: 'newcomments'},
    {name: 'show'},
    {name: 'ask'},
    {name: 'jobs'},
    {name: 'submit'}
  ];

  const webPageModeLinks = [
    {name: 'home', link: '/'},
    {name: 'github', link: 'https://github.com/mcnuttandrew/forum-explorer'}
  ];

  return (WEB_PAGE_MODE ? webPageModeLinks : regularLinks)
  .filter(d => d)
  .map(({name, link}) => {
    const url = link || name;
    return <a className="header-link" href={url} key={url}>{name}</a>;
  });
}

class Header extends React.Component {
  constructor() {
    super();
    this.state = {
      tooltipOpen: false
    };
  }

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
          <img src="https://news.ycombinator.com/y18.gif" className="logo"/>
        </a>
        <a
          href={WEB_PAGE_MODE ?
            'https://www.mcnutt.in/forum-explorer/' :
            'https://news.ycombinator.com/news'}
          className="header-link site-title">
          {WEB_PAGE_MODE ? 'FeX: ForumExplorer' : 'HackerNews'}
        </a>
        {headerLinks(username)}
        <a id="settings-link" onClick={toggleTooltip}>settings</a>
        {tooltipOpen && <div onClick={toggleTooltip} className="tooltip-background" />}
        {tooltipOpen && <div className="tooltip-container">
          {tooltip(configs, setConfig, toggleTooltip)}
        </div>}
        {!WEB_PAGE_MODE && <div className="right-links-container">
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
        </div>}
      </div>
    );
  }
}

export default Header;
