import { useState, useMemo, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  Clock,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Save,
  AlertTriangle,
  TrendingUp, // Added TrendingUp for the stats card
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { API_BASE } from "@/config";
import { API_BASE_URL } from "../../apiConfig";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

interface Class {
  id: string;
  subject: string;
  teacher: string;
  teacher_id?: number | null;
  room: string;
  grade: string;
  section: string;
  color: string;
  periodsPerWeek: number;
}

interface TimeSlot {
  time: string;
  label: string;
}

const timeSlots: TimeSlot[] = [
  { time: "07:45", label: "7:45 - 8:25 AM" },
  { time: "08:25", label: "8:25 - 9:05 AM" },
  { time: "09:05", label: "9:05 - 9:45 AM" },
  { time: "09:45", label: "9:45 AM - 10:25 PM" },
  { time: "10:25", label: "10:25 - 11:05 PM" },
  { time: "11:05", label: "11:05 - 11:30 PM" },
  { time: "11:30", label: "11:30 - 12:10 PM" },
  { time: "12:10", label: "12:10 - 12:50 PM" },
  { time: "12:50", label: "12:50 - 13:30 PM" },
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// ---------------- COMPONENTS ----------------

const ClassCard = ({
  classInfo,
  remaining,
}: {
  classInfo: Class;
  remaining: number;
}) => {
  const isDraggable = remaining > 0;
  const [{ opacity }, drag] = useDrag(
    () => ({
      type: "class",
      item: classInfo,
      canDrag: isDraggable,
      collect: (monitor) => ({ opacity: monitor.isDragging() ? 0.4 : 1 }),
    }),
    [isDraggable, classInfo],
  );

  return (
    <div
      ref={isDraggable ? (drag as any) : null}
      style={{
        opacity: isDraggable ? opacity : 0.4,
        borderLeftColor: isDraggable ? classInfo.color : "#cbd5e1",
      }}
      className={`bg-white border-l-4 border border-gray-200 rounded p-2 transition-shadow text-xs ${isDraggable ? "cursor-move hover:shadow-md" : "cursor-not-allowed bg-gray-50"}`}
    >
      <div className="flex justify-between items-start mb-0.5">
        <div
          className={`font-semibold truncate ${isDraggable ? "text-gray-900" : "text-gray-500"}`}
          title={classInfo.subject}
        >
          {classInfo.subject}
        </div>
        <Badge
          variant={remaining > 0 ? "default" : "secondary"}
          className={`text-[9px] px-1.5 py-0 h-4 flex-shrink-0 ml-1 ${remaining > 0 ? "bg-blue-100 text-blue-700" : ""}`}
        >
          {remaining} left
        </Badge>
      </div>
      <div
        className="text-gray-600 text-[10px] truncate"
        title={classInfo.teacher}
      >
        {classInfo.teacher}
      </div>
      <div className="flex items-center gap-1 mt-1">
        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
          {classInfo.room}
        </Badge>
        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
          {classInfo.section}
        </Badge>
      </div>
    </div>
  );
};

const DraggableScheduledClass = ({
  classInfo,
  day,
  time,
  onRemove,
}: {
  classInfo: Class;
  day: string;
  time: string;
  onRemove: () => void;
}) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "class",
      item: { ...classInfo, sourceDay: day, sourceTime: time },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [classInfo, day, time],
  );

  return (
    <div
      ref={drag as any}
      style={{
        borderLeftColor: classInfo.color,
        opacity: isDragging ? 0.3 : 1,
      }}
      className="bg-gradient-to-r from-gray-50 to-white border-l-4 border border-gray-200 rounded p-2 h-full relative group cursor-move hover:shadow-sm"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5 shadow-sm"
      >
        <Trash2 className="h-3 w-3 text-red-500 hover:text-red-700" />
      </button>
      <div className="text-xs font-semibold text-gray-900 mb-0.5 truncate">
        {classInfo.subject}
      </div>
      <div className="text-[10px] text-gray-600 truncate">
        {classInfo.teacher}
      </div>
      <div className="flex items-center gap-1 mt-1">
        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
          {classInfo.room}
        </Badge>
      </div>
    </div>
  );
};

