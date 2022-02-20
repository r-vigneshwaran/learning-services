import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import AuthApp from './AuthApp';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';

ReactDOM.render(
  <BrowserRouter>
    <Auth0Provider
      domain="e-gaudi.us.auth0.com"
      clientId="tSJLnjuwjZ2O1KwMC95H4T6GbGr2vs07"
      redirectUri={window.location.origin}
      audience="learning-auth0"
      scope="openid profile email"
    >
      <AuthApp />
    </Auth0Provider>
  </BrowserRouter>,
  document.getElementById('root')
);
