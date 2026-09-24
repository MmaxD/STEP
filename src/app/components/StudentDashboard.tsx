import { useState, useEffect } from "react";
import { Calendar, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { API_BASE_URL } from "../../apiConfig";

export function StudentDashboard() {
  const [schedule, setSchedule] = useState<any[]>([
    { day: "MON", classes: [] },
    { day: "TUE", classes: [] },
    { day: "WED", classes: [] },
    { day: "THU", classes: [] },
    { day: "FRI", classes: [] },
  ]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("Student");
  const [studentClass, setStudentClass] = useState("Unassigned");

  // Dynamically get today's date for the header
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

useEffect(() => {
  const fetchStudentData = async () => {
    try {
      setLoading(true);
      // 1. Get logged-in user credentials from localStorage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      // 2. Fetch all students to find this specific student's database record
      const studentRes = await fetch(`${API_BASE_URL}/students`);
      const students = await studentRes.json();

      // Match by email
      const myRecord =
        students.find((s: any) => s.email === currentUser.email) || students[0];

      if (myRecord) {
        setStudentName(myRecord.name ? myRecord.name.split(" ")[0] : "Student");

        const className =
          myRecord.enrolled_class || myRecord.enrolledClass || "Unassigned";
        setStudentClass(className);

        if (className !== "Unassigned") {
          // BULLETPROOF FORMATTING: Extracts only the digits and the letter
          const classMatch = className.match(/(\d+)[^A-Za-z]*([A-Za-z])/);
          // Keep the exact spacing from the database (e.g., "11 - A" or "10-B")
          const formattedClass = className.replace(/Grade\s*/i, "").trim();

          // 3. Fetch timetable (using encodeURIComponent just in case the spaces confuse the URL)
          const timeRes = await fetch(
            `${API_BASE_URL}/timetable/${encodeURIComponent(formattedClass)}`,
          );

          if (timeRes.ok) {
            const timeData = await timeRes.json();
            const actualArray = Array.isArray(timeData)
              ? timeData
              : timeData.data || [];

            if (actualArray.length > 0) {
              const days = [
                { full: "Monday", short: "MON" },
                { full: "Tuesday", short: "TUE" },
                { full: "Wednesday", short: "WED" },
                { full: "Thursday", short: "THU" },
                { full: "Friday", short: "FRI" },
              ];

              const mappedSchedule = days.map((d) => {
                const dayBlocks = actualArray.filter((block: any) => {
                  const dbDay = (block.day_of_week || "").trim().toLowerCase();
                  return (
                    dbDay === d.full.toLowerCase() ||
                    dbDay === d.short.toLowerCase()
                  );
                });

                dayBlocks.sort((a, b) =>
                  (a.start_time || "").localeCompare(b.start_time || ""),
                );
                const classList = dayBlocks.map(
                  (block: any) => block.subject || "Class",
                );

                return { day: d.short, classes: classList };
              });

              setSchedule(mappedSchedule);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchStudentData();
}, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8 max-w-[1440px] mx-auto">
        {/* Personalized Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl mb-2 font-bold" style={{ color: "#2563eb" }}>
            Welcome back, {studentName}!
          </h1>
          <p className="text-gray-600 font-medium">
            {today} &nbsp;|&nbsp;{" "}
            <span className="text-blue-600">{studentClass}</span>
          </p>
        </div>

        {/* Full-Width Weekly Schedule */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4 border-b border-gray-100 mb-4 bg-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{ color: "#2563eb" }} />
              <CardTitle className="text-xl">Weekly Schedule</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {schedule.map((day, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-gray-50/50 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="text-center mb-4 pb-3 border-b border-gray-200">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                      {day.day}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {day.classes && day.classes.length > 0 ? (
                      day.classes.map((cls: string, idx: number) => (
                        <div
                          key={idx}
                          className="text-sm p-3 rounded-lg text-center font-semibold shadow-sm transition-transform hover:scale-[1.02]"
                          style={{
                            backgroundColor: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                          }}
                        >
                          {cls}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 text-center italic py-6">
                        No classes scheduled
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
