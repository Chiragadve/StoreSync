import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-60 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <div className="animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
