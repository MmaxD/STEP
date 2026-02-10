import { useState, useEffect } from 'react';
import { Plus, Users, School, ChevronRight, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from '@/app/components/ui/badge';

export function ClassManager() {
  const [classes, setClasses] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [newClass, setNewClass] = useState({
    className: '',
    roomNumber: '',
    teacherId: ''
  });

  // 1. Fetch Classes on Load
  useEffect(() => {
    fetchClasses();
  }, []);

  // 2. Fetch Available Teachers when Modal opens
  useEffect(() => {
    if (isModalOpen) {
      fetch('http://localhost:8081/teachers/available-for-homeroom')
        .then(res => res.json())
        .then(data => setAvailableTeachers(data))
        .catch(err => console.error(err));
    }
  }, [isModalOpen]);

  const fetchClasses = () => {
    fetch('http://localhost:8081/classes')
      .then(res => res.json())
      .then(data => setClasses(data))
      .catch(err => console.error(err));
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8081/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setNewClass({ className: '', roomNumber: '', teacherId: '' }); // Reset
        fetchClasses(); // Refresh list
      } else {
        alert("Failed to create class. Name might be duplicate.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
          <p className="text-gray-500">Manage class sections, homeroom teachers, and timetables.</p>
        </div>
        
        {/* ADD CLASS DIALOG */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Class Section</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClass} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Class Name</label>
                <Input 
                  placeholder="e.g. Grade 10-A" 
                  value={newClass.className}
                  onChange={(e) => setNewClass({...newClass, className: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">Room Number</label>
                <Input 
                  placeholder="e.g. 101" 
                  value={newClass.roomNumber}
                  onChange={(e) => setNewClass({...newClass, roomNumber: e.target.value})}
                  required
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Assign Homeroom Teacher</label>
                <Select 
                  onValueChange={(val) => setNewClass({...newClass, teacherId: val})} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an available teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.length > 0 ? (
                      availableTeachers.map((t: any) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.name} ({t.subject_specialty})
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">No teachers available</div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-500">
                  * Only teachers without an existing homeroom class are shown.
                </p>
              </div>

              <Button type="submit" className="mt-2 bg-green-600 hover:bg-green-700">
                Create Class
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* CLASS LIST GRID */}
      {/* ... inside ClassManager.tsx ... */}

{/* CLASS LIST GRID */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {classes.map((cls: any) => (
    // Added 'overflow-hidden' to clip any stray content
    <Card key={cls.id} className="hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold truncate">{cls.class_name}</CardTitle>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shrink-0">
          {cls.room_number}
        </Badge>
      </CardHeader>
      
      {/* Added 'flex-1' to push content to fill height if needed */}
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-3 mt-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
            {cls.teacher_name ? cls.teacher_name.charAt(0) : '?'}
          </div>
          <div className="min-w-0"> {/* min-w-0 prevents text overflow */}
            <div className="text-xs text-gray-500">Homeroom Teacher</div>
            <div className="text-sm font-medium truncate">
              {cls.teacher_name || <span className="text-red-500">Unassigned</span>}
            </div>
          </div>
        </div>
        
        {/* FIX: Changed from 'flex' to 'grid' to force 50/50 split */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Button variant="outline" size="sm" className="w-full px-2">
            <Users className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">Students</span>
          </Button>
          <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 px-2">
            <Calendar className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">Timetable</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
      
      {classes.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
          <School className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No classes found. Add your first class to get started.</p>
        </div>
      )}
    </div>
  );
}