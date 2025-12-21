import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Palette, 
  Settings,
  Library,
  Layers
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/orders', icon: FileText, label: 'Orders' },
  { path: '/orders/new', icon: PlusCircle, label: 'New Order' },
  { path: '/leather-library', icon: Palette, label: 'Leather Library' },
  { path: '/finish-library', icon: Layers, label: 'Finish Library' },
  { path: '/template-settings', icon: Settings, label: 'Template Settings' },
];

export const Layout = () => {
  return (
    <div className="flex min-h-screen" data-testid="app-layout">
      {/* Sidebar */}
      <aside className="w-64 sidebar flex flex-col" data-testid="sidebar">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <h1 className="font-serif text-2xl font-semibold text-primary" data-testid="logo">
            JAIPUR
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            A fine wood furniture company
          </p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1" data-testid="nav-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
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
      <main className="flex-1 p-8 overflow-auto" data-testid="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
