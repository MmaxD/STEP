import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Users, Search, Filter, UserPlus, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

interface Student {
  id: string;
  name: string;
  grade: string;
  gpa: number;
  status: 'new' | 'transfer' | 'returning';
}

interface Classroom {
  id: string;
  name: string;
  teacher: string;
  capacity: number;
  students: Student[];
  section: string;
}

const unassignedStudents: Student[] = [
  { id: 'S001', name: 'Emma Wilson', grade: 'Grade 11', gpa: 3.8, status: 'new' },
  { id: 'S002', name: 'Liam Chen', grade: 'Grade 11', gpa: 3.6, status: 'returning' },
  { id: 'S003', name: 'Olivia Martinez', grade: 'Grade 11', gpa: 3.9, status: 'new' },
  { id: 'S004', name: 'Noah Anderson', grade: 'Grade 11', gpa: 3.5, status: 'transfer' },
  { id: 'S005', name: 'Ava Thompson', grade: 'Grade 11', gpa: 3.7, status: 'returning' },
  { id: 'S006', name: 'Ethan Davis', grade: 'Grade 11', gpa: 3.4, status: 'new' },
  { id: 'S007', name: 'Sophia Brown', grade: 'Grade 11', gpa: 3.8, status: 'returning' },
  { id: 'S008', name: 'Mason Garcia', grade: 'Grade 11', gpa: 3.6, status: 'new' },
  { id: 'S009', name: 'Isabella Rodriguez', grade: 'Grade 11', gpa: 3.9, status: 'transfer' },
  { id: 'S010', name: 'Lucas Miller', grade: 'Grade 11', gpa: 3.5, status: 'returning' },
];

