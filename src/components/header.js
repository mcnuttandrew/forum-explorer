import React from 'react';

class Header extends React.Component {
  render() {
    const {
      rootId,
      username,
      toggleGraphLayout,
      logoutLink,
      userKarma
    } = this.props;

    return (
      <div className="header" >
        <a href="https://news.ycombinator.com">
          <img src="y18.gif" className="logo"/>
        </a>
        <a
          href="https://news.ycombinator.com/news"
          className="header-link site-title">Hacker News</a>
        {['new', 'comments', 'show', 'ask', 'job', 'submit'].map(link => {
          return <a className="header-link" href={link} key={link}>{link}</a>;
        })}
        <a
          onClick={toggleGraphLayout}
          className="header-link">change graph</a>
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
