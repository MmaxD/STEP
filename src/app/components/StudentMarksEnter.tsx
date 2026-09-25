import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../apiConfig";
import {
  X,
  BookOpen,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  BarChart3,
  Award,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = "submitted" | "graded" | "late";

interface Student {
  id: number;
  name: string;
  initials: string;
  status: Status;
  studentId: string;
}

type SubjectMarks = {
  [subject: string]: number | "";
};

type MarksStore = {
  [studentId: number]: SubjectMarks;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-teal-100 text-teal-800",
  "bg-purple-100 text-purple-800",
  "bg-amber-100 text-amber-800",
  "bg-pink-100 text-pink-800",
  "bg-green-100 text-green-800",
  "bg-rose-100 text-rose-800",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function calcAverage(subjectMarks: SubjectMarks | undefined): number | null {
  if (!subjectMarks) return null;
  const values = Object.values(subjectMarks).filter(
    (v): v is number => v !== "" && !isNaN(Number(v)),
  );
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function calcTotal(subjectMarks: SubjectMarks): number {
  return Object.values(subjectMarks)
    .filter((v): v is number => v !== "" && !isNaN(Number(v)))
    .reduce((a, b) => a + b, 0);
}

function computeRanks(
  students: Student[],
  marksStore: MarksStore,
): { rankMap: Record<number, number>; rankedTotal: number } {
  const ranked = students
    .map((s) => ({ id: s.id, avg: calcAverage(marksStore[s.id]) }))
    .filter((s): s is { id: number; avg: number } => s.avg !== null)
    .sort((a, b) => b.avg - a.avg);

  const rankMap: Record<number, number> = {};
  ranked.forEach((s, i) => {
    rankMap[s.id] = i + 1;
  });

  return { rankMap, rankedTotal: ranked.length };
}

// Logic to determine grade category based on class name
function getGradeCategory(className: string): string {
  if (!className) return "10-11";
  if (
    className.includes("6") ||
    className.includes("7") ||
    className.includes("8") ||
    className.includes("9")
  )
    return "6-9";
  if (className.includes("10") || className.includes("11")) return "10-11";
  if (className.includes("12")) return "12";
  return "10-11"; // Fallback
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function StudentMarkEntry() {
  const [students, setStudents] = useState<Student[]>([]);
  const [marksStore, setMarksStore] = useState<MarksStore>({});

  // Dynamic Subjects from DB
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [subjectMap, setSubjectMap] = useState<Record<string, number>>({});

  // Dynamic Class Display
  const [classNameDisplay, setClassNameDisplay] =
    useState<string>("Loading Class...");

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [draftMarks, setDraftMarks] = useState<SubjectMarks>({});

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // 1. Fetch class data and specific subjects from backend on mount
  useEffect(() => {
    const fetchData = async () => {
      const teacherId = localStorage.getItem("loggedInUserId") || "1";
      try {
        // Step 1: Get students to determine the class name and category
        const stdRes = await fetch(
          `${API_BASE_URL}/api/homeroom/${teacherId}/students`,
        );
        const stdData = await stdRes.json();

        let currentClassName = "Unassigned Class";
        let category = "10-11";

        if (stdData.length > 0) {
          currentClassName = stdData[0].class_name || "Unassigned Class";
          category = getGradeCategory(currentClassName);
        }

        setClassNameDisplay(currentClassName);

        // Step 2: Fetch only the subjects that belong to this class's category
        const subRes = await fetch(
          `${API_BASE_URL}/curriculum-subjects?category=${category}`,
        );
        const subData = await subRes.json();

        const fetchedSubjects: string[] = [];
        const fetchedMap: Record<string, number> = {};

        subData.forEach((row: any) => {
          if (!fetchedSubjects.includes(row.subject_name)) {
            fetchedSubjects.push(row.subject_name);
          }
          fetchedMap[row.subject_name] = row.id;
        });

        setSubjectsList(fetchedSubjects);
        setSubjectMap(fetchedMap);

        // Step 3: Populate Students and Marks Store
        const formattedStudents: Record<number, Student> = {};
        const formattedMarks: MarksStore = {};

        stdData.forEach((row: any) => {
          if (!formattedStudents[row.id]) {
            const initials = row.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();
            formattedStudents[row.id] = {
              id: row.id,
              name: row.name,
              initials: initials,
              status: "submitted",
              studentId: `STU-2026-${1000 + row.id}`,
            };

            const emptyMarks: SubjectMarks = {};
            fetchedSubjects.forEach((sub) => {
              emptyMarks[sub] = "";
            });
            formattedMarks[row.id] = emptyMarks;
          }

          // Only apply the score if the subject actually belongs to this category!
          if (
            row.subject_name &&
            row.score !== null &&
            fetchedSubjects.includes(row.subject_name)
          ) {
            formattedMarks[row.id][row.subject_name] = row.score;
            formattedStudents[row.id].status = "graded";
          }
        });

        setStudents(Object.values(formattedStudents));
        setMarksStore(formattedMarks);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  // ── Computations ─────────────────────────────────────────────────────────────
  const { rankMap, rankedTotal } = computeRanks(students, marksStore);

  const pendingStudents = students.filter(
    (s) => calcAverage(marksStore[s.id]) === null,
  );
  const rankedStudents = students
    .filter((s) => calcAverage(marksStore[s.id]) !== null)
    .sort((a, b) => (rankMap[a.id] ?? 99) - (rankMap[b.id] ?? 99));

  const allStudentsList = [...pendingStudents, ...rankedStudents];

  const totalStudents = students.length;
  const gradedCount = rankedStudents.length;
  const pendingCount = pendingStudents.length;
  const overallAvg =
    rankedStudents.length > 0
      ? Math.round(
          rankedStudents.reduce(
            (acc, s) => acc + (calcAverage(marksStore[s.id]) || 0),
            0,
          ) / rankedStudents.length,
        )
      : 0;
  const progressPct =
    totalStudents > 0 ? Math.round((gradedCount / totalStudents) * 100) : 0;

  const topPerformers = rankedStudents.slice(0, 3);

  // ── Modal helpers ────────────────────────────────────────────────────────────
  function openModal(student: Student) {
    setSelectedStudent(student);
    setDraftMarks({ ...marksStore[student.id] });
  }

  function closeModal() {
    setSelectedStudent(null);
    setDraftMarks({});
  }

  // Save to backend
  async function saveMarks() {
    if (!selectedStudent) return;

    const teacherId = localStorage.getItem("loggedInUserId") || "1";

    const marksPayload = Object.entries(draftMarks)
      .filter(([_, score]) => score !== "")
      .map(([subjectName, score]) => ({
        subject_id: subjectMap[subjectName],
        score: Number(score),
      }));

    if (marksPayload.length === 0) {
      closeModal();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/student-marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: teacherId,
          student_id: selectedStudent.id,
          marks: marksPayload,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMarksStore((prev) => ({
          ...prev,
          [selectedStudent.id]: { ...draftMarks },
        }));
        setStudents((prev) =>
          prev.map((s) =>
            s.id === selectedStudent.id ? { ...s, status: "graded" } : s,
          ),
        );
        closeModal();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to save marks", error);
      alert("Network error. Could not reach the server.");
    }
  }

  function handleMarkChange(subject: string, value: string) {
    const parsed =
      value === "" ? "" : Math.min(100, Math.max(0, Number(value)));
    setDraftMarks((prev) => ({ ...prev, [subject]: parsed }));
  }

  const draftTotal = calcTotal(draftMarks);
  const filledCount = Object.values(draftMarks).filter((v) => v !== "").length;
  // Dynamically calculate the average out of the specific number of subjects for this grade category
  const draftPct =
    filledCount > 0 && subjectsList.length > 0
      ? Math.round(draftTotal / subjectsList.length)
      : 0;

  const selectedIndex = selectedStudent
    ? students.findIndex((s) => s.id === selectedStudent.id)
    : 0;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50 p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* 1. Header Card (Matching Theme) */}
        <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 shadow-inner">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {classNameDisplay} Marks Entry
                </h1>
                <p className="text-sm text-gray-500">
                  Homeroom Management • Term 1
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" />
                {currentDate}
              </div>
              <Button
                onClick={() => window.print()}
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm font-medium print:hidden"
              >
                Print Grades
              </Button>
            </div>
          </div>

          {/* 2. Metric Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 pt-0">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-green-700 mb-1 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" /> Graded
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {gradedCount}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-amber-700 mb-1 text-sm font-medium">
                <Clock className="h-4 w-4" /> Pending
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {pendingCount}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-blue-700 mb-1 text-sm font-medium">
                <BarChart3 className="h-4 w-4" /> Class Average
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {overallAvg > 0 ? `${overallAvg}%` : "-"}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-gray-600 mb-1 text-sm font-medium">
                <Users className="h-4 w-4" /> Total Students
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {totalStudents}
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Student List */}
          <Card className="lg:col-span-2 border-gray-200 shadow-sm rounded-xl bg-white overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-white pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800">
                Student Roster
              </CardTitle>
            </CardHeader>
            <div className="flex flex-col">
              {allStudentsList.map((student, index) => {
                const avg = calcAverage(marksStore[student.id]);
                const rank = rankMap[student.id] ?? null;
                const isGraded = avg !== null;

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-gray-200 shadow-sm">
                        <AvatarFallback
                          className={`text-sm font-medium ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                        >
                          {student.initials}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {student.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>{student.studentId}</span>
                          {isGraded && (
                            <>
                              <span>•</span>
                              <span>
                                Avg: <strong>{avg}%</strong>
                              </span>
                              {rank && (
                                <>
                                  <span>•</span>
                                  <span>Rank: {ordinal(rank)}</span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isGraded ? (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-md border border-green-200 bg-green-50 text-green-700 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Graded
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium">
                          <Clock className="h-3.5 w-3.5" /> Pending
                        </div>
                      )}

                      <button
                        onClick={() => openModal(student)}
                        className={`print:hidden text-xs px-4 py-1.5 rounded-md font-medium transition-colors border ${
                          isGraded
                            ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                            : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                        }`}
                      >
                        {isGraded ? "Edit Marks" : "Enter Marks"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {allStudentsList.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No students found.
                </div>
              )}
            </div>
          </Card>

          {/* RIGHT COLUMN: Sidebar Overview */}
          <div className="space-y-6">
            {/* Overview Donut/Progress Placeholder */}
            <Card className="border-gray-200 shadow-sm rounded-xl bg-white">
              <CardHeader className="border-b border-gray-100 pb-3">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Grading Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-[12px] border-gray-100 mb-2">
                  {/* Fake Progress Ring */}
                  <svg
                    className="absolute inset-0 w-full h-full transform -rotate-90"
                    viewBox="0 0 36 36"
                  >
                    <path
                      className="text-teal-500"
                      strokeDasharray={`${progressPct}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                  </svg>
                  <span className="text-3xl font-bold text-gray-800">
                    {progressPct}%
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {gradedCount} of {totalStudents} students graded
                </p>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card className="border-teal-100 shadow-sm rounded-xl bg-gradient-to-b from-teal-50/50 to-white">
              <CardHeader className="border-b border-teal-100/50 pb-3">
                <CardTitle className="text-base font-semibold text-teal-800 flex items-center gap-2">
                  <Award className="h-4 w-4" /> Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {topPerformers.length > 0 ? (
                  topPerformers.map((student, idx) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-teal-100 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-teal-100 text-teal-700 font-medium">
                            {student.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {student.name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Rank: {ordinal(idx + 1)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-teal-600">
                          {calcAverage(marksStore[student.id])}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Waiting for grades to be entered.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {selectedStudent && (
        <div
          className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 shadow-sm border border-gray-200">
                  <AvatarFallback
                    className={`text-sm font-medium ${AVATAR_COLORS[selectedIndex % AVATAR_COLORS.length]}`}
                  >
                    {selectedStudent.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {selectedStudent.name}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedStudent.studentId}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Subject Scores
                </p>
                <span className="text-[10px] text-gray-400">Max 100</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {subjectsList.map((subject) => (
                  <div key={subject} className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700 block">
                      {subject}
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0"
                        value={
                          draftMarks[subject] === "" ||
                          draftMarks[subject] === undefined
                            ? ""
                            : draftMarks[subject]
                        }
                        onChange={(e) =>
                          handleMarkChange(subject, e.target.value)
                        }
                        className="h-10 text-sm font-medium pr-8 focus:ring-teal-500 focus:border-teal-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Calculated Average
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {filledCount} of {subjectsList.length} subjects entered
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-teal-600">
                    {draftPct}%
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1 font-medium border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveMarks}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm"
                >
                  Save Marks
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
