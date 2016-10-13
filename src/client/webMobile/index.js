import React from 'react';
import ReactDom from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';

import Store from '../store';

import App from './app';
import Login from './login/login';
import Main from './main/main';
import Linkman from './linkman/linkman';
import Chat from './chat/chat';

ReactDom.render(
    <Provider store={Store}>
        <Router history={browserHistory}>
            <Route path="/" component={App}>
                <IndexRoute component={Login} />
                <Route path="login" component={Login} />
                <Route path="main" component={Main}>
                    <Route path="linkman" component={Linkman} />
                </Route>
                <Route path="chat/:type/:id" component={Chat} />
            </Route>
        </Router>
    </Provider>,
    document.querySelector('#app')
);
