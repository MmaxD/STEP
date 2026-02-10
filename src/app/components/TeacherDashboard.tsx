import { useState } from 'react';
import { LayoutDashboard, BookOpen, GraduationCap, BarChart3, Check, Bell, Calendar, Clock, Users, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Separator } from '@/app/components/ui/separator';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// Navy Blue: #1e3a8a, Teal: #14b8a6

interface ClassSession {
  id: string;
  time: string;
  subject: string;
  grade: string;
  room: string;
  type: 'regular' | 'relief';
  status: 'upcoming' | 'current' | 'completed';
}

interface Student {
  id: string;
  name: string;
  photo: string;
  gpa: number;
  attendance: number;
  performanceData: number[];
  gpaData: { month: string; gpa: number }[];
  focusAreas: { topic: string; status: 'needs-attention' | 'improving' | 'good' }[];
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}

const todaySchedule: ClassSession[] = [
  { id: '1', time: '08:00 - 09:00', subject: 'Mathematics', grade: 'Grade 11-A', room: 'A101', type: 'regular', status: 'completed' },
  { id: '2', time: '09:00 - 10:00', subject: 'Mathematics', grade: 'Grade 11-B', room: 'A101', type: 'regular', status: 'completed' },
  { id: '3', time: '10:00 - 11:00', subject: 'Relief Period', grade: 'Grade 10-C', room: 'B205', type: 'relief', status: 'current' },
  { id: '4', time: '11:00 - 12:00', subject: 'Mathematics', grade: 'Grade 12-A', room: 'A101', type: 'regular', status: 'upcoming' },
  { id: '5', time: '12:00 - 13:00', subject: 'Lunch Break', grade: '-', room: '-', type: 'regular', status: 'upcoming' },
  { id: '6', time: '13:00 - 14:00', subject: 'Mathematics', grade: 'Grade 11-A', room: 'A101', type: 'regular', status: 'upcoming' },
  { id: '7', time: '14:00 - 15:00', subject: 'Relief Period', grade: 'Grade 9-B', room: 'C102', type: 'relief', status: 'upcoming' },
  { id: '8', time: '15:00 - 16:00', subject: 'Faculty Meeting', grade: '-', room: 'Staff Room', type: 'regular', status: 'upcoming' },
];

const homeroomStudents: Student[] = [
  {
    id: 'S001',
    name: 'Emily Chen',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    gpa: 3.8,
    attendance: 96,
    performanceData: [75, 78, 82, 85, 88, 90, 92],
    gpaData: [
      { month: 'Sep', gpa: 3.5 },
      { month: 'Oct', gpa: 3.6 },
      { month: 'Nov', gpa: 3.7 },
      { month: 'Dec', gpa: 3.8 },
    ],
    focusAreas: [
      { topic: 'Calculus - Integration', status: 'needs-attention' },
      { topic: 'Essay Writing', status: 'improving' },
      { topic: 'Lab Reports', status: 'good' },
    ],
  },
  {
    id: 'S002',
    name: 'Michael Rodriguez',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    gpa: 3.6,
    attendance: 94,
    performanceData: [70, 72, 75, 78, 80, 82, 85],
    gpaData: [
      { month: 'Sep', gpa: 3.3 },
      { month: 'Oct', gpa: 3.4 },
      { month: 'Nov', gpa: 3.5 },
      { month: 'Dec', gpa: 3.6 },
    ],
    focusAreas: [
      { topic: 'Physics - Mechanics', status: 'improving' },
      { topic: 'Time Management', status: 'needs-attention' },
      { topic: 'Group Projects', status: 'good' },
    ],
  },
  {
    id: 'S003',
    name: 'Sarah Johnson',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    gpa: 3.9,
    attendance: 98,
    performanceData: [88, 90, 92, 93, 94, 95, 96],
    gpaData: [
      { month: 'Sep', gpa: 3.7 },
      { month: 'Oct', gpa: 3.8 },
      { month: 'Nov', gpa: 3.85 },
      { month: 'Dec', gpa: 3.9 },
    ],
    focusAreas: [
      { topic: 'Advanced Mathematics', status: 'good' },
      { topic: 'Research Skills', status: 'good' },
      { topic: 'Public Speaking', status: 'improving' },
    ],
  },
  {
    id: 'S004',
    name: 'David Kim',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    gpa: 3.5,
    attendance: 92,
    performanceData: [68, 70, 72, 75, 78, 80, 82],
    gpaData: [
      { month: 'Sep', gpa: 3.2 },
      { month: 'Oct', gpa: 3.3 },
      { month: 'Nov', gpa: 3.4 },
      { month: 'Dec', gpa: 3.5 },
    ],
    focusAreas: [
      { topic: 'Chemistry - Organic', status: 'needs-attention' },
      { topic: 'Study Habits', status: 'improving' },
      { topic: 'Lab Safety', status: 'good' },
    ],
  },
  {
    id: 'S005',
    name: 'Jessica Martinez',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    gpa: 3.7,
    attendance: 95,
    performanceData: [80, 82, 85, 86, 88, 89, 90],
    gpaData: [
      { month: 'Sep', gpa: 3.5 },
      { month: 'Oct', gpa: 3.6 },
      { month: 'Nov', gpa: 3.65 },
      { month: 'Dec', gpa: 3.7 },
    ],
    focusAreas: [
      { topic: 'History - Analysis', status: 'improving' },
      { topic: 'Critical Thinking', status: 'good' },
      { topic: 'Exam Preparation', status: 'good' },
    ],
  },
];

