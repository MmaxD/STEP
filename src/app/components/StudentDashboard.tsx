import { Calendar, BookOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';

const weekSchedule = [
  { day: 'Mon', date: '13', classes: ['Math 9:00', 'Physics 11:00', 'English 14:00'] },
  { day: 'Tue', date: '14', classes: ['Chemistry 10:00', 'History 13:00'] },
  { day: 'Wed', date: '15', classes: ['Math 9:00', 'English 11:00', 'Art 15:00'] },
  { day: 'Thu', date: '16', classes: ['Physics 10:00', 'Chemistry 14:00'] },
  { day: 'Fri', date: '18', classes: ['Math 9:00', 'History 11:00'] },
];

const upcomingDeadlines = [
  { id: 1, title: 'Physics Lab Report', course: 'Physics 101', dueDate: 'Jan 18, 2026', priority: 'high', timeLeft: '1 day' },
  { id: 2, title: 'Math Problem Set #5', course: 'Calculus II', dueDate: 'Jan 20, 2026', priority: 'medium', timeLeft: '3 days' },
  { id: 3, title: 'History Essay Draft', course: 'Modern History', dueDate: 'Jan 22, 2026', priority: 'medium', timeLeft: '5 days' },
  { id: 4, title: 'Chemistry Quiz', course: 'Organic Chemistry', dueDate: 'Jan 25, 2026', priority: 'low', timeLeft: '8 days' },
  { id: 5, title: 'English Literature Review', course: 'English 201', dueDate: 'Jan 28, 2026', priority: 'low', timeLeft: '11 days' },
];

const courseProgress = [
  { name: 'Physics 101', progress: 75, color: '#2563eb' },
  { name: 'Calculus II', progress: 82, color: '#2563eb' },
  { name: 'Modern History', progress: 68, color: '#2563eb' },
  { name: 'Organic Chemistry', progress: 71, color: '#2563eb' },
  { name: 'English 201', progress: 88, color: '#2563eb' },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500 text-white';
    case 'medium':
      return 'bg-amber-500 text-white';
    case 'low':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high':
      return <AlertCircle className="h-4 w-4" />;
    case 'medium':
      return <Clock className="h-4 w-4" />;
    case 'low':
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="p-8 max-w-[1440px] mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl mb-2" style={{ color: '#2563eb' }}>Welcome back, Sarah!</h1>
          <p className="text-gray-600">Saturday, January 17, 2026</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Schedule */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" style={{ color: '#2563eb' }} />
                <CardTitle>Weekly Schedule</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                {weekSchedule.map((day) => (
                  <div
                    key={day.day}
                    className={`p-4 rounded-lg ${
                      day.date === '17' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="text-center mb-3">
                      <div className="text-sm text-gray-600">{day.day}</div>
                      <div
                        className={`text-xl ${day.date === '17' ? 'font-bold' : ''}`}
                        style={day.date === '17' ? { color: '#2563eb' } : {}}
                      >
                        {day.date}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {day.classes.map((cls, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-2 rounded text-center"
                          style={{ backgroundColor: '#2563eb', color: 'white' }}
                        >
                          {cls}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" style={{ color: '#2563eb' }} />
                <CardTitle>Upcoming Deadlines</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm">{deadline.title}</h4>
                      <Badge className={`${getPriorityColor(deadline.priority)} text-xs px-2 py-0.5`}>
                        {deadline.priority}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{deadline.course}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>Due: {deadline.dueDate}</span>
                      <span className="ml-auto font-medium">{deadline.timeLeft}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Progress */}
        <Card className="mt-6 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" style={{ color: '#2563eb' }} />
              <CardTitle>Course Progress</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
              {courseProgress.map((course) => (
                <div key={course.name} className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    {/* Circular Progress */}
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke={course.color}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - course.progress / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl" style={{ color: '#2563eb' }}>
                        {course.progress}%
                      </span>
                    </div>
                  </div>
                  <h4 className="text-center text-sm text-gray-700">{course.name}</h4>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
