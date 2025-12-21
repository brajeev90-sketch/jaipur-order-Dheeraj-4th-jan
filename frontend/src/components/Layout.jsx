import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Palette, 
  Settings,
  Layers,
  Menu,
  X
} from 'lucide-react';
import { Button } from './ui/button';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/orders', icon: FileText, label: 'Orders' },
  { path: '/orders/new', icon: PlusCircle, label: 'New Order' },
  { path: '/leather-library', icon: Palette, label: 'Leather Library' },
  { path: '/finish-library', icon: Layers, label: 'Finish Library' },
  { path: '/template-settings', icon: Settings, label: 'Template Settings' },
];

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen" data-testid="app-layout">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(true)}
            data-testid="mobile-menu-btn"
          >
            <Menu size={24} />
          </Button>
          <h1 className="font-serif text-xl font-semibold text-primary">JAIPUR</h1>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 sidebar flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-primary" data-testid="logo">
              JAIPUR
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              A fine wood furniture company
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1" data-testid="nav-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          Production Sheet System v1.0
        </div>
      </aside>
      
      {/* Main Content */}
      <main 
        className="flex-1 p-4 lg:p-8 overflow-auto pt-16 lg:pt-8" 
        data-testid="main-content"
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
