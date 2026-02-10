'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Plus, Trash2, ArrowLeft, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

export function ManageAccounts() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add User State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'teacher' });

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean, id: string | null }>({ open: false, id: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8081/users');
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await fetch('http://localhost:8081/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });

        if (res.ok) {
            setIsAddOpen(false);
            setNewUser({ name: '', email: '', password: '', role: 'teacher' });
            fetchUsers(); // Refresh list
        } else {
            alert("Failed to add user. Email might be duplicate.");
        }
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm.id) return;
    try {
        await fetch(`http://localhost:8081/users/${deleteConfirm.id}`, { method: 'DELETE' });
        setDeleteConfirm({ open: false, id: null });
        fetchUsers();
    } catch (err) { console.error(err); }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/principal')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage Accounts</h1>
                    <p className="text-gray-500">Create and remove system access credentials</p>
                </div>
            </div>
            
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4 mr-2" /> Add Account
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create New Account</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddUser} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input placeholder="John Doe" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" placeholder="john@school.edu" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <Input type="password" placeholder="••••••" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select value={newUser.role} onValueChange={val => setNewUser({...newUser, role: val})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="principal">Principal</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full bg-indigo-600">Create Account</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>

        {/* Content */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">System Users</CardTitle>
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search users..." 
                        className="pl-8" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    {user.name}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        user.role === 'principal' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        user.role === 'teacher' ? 'bg-green-50 text-green-700 border-green-200' : 
                                        'bg-gray-100'
                                    }>
                                        {user.role.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                                        onClick={() => setDeleteConfirm({ open: true, id: user.id })}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}>
          <DialogContent>
            <DialogHeader>
                <div className="flex items-center gap-2 text-red-600 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <DialogTitle>Revoke Access?</DialogTitle>
                </div>
                <DialogDescription>
                    Are you sure you want to delete this account? The user will no longer be able to log in.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteUser}>Delete Account</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}