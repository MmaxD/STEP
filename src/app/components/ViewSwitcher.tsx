import { Button } from './ui/button';
import { 
  LayoutDashboard, Users, BookCheck, Smartphone, 
  LineChart, Shield, School, ClipboardCheck 
} from 'lucide-react';

// This is the "List" of views
const views = [
  { id: 'homeroom', name: 'Homeroom', icon: ClipboardCheck },
  { id: 'teacherDash', name: 'Teacher', icon: School },
  { id: 'principal', name: 'Principal', icon: Shield },
  { id: 'enhanced', name: 'Analytics', icon: LineChart },
  { id: 'student', name: 'Student', icon: LayoutDashboard },
  { id: 'teacher', name: 'Grading', icon: BookCheck },
  { id: 'admin', name: 'Admin', icon: Users },
  { id: 'loginpage', name: 'LogInPage', icon: Smartphone },
] as const;

export function ViewSwitcher({ currentView, setView }: { currentView: string, setView: (v: any) => void }) {
  return (
    <div className="bg-white border-b border-gray-200 overflow-x-auto">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex gap-2">
        {/* --- THIS IS THE MAPPING CODE --- */}
        {views.map((view) => {
          const Icon = view.icon;
          const isActive = currentView === view.id;

          return (
            <Button
              key={view.id}
              onClick={() => setView(view.id)}
              variant={isActive ? 'default' : 'outline'}
              className={isActive ? 'bg-blue-600 text-white' : 'text-gray-600'}
            >
              <Icon className="h-4 w-4 mr-2" />
              {view.name}
            </Button>
          );
        })}
        {/* --- END OF MAPPING CODE --- */}
      </div>
    </div>
  );
}