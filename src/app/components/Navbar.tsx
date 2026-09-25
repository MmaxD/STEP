import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../../apiConfig";
import {
  GraduationCap,
  Shield,
  LogOut,
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart2,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";

interface NavbarProps {
  currentView: string | null;
  setView: (view: any) => void;
  onLogout: () => void;
}

export function Navbar({ currentView, setView, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Track if the teacher has an assigned homeroom
  const [hasHomeroom, setHasHomeroom] = useState(false);

  // NEW: Profile Dropdown States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamically grab the logged-in user's info from localStorage
  const userName = localStorage.getItem("userName") || "User";
  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = userObj.email || "No email available";

  // Close dropdown if user clicks anywhere outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check the database for homeroom assignment on load
  useEffect(() => {
    if (currentView === "teacherDash") {
      const teacherId = localStorage.getItem("loggedInUserId");
      if (teacherId) {
        fetch(`${API_BASE_URL}/api/teacher-homeroom/${teacherId}`)
          .then((res) => res.json())
          .then((data) => setHasHomeroom(data.hasHomeroom))
          .catch((err) => console.error(err));
      }
    }
  }, [currentView]);

  const getNavItems = () => {
    switch (currentView) {
      case "principal":
        return [
          {
            id: "principal",
            name: "Dashboard",
            path: "/principal",
            icon: <Shield className="w-4 h-4 mr-2" />,
          },
          {
            id: "ReliefAllocation",
            name: "Relief Allocation",
            path: "/relief",
            icon: <ClipboardList className="w-4 h-4 mr-2" />,
          },
          {
            id: "announcements",
            name: "Announcements",
            path: "/announcements",
            icon: <Shield className="w-4 h-4 mr-2" />, // Replaced Bell with Shield
          },
        ];
      case "teacherDash":
        const teacherItems = [];
        if (hasHomeroom) {
          teacherItems.push({
            id: "homeroom",
            name: "Homeroom",
            path: "/homeroom",
            icon: <Users className="w-4 h-4 mr-2" />,
          });
        }
        teacherItems.push(
          {
            id: "leaveForm",
            name: "Leave Form",
            path: "/leave",
            icon: <BarChart2 className="w-4 h-4 mr-2" />,
          },
          {
            id: "grading",
            name: "Grading",
            path: "/grading",
            icon: <ClipboardList className="w-4 h-4 mr-2" />,
          },
          {
            id: "TimeTable",
            name: "Time Table",
            path: "/teacher-dash",
            icon: <ClipboardList className="w-4 h-4 mr-2" />,
          },
        );
        return teacherItems;
      case "admin":
        return [
          {
            id: "admin",
            name: "User Management",
            path: "/admin",
            icon: <Shield className="w-4 h-4 mr-2" />,
          },
        ];
      case "student":
        return [
          {
            id: "student",
            name: "My Dashboard",
            path: "/student",
            icon: <LayoutDashboard className="w-4 h-4 mr-2" />,
          },
          {
            id: "analytics",
            name: "Analytics",
            path: "/analytics",
            icon: <BarChart2 className="w-4 h-4 mr-2" />,
          },
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
          <div className="flex items-center gap-8">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">
                STEP
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`text-sm font-medium transition-colors relative h-16 flex items-center ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {item.name}
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

            {/* NEW: Profile Section with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold cursor-pointer text-sm hover:bg-blue-200 transition-colors shadow-sm focus:outline-none"
              >
                {userName ? userName.substring(0, 2).toUpperCase() : "US"}
              </button>

              {/* Profile Dropdown Card */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-[#2b3137] rounded-xl shadow-2xl p-6 z-50 text-white flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                  <Avatar className="h-20 w-20 mb-3 border-2 border-gray-500 shadow-inner">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
                    />
                    <AvatarFallback className="bg-gray-700 text-xl">
                      {userName ? userName.substring(0, 2).toUpperCase() : "US"}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-medium m-0 tracking-wide text-center">
                    {userName}
                  </h3>
                  <p className="text-sm text-gray-400 m-0 mt-1 text-center truncate w-full">
                    {userEmail}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
