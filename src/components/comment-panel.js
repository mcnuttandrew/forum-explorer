import React from 'react';
import {getSelectedOption} from '../utils';
import {GRAPH_LAYOUT_CONFIG, STUMP_PRUNE_THRESHOLD} from '../constants';
import SingleComment from './single-comment';

/* eslint-disable max-len */
const longPruneExplanation = 'For particularly large conversations we remove single comments from the graph view for legibility, but the are still around!';
/* eslint-enable max-len */

class CommentPanel extends React.PureComponent {
  componentDidUpdate(prevProps) {
    const {hoveredGraphComment} = this.props;
    if (hoveredGraphComment && hoveredGraphComment !== prevProps.hoveredGraphComment) {
      const target = this.refs[`item${hoveredGraphComment}`];
      if (!target) {
        return;
      }
      target.scrollIntoView();
    }
  }

  render() {
    const {itemsToRender, configs} = this.props;
    const data = itemsToRender
      .filter(item => item.get('type') !== 'story' || item.get('text'));
      // figure out if view is at root on forest mode with sufficently large comment chain
    const isForest = getSelectedOption(configs, GRAPH_LAYOUT_CONFIG) === 'forest';
    const singleComments = data.filter(d => !d.get('descendants'));
    const viewingRoot = data.every(d => d.get('depth') === 0 || d.get('depth') === 1);
    const splitComments = isForest && (singleComments.size > STUMP_PRUNE_THRESHOLD) && viewingRoot;
    // if its not behave as normal
    // if it is, then grab all the single comments and the branch comments, separate them
    const buildComment = (item, idx) => (SingleComment(this.props, item, idx));
    return (
      <div className="overflow-y panel" ref="commentPanel">
        {!itemsToRender.size && <div
          className="comments-help">
          <h1>Forum Explorer</h1>
          <div>Visualize threaded async conversations in new and dynamic ways</div>
          <h3>Usage</h3>
          <div>{'Mouse over graph to select comments'}</div>
          <div>{'Click graph to lock/unlock selection'}</div>
          <div>{'Click the user names or topics or type in to the search box to search'}</div>
          <h3>Feedback</h3>
          <div>{'Feel free to send any feedback or bug reports on the'}
            <a
              className="feedback-link"
              href="https://github.com/mcnuttandrew/forum-explorer/issues"> github issues</a>
          </div>
        </div>}
        {!splitComments && data.map(buildComment)}
        {splitComments && <div className="comment-root-prune-explanation">
          <h3>{'Branched Conversation'}</h3>
          <h5>
            {longPruneExplanation}
            Scroll down or click <a
              className="expand-comment"
              onClick={d => this.refs.singleComments.scrollIntoView()}>here.</a>
          </h5>
        </div>}
        {splitComments && data.filter(d => d.get('descendants')).map(buildComment)}
        {splitComments && <div
          ref="singleComments"
          className="comment-root-prune-explanation single-comments-division margin-top-huge">
          <h3>{'Single Comments'}</h3>
        </div>}
        {splitComments && singleComments.map(buildComment)}
      </div>
    );
  }
}

export default CommentPanel;
