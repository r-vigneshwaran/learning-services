import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const Challenges = () => {
  const [challengesData, setChallengesData] = useState('none');
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    fetch(`http://localhost:3001/challenges?code=${code}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        Accept: 'application/json'
      }
    })
      .then((res) => {
        res.json();
      })
      .then((res) => {
        setChallengesData(JSON.stringify(res));
      });
  }, [code]);

  return (
    <div className="Challenges-body">
      <h3>Challenges</h3>
      <h5 className="Content">{challengesData}</h5>
    </div>
  );
};

export default Challenges;
