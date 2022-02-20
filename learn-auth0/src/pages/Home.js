import React from 'react';

const Home = () => {
  const request = {
    domain: 'e-gaudi.us.auth0.com',
    audience: 'https://www.challenges-api.com',
    scope: 'read:challenges',
    clientId: 'Ypz8H6mNfwh9mmdi1IsVQl1nVj0dGKBI',
    responseType: 'code',
    redirectUri: 'http:localhost:3000/challenges',
    returnTo: 'http:localhost:3000'
  };
  const handleLogin = async () => {
    const response = await fetch(
      `https://${request.domain}/authorize?` +
        `audience=${request.audience}&` +
        `scope=${request.scope}&` +
        `response_type=${request.responseType}&` +
        `client_id=${request.clientId}&` +
        `redirect_uri=${request.redirectUri}`,
      {
        redirect: 'manual'
      }
    );

    window.location.replace(response.url);
  };

  const handleLogout = async () => {
    const response = await fetch(
      `https://${request.domain}/logout?client_id=${request.clientId}&returnTo=${request.returnTo}`,
      {
        redirect: 'manual'
      }
    );
    window.location.replace(response.url);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard</h1>
      </header>
      <div className="App-body">
        <span>
          <button className="Login-button" onClick={handleLogin}>
            login
          </button>
          <button onClick={handleLogout} className="Login-button">
            Logout
          </button>
        </span>
      </div>
    </div>
  );
};

export default Home;
