import React from 'react';
import {WEB_PAGE_MODE, CONFIG_OPTIONS} from '../constants';
import {classnames} from '../utils';

function tooltip(configs, setConfig, toggleTooltip) {
  return (
    <div className="tooltip">
      <div className="tooltip-header">
        <div className="tooltip-close" onClick={toggleTooltip}>
          X
        </div>
      </div>
      {CONFIG_OPTIONS.map((row, rowIdx) => {
        const rowName = row.name;
        return (
          <div className="tooltip-row" key={rowName}>
            <div className="tooltip-row-name">{rowName}</div>
            <div className="tooltip-row-options-container">
              {row.options.map(option => {
                return (
                  <div
                    key={`${option}-${rowName}`}
                    className={classnames({
                      'tooltip-row-option': true,
                      'tooltip-row-option-selected':
                        configs.get(rowName) === option,
                    })}
                    onClick={() => setConfig(rowName, option)}
                  >
                    {option}
                  </div>
                );
              })}
            </div>
          </div>
        );
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
    {name: 'submit'},
  ];

  const webPageModeLinks = [
    {name: 'home', link: '/'},
    {name: 'github', link: 'https://github.com/mcnuttandrew/forum-explorer'},
  ];

  return (WEB_PAGE_MODE ? webPageModeLinks : regularLinks)
    .filter(d => d)
    .map(({name, link}) => {
      const url = link || name;
      return (
        <a className="header-link" href={url} key={url}>
          {name}
        </a>
      );
    });
}

class Header extends React.Component {
  constructor() {
    super();
    this.state = {
      tooltipOpen: false,
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
      configs,
    } = this.props;

    const toggleTooltip = () => this.setState({tooltipOpen: !tooltipOpen});
    const isExtension = location.origin === 'https://news.ycombinator.com';
    const returnLink = isExtension
      ? 'https://news.ycombinator.com/news'
      : 'https://www.mcnutt.in/forum-explorer/';
    return (
      <div className="header">
        <a href={returnLink}>
          <img src="https://news.ycombinator.com/y18.gif" className="logo" />
        </a>
        <a href={returnLink} className="header-link site-title">
          {isExtension ? 'HackerNews' : 'FeX: ForumExplorer'}
        </a>
        {headerLinks(username)}
        <a id="settings-link" onClick={toggleTooltip}>
          settings
        </a>
        {tooltipOpen && (
          <div onClick={toggleTooltip} className="tooltip-background" />
        )}
        {tooltipOpen && (
          <div className="tooltip-container">
            {tooltip(configs, setConfig, toggleTooltip)}
          </div>
        )}
        {!WEB_PAGE_MODE && (
          <div className="right-links-container">
            {username ? (
              <div>
                <a
                  className="header-link"
                  href={`https://news.ycombinator.com/user?id=${username}`}
                >{`${username} (${userKarma})`}</a>
                <a href={logoutLink} className="header-link">
                  logout
                </a>
              </div>
            ) : (
              <a
                className="header-link"
                href={`https://news.ycombinator.com/login?goto=item%3Fid%3D${rootId}`}
              >
                login
              </a>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default Header;
