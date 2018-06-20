import React from 'react';

class Header extends React.Component {
  render() {
    return (
      <div className="header" >
        <a href="https://news.ycombinator.com">
          <img src="" className="logo"/>
        </a>
        <div className="site-title">
          Hacker News
        </div>
        {['new', 'comments', 'show', 'ask', 'job', 'submit'].map(link => {
          return <a className="header-link" href={link} key={link}>{link}</a>;
        })}
        <a
          onClick={this.props.toggleGraphLayout}
          className="header-link">Toggle Graph Layout</a>
        <a> login</a>
      </div>
    );
  }
}

export default Header;
