import React from 'react';
import bgImage from '../assets/home-bg.jpg';

const AppLayout = ({ children }) => {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.35)',
          zIndex: 0,
        }}
      />

      {/* SCROLLABLE CONTENT AREA */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          width: '100%',
          overflowY: 'auto',          // ✅ ALLOW SCROLL WHEN NEEDED
          overflowX: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',   // 🔑 top-align for long forms
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1200px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