const announcements: Announcement[] = [
  {
    id: '1',
    title: 'Parent-Teacher Meeting',
    message: 'Scheduled for next Saturday at 10:00 AM',
    time: '2 hours ago',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Grade Submission Deadline',
    message: 'Please submit Q2 grades by Friday, 5:00 PM',
    time: '5 hours ago',
    priority: 'high',
  },
  {
    id: '3',
    title: 'New Lab Equipment',
    message: 'Science lab has received new microscopes',
    time: '1 day ago',
    priority: 'medium',
  },
  {
    id: '4',
    title: 'Faculty Workshop',
    message: 'Professional development session on modern teaching methods',
    time: '2 days ago',
    priority: 'medium',
  },
];

const Sparkline = ({ data }: { data: number[] }) => {
  const chartData = data.map((value, index) => ({ index, value }));
  
  return (
    <ResponsiveContainer width={80} height={30}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke="#14b8a6"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const getFocusStatusColor = (status: string) => {
  switch (status) {
    case 'needs-attention':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'improving':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'good':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export function TeacherDashboard() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeNav, setActiveNav] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'classes', icon: BookOpen, label: 'Classes' },
    { id: 'grading', icon: GraduationCap, label: 'Grading' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex max-w-[1440px] mx-auto">


        {/* Column 2 - Daily Schedule */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1e3a8a' }}>
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Daily Schedule</h2>
                <p className="text-xs text-gray-500">Saturday, January 17, 2026</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {todaySchedule.map((session) => (
              <Card
                key={session.id}
                className={`border shadow-sm transition-all ${
                  session.type === 'relief'
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
                    : session.status === 'current'
                    ? 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-300 ring-2 ring-teal-200'
                    : 'bg-white border-gray-200'
                } ${session.status === 'completed' ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-700">{session.time}</span>
                    </div>
                    {session.type === 'relief' && (
                      <Badge className="bg-orange-500 text-white text-[10px] px-2 py-0">
                        Relief
                      </Badge>
                    )}
                    {session.status === 'current' && (
                      <Badge className="bg-teal-600 text-white text-[10px] px-2 py-0">
                        Now
                      </Badge>
                    )}
                    {session.status === 'completed' && (
                      <Badge className="bg-gray-400 text-white text-[10px] px-2 py-0">
                        <Check className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{session.subject}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{session.grade}</span>
                    {session.room !== '-' && (
                      <>
                        <span>•</span>
                        <span>Room {session.room}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Column 3 - Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#14b8a6] rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome back, Mr. Chen</h1>
                <p className="text-sm text-white/80">You have 6 classes and 2 relief periods today</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">10:15 AM</div>
                <div className="text-sm text-white/80">Current Period: Relief - Grade 10-C</div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Announcements Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-100 bg-gray-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#14b8a6' }}>
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Button className="w-full justify-start bg-[#1e3a8a] hover:bg-[#1e40af] text-white shadow-sm">
                  <Users className="h-4 w-4 mr-3" />
                  Mark Attendance - Grade 11-A
                </Button>
                <Button variant="outline" className="w-full justify-start border-[#14b8a6] text-[#14b8a6] hover:bg-teal-50">
                  <GraduationCap className="h-4 w-4 mr-3" />
                  Enter Grades
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-3" />
                  Upload Class Materials
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-3" />
                  Schedule Makeup Class
                </Button>
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card className="border border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-100 bg-gray-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1e3a8a' }}>
                    <Bell className="h-4 w-4 text-white" />
                  </div>
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-[280px] overflow-y-auto">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-3 rounded-lg border ${
                      announcement.priority === 'high'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">{announcement.title}</h4>
                      {announcement.priority === 'high' && (
                        <Badge className="bg-red-500 text-white text-[10px] px-2 py-0">
                          High
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{announcement.message}</p>
                    <span className="text-[10px] text-gray-500">{announcement.time}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Homeroom Teacher Section */}
          <Card className="border border-gray-200 shadow-md">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-[#1e3a8a]/5 to-[#14b8a6]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#1e3a8a] to-[#14b8a6]">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">My Class Performance - Grade 11-A</CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">Homeroom Teacher View • 25 Students</p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-[#1e3a8a] to-[#14b8a6] text-white px-3 py-1">
                  Homeroom Teacher
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {homeroomStudents.map((student) => (
                  <div key={student.id}>
                    <div
                      onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                    >
                      <Avatar className="h-12 w-12 ring-2 ring-gray-200">
                        <AvatarImage src={student.photo} />
                        <AvatarFallback className="bg-gradient-to-br from-[#1e3a8a] to-[#14b8a6] text-white">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">{student.name}</h4>
                          <Badge variant="outline" className="text-[10px] px-2 py-0">
                            {student.id}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>GPA: <strong style={{ color: '#14b8a6' }}>{student.gpa}</strong></span>
                          <span>•</span>
                          <span>Attendance: <strong>{student.attendance}%</strong></span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right mr-2">
                          <div className="text-[10px] text-gray-500 mb-1">Performance Trend</div>
                          <Sparkline data={student.performanceData} />
                        </div>
                        <TrendingUp className="h-5 w-5 text-teal-600" />
                      </div>
                    </div>

                    {/* Expanded Student Detail */}
                    {selectedStudent?.id === student.id && (
                      <Card className="mt-3 border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 shadow-lg">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-2 gap-6">
                            {/* GPA Trend */}
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="h-4 w-4 text-teal-600" />
                                <h4 className="text-sm font-semibold text-gray-900">GPA Trend</h4>
                              </div>
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <ResponsiveContainer width="100%" height={120}>
                                  <LineChart data={student.gpaData}>
                                    <Line
                                      type="monotone"
                                      dataKey="gpa"
                                      stroke="#14b8a6"
                                      strokeWidth={3}
                                      dot={{ fill: '#14b8a6', r: 4 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                                <div className="flex justify-between mt-2">
                                  {student.gpaData.map((data, idx) => (
                                    <div key={idx} className="text-center">
                                      <div className="text-[10px] text-gray-500">{data.month}</div>
                                      <div className="text-xs font-semibold text-gray-900">{data.gpa}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Focus Areas */}
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <Target className="h-4 w-4 text-[#1e3a8a]" />
                                <h4 className="text-sm font-semibold text-gray-900">Focus Areas</h4>
                              </div>
                              <div className="space-y-2">
                                {student.focusAreas.map((area, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-3 rounded-lg border ${getFocusStatusColor(area.status)}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold">{area.topic}</span>
                                      {area.status === 'needs-attention' && (
                                        <AlertCircle className="h-3 w-3" />
                                      )}
                                      {area.status === 'improving' && (
                                        <TrendingUp className="h-3 w-3" />
                                      )}
                                      {area.status === 'good' && (
                                        <Check className="h-3 w-3" />
                                      )}
                                    </div>
                                    <div className="text-[10px] mt-1 capitalize">{area.status.replace('-', ' ')}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
