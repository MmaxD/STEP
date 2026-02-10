'use client';

import { useState, useEffect } from 'react';
export const API_BASE_URL = "https://step-58cj.onrender.com";
import { useNavigate } from 'react-router-dom'; // 1. Import Router Hook
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Calendar, Users, BookOpen, Settings, TrendingUp,Shield ,Bell, Loader2, Plus, Search, Save, Download, AlertCircle, ChevronRight, Award, CheckCircle, ChevronLeft, Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Input } from '@/app/components/ui/input';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Progress } from '@/app/components/ui/progress';
import { TimetableBuilder } from '@/app/components/TimetableBuilder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';

// --- 1. DRAGGABLE STUDENT ITEM ---
const StudentItem = ({ student, sourceId }: { student: any, sourceId: string }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'STUDENT',
    item: { id: student.id, sourceId: sourceId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  if (sourceId === 'unassigned') {
    return (
      <div
        ref={drag}
        className={`p-3 bg-white border border-gray-200 rounded-lg mb-3 cursor-move shadow-sm hover:shadow-md transition-all ${isDragging ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 bg-indigo-100 border border-indigo-200">
              <AvatarFallback className="text-indigo-700 text-xs font-bold">
                {student.name ? student.name.substring(0, 2).toUpperCase() : 'ST'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 leading-none">{student.name}</h4>
              <span className="text-[10px] text-gray-500 font-mono">{student.studentId || 'ID-PENDING'}</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-yellow-50 text-yellow-700 border-yellow-200">
            Unassigned
          </Badge>
        </div>
        <Separator className="my-2" />
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> {student.grade}
          </span>
          <span className="font-medium text-gray-700 bg-gray-100 px-1.5 rounded">
            GPA: {student.gpa || 'N/A'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={drag} onClick={(e) => e.stopPropagation()} className={`flex items-center justify-between p-2 bg-white rounded border border-gray-100 mb-2 text-xs shadow-sm hover:border-indigo-200 transition-colors cursor-move ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">
          {student.name ? student.name.charAt(0) : 'S'}
        </div>
        <div>
           <div className="font-medium text-gray-900">{student.name}</div>
        </div>
      </div>
    </div>
  );
};

// --- 2. DROP ZONE BUCKET (Now Clickable) ---
const ClassBucketCard = ({ bucket, onDropStudent, onRequestDelete, onClick }: { bucket: any, onDropStudent: any, onRequestDelete: any, onClick: any }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'STUDENT',
    drop: (item: { id: any, sourceId: any }) => onDropStudent(item.id, item.sourceId, bucket.id),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const capacity = bucket.capacity || 30;
  const currentCount = bucket.students ? bucket.students.length : 0;
  const fillPercentage = (currentCount / capacity) * 100;
  
  let progressColor = "bg-blue-600";
  if (fillPercentage > 90) progressColor = "bg-red-500";
  else if (fillPercentage > 75) progressColor = "bg-amber-500";

  return (
    <div 
        ref={drop} 
        onClick={() => onClick(bucket.id)} // 2. Trigger Navigation on Click
        className={`group relative p-4 rounded-xl border-2 transition-all h-full flex flex-col cursor-pointer ${isOver ? 'border-indigo-500 bg-indigo-50 shadow-md scale-[1.02]' : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-lg'}`}
    >
      
      {/* Delete Class Button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50"
            onClick={(e) => {
                e.stopPropagation(); // 3. IMPORTANT: Stop click from triggering navigation when deleting
                onRequestDelete(bucket.id);
            }}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-between items-start mb-3 pr-6">
        <div>
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{bucket.class_name}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Users className="h-3 w-3" />
            <span>{bucket.teacher_name || "Unassigned"}</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-normal bg-gray-50 text-gray-600 border-gray-200">
            {bucket.room_number || "No Room"}
          </Badge>
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>Capacity</span>
            <span>{currentCount}/{capacity}</span>
        </div>
        <Progress value={fillPercentage} className={`h-1.5`} indicatorClassName={progressColor} />
      </div>

      <div className="flex-1 overflow-y-auto min-h-[120px] max-h-[200px] space-y-1 bg-gray-50/50 rounded-lg p-2 border border-gray-100 shadow-inner">
        {bucket.students && bucket.students.length > 0 ? (
          bucket.students.map((s: any) => <StudentItem key={s.id} student={s} sourceId={bucket.id} />)
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-xs text-gray-400 italic">
            <Download className="h-4 w-4 mb-1 opacity-50" />
            <span>Drop students here</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 3. MAIN DASHBOARD ---
export function PrincipalDashboard() {
  const navigate = useNavigate(); // 4. Initialize Navigate Hook
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Student Placement State
  const [buckets, setBuckets] = useState<any[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Grade Navigation & Search State
  const [currentGradeFilter, setCurrentGradeFilter] = useState(10); 
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [newClass, setNewClass] = useState({ className: '', roomNumber: '', teacherId: '' });
  
  // Teacher Modals
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', subject: '' });
  const [showFacultyList, setShowFacultyList] = useState(false);
  const [faculty, setFaculty] = useState([]);
  
  const [successDialog, setSuccessDialog] = useState<{ open: boolean, title: string, message: string }>({ open: false, title: '', message: '' });
  
  // DELETE CONFIRMATION STATE
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean, type: 'class' | 'teacher', id: string | null }>({ open: false, type: 'class', id: null });
  
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const dashRes = await fetch(`${API_BASE_URL}/principal/dashboard`);
        const dashData = await dashRes.json();
        setDashboardData(dashData);
        refreshBuckets();
        refreshUnassigned();
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    initData();
  }, []);

  const refreshBuckets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/classes/with-students`);
      if (!res.ok) { setBuckets([]); return; }
      const data = await res.json();
      if (Array.isArray(data)) setBuckets(data);
      else setBuckets([]);
    } catch (e) { 
        console.error(e); 
        setBuckets([]);
    }
  };

  const refreshUnassigned = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/students/unassigned`);
      const data = await res.json();
      const enrichedStudents = data.map((s: any, index: number) => {
        let gradeLevel = s.enrolled_class; 
        if (!gradeLevel) gradeLevel = `Grade ${Math.floor(Math.random() * 3) + 10}`;

        return {
          ...s,
          id: s.id || `temp-${index}`, 
          grade: gradeLevel,
          gpa: s.gpa || (Math.random() * (4.0 - 2.5) + 2.5).toFixed(1),
          status: 'new'
        };
      });
      setUnassignedStudents(enrichedStudents);
    } catch (e) { console.error(e); }
  };

  const nextGrade = () => {
    setCurrentGradeFilter(prev => (prev < 12 ? prev + 1 : 12));
    setSearchQuery('');
  };
  const prevGrade = () => {
    setCurrentGradeFilter(prev => (prev > 9 ? prev - 1 : 9));
    setSearchQuery('');
  };

  // --- FILTER LOGIC ---
  const filteredUnassigned = unassignedStudents.filter(s => {
    const sGrade = s.grade ? s.grade.trim() : ''; 
    const matchesGrade = sGrade === `Grade ${currentGradeFilter}`;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.studentId && s.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGrade && matchesSearch;
  });

  const filteredBuckets = buckets.filter(b => {
    const className = b.class_name || "";
    const isTargetGrade = className.includes(currentGradeFilter.toString());
    const isNotGeneric = className.trim() !== `Grade ${currentGradeFilter}`;
    return isTargetGrade && isNotGeneric;
  });

  useEffect(() => {
    if (isClassModalOpen) {
      fetch(`${API_BASE_URL}/teachers/available-for-homeroom`)
        .then(res => res.json())
        .then(data => setAvailableTeachers(data))
        .catch(err => console.error(err));
    }
  }, [isClassModalOpen]);

  // --- HANDLERS ---
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass)
      });
      
      if (res.ok) {
        setIsClassModalOpen(false);
        setNewClass({ className: '', roomNumber: '', teacherId: '' });
        refreshBuckets();
        setSuccessDialog({
            open: true,
            title: "Classroom Created!",
            message: "The new classroom bucket has been successfully added."
        });
      } else {
        alert("Failed to create class.");
      }
    } catch (err) { console.error(err); }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_BASE_URL}/teachers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTeacher)
        });

        if (res.ok) {
            setIsAddTeacherOpen(false);
            setNewTeacher({ name: '', email: '', subject: '' });
            setSuccessDialog({
                open: true,
                title: "Teacher Added",
                message: `${newTeacher.name} has been added to the faculty.`
            });
            // Refresh dashboard data
            const dashRes = await fetch(`${API_BASE_URL}/principal/dashboard`);
            const dashData = await dashRes.json();
            setDashboardData(dashData);
        } else {
            alert("Failed to add teacher");
        }
    } catch (err) { console.error(err); }
  };

  // --- TRIGGER DELETE MODAL ---
  const initiateDelete = (type: 'class' | 'teacher', id: string) => {
    setDeleteConfirm({ open: true, type, id });
  };

  // --- CONFIRM DELETE ACTION ---
  const confirmDelete = async () => {
    const { type, id } = deleteConfirm;
    if (!id) return;

    try {
        let url = '';
        if (type === 'class') url = `${API_BASE_URL}/classes/${id}`;
        if (type === 'teacher') url = `${API_BASE_URL}/teachers/${id}`;

        const res = await fetch(url, { method: 'DELETE' });
        
        if (res.ok) {
            setDeleteConfirm({ open: false, type: 'class', id: null }); // Close modal
            
            if (type === 'class') {
                refreshBuckets();
                refreshUnassigned();
            } else {
                handleViewFaculty(); 
                const dashRes = await fetch(`${API_BASE_URL}/principal/dashboard`);
                const dashData = await dashRes.json();
                setDashboardData(dashData);
            }
        } else {
            alert(`Failed to delete ${type}.`);
        }
    } catch (err) { console.error(err); }
  };

  // --- 5. NAVIGATION HANDLER ---
const handleClassClick = (classId: string) => {
    navigate(`/homeroom/${classId}`); 
  };

  const handleMoveStudent = (studentId: any, sourceId: any, targetClassId: any) => {
    if (sourceId === targetClassId) return;
    setHasChanges(true);
    let studentToMove: any = null;

    if (sourceId === 'unassigned') {
      studentToMove = unassignedStudents.find(s => s.id == studentId);
    } else {
      const sourceBucket = buckets.find(b => b.id === sourceId);
      if(sourceBucket) studentToMove = sourceBucket.students.find((s: any) => s.id == studentId);
    }

    if (!studentToMove) return;

    if (sourceId === 'unassigned') {
        setUnassignedStudents(prev => prev.filter(s => s.id != studentId));
        setBuckets(prevBuckets => prevBuckets.map(b => {
            if (b.id === targetClassId) {
                if (b.students.some((s: any) => s.id == studentId)) return b;
                return { ...b, students: [...(b.students || []), studentToMove] };
            }
            return b;
        }));
    } else {
        setBuckets(prevBuckets => {
            return prevBuckets.map(b => {
                if (b.id === sourceId) return { ...b, students: b.students.filter((s: any) => s.id != studentId) };
                if (b.id === targetClassId) {
                    if (b.students.some((s: any) => s.id == studentId)) return b;
                    return { ...b, students: [...(b.students || []), studentToMove] };
                }
                return b;
            });
        });
    }
  };

  const handleFinalizePlacement = async () => {
    const placements: any[] = [];
    buckets.forEach(bucket => {
      if(bucket.students) {
        bucket.students.forEach((student: any) => {
          placements.push({
            studentId: student.id,
            className: bucket.class_name
          });
        });
      }
    });

    try {
      const res = await fetch(`${API_BASE_URL}/students/placement/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placements })
      });
      if (res.ok) {
        setSuccessDialog({
            open: true,
            title: "Placements Saved Successfully",
            message: "All student movements have been recorded in the database."
        });
        setHasChanges(false);
        refreshBuckets();
        refreshUnassigned();
      }
    } catch (err) {
      console.error(err);
      alert("Error saving placements");
    }
  };

  const handleViewFaculty = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/faculty`);
      const data = await res.json();
      setFaculty(data);
      setShowFacultyList(true);
    } catch (e) { console.error(e); }
  };

  if (loading || !dashboardData) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin h-10 w-10 text-indigo-600" /></div>;
  }

  const settings = dashboardData.settings || { currentSession: '...', startDate: '...' };
  const facultyStats = dashboardData.faculty || { total: 0, fullTime: 0, onLeave: 0 };
  const quickStats = dashboardData.quickStats || { enrolledStudents: 0, activeClasses: 0, avgAttendance: 0 };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-100">
        <div className="flex max-w-[1920px] mx-auto">
          
          {/* Left Sidebar */}
          
          <div className="w-80 bg-white border-r border-gray-200 p-6 space-y-6 hidden md:block">
            <CardContent className="pt-4 space-y-3">
                {/* ... Session info ... */}
                
                {/* Add THIS Button */}
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2 text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100" 
                    onClick={() => navigate('/accounts')}
                >
                    <Shield className="h-3 w-3 mr-2" /> Manage Accounts
                </Button>

                <Separator className="my-2"/>
                
            </CardContent>
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-sm">Academic Year</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                 <div className="flex justify-between text-xs"><span className="text-gray-600">Session</span><span className="font-semibold">{settings.currentSession}</span></div>
                 <Separator />
                 <div className="flex justify-between text-xs"><span className="text-gray-600">Start</span><span className="font-semibold">{settings.startDate}</span></div>
                 <Button variant="outline" size="sm" className="w-full mt-4 text-xs" onClick={() => setShowSettings(true)}><Settings className="h-3 w-3 mr-2" /> Settings</Button>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-sm">Faculty</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Total</div>
                        <div className="text-xl font-bold text-gray-900">{facultyStats.total}</div>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">On Leave</div>
                        <div className="text-xl font-bold text-gray-900">{facultyStats.onLeave}</div>
                    </div>
                </div>
                <Separator className="my-3"/>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleViewFaculty}>View All</Button>
                    <Dialog open={isAddTeacherOpen} onOpenChange={setIsAddTeacherOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="h-3 w-3 mr-1"/> Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add New Teacher</DialogTitle></DialogHeader>
                            <form onSubmit={handleAddTeacher} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input placeholder="e.g. Dr. Sarah Connor" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <Input type="email" placeholder="sarah@school.edu" value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Subject Specialty</label>
                                    <Input placeholder="e.g. Physics" value={newTeacher.subject} onChange={e => setNewTeacher({...newTeacher, subject: e.target.value})} required />
                                </div>
                                <Button type="submit" className="w-full bg-indigo-600">Register Teacher</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 space-y-8 overflow-y-auto h-screen">
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Principal Dashboard</h1>
                <p className="text-sm text-gray-600">Central command for school administration</p>
              </div>
              <Badge className="bg-green-100 text-green-700 px-3 py-1">System Active</Badge>
            </div>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Student Placement
                </h2>
                {hasChanges && (
                  <Button onClick={handleFinalizePlacement} className="bg-green-600 hover:bg-green-700 text-white shadow-lg animate-bounce">
                    <Save className="h-4 w-4 mr-2" />
                    Save Placements
                  </Button>
                )}
              </div>
              
              <div className="flex h-[600px] gap-6">
                
                {/* 1. Unassigned Sidebar */}
                <div className="w-80 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-shrink-0">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">Unassigned</h3>
                            <Badge variant="outline" className="bg-white">{unassignedStudents.length}</Badge>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white border rounded-md p-1 mb-3">
                        <Button variant="ghost" size="sm" onClick={prevGrade} disabled={currentGradeFilter <= 9} className="h-7 w-7 p-0">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold text-gray-700">Grade {currentGradeFilter}</span>
                        <Button variant="ghost" size="sm" onClick={nextGrade} disabled={currentGradeFilter >= 12} className="h-7 w-7 p-0">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder={`Search in Grade ${currentGradeFilter}...`} 
                        className="pl-8 bg-white h-9 text-xs" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                    {filteredUnassigned.length > 0 ? (
                        filteredUnassigned.map(student => (
                        <StudentItem key={student.id} student={student} sourceId="unassigned" />
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-xs">No matching students found</p>
                        </div>
                    )}
                  </div>
                </div>

                {/* 2. Classroom Buckets */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-sm font-semibold text-gray-500">
                      Showing Classrooms for <span className="text-gray-900 font-bold">Grade {currentGradeFilter}</span>
                    </h3>
                    <Badge variant="outline" className="bg-white">{filteredBuckets.length} Classes</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4 pr-2">
                    {filteredBuckets.map(bucket => (
                      <div key={bucket.id} className="h-[320px]">
                        <ClassBucketCard 
                            bucket={bucket} 
                            onDropStudent={handleMoveStudent} 
                            onRequestDelete={(id: string) => initiateDelete('class', id)} 
                            onClick={handleClassClick} // 6. Pass Click Handler
                        />
                      </div>
                    ))}

                    <div className="h-[320px]">
                      <div className="h-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center bg-gray-50 hover:bg-white hover:border-indigo-400 transition-all cursor-pointer group">
                        <Dialog open={isClassModalOpen} onOpenChange={setIsClassModalOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" className="text-gray-500 group-hover:text-indigo-600 w-full h-full flex flex-col gap-2">
                              <div className="h-12 w-12 rounded-full bg-gray-100 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                                <Plus className="h-6 w-6" />
                              </div>
                              <span className="font-semibold">Add New Classroom</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create New Classroom</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateClass} className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Class Name</label>
                                <Input 
                                  placeholder={`e.g. Grade ${currentGradeFilter}-C`} 
                                  value={newClass.className} 
                                  onChange={e => setNewClass({...newClass, className: e.target.value})}
                                  required 
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Room Number</label>
                                <Input placeholder="e.g. Rm-305" value={newClass.roomNumber} onChange={e => setNewClass({...newClass, roomNumber: e.target.value})} required />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Assign Homeroom Teacher</label>
                                <Select onValueChange={val => setNewClass({...newClass, teacherId: val})} required>
                                  <SelectTrigger><SelectValue placeholder="Select Available Teacher" /></SelectTrigger>
                                  <SelectContent>
                                    {availableTeachers.length > 0 ? (
                                      availableTeachers.map((t: any) => (
                                        <SelectItem key={t.id} value={String(t.id)}>{t.name} ({t.subject_specialty})</SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="none" disabled>No teachers available</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Create Classroom</Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            <TimetableBuilder />

            <div className="grid grid-cols-4 gap-4 pb-10">
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><Users className="h-5 w-5" /></div>
                  <div><div className="text-xs text-gray-600">Total Students</div><div className="text-xl font-bold text-gray-900">{quickStats.enrolledStudents}</div></div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600"><TrendingUp className="h-5 w-5" /></div>
                  <div><div className="text-xs text-gray-600">Avg Performance</div><div className="text-xl font-bold text-gray-900">87.3%</div></div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>

        {/* --- MODALS --- */}

        {/* DELETE CONFIRMATION MODAL */}
        <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <div className="flex items-center gap-2 text-red-600 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <DialogTitle>Confirm Deletion</DialogTitle>
                </div>
                <DialogDescription>
                    {deleteConfirm.type === 'class' 
                        ? "Are you sure you want to delete this classroom? All students in it will be moved back to the Unassigned list." 
                        : "Are you sure you want to remove this faculty member? This action cannot be undone."
                    }
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={successDialog.open} onOpenChange={(open) => setSuccessDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="sm:max-w-md">
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <DialogTitle className="text-xl font-bold text-gray-900">{successDialog.title}</DialogTitle>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">{successDialog.message}</p>
              </div>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button type="button" className="bg-green-600 hover:bg-green-700 min-w-[120px]" onClick={() => setSuccessDialog(prev => ({ ...prev, open: false }))}>Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Configure Academic Settings</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
                <p className="text-sm text-gray-500">Settings logic connected to DB.</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>Close</Button>
                </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Faculty List with DELETE button */}
        <Dialog open={showFacultyList} onOpenChange={setShowFacultyList}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Faculty Directory</DialogTitle></DialogHeader>
            <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Subject</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                    {faculty.map((f: any) => (
                        <TableRow key={f.id}>
                            <TableCell className="font-medium">{f.name}</TableCell>
                            <TableCell>{f.subject_specialty}</TableCell>
                            <TableCell><Badge variant="outline">{f.employment_type || 'Full Time'}</Badge></TableCell>
                            <TableCell><span className={f.status === 'Active' ? 'text-green-600' : 'text-red-500'}>{f.status}</span></TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => initiateDelete('teacher', f.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </DialogContent>
        </Dialog>

      </div>
    </DndProvider>
  );
}