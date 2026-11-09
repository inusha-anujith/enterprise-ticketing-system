// components/Layout.jsx
// The frame shared by every logged-in page: sidebar on the left, page content on the right.
// <Outlet /> is where React Router puts the current page.
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans text-gray-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
