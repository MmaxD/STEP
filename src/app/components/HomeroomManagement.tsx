import { useState, useEffect,useRef } from "react";
import { API_BASE_URL } from "../../apiConfig";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Check,
  Users,
  AlertTriangle,
  TrendingDown,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";

const Sparkline = ({ data }: { data: number[] }) => {
  const safeData =
    data && data.length > 0 ? data : [70, 75, 72, 80, 85, 82, 90];
  const chartData = safeData.map((value, index) => ({ index, value }));
  const trend = safeData[safeData.length - 1] - safeData[0];
  const color = trend >= 0 ? "#10b981" : "#ef4444";

  return (
    <ResponsiveContainer width={100} height={40}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export function HomeroomManagement() {
  const navigate = useNavigate();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [studentList, setStudentList] = useState<any[]>([]);
  const [absentees, setAbsentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const displayDate = new Date(currentDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // NEW DYNAMIC STATES
  const [currentClass, setCurrentClass] = useState<string>("Loading...");
  const [hasHomeroom, setHasHomeroom] = useState<boolean>(true);

  // 1. Fetch Teacher's assigned class on load or when date changes
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const teacherId = localStorage.getItem("loggedInUserId") || "1";
      try {
        const classRes = await fetch(
          `${API_BASE_URL}/api/teacher-homeroom/${teacherId}`,
        );
        const classData = await classRes.json();

        if (classData.hasHomeroom) {
          const targetClass = classData.className;
          setCurrentClass(targetClass);

          // 2. Fetch specific students and attendance for this date
          await fetchData(targetClass);
          await fetchAbsentees(targetClass);
        } else {
          setHasHomeroom(false);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    init();
  }, [currentDate]);

  // --- UPDATED: Uses the proper dynamic endpoint with the date parameter ---
  const fetchData = async (targetClass: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/homeroom/${encodeURIComponent(targetClass)}?date=${currentDate}`
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        setStudentList(data);
      } else {
        setStudentList([]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setLoading(false);
    }
  };

  const fetchAbsentees = async (targetClass: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/homeroom/${encodeURIComponent(targetClass)}/absentees`,
      );
      const data = await res.json();
      setAbsentees(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttendanceChange = async (studentId: number, status: string) => {
    setStudentList((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, today_status: status } : s,
      ),
    );
    try {
      await fetch(`${API_BASE_URL}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, date: currentDate, status }),
      });
      fetchAbsentees(currentClass);
    } catch (err) {
      console.error("Failed to save attendance");
    }
  };

  const handleMarkAllPresent = async () => {
    const ids = studentList.map((s) => s.id);
    setStudentList((prev) =>
      prev.map((s) => ({ ...s, today_status: "present" })),
    );
    try {
      await fetch(`${API_BASE_URL}/attendance/mark-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: ids, date: currentDate }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStudentClick = (studentId: string) => {
    navigate(`/student-performance/${studentId}`);
  };

  const presentCount = studentList.filter(
    (s) => s.today_status === "present",
  ).length;
  const absentCount = studentList.filter(
    (s) => s.today_status === "absent",
  ).length;
  const lateCount = studentList.filter((s) => s.today_status === "late").length;
  const unmarkedCount = studentList.filter((s) => !s.today_status).length;

  const attendanceData = [
    { name: "Present", value: presentCount, color: "#10b981" },
    { name: "Absent", value: absentCount, color: "#ef4444" },
    { name: "Late", value: lateCount, color: "#f59e0b" },
    { name: "Unmarked", value: unmarkedCount, color: "#e5e7eb" },
  ];

  const attendancePercentage =
    studentList.length > 0
      ? Math.round((presentCount / studentList.length) * 100)
      : 0;

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );

  // Render a clean fallback if the user navigates here manually without a class
  if (!hasHomeroom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">
            No Homeroom Assigned
          </h2>
          <p className="text-gray-500 mt-2">
            You are not currently assigned as a homeroom teacher to any class.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="max-w-[1440px] mx-auto p-8">
        <Card className="border border-gray-200 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-12 gap-6 items-center">
              <div className="col-span-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#1e3a8a] to-[#10b981]">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {currentClass} Attendance
                    </h1>
                    <p className="text-sm text-gray-600">Homeroom Management</p>
                  </div>
                </div>
              </div>
              <div className="col-span-4 flex justify-center">
                <div className="flex items-center gap-3">
                  
                  {/* --- UPDATED: Date Picker UI --- */}
                  <div 
                    className="relative flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => {
                      try {
                        // Forces the native calendar popup to open
                        dateInputRef.current?.showPicker();
                      } catch (e) {
                        // Fallback for older browsers
                        dateInputRef.current?.focus();
                      }
                    }}
                  >
                    <Calendar className="h-5 w-5 text-[#1e3a8a] pointer-events-none" />
                    
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={currentDate}
                      onChange={(e) => setCurrentDate(e.target.value)}
                      // We hide the input completely since we are triggering it via JS
                      className="absolute w-0 h-0 opacity-0 overflow-hidden" 
                    />
                    
                    <span className="text-sm font-semibold text-gray-900 pointer-events-none">
                      {displayDate}
                    </span>
                  </div>
                  {/* ---------------------------------- */}
                  
                </div>
              </div>
              <div className="col-span-4 flex justify-end gap-3">
                <Button
                  onClick={handleMarkAllPresent}
                  className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 h-14 shadow-lg"
                >
                  <Check className="h-5 w-5 mr-2" /> Mark All Present
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-600">Present</div>
                  <div className="text-xl font-bold text-gray-900">
                    {presentCount}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-600">Absent</div>
                  <div className="text-xl font-bold text-gray-900">
                    {absentCount}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-600">Late</div>
                  <div className="text-xl font-bold text-gray-900">
                    {lateCount}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-600">Unmarked</div>
                  <div className="text-xl font-bold text-gray-900">
                    {unmarkedCount}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <Card className="border border-gray-200 shadow-lg">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className="text-lg">Student Attendance</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {studentList.map((student, index) => (
                    <div
                      key={student.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex items-center gap-4 flex-1 cursor-pointer group"
                          onClick={() => handleStudentClick(student.id)}
                        >
                          <Avatar className="h-12 w-12 ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
                            />
                            <AvatarFallback>ST</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 mb-0.5 group-hover:text-blue-600 transition-colors">
                              {student.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                Rate:{" "}
                                {student.attendance_rate
                                  ? Math.round(student.attendance_rate)
                                  : 100}
                                %
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                Absences: {student.absence_count}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <ToggleGroup
                            type="single"
                            value={student.today_status || ""}
                            onValueChange={(val) => {
                              if (val) handleAttendanceChange(student.id, val);
                            }}
                            className="gap-2"
                          >
                            <ToggleGroupItem
                              value="present"
                              className={`px-4 py-2 text-xs font-semibold ${student.today_status === "present" ? "bg-green-500 text-white" : "bg-white border-2 border-green-200 text-green-700"}`}
                            >
                              <Check className="h-3 w-3 mr-1" /> Present
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="absent"
                              className={`px-4 py-2 text-xs font-semibold ${student.today_status === "absent" ? "bg-red-500 text-white" : "bg-white border-2 border-red-200 text-red-700"}`}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" /> Absent
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="late"
                              className={`px-4 py-2 text-xs font-semibold ${student.today_status === "late" ? "bg-amber-500 text-white" : "bg-white border-2 border-amber-200 text-amber-700"}`}
                            >
                              <Clock className="h-3 w-3 mr-1" /> Late
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </div>
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

          <div className="col-span-4 space-y-6">
            <Card className="border border-gray-200 shadow-lg">
              <CardHeader className="border-b border-gray-200 bg-gray-50">
                <CardTitle className="text-base">Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center">
                <div className="relative">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={attendanceData}
                        cx={100}
                        cy={100}
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {attendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold text-[#1e3a8a]">
                      {attendancePercentage}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-lg">
              <CardHeader className="border-b border-gray-200 bg-red-50">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-base text-red-900">
                    Frequent Absentees
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {absentees.map((absentee) => (
                  <div
                    key={absentee.id}
                    className="flex items-center gap-3 p-3 bg-white border border-red-100 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                    onClick={() => handleStudentClick(absentee.id)}
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-red-200">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${absentee.name}`}
                      />
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {absentee.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Last:{" "}
                        {new Date(absentee.lastAbsent).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        {absentee.absences}
                      </div>
                      <div className="text-[10px] text-gray-500">absences</div>
                    </div>
                  </div>
                ))}
                {absentees.length === 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    No absences recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}