import { useNavigate, useLocation } from 'react-router-dom'; // 1. Import Router Hooks
import { GraduationCap, Bell, Shield, LogOut, LayoutDashboard, Users, ClipboardList, BarChart2 } from 'lucide-react';

interface NavbarProps {
  currentView: string | null;
  setView: (view: any) => void; // We keep this to prevent errors, but won't use it
  onLogout: () => void;
}

export function Navbar({ currentView, setView, onLogout }: NavbarProps) {
  const navigate = useNavigate();   // 2. Hook to change pages
  const location = useLocation();   // 3. Hook to see current page

  // 4. Define the paths for each role

// const getNavItems = () => {
//     return [
//       { id: 'principal', name: 'Principal', path: '/principal', icon: <Shield className="w-4 h-4 mr-2"/> },
//       { id: 'homeroom', name: 'Homeroom', path: '/homeroom', icon: <Users className="w-4 h-4 mr-2"/> },
//       { id: 'grading', name: 'Teacher', path: '/teacher-dash', icon: <ClipboardList className="w-4 h-4 mr-2"/> },
//       { id: 'student', name: 'Student', path: '/student', icon: <LayoutDashboard className="w-4 h-4 mr-2"/> },
//       { id: 'admin', name: 'Admin', path: '/admin', icon: <Shield className="w-4 h-4 mr-2"/> },
//       { id: 'analytics', name: 'Analytics', path: '/analytics', icon: <BarChart2 className="w-4 h-4 mr-2"/> },
//     ];
//   };


  const getNavItems = () => {
    switch (currentView) {
      case 'principal':
        return [
          { id: 'principal', name: 'Dashboard', path: '/principal', icon: <Shield className="w-4 h-4 mr-2"/> },
          { id: 'analytics', name: 'Analytics', path: '/analytics', icon: <BarChart2 className="w-4 h-4 mr-2"/> },
        ];
      case 'homeroom':
        return [
          { id: 'homeroom', name: 'Homeroom', path: '/homeroom', icon: <Users className="w-4 h-4 mr-2"/> },
          { id: 'analytics', name: 'Analytics', path: '/analytics', icon: <BarChart2 className="w-4 h-4 mr-2"/> },
          { id: 'grading', name: 'Grading', path: '/grading', icon: <ClipboardList className="w-4 h-4 mr-2"/> },
        ];
      case 'admin':
        return [
          { id: 'admin', name: 'User Management', path: '/admin', icon: <Shield className="w-4 h-4 mr-2"/> },
        ];
      case 'student':
        return [
          { id: 'student', name: 'My Dashboard', path: '/student', icon: <LayoutDashboard className="w-4 h-4 mr-2"/> },
          { id: 'analytics', name: 'Analytics', path: '/analytics', icon: <BarChart2 className="w-4 h-4 mr-2"/> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">LMS Portal</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                // Check if this tab is active
                const isActive = location.pathname === item.path;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)} // <--- 5. KEY FIX: Use navigate(), not setView()
                    className={`text-sm font-medium transition-colors relative h-16 flex items-center ${
                      isActive 
                        ? 'text-blue-600' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {/* Optional: Show icon if you want */}
                    {/* {item.icon} */}
                    {item.name}
                    
                    {/* Active Underline */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors mr-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline font-medium">Logout</span>
            </button>
            <Bell className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold cursor-pointer text-xs">
              {currentView ? currentView.substring(0, 2).toUpperCase() : 'US'}
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}