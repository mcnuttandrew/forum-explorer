import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import AppState from './reducers/index';

import './stylesheets/main.css';
import Root from './components/root.js';

const extensionContainer = document.createElement('div');
extensionContainer.setAttribute('id', 'extension-container');
document.querySelector('body').appendChild(extensionContainer);
const center = document.querySelector('center');
if (center) {
  center.remove();
}

ReactDOM.render(
  <Provider store={AppState}>
    <Root/>
  </Provider>, 
  document.querySelector('#extension-container')
);
