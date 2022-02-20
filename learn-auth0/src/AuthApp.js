import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

const AuthApp = () => {
  const {
    loginWithPopup,
    loginWithRedirect,
    logout,
    user,
    isAuthenticated,
    isLoading,
    getAccessTokenSilently
  } = useAuth0();
  const [message, setMessage] = useState('none');

  const get = async () => {
    const res = await axios.get('http://localhost:1234/');
    setMessage(res.data);
  };

  const getProtected = async () => {
    try {
      const token = await getAccessTokenSilently();
      const headers = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = await axios.get('http://localhost:1234/protected', headers);
      setMessage(res.data);
    } catch (err) {
      setMessage(`Reason ${err.message}`);
    }
  };
  if (isLoading)
    return (
      <div>
        <h1>Loading....</h1>
      </div>
    );
  return (
    <div className="App-body">
      <h1>Auth0 Authentication</h1>
      <h2>
        {isAuthenticated &&
          `Hi ${user?.given_name ? user?.given_name : user?.nickname}`}
      </h2>
      <ul>
        <li>
          <button onClick={loginWithPopup}>Login with Popup</button>
        </li>
        <li>
          <button onClick={loginWithRedirect}>Login with Redirect</button>
        </li>
        <li>
          <button onClick={logout}>Logout</button>
        </li>
        <li>
          <button onClick={get}>Get unprotected</button>
        </li>
        <li>
          <button onClick={getProtected}>Get protected</button>
        </li>
      </ul>
      <div className="container">
        <h3>User is {isAuthenticated ? 'Logged in' : 'Logged Out'}</h3>
        {isAuthenticated && <pre>{JSON.stringify(user, null, 2)} </pre>}
        <h5>{message}</h5>
      </div>
    </div>
  );
};

export default AuthApp;
