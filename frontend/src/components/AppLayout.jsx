import React from 'react';
import bgImage from '../assets/home-bg.jpg';

const AppLayout = ({ children }) => {
  return (
    <div style={{ width: '100vw', minHeight: '100vh', margin: 0, padding: 0 }}>
      {children}
    </div>
  );
};

export default AppLayout;
