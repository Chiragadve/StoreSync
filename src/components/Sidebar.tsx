import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/inventory', label: 'Inventory', icon: '◫' },
  { path: '/orders', label: 'Orders', icon: '↗' },
  { path: '/products', label: 'Products', icon: '▣' },
  { path: '/locations', label: 'Locations', icon: '◎' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <span className="font-mono font-bold text-xl text-primary">STORE</span>
          <span className="font-mono font-bold text-xl text-foreground">SYNC</span>
        </div>
        <button className="hidden md:block lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* User Card */}
      {!collapsed && (
        <div className="mx-4 mb-6 p-3 bg-secondary rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-mono font-bold text-sm">AM</div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{state.currentUser.name}</div>
              <div className="text-xs text-muted-foreground">{state.currentUser.role}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-secondary text-primary border-l-2 border-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="p-4">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors border border-border">
          <span className="text-base w-5 text-center">↩</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 text-foreground bg-card border border-border rounded-lg p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-background border-r border-border z-40 transition-all duration-200 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 ${collapsed ? 'md:w-16' : 'md:w-60'} w-60`}>
        {sidebarContent}
      </aside>
    </>
  );
}
