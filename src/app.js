import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import {maybeRefreshDB} from './actions/db';

maybeRefreshDB();

import AppState from './reducers/index';

import '../node_modules/react-vis/dist/style.css';
import './stylesheets/main.css';
import './stylesheets/material-design.css';
import Root from './components/root.js';
import TestOrder from './constants/test-order';

// let givenOrder = [...document.querySelectorAll('.comment-tree .comhead')]
//   .map(el => el.innerText.slice(0, el.innerText.length - 4));

let givenOrder = [...document.querySelectorAll('.comtr')].map(el => {
  const id = el.getAttribute('id');
  const gatheredDetail = {id, upvoteLink: '', replyLink: '', textContent: ''};
  const upvoteLink = el.querySelector('.votelinks a');
  if (upvoteLink) {
    gatheredDetail.upvoteLink = upvoteLink.getAttribute('href');
  }
  const replyLink = el.querySelector('.reply a');
  if (replyLink) {
    gatheredDetail.replyLink = replyLink.getAttribute('href');
  }
  const textContent = el.querySelector('.comment');
  if (textContent) {
    gatheredDetail.textContent = textContent.textContent;
  }
  return gatheredDetail;
});

const userQuery = document.querySelector('#me');
const username = userQuery && userQuery.textContent || null;

const logoutQuery = document.querySelector('#logout');
const logoutLink = logoutQuery && logoutQuery.getAttribute('href') || null;

const topQuery = document.querySelectorAll('.pagetop');
const karmaQuery = topQuery && topQuery.length && (/\((.*)\)/).exec(topQuery[1].textContent);
const karma = karmaQuery && karmaQuery[1] || null;

const extensionContainer = document.createElement('div');
extensionContainer.setAttribute('id', 'root-container');
document.querySelector('body').appendChild(extensionContainer);
const center = document.querySelector('center');
if (center) {
  center.remove();
} else {
  givenOrder = TestOrder;
}

ReactDOM.render(
  <Provider store={AppState}>
    <Root
      foundOrder={givenOrder}
      username={username}
      logoutLink={logoutLink}
      userKarma={karma}/>
  </Provider>,
  document.querySelector('#root-container')
);