const TimetableSlot = ({ day, time, classInfo, onDrop, onRemove }: any) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "class",
      drop: (item: any) => onDrop(day, time, item),
      collect: (monitor) => ({ isOver: monitor.isOver() }),
    }),
    [day, time],
  );

  return (
    <div
      ref={drop as any}
      className={`min-h-[80px] border border-gray-200 p-2 transition-all ${isOver ? "bg-blue-50 border-blue-400 border-2" : "bg-white"} ${!classInfo ? "hover:bg-gray-50" : ""}`}
    >
      {classInfo ? (
        <DraggableScheduledClass
          classInfo={classInfo}
          day={day}
          time={time}
          onRemove={() => onRemove(day, time)}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-300">
          <Plus className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

// ---------------- MAIN COMPONENT ----------------

export function TimetableBuilder() {
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);

  // NEW: State to hold the dynamic stats per class section
  const [classStatsMap, setClassStatsMap] = useState<
    Record<string, { total: number; avg: string }>
  >({});

  const [subjectSearchQuery, setSubjectSearchQuery] = useState<string>("");
  const [sectionSearchQuery, setSectionSearchQuery] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    subject_name: "",
    grade_category: "10-11",
    periods_per_week: 4,
    teacher_name: "",
    room_number: "",
    color: "#3b82f6",
  });

  const [timetable, setTimetable] = useState<
    Record<string, Record<string, Record<string, Class | null>>>
  >(() => {
    const initial: any = {};
    availableSections.forEach((section) => {
      initial[section] = {};
      days.forEach((day) => {
        initial[section][day] = {};
        timeSlots.forEach((slot) => {
          initial[section][day][slot.time] = null;
        });
      });
    });
    return initial;
  });

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getGradeCategory = (sectionName: string) => {
    if (
      sectionName.includes("6") ||
      sectionName.includes("7") ||
      sectionName.includes("8") ||
      sectionName.includes("9")
    )
      return "6-9";
    if (sectionName.includes("10") || sectionName.includes("11"))
      return "10-11";
    return "12";
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const resSections = await fetch(
          `${API_BASE_URL}/classes/with-students`,
        );
        const dataSections = await resSections.json();

        let uniqueSections: string[] = [];

        if (Array.isArray(dataSections)) {
          // Calculate stats for all sections
          const statsObj: Record<string, { total: number; avg: string }> = {};

          dataSections.forEach((c: any) => {
            const cleanName = (c.class_name || "").replace("Grade ", "").trim();
            const uniqueStudents = new Map();
            let totalScore = 0;
            let scoreCount = 0;

            if (c.students) {
              c.students.forEach((s: any) => {
                uniqueStudents.set(s.id, s);
                if (
                  s.grade !== null &&
                  s.grade !== undefined &&
                  s.grade !== ""
                ) {
                  totalScore += Number(s.grade);
                  scoreCount++;
                }
              });
            }

            statsObj[cleanName] = {
              total: uniqueStudents.size,
              avg:
                scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : "N/A",
            };
          });

          setClassStatsMap(statsObj);

          let sections = dataSections.map((c: any) =>
            (c.class_name || "").replace("Grade ", "").trim(),
          );
          sections = sections.filter(
            (name: string) =>
              !name.startsWith("5") &&
              !name.startsWith("12") &&
              name.includes("-"),
          );
          uniqueSections = Array.from(new Set(sections)).sort();
          setAvailableSections(uniqueSections);

          if (uniqueSections.length > 0) setSelectedSection(uniqueSections[0]);

          const emptyTimetable: Record<
            string,
            Record<string, Record<string, Class | null>>
          > = {};
          uniqueSections.forEach((sec) => {
            emptyTimetable[sec] = {};
            days.forEach((day) => {
              emptyTimetable[sec][day] = {};
              timeSlots.forEach((slot) => {
                emptyTimetable[sec][day][slot.time] = null;
              });
            });
          });

          try {
            const resSchedule = await fetch(`${API_BASE_URL}/schedules`);
            if (resSchedule.ok) {
              const scheduleData = await resSchedule.json();
              if (scheduleData && scheduleData.timetable)
                setTimetable({ ...emptyTimetable, ...scheduleData.timetable });
              else setTimetable(emptyTimetable);
            } else setTimetable(emptyTimetable);
          } catch {
            setTimetable(emptyTimetable);
          }
        }

        const resFaculty = await fetch(`${API_BASE_URL}/faculty`);
        if (resFaculty.ok) {
          const dataFaculty = await resFaculty.json();
          setFacultyList(Array.isArray(dataFaculty) ? dataFaculty : []);
        }
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    };

    fetchInitialData();
  }, []);

  const fetchSubjects = async () => {
    const category = getGradeCategory(selectedSection);
    try {
      const res = await fetch(
        `${API_BASE_URL}/curriculum-subjects?category=${category}`,
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        const formattedClasses: Class[] = data.map((course: any) => ({
          id: `${course.subject_name.toLowerCase().replace(/\s+/g, "-")}-${selectedSection.toLowerCase()}`,
          subject: course.subject_name,
          teacher: course.teacher_name,
          teacher_id: course.teacher_id || null,
          room: course.room_number,
          section: selectedSection,
          grade: category,
          color: course.color || "#3b82f6",
          periodsPerWeek: course.periods_per_week,
        }));
        setAvailableClasses(formattedClasses);
      } else setAvailableClasses([]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedSection) fetchSubjects();
  }, [selectedSection]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/curriculum-subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubject),
      });
      setIsAddSubjectOpen(false);
      setNewSubject({
        subject_name: "",
        grade_category: "10-11",
        periods_per_week: 4,
        teacher_name: "",
        room_number: "",
        color: "#3b82f6",
      });
      fetchSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  const getRemainingPeriods = (
    classId: string,
    totalPeriods: number,
    targetSection: string,
  ) => {
    let scheduledCount = 0;
    const sectionTimetable = timetable[targetSection] || {};
    Object.values(sectionTimetable).forEach((daySchedule: any) => {
      Object.values(daySchedule).forEach((scheduledClass: any) => {
        if (scheduledClass?.id === classId) scheduledCount++;
      });
    });
    return totalPeriods - scheduledCount;
  };

  const handleDrop = (targetDay: string, targetTime: string, item: any) => {
    setTimetable((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const section = item.section;
      if (item.sourceDay && item.sourceTime)
        next[section][item.sourceDay][item.sourceTime] = null;
      const classData = { ...item };
      delete classData.sourceDay;
      delete classData.sourceTime;
      next[section][targetDay][targetTime] = classData;
      return next;
    });
  };

  const handleRemove = (day: string, time: string) => {
    setTimetable((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[selectedSection][day][time] = null;
      return next;
    });
  };

  const executeAutoGenerate = async () => {
    setShowConfirmModal(false);
    if (availableSections.length === 0)
      return showNotification("No class sections found.", "error");

    try {
      showNotification("Building constraints for all classes...", "success");
      const categories = ["6-9", "10-11", "12"];
      const categorySubjectMap: Record<string, any[]> = {};

      await Promise.all(
        categories.map(async (cat) => {
          try {
            const res = await fetch(
              `${API_BASE_URL}/curriculum-subjects?category=${cat}`,
            );
            const data = await res.json();
            categorySubjectMap[cat] = Array.isArray(data) ? data : [];
          } catch (e) {
            categorySubjectMap[cat] = [];
          }
        }),
      );

      const schoolWideClasses: any[] = [];
      availableSections.forEach((sec) => {
        const cat = getGradeCategory(sec);
        const subjectsForCategory = categorySubjectMap[cat] || [];
        subjectsForCategory.forEach((course) => {
          schoolWideClasses.push({
            id: `${course.subject_name.toLowerCase().replace(/\s+/g, "-")}-${sec.toLowerCase()}`,
            subject: String(course.subject_name || "Subject"),
            teacher: String(course.teacher_name || "Unassigned"),
            teacher_id: course.teacher_id || null,
            room: String(course.room_number || `Room-${sec}`),
            section: sec,
            color: String(course.color || "#3b82f6"),
            periodsPerWeek: Number(course.periods_per_week) || 4,
          });
        });
      });

      if (schoolWideClasses.length === 0)
        return showNotification("No curriculum subjects found.", "error");

      const payload = {
        classes: schoolWideClasses,
        teachers: facultyList,
        days: days,
        timeSlots: timeSlots.map((slot) => slot.time),
      };
      const response = await fetch(`${API_BASE}/generate-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok)
        return showNotification(
          `Validation error: ${JSON.stringify(data.detail)}`,
          "error",
        );

      if (data.status === "success") {
        setTimetable(data.timetable);
        showNotification(
          `Master timetable generated for ${Object.keys(data.timetable).length} sections!`,
          "success",
        );
      } else {
        showNotification(`Solver failed: ${data.message}`, "error");
      }
    } catch (error) {
      console.error(error);
      showNotification("Failed to connect to backend server.", "error");
    }
  };

  const handleSaveSchedule = async () => {
    try {
      showNotification("Saving schedule to database...", "success");
      const flattenedSchedule: any[] = [];

      Object.entries(timetable).forEach(([section, daysObj]) => {
        Object.entries(daysObj).forEach(([day, slotsObj]) => {
          Object.entries(slotsObj).forEach(([time, classInfo]) => {
            if (classInfo) {
              flattenedSchedule.push({
                section: section,
                day: day,
                time_slot: time,
                class_id: classInfo.id,
                subject: classInfo.subject,
                teacher_id: classInfo.teacher_id || null,
                room: classInfo.room,
              });
            }
          });
        });
      });

      if (flattenedSchedule.length === 0)
        return showNotification(
          "Timetable is empty. Nothing to save.",
          "error",
        );

      const res = await fetch(`${API_BASE_URL}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedules: flattenedSchedule,
          raw_timetable: timetable,
        }),
      });

      if (res.ok)
        showNotification("Schedule successfully saved to database!", "success");
      else {
        const errorData = await res.json();
        showNotification(
          `Failed to save: ${errorData.message || "Database error"}`,
          "error",
        );
      }
    } catch (e) {
      console.error(e);
      showNotification("Error saving schedule to server.", "error");
    }
  };

  const visibleClasses = useMemo(() => {
    let filtered = availableClasses;
    if (subjectSearchQuery.trim() !== "") {
      const query = subjectSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.subject.toLowerCase().includes(query) ||
          c.teacher.toLowerCase().includes(query) ||
          c.room.toLowerCase().includes(query),
      );
    }
    return filtered;
  }, [availableClasses, subjectSearchQuery]);

  const visibleSections = useMemo(() => {
    if (sectionSearchQuery.trim() === "") return availableSections;
    return availableSections.filter((sec) =>
      sec.toLowerCase().includes(sectionSearchQuery.toLowerCase()),
    );
  }, [sectionSearchQuery, availableSections]);

  const currentStats = classStatsMap[selectedSection] || {
    total: 0,
    avg: "N/A",
  };

  return (
    <>
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <div className="bg-amber-100 p-2 rounded-full">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Overwrite Schedule?
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Auto-generating a new schedule will completely overwrite all
              current classes on the grid across <strong>all sections</strong>.
              Any manual changes you have made will be lost.
              <br />
              <br />
              Do you want to proceed?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={executeAutoGenerate}
              >
                Yes, Generate Schedule
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="border border-gray-200 shadow-sm relative">
        <CardHeader className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Master Timetable Builder
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Generate and edit schedules across all classes and sections
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirmModal(true)}
              >
                Auto-Generate Full School
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSaveSchedule}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Schedule
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {notification && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-4 ${notification.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}
            >
              {notification.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {notification.message}
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-200 pb-4">
            <div className="flex flex-wrap gap-2 flex-1">
              {visibleSections.length > 0 ? (
                visibleSections.map((section) => (
                  <Button
                    key={section}
                    variant={
                      selectedSection === section ? "default" : "outline"
                    }
                    onClick={() => {
                      setSelectedSection(section);
                      setSubjectSearchQuery("");
                    }}
                    className="min-w-[100px]"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {section}
                  </Button>
                ))
              ) : (
                <span className="text-sm text-gray-500 py-2">
                  No sections found.
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Find a section..."
                value={sectionSearchQuery}
                onChange={(e) => setSectionSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64 bg-white"
              />
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-4">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-4">
                {selectedSection} Classes - Drag to Schedule
                <Dialog
                  open={isAddSubjectOpen}
                  onOpenChange={setIsAddSubjectOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50 h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add New Card
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Curriculum Subject</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={handleAddSubject}
                      className="space-y-4 pt-4"
                    >
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Subject Name
                        </label>
                        <Input
                          placeholder="e.g. Computer Science"
                          value={newSubject.subject_name}
                          onChange={(e) =>
                            setNewSubject({
                              ...newSubject,
                              subject_name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Periods/Week
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={newSubject.periods_per_week}
                            onChange={(e) =>
                              setNewSubject({
                                ...newSubject,
                                periods_per_week: parseInt(e.target.value),
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Grade Category
                          </label>
                          <Select
                            value={newSubject.grade_category}
                            onValueChange={(val) =>
                              setNewSubject({
                                ...newSubject,
                                grade_category: val,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="6-9">Grades 6-9</SelectItem>
                              <SelectItem value="10-11">
                                Grades 10-11
                              </SelectItem>
                              <SelectItem value="12">Grade 12</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Teacher Name
                          </label>
                          <Select
                            value={newSubject.teacher_name}
                            onValueChange={(val) =>
                              setNewSubject({
                                ...newSubject,
                                teacher_name: val,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Teacher" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {facultyList.length > 0 ? (
                                facultyList.map((teacher: any) => (
                                  <SelectItem
                                    key={teacher.id}
                                    value={teacher.name}
                                  >
                                    {teacher.name} ({teacher.subject_specialty})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="unassigned" disabled>
                                  No teachers found
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Default Room
                          </label>
                          <Input
                            placeholder="e.g. Lab-1"
                            value={newSubject.room_number}
                            onChange={(e) =>
                              setNewSubject({
                                ...newSubject,
                                room_number: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-blue-600">
                        Create Subject Card
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search subjects, teachers..."
                  value={subjectSearchQuery}
                  onChange={(e) => setSubjectSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 min-h-[70px]">
              {visibleClasses.length > 0 ? (
                visibleClasses.map((classInfo) => {
                  const remaining = getRemainingPeriods(
                    classInfo.id,
                    classInfo.periodsPerWeek,
                    selectedSection,
                  );
                  return (
                    <ClassCard
                      key={classInfo.id}
                      classInfo={classInfo}
                      remaining={remaining}
                    />
                  );
                })
              ) : (
                <div className="col-span-full flex items-center justify-center text-sm text-gray-500 py-4">
                  No classes match "{subjectSearchQuery}"
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              <div className="grid grid-cols-[120px_repeat(5,1fr)] gap-px bg-gray-200 border border-gray-200">
                <div className="bg-gray-100 p-3 font-semibold text-xs text-gray-700">
                  Time
                </div>
                {days.map((day) => (
                  <div
                    key={day}
                    className="bg-gray-100 p-3 font-semibold text-xs text-gray-700 text-center"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-[120px_repeat(5,1fr)] gap-px bg-gray-200 border-l border-r border-b border-gray-200">
                {timeSlots.map((slot) => (
                  <div key={`row-${slot.time}`} className="contents">
                    <div className="bg-gray-50 p-3 text-xs text-gray-600">
                      <div className="font-semibold">{slot.time}</div>
                      <div className="text-[10px] text-gray-500">
                        {slot.label.split(" - ")[1]}
                      </div>
                    </div>
                    {days.map((day) => (
                      <TimetableSlot
                        key={`${day}-${slot.time}`}
                        day={day}
                        time={slot.time}
                        classInfo={
                          timetable[selectedSection]?.[day]?.[slot.time] || null
                        }
                        onDrop={handleDrop}
                        onRemove={handleRemove}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DYNAMIC CLASS STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 mb-8">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-gray-600">Total Students</div>
              <div className="text-xl font-bold text-gray-900">
                {currentStats.total}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-gray-600">Avg Performance</div>
              <div className="text-xl font-bold text-gray-900">
                {currentStats.avg}
                {currentStats.avg !== "N/A" ? "%" : ""}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
