import { useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'submitted' | 'graded' | 'late';

interface Student {
  id: number;
  name: string;
  initials: string;
  status: Status;
  studentId: string;
}

type SubjectMarks = {
  [subject: string]: number | '';
};

type MarksStore = {
  [studentId: number]: SubjectMarks;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Art',
  'Physical Ed',
];

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-teal-100 text-teal-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-pink-100 text-pink-800',
  'bg-green-100 text-green-800',
  'bg-rose-100 text-rose-800',
];

const INITIAL_STUDENTS: Student[] = [
  { id: 1, name: 'Emily Chen',        initials: 'EC', status: 'submitted', studentId: 'STU-2024-1841' },
  { id: 2, name: 'Michael Rodriguez', initials: 'MR', status: 'graded',    studentId: 'STU-2024-1842' },
  { id: 3, name: 'Sarah Johnson',     initials: 'SJ', status: 'submitted', studentId: 'STU-2024-1843' },
  { id: 4, name: 'David Kim',         initials: 'DK', status: 'late',      studentId: 'STU-2024-1844' },
  { id: 5, name: 'Jessica Martinez',  initials: 'JM', status: 'graded',    studentId: 'STU-2024-1845' },
  { id: 6, name: 'Ryan Thompson',     initials: 'RT', status: 'submitted', studentId: 'STU-2024-1846' },
  { id: 7, name: 'Amanda Lee',        initials: 'AL', status: 'graded',    studentId: 'STU-2024-1847' },
];

