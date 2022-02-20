import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Landing from './pages/Landing';

const AuthApp = () => {
  const { isLoading } = useAuth0();

  if (isLoading)
    return (
      <div>
        <h1>Loading....</h1>
      </div>
    );
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<PrivateRoute component={Home} />} />
    </Routes>
  );
};

export default AuthApp;
