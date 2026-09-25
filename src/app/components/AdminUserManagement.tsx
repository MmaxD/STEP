import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../apiConfig";
import {
  Search,
  Filter,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/app/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

const getStatusBadge = (status) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
    case "inactive":
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Inactive</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
    default:
      return null;
  }
};

export function AdminUserManagement() {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [newStudent, setNewStudent] = useState({
    name: "",
    enrolledClass: "Grade 10", // Default matching your select values
    email: "",
    status: "active",
    password: "", 
  });

  // FETCH DATA
  useEffect(() => {
    fetch(`${API_BASE_URL}/students`)
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.log(err));
  }, []);

  // DELETE
  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    if (deleteId) {
      try {
        await fetch(`${API_BASE_URL}/students/${deleteId}`, { method: "DELETE" });
        setRecords(records.filter((record) => record.id !== deleteId));
        setDeleteId(null);
      } catch (err) {
        console.log(err);
      }
    }
  };

  // EDIT
  const startEdit = (record) => {
    setEditingId(record.id);
    setNewStudent({
      name: record.name,
      email: record.email,
      enrolledClass: record.enrolled_class || record.enrolledClass,
      status: record.status,
      password: "", // We don't edit password here
    });
    setIsFormOpen(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/students/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStudent.name,
          email: newStudent.email,
          enrolledClass: newStudent.enrolledClass,
          status: newStudent.status,
        }),
      });
      
      if (res.ok) {
        window.location.reload();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to update student.");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ADD (Now sends password directly to /students)
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStudent.name,
          email: newStudent.email,
          enrolledClass: newStudent.enrolledClass,
          status: newStudent.status,
          password: newStudent.password, // Correctly passing the password to backend
        }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to add student. Email might already exist.");
      }
    } catch (err) {
      console.log(err);
      alert("An error occurred while connecting to the server.");
    }
  };

  // FILTER LOGIC
  const filteredRecords = records.filter((record) => {
    const studentClass = record.enrolledClass || record.enrolled_class || "";
    const studentName = record.name || "";
    const studentEmail = record.email || "";
    const studentId = String(record.id || "");

    const matchesSearch =
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade =
      gradeFilter === "all" ||
      (studentClass && studentClass.toString().includes(gradeFilter));

    return matchesSearch && matchesGrade;
  });

  // STATS
  const stats = {
    total: records.length,
    active: records.filter((r) => r.status === "active").length,
    pending: records.filter((r) => r.status === "pending").length,
    inactive: records.filter((r) => r.status === "inactive").length,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2">User Management</h1>
          <p className="text-gray-600">Manage student records and accounts</p>
        </div>

        {/* Add / Edit Form */}
        {isFormOpen && (
          <Card className="mb-6 border-2 border-blue-100 bg-blue-50/30 animate-in fade-in slide-in-from-top-4">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingId ? "Edit Student Information" : "Add New Student Information"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingId ? handleUpdateStudent : handleAddStudent} className="gap-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  
                  {/* Name */}
                  <div className="space-y-2">
                    <Input
                      placeholder="Full Name"
                      required
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    />
                  </div>

                  {/* Class */}
                  <div className="space-y-2">
                    <Select
                      value={newStudent.enrolledClass}
                      onValueChange={(val) => setNewStudent({ ...newStudent, enrolledClass: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Grade 5">Grade 5</SelectItem>
                        <SelectItem value="Grade 6">Grade 6</SelectItem>
                        <SelectItem value="Grade 7">Grade 7</SelectItem>
                        <SelectItem value="Grade 8">Grade 8</SelectItem>
                        <SelectItem value="Grade 9">Grade 9</SelectItem>
                        <SelectItem value="Grade 10">Grade 10</SelectItem>
                        <SelectItem value="Grade 11">Grade 11</SelectItem>
                        <SelectItem value="Grade 12">Grade 12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Select
                      value={newStudent.status}
                      onValueChange={(val) => setNewStudent({ ...newStudent, status: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Account Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <span className="flex items-center text-green-600">Active</span>
                        </SelectItem>
                        <SelectItem value="pending">
                          <span className="flex items-center text-yellow-600">Pending</span>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <span className="flex items-center text-gray-500">Inactive</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Password - Only shown when ADDING a new user */}
                  {!editingId && (
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Set Login Password"
                        required
                        value={newStudent.password}
                        onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingId(null);
                      setNewStudent({
                        name: "",
                        email: "",
                        enrolledClass: "Grade 10",
                        status: "active",
                        password: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 min-w-[150px]">
                    {editingId ? "Update Student" : "Save Student"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Main Card */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-xl">Student Records</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, ID, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    <SelectItem value="Grade 10">Grade 10</SelectItem>
                    <SelectItem value="Grade 11">Grade 11</SelectItem>
                    <SelectItem value="Grade 12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    setIsFormOpen(!isFormOpen);
                    setEditingId(null);
                    setNewStudent({
                      name: "",
                      email: "",
                      enrolledClass: "Grade 10",
                      status: "active",
                      password: "",
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isFormOpen ? "Close Form" : "Add New User"}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-[120px]">Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Enrolled Class</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead className="w-[80px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{record.id}</TableCell>
                      <TableCell>{record.name}</TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {record.email}
                        </div>
                      </TableCell>
                      <TableCell>{record.enrolled_class || record.enrolledClass}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors focus:outline-none">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white z-50 shadow-lg border border-gray-200 min-w-[150px]">
                            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => startEdit(record)} className="cursor-pointer px-2 py-1.5 hover:bg-gray-50 flex items-center gap-2">
                              <Edit className="h-4 w-4 text-blue-600" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer px-2 py-1.5 hover:bg-gray-50 flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-600" />
                              <span>Email</span>
                            </DropdownMenuItem>
                            <div className="h-px bg-gray-100 my-1" />
                            <DropdownMenuItem onClick={() => confirmDelete(record.id)} className="text-red-600 cursor-pointer px-2 py-1.5 hover:bg-red-50 flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredRecords.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No students found matching your criteria</p>
              </div>
            )}

            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredRecords.length} of {records.length} students
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 pb-2">Total Students</p>
              <div className="text-3xl font-bold" style={{ color: "#2563eb" }}>{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 pb-2">Active</p>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 pb-2">Pending</p>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 pb-2">Inactive</p>
              <div className="text-3xl font-bold text-gray-600">{stats.inactive}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}