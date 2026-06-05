import { Link, Outlet, useLocation } from 'react-router-dom';
import { Church, ShieldCheck, Users, LayoutDashboard, Calendar, FileText } from 'lucide-react';
import { Button } from './ui/Button';

export function Navbar() {
  const location = useLocation();

  const mainLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const checkinLinks = [
    { name: 'School', path: '/school' },
    { name: 'Devotion', path: '/devotion' },
    { name: 'Chapel', path: '/chapel' },
  ];

  const recordLinks = [
    { name: 'School', path: '/records/school' },
    { name: 'Devotion', path: '/records/devotion' },
    { name: 'Chapel', path: '/records/chapel' },
  ];

  return (
    <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <nav className="border border-white/50 bg-white/50 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Church className="h-6 w-6" />
            </div>
            <Link to="/" className="text-xl font-bold tracking-tight text-gray-900">
              Vessel of His Mercy
            </Link>
          </div>
          
          <div className="hidden lg:flex items-center space-x-1">
            {mainLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.path ? 'bg-blue-600/10 text-blue-700 shadow-sm' : 'text-gray-700 hover:bg-white/60 hover:text-blue-600'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center space-x-4">
             <div className="flex flex-col items-end border-l border-gray-200 pl-4 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 w-16 text-right">Check In</span>
                  <div className="flex space-x-1">
                    {checkinLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                          location.pathname === link.path ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 w-16 text-right">Records</span>
                  <div className="flex space-x-1">
                    {recordLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                          location.pathname === link.path ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
            </div>
          </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/school' || location.pathname === '/devotion' || location.pathname === '/chapel';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex flex-col font-sans">
      <Navbar />
      <main className={`flex-1 ${!isHome ? 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full' : ''}`}>
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Vessel of His Mercy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

