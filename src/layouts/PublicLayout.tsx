import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicNav } from '../components/PublicNav';
import { PublicFooter } from '../components/PublicFooter';

export const PublicLayout: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-grow">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};