const initialClassrooms: Classroom[] = [
  {
    id: 'C1',
    name: 'Class 11-A',
    teacher: 'Mr. Robert Chen',
    capacity: 30,
    section: 'Science',
    students: [
      { id: 'S101', name: 'Sarah Johnson', grade: 'Grade 11', gpa: 3.8, status: 'returning' },
      { id: 'S102', name: 'Michael Brown', grade: 'Grade 11', gpa: 3.7, status: 'returning' },
      { id: 'S103', name: 'Emily Davis', grade: 'Grade 11', gpa: 3.9, status: 'returning' },
    ],
  },
  {
    id: 'C2',
    name: 'Class 11-B',
    teacher: 'Ms. Jennifer Smith',
    capacity: 30,
    section: 'Commerce',
    students: [
      { id: 'S201', name: 'David Kim', grade: 'Grade 11', gpa: 3.6, status: 'returning' },
      { id: 'S202', name: 'Jessica Lee', grade: 'Grade 11', gpa: 3.8, status: 'returning' },
    ],
  },
  {
    id: 'C3',
    name: 'Class 11-C',
    teacher: 'Dr. Amanda Wilson',
    capacity: 28,
    section: 'Arts',
    students: [],
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return 'bg-green-100 text-green-700';
    case 'transfer':
      return 'bg-blue-100 text-blue-700';
    case 'returning':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

interface StudentCardProps {
  student: Student;
  showGrade?: boolean;
}

const StudentCard = ({ student, showGrade = true }: StudentCardProps) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'student',
      item: student,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [student]
  );

  return (
    <div
      ref={drag}
      className={`p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            {student.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{student.name}</div>
            <div className="text-xs text-gray-500">{student.id}</div>
          </div>
        </div>
        <Badge className={`${getStatusColor(student.status)} text-[10px] px-2 py-0.5`}>
          {student.status}
        </Badge>
      </div>
      <div className="flex items-center gap-3 text-xs">
        {showGrade && (
          <div className="text-gray-600">
            <span className="text-gray-400">Grade:</span> {student.grade}
          </div>
        )}
        <div className="text-gray-600">
          <span className="text-gray-400">GPA:</span>{' '}
          <span className="font-semibold text-blue-600">{student.gpa}</span>
        </div>
      </div>
    </div>
  );
};

interface ClassroomBucketProps {
  classroom: Classroom;
  onDrop: (classId: string, student: Student) => void;
  onRemove: (classId: string, studentId: string) => void;
}

const ClassroomBucket = ({ classroom, onDrop, onRemove }: ClassroomBucketProps) => {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'student',
      drop: (item: Student) => onDrop(classroom.id, item),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [classroom.id]
  );

  const filledPercentage = (classroom.students.length / classroom.capacity) * 100;
  const isNearCapacity = filledPercentage >= 80;
  const isFull = classroom.students.length >= classroom.capacity;

  return (
    <div
      ref={drop}
      className={`border-2 rounded-lg p-4 transition-all ${
        isOver && !isFull ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
      } ${isFull ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{classroom.name}</h4>
          <p className="text-xs text-gray-500">{classroom.teacher}</p>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 mt-1">
            {classroom.section}
          </Badge>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {classroom.students.length}
            <span className="text-gray-400">/{classroom.capacity}</span>
          </div>
          <div className="text-[10px] text-gray-500">Students</div>
        </div>
      </div>

      {/* Capacity Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-600">Capacity</span>
          <span className={`font-semibold ${isNearCapacity ? 'text-orange-600' : 'text-gray-600'}`}>
            {filledPercentage.toFixed(0)}%
          </span>
        </div>
        <Progress
          value={filledPercentage}
          className="h-2"
          style={{
            backgroundColor: '#e5e7eb',
          }}
        />
        {isFull && (
          <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>Classroom at full capacity</span>
          </div>
        )}
        {isNearCapacity && !isFull && (
          <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
            <AlertCircle className="h-3 w-3" />
            <span>Near capacity</span>
          </div>
        )}
      </div>

      {/* Student List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {classroom.students.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded">
            Drop students here
          </div>
        ) : (
          classroom.students.map((student) => (
            <div key={student.id} className="relative group">
              <StudentCard student={student} showGrade={false} />
              <button
                onClick={() => onRemove(classroom.id, student.id)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded p-1"
              >
                <UserPlus className="h-3 w-3 rotate-45" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export function StudentPlacement() {
  const [students, setStudents] = useState<Student[]>(unassignedStudents);
  const [classrooms, setClassrooms] = useState<Classroom[]>(initialClassrooms);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDrop = (classId: string, student: Student) => {
    const classroom = classrooms.find((c) => c.id === classId);
    if (!classroom || classroom.students.length >= classroom.capacity) return;

    // Remove from unassigned
    setStudents((prev) => prev.filter((s) => s.id !== student.id));

    // Add to classroom
    setClassrooms((prev) =>
      prev.map((c) =>
        c.id === classId ? { ...c, students: [...c.students, student] } : c
      )
    );
  };

  const handleRemove = (classId: string, studentId: string) => {
    const classroom = classrooms.find((c) => c.id === classId);
    const student = classroom?.students.find((s) => s.id === studentId);
    if (!student) return;

    // Add back to unassigned
    setStudents((prev) => [...prev, student]);

    // Remove from classroom
    setClassrooms((prev) =>
      prev.map((c) =>
        c.id === classId
          ? { ...c, students: c.students.filter((s) => s.id !== studentId) }
          : c
      )
    );
  };

  const totalAssigned = classrooms.reduce((acc, c) => acc + c.students.length, 0);
  const totalCapacity = classrooms.reduce((acc, c) => acc + c.capacity, 0);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Student Placement Module</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Assign students to classrooms - {students.length} unassigned, {totalAssigned}/{totalCapacity} seats filled
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Finalize Placements
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Side - Unassigned Students */}
          <div className="col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Unassigned Students</h3>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                {students.length} Students
              </Badge>
            </div>

            {/* Search and Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="text-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="returning">Returning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No students found
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <StudentCard key={student.id} student={student} />
                ))
              )}
            </div>
          </div>

          {/* Right Side - Classroom Buckets */}
          <div className="col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Classroom Buckets</h3>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span>{totalAssigned} of {totalCapacity} seats filled ({((totalAssigned / totalCapacity) * 100).toFixed(1)}%)</span>
              </div>
            </div>

            {/* Classroom Grid */}
            <div className="grid grid-cols-2 gap-4">
              {classrooms.map((classroom) => (
                <ClassroomBucket
                  key={classroom.id}
                  classroom={classroom}
                  onDrop={handleDrop}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {/* Add New Classroom */}
            <Button variant="outline" className="w-full border-dashed border-2">
              <UserPlus className="h-4 w-4 mr-2" />
              Add New Classroom
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
