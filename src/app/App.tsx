import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'; // No BrowserRouter here
import { Navbar } from '@/app/components/Navbar';
import { LoginPage } from '@/app/components/LoginPage';
import { PrincipalDashboard } from '@/app/components/PrincipalDashboard';
import { HomeroomManagement } from '@/app/components/HomeroomManagement';
import { StudentDashboard } from '@/app/components/StudentDashboard';
import { EnhancedStudentDashboard } from '@/app/components/EnhancedStudentDashboard';
import { TeacherGrading } from '@/app/components/TeacherGrading';
import { TeacherDashboard } from '@/app/components/TeacherDashboard';
import { AdminUserManagement } from '@/app/components/AdminUserManagement';
import { ManageAccounts } from '@/app/components/ManageAccounts';

export default function App() {
  const navigate = useNavigate(); // Now we can use this hook in App too!
  const location = useLocation();
  
  // Login State
  const [user, setUser] = useState<{ isLoggedIn: boolean; role: string | null }>(() => {
    // Optional: Persist login across refreshes
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : { isLoggedIn: false, role: null };
  });

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  const handleLogin = (role: string) => {
    setUser({ isLoggedIn: true, role });
    // Navigate to default page based on role immediately after login
    if (role === 'principal') navigate('/principal');
    else if (role === 'homeroom') navigate('/homeroom');
    else if (role === 'admin') navigate('/admin');
    else if (role === 'student') navigate('/student');
    else navigate('/homeroom');
  };

  const handleLogout = () => {
    setUser({ isLoggedIn: false, role: null });
    navigate('/'); // Send back to login
  };

  // 1. Guard: If not logged in, show Login Page
  if (!user.isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar 
        currentView={user.role} 
        setView={() => {}} // Not needed anymore, Navbar handles its own navigation
        onLogout={handleLogout} 
      />
      
      <main className="p-6">
        {/* 2. DEFINE ROUTES (No BrowserRouter wrapper needed here) */}
        <Routes>
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/homeroom" replace />} />

          {/* Core Routes */}
          
          <Route path="/teacher-dash" element={<TeacherDashboard />} />
          <Route path="/principal" element={<PrincipalDashboard />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/analytics" element={<EnhancedStudentDashboard />} />
          <Route path="/admin" element={<AdminUserManagement />} />
          <Route path="/grading" element={<TeacherGrading />} />
          <Route path="/accounts" element={<ManageAccounts />} />

          {/* Dynamic Route for Student Performance */}
          {/* 1. Default Route (No ID) - Redirects to Class 1 or shows a "Select Class" screen */}
          <Route path="/homeroom" element={<HomeroomManagement />} />

          {/* 2. Dynamic Route (With ID) - Loads specific class data */}
          <Route path="/homeroom/:classId" element={<HomeroomManagement />} />
          <Route path="/student-performance/:studentId" element={<EnhancedStudentDashboard />} />
        </Routes>
      </main>
    </div>
  );
}