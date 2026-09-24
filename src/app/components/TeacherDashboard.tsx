import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../apiConfig";
import {
  Check,
  Bell,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Target,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface ClassSession {
  id: string;
  time: string;
  subject: string;
  grade: string;
  room: string;
  type: "regular" | "relief";
  status: "upcoming" | "current" | "completed";
}

interface Student {
  id: string;
  name: string;
  photo: string;
  gpa: number | string;
  attendance: number;
  performanceData: number[];
  gpaData: { month: string; gpa: number }[];
  focusAreas: {
    topic: string;
    status: "needs-attention" | "improving" | "good";
  }[];
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  time: string;
  priority: "high" | "medium" | "low";
}

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
    case "needs-attention":
      return "bg-red-100 text-red-700 border-red-200";
    case "improving":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "good":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export function TeacherDashboard() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dailySchedule, setDailySchedule] = useState<ClassSession[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Dynamic Homeroom States
  const [homeroomClass, setHomeroomClass] = useState<string | null>(null);
  const [realHomeroomStudents, setRealHomeroomStudents] = useState<Student[]>(
    [],
  );

  // NEW: Dynamic Announcements State
  const [activeAnnouncements, setActiveAnnouncements] = useState<
    Announcement[]
  >([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const validClasses = dailySchedule.filter(
    (s) => s.subject !== "Free" && s.subject !== "Interval",
  ).length;

  const reliefClasses = dailySchedule.filter((s) => s.type === "relief").length;

  const getCurrentSession = () => {
    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    for (const session of dailySchedule) {
      if (!session.time.includes("-")) continue;
      const parts = session.time.split("-");
      if (parts.length !== 2) continue;
      const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.trim().split(":").map(Number);
        return h * 60 + m;
      };
      if (
        currentMins >= parseTime(parts[0]) &&
        currentMins <= parseTime(parts[1])
      ) {
        return session;
      }
    }
    return null;
  };

  const activeSession = getCurrentSession();
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // 1. Fetch Timetable
  useEffect(() => {
    const teacherId = localStorage.getItem("loggedInUserId") || "1";
    fetch(`${API_BASE_URL}/api/timetable/${teacherId}`)
      .then((res) => res.json())
      .then((data) => {
        const currentDayName = new Date().toLocaleDateString("en-US", {
          weekday: "long",
        });
        let todayRow = data.find(
          (row: any) => row.day_of_week === currentDayName,
        );
        if (!todayRow)
          todayRow =
            data.find((row: any) => row.day_of_week === "Monday") || data[0];

        if (todayRow) {
          const parsedSessions: ClassSession[] = [];
          let idCounter = 1;

          const addSession = (dbKey: string, timeLabel: string) => {
            const dbValue = todayRow[dbKey];
            if (dbValue && dbValue !== "-" && dbValue.trim() !== "") {
              let subject = dbValue;
              let grade = "-";
              let type: "regular" | "relief" = dbValue
                .toLowerCase()
                .includes("relief")
                ? "relief"
                : "regular";

              if (dbValue.includes("(") && dbValue.includes(")")) {
                const parts = dbValue.split("(");
                subject = parts[0].trim();
                grade = parts[1].replace(")", "").trim();
              }

              let status: "completed" | "current" | "upcoming" = "upcoming";
              const [startStr, endStr] = timeLabel.split(" - ");
              const startMins =
                parseInt(startStr.split(":")[0]) * 60 +
                parseInt(startStr.split(":")[1]);
              const endMins =
                parseInt(endStr.split(":")[0]) * 60 +
                parseInt(endStr.split(":")[1]);
              const currentMins =
                new Date().getHours() * 60 + new Date().getMinutes();

              if (currentMins > endMins) status = "completed";
              else if (currentMins >= startMins && currentMins <= endMins)
                status = "current";

              parsedSessions.push({
                id: String(idCounter++),
                time: timeLabel,
                subject,
                grade,
                room: "-",
                type,
                status,
              });
            }
          };

          addSession("7:45 - 8:25 AM", "07:45 - 08:25");
          addSession("8:25 - 9:05 AM", "08:25 - 09:05");
          addSession("9:05 - 9:45 AM", "09:05 - 09:45");
          addSession("9:45 - 10:25 AM", "09:45 - 10:25");
          addSession("10:25 - 11:05 AM", "10:25 - 11:05");
          addSession("11:05 - 11:30 AM", "11:05 - 11:30");
          addSession("11:30 - 12:10 PM", "11:30 - 12:10");
          addSession("12:10 - 12:50 PM", "12:10 - 12:50");
          addSession("12:50 - 1:30 PM", "12:50 - 13:30");

          setDailySchedule(parsedSessions);
        }
      })
      .catch(console.error);
  }, []);

  // 2. Fetch Homeroom Data
  useEffect(() => {
    const loadHomeroomData = async () => {
      const teacherId = localStorage.getItem("loggedInUserId") || "1";
      try {
        const hrRes = await fetch(
          `${API_BASE_URL}/api/teacher-homeroom/${teacherId}`,
        );
        const hrData = await hrRes.json();

        if (hrData.hasHomeroom && hrData.className) {
          setHomeroomClass(hrData.className);
          const studentsRes = await fetch(
            `${API_BASE_URL}/homeroom/${encodeURIComponent(hrData.className)}`,
          );
          const studentsData = await studentsRes.json();

          if (Array.isArray(studentsData)) {
            const mappedStudents = studentsData.map((s: any) => ({
              id: s.studentId
                ? `STU-${String(s.studentId).padStart(4, "0")}`
                : "New",
              name: s.name,
              photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`,
              gpa: (Math.random() * (4.0 - 2.8) + 2.8).toFixed(1),
              attendance: s.attendance_rate
                ? Math.round(s.attendance_rate)
                : 100,
              performanceData: [70, 75, 72, 80, 85, 82, 90],
              gpaData: [
                { month: "Sep", gpa: 3.2 },
                { month: "Oct", gpa: 3.4 },
                { month: "Nov", gpa: 3.5 },
                { month: "Dec", gpa: 3.8 },
              ],
              focusAreas: [{ topic: "General Academics", status: "good" }],
            }));
            setRealHomeroomStudents(mappedStudents);
          }
        } else {
          setHomeroomClass(null);
        }
      } catch (err) {
        console.error("Failed to load homeroom widget data:", err);
      }
    };
    loadHomeroomData();
  }, []);

  // 3. Fetch Announcements Data
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/announcements`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map((a: any) => ({
            id: String(a.id),
            title: a.title,
            message: a.message,
            priority: a.priority,
            time: new Date(a.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }),
          }));
          setActiveAnnouncements(formatted);
        }
      })
      .catch(console.error);
  }, []);

  const teacherName = localStorage.getItem("userName") || "Teacher";

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="flex max-w-[1440px] mx-auto">
        {/* Daily Schedule Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#1e3a8a" }}
              >
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Daily Schedule
                </h2>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {dailySchedule.map((session) => (
              <Card
                key={session.id}
                className={`border shadow-sm transition-all ${
                  session.type === "relief"
                    ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200"
                    : session.status === "current"
                      ? "bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-300 ring-2 ring-teal-200"
                      : "bg-white border-gray-200"
                } ${session.status === "completed" ? "opacity-60" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-700">
                        {session.time}
                      </span>
                    </div>
                    {session.type === "relief" && (
                      <Badge className="bg-orange-500 text-white text-[10px] px-2 py-0">
                        Relief
                      </Badge>
                    )}
                    {session.status === "current" && (
                      <Badge className="bg-teal-600 text-white text-[10px] px-2 py-0">
                        Now
                      </Badge>
                    )}
                    {session.status === "completed" && (
                      <Badge className="bg-gray-400 text-white text-[10px] px-2 py-0">
                        <Check className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {session.subject}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{session.grade}</span>
                    {session.room !== "-" && (
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

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#14b8a6] rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  Welcome back, {teacherName}
                </h1>
                <p className="text-sm text-white/80">
                  You have {validClasses} classes and {reliefClasses} relief
                  periods today
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{formattedTime}</div>
                <div className="text-sm text-white/80">
                  {activeSession
                    ? `Current Period: ${activeSession.subject}`
                    : "Currently: Free / No Active Class"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Card className="border border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-100 bg-gray-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "#1e3a8a" }}
                  >
                    <Bell className="h-4 w-4 text-white" />
                  </div>
                  Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-[280px] overflow-y-auto">
                {activeAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-3 rounded-lg border ${
                      announcement.priority === "high"
                        ? "bg-red-50 border-red-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {announcement.title}
                      </h4>
                      {announcement.priority === "high" && (
                        <Badge className="bg-red-500 text-white text-[10px] px-2 py-0">
                          High
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {announcement.message}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      {announcement.time}
                    </span>
                  </div>
                ))}
                {activeAnnouncements.length === 0 && (
                  <div className="text-center text-sm text-gray-500 py-4">
                    No recent announcements.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* DYNAMIC HOMEROOM WIDGET */}
          {homeroomClass && (
            <Card className="border border-gray-200 shadow-md animate-in fade-in slide-in-from-bottom-4">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-[#1e3a8a]/5 to-[#14b8a6]/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#1e3a8a] to-[#14b8a6]">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        My Class Performance - {homeroomClass}
                      </CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Homeroom Teacher View • {realHomeroomStudents.length}{" "}
                        Students
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-[#1e3a8a] to-[#14b8a6] text-white px-3 py-1">
                    Homeroom Teacher
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {realHomeroomStudents.map((student) => (
                    <div key={student.id}>
                      <div
                        onClick={() =>
                          setSelectedStudent(
                            selectedStudent?.id === student.id ? null : student,
                          )
                        }
                        className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-gray-200">
                          <AvatarImage src={student.photo} />
                          <AvatarFallback className="bg-gradient-to-br from-[#1e3a8a] to-[#14b8a6] text-white">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {student.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0"
                            >
                              {student.id}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>
                              GPA:{" "}
                              <strong style={{ color: "#14b8a6" }}>
                                {student.gpa}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Attendance: <strong>{student.attendance}%</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right mr-2">
                            <div className="text-[10px] text-gray-500 mb-1">
                              Performance Trend
                            </div>
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
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <TrendingUp className="h-4 w-4 text-teal-600" />
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    GPA Trend
                                  </h4>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                  <ResponsiveContainer
                                    width="100%"
                                    height={120}
                                  >
                                    <LineChart data={student.gpaData}>
                                      <Line
                                        type="monotone"
                                        dataKey="gpa"
                                        stroke="#14b8a6"
                                        strokeWidth={3}
                                        dot={{ fill: "#14b8a6", r: 4 }}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                  <div className="flex justify-between mt-2">
                                    {student.gpaData.map((data, idx) => (
                                      <div key={idx} className="text-center">
                                        <div className="text-[10px] text-gray-500">
                                          {data.month}
                                        </div>
                                        <div className="text-xs font-semibold text-gray-900">
                                          {data.gpa}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <Target className="h-4 w-4 text-[#1e3a8a]" />
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    Focus Areas
                                  </h4>
                                </div>
                                <div className="space-y-2">
                                  {student.focusAreas.map((area, idx) => (
                                    <div
                                      key={idx}
                                      className={`p-3 rounded-lg border ${getFocusStatusColor(
                                        area.status,
                                      )}`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold">
                                          {area.topic}
                                        </span>
                                        {area.status === "needs-attention" && (
                                          <AlertCircle className="h-3 w-3" />
                                        )}
                                        {area.status === "improving" && (
                                          <TrendingUp className="h-3 w-3" />
                                        )}
                                        {area.status === "good" && (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </div>
                                      <div className="text-[10px] mt-1 capitalize">
                                        {area.status.replace("-", " ")}
                                      </div>
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
                  {realHomeroomStudents.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                      No students currently assigned to your homeroom.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
