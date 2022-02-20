import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Challenges from './pages/Challenges';
import Home from './pages/Home';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/challenges" element={<Challenges />} />
    </Routes>
  );
}

export default App;
