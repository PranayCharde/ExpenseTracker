import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <Navbar />
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
