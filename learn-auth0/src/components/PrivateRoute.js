import React from 'react';
import { withAuthenticationRequired } from '@auth0/auth0-react';

const PrivateRoute = ({ component, ...props }) => {
  const Cp = withAuthenticationRequired(component, {
    onRedirecting: () => (
      <div>
        <h1>Loading...</h1>
      </div>
    )
  });
  return <Cp {...props} />;
};
export default PrivateRoute;