const INITIAL_MARKS: MarksStore = {
  1: { Mathematics: '', Science: '', English: '', History: '', Art: '', 'Physical Ed': '' },
  2: { Mathematics: 95, Science: 88, English: 76, History: 90, Art: 82, 'Physical Ed': 79 },
  3: { Mathematics: '', Science: '', English: '', History: '', Art: '', 'Physical Ed': '' },
  4: { Mathematics: '', Science: '', English: '', History: '', Art: '', 'Physical Ed': '' },
  5: { Mathematics: 88, Science: 72, English: 91, History: 85, Art: 68, 'Physical Ed': 94 },
  6: { Mathematics: '', Science: '', English: '', History: '', Art: '', 'Physical Ed': '' },
  7: { Mathematics: 92, Science: 85, English: 88, History: 79, Art: 95, 'Physical Ed': 83 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLetterGrade(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: 'A — Excellent',          color: 'bg-green-100 text-green-800' };
  if (pct >= 75) return { label: 'B — Good',               color: 'bg-blue-100 text-blue-800'  };
  if (pct >= 55) return { label: 'C — Average',            color: 'bg-amber-100 text-amber-800' };
  return           { label: 'F — Needs improvement', color: 'bg-red-100 text-red-800'    };
}

function calcAverage(subjectMarks: SubjectMarks): number | null {
  const values = Object.values(subjectMarks).filter(
    (v): v is number => v !== '' && !isNaN(Number(v))
  );
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function calcTotal(subjectMarks: SubjectMarks): number {
  return Object.values(subjectMarks)
    .filter((v): v is number => v !== '' && !isNaN(Number(v)))
    .reduce((a, b) => a + b, 0);
}

function getStatusBadge(status: Status) {
  const map: Record<Status, { className: string; label: string }> = {
    submitted: { className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',   label: 'Submitted' },
    graded:    { className: 'bg-green-100 text-green-700 hover:bg-green-100', label: 'Graded'    },
    late:      { className: 'bg-red-100 text-red-700 hover:bg-red-100',       label: 'Late'      },
  };
  const { className, label } = map[status];
  return <Badge className={className}>{label}</Badge>;
}

function getProgressColor(pct: number): string {
  if (pct >= 75) return 'bg-green-600';
  if (pct >= 55) return 'bg-amber-500';
  return 'bg-red-500';
}

// ─── Student Card Sub-component ───────────────────────────────────────────────

interface StudentCardProps {
  student: Student;
  index: number;
  marksStore: MarksStore;
  onClick: () => void;
}

function StudentCard({ student, index, marksStore, onClick }: StudentCardProps) {
  const avg = calcAverage(marksStore[student.id]);
  const grade = avg !== null ? getLetterGrade(avg) : null;
  const hasMarks = avg !== null;

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-4 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
        hasMarks
          ? 'border-green-200 hover:border-green-400'
          : 'border-gray-200 hover:border-amber-300'
      }`}
    >
      <Avatar className="h-11 w-11 mb-3">
        <AvatarFallback className={`text-sm font-medium ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
          {student.initials}
        </AvatarFallback>
      </Avatar>

      <p className="text-sm font-medium text-gray-900 leading-snug">{student.name}</p>
      <p className="text-xs text-gray-400 mt-0.5 mb-2">{student.studentId}</p>

      {getStatusBadge(student.status)}

      {avg !== null && grade ? (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500">Avg:</span>
          <span className="text-xs font-medium text-gray-900">{avg}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${grade.color}`}>
            {grade.label.split(' ')[0]}
          </span>
        </div>
      ) : (
        <p className="mt-2 text-xs text-amber-500">No marks yet</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentMarkEntry() {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [marksStore, setMarksStore] = useState<MarksStore>(INITIAL_MARKS);

  // Modal state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [draftMarks, setDraftMarks] = useState<SubjectMarks>({});

  // ── Open / Close ────────────────────────────────────────────────────────────

  function openModal(student: Student) {
    setSelectedStudent(student);
    setDraftMarks({ ...marksStore[student.id] });
  }

  function closeModal() {
    setSelectedStudent(null);
    setDraftMarks({});
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  function saveMarks() {
    if (!selectedStudent) return;

    setMarksStore(prev => ({
      ...prev,
      [selectedStudent.id]: { ...draftMarks },
    }));

    // Mark student as graded
    setStudents(prev =>
      prev.map(s =>
        s.id === selectedStudent.id ? { ...s, status: 'graded' } : s
      )
    );

    closeModal();
  }

  // ── Draft mark update ────────────────────────────────────────────────────────

  function handleMarkChange(subject: string, value: string) {
    const parsed = value === '' ? '' : Math.min(100, Math.max(0, Number(value)));
    setDraftMarks(prev => ({ ...prev, [subject]: parsed }));
  }

  // ── Draft calculations ───────────────────────────────────────────────────────

  const draftTotal   = calcTotal(draftMarks);
  const filledCount  = Object.values(draftMarks).filter(v => v !== '').length;
  const draftPct     = filledCount > 0 ? Math.round(draftTotal / SUBJECTS.length) : 0;
  const draftGrade   = filledCount > 0 ? getLetterGrade(draftPct) : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h1 className="text-2xl text-gray-900">Student Marks</h1>
        </div>
        <p className="text-sm text-gray-500">Click a student card to add or update marks</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Column 1: Marks NOT updated ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <h2 className="text-sm font-medium text-gray-700">Pending</h2>
            <span className="text-xs text-gray-400">
              ({students.filter(s => calcAverage(marksStore[s.id]) === null).length} students)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {students
              .filter(s => calcAverage(marksStore[s.id]) === null)
              .map((student, index) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  index={index}
                  marksStore={marksStore}
                  onClick={() => openModal(student)}
                />
              ))}
            {students.filter(s => calcAverage(marksStore[s.id]) === null).length === 0 && (
              <div className="col-span-3 py-10 text-center text-sm text-gray-400 bg-white border border-dashed border-gray-200 rounded-xl">
                🎉 All students have been marked!
              </div>
            )}
          </div>
        </div>

        {/* ── Column 2: Marks updated ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h2 className="text-sm font-medium text-gray-700">Marks Updated</h2>
            <span className="text-xs text-gray-400">
              ({students.filter(s => calcAverage(marksStore[s.id]) !== null).length} students)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {students
              .filter(s => calcAverage(marksStore[s.id]) !== null)
              .map((student, index) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  index={index}
                  marksStore={marksStore}
                  onClick={() => openModal(student)}
                />
              ))}
            {students.filter(s => calcAverage(marksStore[s.id]) !== null).length === 0 && (
              <div className="col-span-3 py-10 text-center text-sm text-gray-400 bg-white border border-dashed border-gray-200 rounded-xl">
                No marks added yet
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Modal overlay ── */}
      {selectedStudent && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    className={`text-sm font-medium ${
                      AVATAR_COLORS[
                        students.findIndex(s => s.id === selectedStudent.id) % AVATAR_COLORS.length
                      ]
                    }`}
                  >
                    {selectedStudent.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-base font-medium text-gray-900">{selectedStudent.name}</h2>
                  <p className="text-xs text-gray-400">{selectedStudent.studentId}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Subject inputs */}
            <div className="p-5">
              <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Marks out of 100</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {SUBJECTS.map(subject => (
                  <div key={subject}>
                    <label className="text-xs text-gray-500 mb-1 block">{subject}</label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0–100"
                        value={draftMarks[subject] === '' ? '' : draftMarks[subject]}
                        onChange={e => handleMarkChange(subject, e.target.value)}
                        className="h-9 text-sm"
                      />
                      <span className="text-xs text-gray-400 whitespace-nowrap">/100</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 mb-4" />

              {/* Total / grade summary */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">Total Score</p>
                  {draftGrade && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${draftGrade.color}`}>
                      {draftGrade.label}
                    </span>
                  )}
                  {!draftGrade && (
                    <p className="text-xs text-gray-400 mt-1">Enter marks above</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-medium text-gray-900">
                    {filledCount > 0 ? draftTotal : '—'}
                  </span>
                  <span className="text-sm text-gray-400">/600</span>
                  {filledCount > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{draftPct}% average</p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getProgressColor(draftPct)}`}
                  style={{ width: filledCount > 0 ? `${draftPct}%` : '0%' }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={saveMarks}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Marks
                </Button>
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
