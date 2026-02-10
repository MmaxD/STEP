import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, TrendingUp, Target, Award, Brain, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Helper function for colors (same as before)
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
    case 'medium': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
    case 'low': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

export function EnhancedStudentDashboard() { // Defaulting to ID 1 for testing
  const { studentId } = useParams(); // Get ID from URL
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from your backend
    fetch(`http://localhost:8081/student-dashboard/${studentId}`)
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching dashboard:", err);
        setLoading(false);
      });
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-gray-500">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.profile) {
    return <div className="p-10 text-center">Student data not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="flex max-w-[1440px] mx-auto flex-col md:flex-row">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-80 p-6 space-y-6">
          {/* Student Profile Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24 ring-4 ring-indigo-100">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${data.profile.name}`} />
                    <AvatarFallback>SJ</AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${data.profile.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <h3 className="text-xl mb-1 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                  {data.profile.name}
                </h3>
                <p className="text-sm text-gray-500 mb-1">{data.profile.enrolled_class}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                  ID: STU-{String(data.profile.id).padStart(4, '0')}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current GPA</span>
                  <span className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {/* Get the latest GPA from history */}
                    {data.gpaHistory.length > 0 ? data.gpaHistory[data.gpaHistory.length - 1].gpa : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-xs font-semibold text-gray-600">{data.profile.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* --- CLASS TEACHER CARD (Dynamic) --- */}
          {data.teacher && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-600" />
                Class Teacher
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="flex items-start gap-3 mb-4">
                <Avatar className="h-14 w-14 ring-2 ring-indigo-100">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${data.teacher.name}`} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
                    TC
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm mb-0.5 font-bold">{data.teacher.name}</h4>
                  <p className="text-xs text-gray-500 mb-2">{data.teacher.subject_specialty} Department</p>
                  <div className="flex gap-2">
                    <div className="inline-flex items-center text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      <Award className="h-3 w-3 mr-1" />
                      Head of Class
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <a
                  href={`mailto:${data.teacher.email}`}
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {data.teacher.email}
                </a>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Available during school hours
                </div>
              </div>
            </CardContent>
          </Card>
        )}


          {/* Quick Stats Card */}
           <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl">{data.focusAreas.length}</div>
                  <div className="text-xs text-indigo-100">Focus Areas Identified</div>
                </div>
              </div>
              <div className="text-xs text-indigo-100">
                You have {data.focusAreas.filter(f => f.priority === 'high').length} high priority topics to review this week.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 space-y-6">
          <div>
            <h1 className="text-3xl mb-2 font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Performance Analytics
            </h1>
            <p className="text-gray-600">Track your academic progress and identify areas for growth</p>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* GPA Trend Chart */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle>GPA Trends</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data.gpaHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 4.0]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="gpa" stroke="#6366f1" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Subject Strengths Radar Chart */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle>Subject Strengths</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={data.subjects}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Focus Areas (Dynamic List) */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <CardTitle>AI-Powered Focus Areas</CardTitle>
                <Badge className="ml-auto bg-gradient-to-r from-cyan-500 to-blue-500 text-white">AI Insights</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.focusAreas.length > 0 ? (
                  data.focusAreas.map((area, index) => (
                    <div key={index} className="group relative p-4 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={`${getPriorityColor(area.priority)} text-xs`}>{area.priority}</Badge>
                      </div>
                      <h4 className="text-sm mb-2 font-semibold text-gray-800">{area.topic}</h4>
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-gray-500">Confidence: {area.confidence}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 col-span-3 text-center">No focus areas identified yet. Great job!</p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}