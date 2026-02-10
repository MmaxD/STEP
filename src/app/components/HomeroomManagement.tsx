import { useState, useEffect } from 'react';
export const API_BASE_URL = "https://step-58cj.onrender.com";
import { useParams,useNavigate } from 'react-router-dom'; // <--- 1. IMPORT HOOK
import { Calendar, Check, Users, AlertTriangle, TrendingDown, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ToggleGroup, ToggleGroupItem } from '@/app/components/ui/toggle-group';

// --- Helper Components ---
const Sparkline = ({ data }: { data: number[] }) => {
  const safeData = data && data.length > 0 ? data : [70, 75, 72, 80, 85, 82, 90];
  const chartData = safeData.map((value, index) => ({ index, value }));
  const trend = safeData[safeData.length - 1] - safeData[0];
  const color = trend >= 0 ? '#10b981' : '#ef4444';
  
  return (
    <ResponsiveContainer width={100} height={40}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export function HomeroomManagement() {
  const navigate = useNavigate(); // <--- 2. INITIALIZE NAVIGATION
  const [studentList, setStudentList] = useState<any[]>([]);
  const [absentees, setAbsentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const displayDate = new Date(currentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  // const { currentClass } = useParams();
  const currentClass = "Grade 10-A"; 

  // 1. Fetch Data on Load
  useEffect(() => {
    fetchData();
    fetchAbsentees();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/homeroom/${encodeURIComponent(currentClass)}?date=${currentDate}`);
      const data = await res.json();
      setStudentList(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAbsentees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/homeroom/${encodeURIComponent(currentClass)}/absentees`);
      const data = await res.json();
      setAbsentees(data);
    } catch (err) {
      console.error(err);
    }
  }

  // 2. Handle Individual Toggle
  const handleAttendanceChange = async (studentId: number, status: string) => {
    setStudentList(prev => prev.map(s => s.id === studentId ? { ...s, today_status: status } : s));

    try {
      await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, date: currentDate, status })
      });
      fetchAbsentees();
    } catch (err) {
      console.error("Failed to save attendance");
    }
  };

  // 3. Handle Mark All Present
  const handleMarkAllPresent = async () => {
    const ids = studentList.map(s => s.id);
    setStudentList(prev => prev.map(s => ({ ...s, today_status: 'present' })));

    try {
      await fetch(`${API_BASE_URL}/attendance/mark-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: ids, date: currentDate })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // --- 4. NAVIGATION HANDLER ---
  const handleStudentClick = (studentId: string) => {
    // This pushes the user to the performance page for the specific student ID
    navigate(`/student-performance/${studentId}`); 
  };

  // --- Calculations for UI ---
  const presentCount = studentList.filter((s) => s.today_status === 'present').length;
  const absentCount = studentList.filter((s) => s.today_status === 'absent').length;
  const lateCount = studentList.filter((s) => s.today_status === 'late').length;
  const unmarkedCount = studentList.filter((s) => !s.today_status).length; 

  const attendanceData = [
    { name: 'Present', value: presentCount, color: '#10b981' },
    { name: 'Absent', value: absentCount, color: '#ef4444' },
    { name: 'Late', value: lateCount, color: '#f59e0b' },
    { name: 'Unmarked', value: unmarkedCount, color: '#e5e7eb' },
  ];

  const attendancePercentage = studentList.length > 0
    ? Math.round((presentCount / studentList.length) * 100)
    : 0;

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-[1440px] mx-auto p-8">
        
        {/* Header Summary Card */}
        <Card className="border border-gray-200 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-12 gap-6 items-center">
              {/* Class Info */}
              <div className="col-span-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#1e3a8a] to-[#10b981]">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{currentClass} Attendance</h1>
                    <p className="text-sm text-gray-600">Homeroom Management</p>
                  </div>
                </div>
              </div>

              {/* Date Picker */}
              <div className="col-span-4 flex justify-center">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg cursor-pointer">
                    <Calendar className="h-5 w-5 text-[#1e3a8a]" />
                    <span className="text-sm font-semibold text-gray-900">{displayDate}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="col-span-4 flex justify-end gap-3">
                 <Button onClick={handleMarkAllPresent} className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 h-14 shadow-lg">
                  <Check className="h-5 w-5 mr-2" /> Mark All Present
                </Button>
              </div>
            </div>

            {/* Status Bar */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center"><Check className="h-5 w-5 text-white" /></div>
                <div><div className="text-xs text-gray-600">Present</div><div className="text-xl font-bold text-gray-900">{presentCount}</div></div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-white" /></div>
                <div><div className="text-xs text-gray-600">Absent</div><div className="text-xl font-bold text-gray-900">{absentCount}</div></div>
              </div>
               <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center"><Clock className="h-5 w-5 text-white" /></div>
                <div><div className="text-xs text-gray-600">Late</div><div className="text-xl font-bold text-gray-900">{lateCount}</div></div>
              </div>
               <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center"><Users className="h-5 w-5 text-white" /></div>
                <div><div className="text-xs text-gray-600">Unmarked</div><div className="text-xl font-bold text-gray-900">{unmarkedCount}</div></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-12 gap-6">
          {/* Main List */}
          <div className="col-span-8">
            <Card className="border border-gray-200 shadow-lg">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                 <CardTitle className="text-lg">Student Attendance</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {studentList.map((student, index) => (
                    <div key={student.id} className={`p-4 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <div className="flex items-center gap-4">
                        
                        {/* --- CLICKABLE STUDENT AREA --- */}
                        <div 
                            className="flex items-center gap-4 flex-1 cursor-pointer group" 
                            onClick={() => handleStudentClick(student.id)}
                        >
                            <Avatar className="h-12 w-12 ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                            <AvatarFallback>ST</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 mb-0.5 group-hover:text-blue-600 transition-colors">{student.name}</h4>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Rate: {student.attendance_rate ? Math.round(student.attendance_rate) : 100}%</span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">Absences: {student.absence_count}</span>
                            </div>
                            </div>
                        </div>
                        {/* ----------------------------- */}

                        {/* Toggle Buttons */}
                        <div className="flex-shrink-0">
                          <ToggleGroup
                            type="single"
                            value={student.today_status || ''}
                            onValueChange={(val) => { if(val) handleAttendanceChange(student.id, val); }}
                            className="gap-2"
                          >
                             <ToggleGroupItem value="present" className={`px-4 py-2 text-xs font-semibold ${student.today_status === 'present' ? 'bg-green-500 text-white' : 'bg-white border-2 border-green-200 text-green-700'}`}>
                               <Check className="h-3 w-3 mr-1" /> Present
                             </ToggleGroupItem>
                             <ToggleGroupItem value="absent" className={`px-4 py-2 text-xs font-semibold ${student.today_status === 'absent' ? 'bg-red-500 text-white' : 'bg-white border-2 border-red-200 text-red-700'}`}>
                               <AlertTriangle className="h-3 w-3 mr-1" /> Absent
                             </ToggleGroupItem>
                             <ToggleGroupItem value="late" className={`px-4 py-2 text-xs font-semibold ${student.today_status === 'late' ? 'bg-amber-500 text-white' : 'bg-white border-2 border-amber-200 text-amber-700'}`}>
                               <Clock className="h-3 w-3 mr-1" /> Late
                             </ToggleGroupItem>
                          </ToggleGroup>
                        </div>
                        
                         {/* Sparkline */}
                        <div className="flex-shrink-0 text-right w-24">
                           <Sparkline data={[]} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-4 space-y-6">
            <Card className="border border-gray-200 shadow-lg">
               <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className="text-base">Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center">
                 <div className="relative">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie data={attendanceData} cx={100} cy={100} innerRadius={60} outerRadius={80} dataKey="value">
                          {attendanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl font-bold text-[#1e3a8a]">{attendancePercentage}%</div>
                    </div>
                 </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-lg">
              <CardHeader className="border-b border-gray-200 bg-red-50">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-base text-red-900">Frequent Absentees</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {absentees.map((absentee) => (
                   <div 
                        key={absentee.id} 
                        className="flex items-center gap-3 p-3 bg-white border border-red-100 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                        onClick={() => handleStudentClick(absentee.id)} // <--- CLICKABLE ABSENTEE
                   >
                      <Avatar className="h-10 w-10 ring-2 ring-red-200">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${absentee.name}`} />
                        <AvatarFallback>AB</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900">{absentee.name}</h4>
                        <p className="text-xs text-gray-500">Last: {new Date(absentee.lastAbsent).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">{absentee.absences}</div>
                        <div className="text-[10px] text-gray-500">absences</div>
                      </div>
                   </div>
                ))}
                {absentees.length === 0 && <p className="text-sm text-gray-500 text-center">No absences recorded yet.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}