import React, { useState } from 'react';
import { API_BASE_URL } from '../../apiConfig';
import { GraduationCap, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'; // Added AlertCircle & Loader2
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent } from '@/app/components/ui/card';

export function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // New State for Error Handling and Loading
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);





  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading
    setError('');     // Clear previous errors

    try {
        // 1. Send data to Backend
        const response = await fetch(`${API_BASE_URL}/login`, { // Use backticks ``
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        // 2. Check Server Response
        if (response.ok && data.status === "Success") {
            // Save user info
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userName', data.name);

            // 3. Navigate based on Role
            if (data.role === 'principal') {
                onLogin('principal'); 
            } else if (data.role === 'teacher') {
                onLogin('teacherDash'); 
            }
            else if (data.role === 'admin') {
                onLogin('admin'); 
            } 
            else {
                setError("Unknown user role detected.");
            }
        } else {
            // Login Failed (Show error on screen)
            setError(data.message || "Invalid email or password");
        }
    } catch (err) {
        console.error("Login Error:", err);
        setError("Unable to connect to server. Please try again.");
    } finally {
        setLoading(false); // Stop loading regardless of success/failure
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4 z-[100]">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            
            {/* Logo & Branding */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">School LMS</h1>
              <p className="text-sm text-gray-500 mt-2">Welcome back! Please login to continue.</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              
              {/* ERROR MESSAGE BOX */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@school.edu"
                    className="pl-10 py-6"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError(''); // Clear error when typing
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 py-6"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError(''); // Clear error when typing
                    }}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-blue-600 hover:underline font-medium">
                  Forgot password?
                </button>
              </div>

              <Button 
                type="submit" 
                disabled={loading} // Disable button while loading
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Signing In...
                    </div>
                ) : (
                    "Sign In"
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <button className="text-blue-600 hover:underline font-bold">
                Contact Administrator
              </button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}