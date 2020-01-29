import React from 'react';
import {TABLET_MODE_CONFIG} from '../constants';

export default class AboutPage extends React.PureComponent {
  render() {
    const {configs, setShowTour, dataSize} = this.props;
    // figure out if view is at root on forest mode with sufficently large comment chain
    const tabletMode = configs.get(TABLET_MODE_CONFIG) === 'on';
    const noComments = dataSize === 1;
    return (
      <div className="comments-help">
        <h1>Forum Explorer</h1>
        <div>
          Visualize threaded async conversations in new and dynamic ways
        </div>
        {noComments && <h2>{'This thread has no comments!'}</h2>}
        {noComments && <div>{'Pick another thread to visualize!!!!'}</div>}
        <h3>Usage</h3>
        {!tabletMode && (
          <div>
            <div>{'Mouse over graph to select comments'}</div>
            <div>{'Click graph to lock/unlock selection'}</div>
            <div>
              {
                'Click the user names or topics or type in to the search box to search'
              }
            </div>
          </div>
        )}
        {tabletMode && (
          <div>
            <div>{'Touch nodes in the graph to select comments'}</div>
            <div>
              {
                'Click the user names or topics or type in to the search box to search'
              }
            </div>
          </div>
        )}
        <h3>Feedback</h3>
        <div>
          {'Feel free to send any feedback or bug reports on the'}
          <a
            className="feedback-link"
            href="https://github.com/mcnuttandrew/forum-explorer/issues"
          >
            {' '}
            github issues
          </a>
        </div>
        <h3>Wait I'm lost</h3>
        <a className="feedback-link" onClick={setShowTour}>
          Click here to show the tour again
        </a>
      </div>
    );
  }
}
