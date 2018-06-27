import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import AppState from './reducers/index';

import './stylesheets/main.css';
import Root from './components/root.js';
import TestOrder from './constants/test-order';

// let givenOrder = [...document.querySelectorAll('.comment-tree .comhead')]
//   .map(el => el.innerText.slice(0, el.innerText.length - 4));

let givenOrder = [...document.querySelectorAll('.comtr')].map(el => {
  const id = el.getAttribute('id');
  const upvoteLink = el.querySelector('.votelinks a').getAttribute('href');
  const replyLink = el.querySelector('.reply a').getAttribute('href');
  return {id, upvoteLink, replyLink};
});

const extensionContainer = document.createElement('div');
extensionContainer.setAttribute('id', 'extension-container');
document.querySelector('body').appendChild(extensionContainer);
const center = document.querySelector('center');
if (center) {
  center.remove();
} else {
  givenOrder = TestOrder;
}

ReactDOM.render(
  <Provider store={AppState}>
    <Root foundOrder={givenOrder}/>
  </Provider>,
  document.querySelector('#extension-container')
);
