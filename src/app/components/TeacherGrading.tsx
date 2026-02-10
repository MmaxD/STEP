import { useState } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';

const submissions = [
  { id: 1, name: 'Emily Chen', status: 'submitted', submittedAt: 'Jan 16, 10:30 AM', grade: null },
  { id: 2, name: 'Michael Rodriguez', status: 'graded', submittedAt: 'Jan 15, 2:15 PM', grade: 95 },
  { id: 3, name: 'Sarah Johnson', status: 'submitted', submittedAt: 'Jan 16, 11:45 AM', grade: null },
  { id: 4, name: 'David Kim', status: 'late', submittedAt: 'Jan 17, 8:20 AM', grade: null },
  { id: 5, name: 'Jessica Martinez', status: 'graded', submittedAt: 'Jan 15, 4:30 PM', grade: 88 },
  { id: 6, name: 'Ryan Thompson', status: 'submitted', submittedAt: 'Jan 16, 9:00 AM', grade: null },
  { id: 7, name: 'Amanda Lee', status: 'graded', submittedAt: 'Jan 15, 1:00 PM', grade: 92 },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'submitted':
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Clock className="h-3 w-3 mr-1" />
          Submitted
        </Badge>
      );
    case 'graded':
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Graded
        </Badge>
      );
    case 'late':
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <AlertCircle className="h-3 w-3 mr-1" />
          Late
        </Badge>
      );
    default:
      return null;
  }
};

export function TeacherGrading() {
  const [selectedStudent, setSelectedStudent] = useState(submissions[0]);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Left Pane - Submissions List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl mb-1">Assignment Submissions</h2>
            <p className="text-sm text-gray-600">Physics Lab Report - Week 3</p>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => setSelectedStudent(submission)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedStudent.id === submission.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm">{submission.name}</h4>
                    {getStatusBadge(submission.status)}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">{submission.submittedAt}</div>
                  {submission.grade !== null && (
                    <div className="text-xs mt-2 font-medium" style={{ color: '#2563eb' }}>
                      Grade: {submission.grade}/100
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Document Preview */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Card className="h-full border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl mb-1">{selectedStudent.name}'s Submission</h3>
                  <p className="text-sm text-gray-600">Submitted: {selectedStudent.submittedAt}</p>
                </div>
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              
              {/* PDF Preview Placeholder */}
              <div className="bg-gray-100 rounded-lg p-8 min-h-[600px] border border-gray-300">
                <div className="bg-white shadow-md rounded p-8 max-w-3xl mx-auto">
                  <div className="mb-6">
                    <h1 className="text-3xl mb-2">Physics Lab Report</h1>
                    <p className="text-sm text-gray-600">Student: {selectedStudent.name}</p>
                    <p className="text-sm text-gray-600">Date: January 15, 2026</p>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <h2 className="text-xl mb-2">Experiment Overview</h2>
                      <p className="text-gray-700 leading-relaxed">
                        This experiment investigates the relationship between force, mass, and acceleration
                        as described by Newton's Second Law of Motion. Using a dynamic cart system and
                        various masses, we collected data to verify the equation F = ma.
                      </p>
                    </div>
                    
                    <div>
                      <h2 className="text-xl mb-2">Methodology</h2>
                      <p className="text-gray-700 leading-relaxed">
                        We used a low-friction cart on a horizontal track with a motion sensor to measure
                        acceleration. Different masses were added to the cart while maintaining constant
                        force from a hanging weight system.
                      </p>
                    </div>
                    
                    <div>
                      <h2 className="text-xl mb-2">Results</h2>
                      <p className="text-gray-700 leading-relaxed">
                        Our data showed a linear relationship between force and acceleration when mass
                        was held constant, and an inverse relationship between mass and acceleration when
                        force was constant. The correlation coefficient was 0.98, indicating strong
                        agreement with theoretical predictions.
                      </p>
                    </div>
                    
                    <div>
                      <h2 className="text-xl mb-2">Conclusion</h2>
                      <p className="text-gray-700 leading-relaxed">
                        The experimental results strongly support Newton's Second Law. Minor deviations
                        can be attributed to friction and measurement uncertainty.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Grading Form */}
        <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xl mb-2">Grade Submission</h3>
            <p className="text-sm text-gray-600">{selectedStudent.name}</p>
          </div>

          <div className="space-y-6">
            {/* Grade Input */}
            <div>
              <Label htmlFor="grade">Grade (0-100)</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                placeholder="Enter grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Feedback */}
            <div>
              <Label htmlFor="feedback">Teacher Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Provide detailed feedback for the student..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-2 min-h-[200px]"
              />
            </div>

            {/* Rubric Section */}
            <div>
              <Label className="mb-3 block">Grading Rubric</Label>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Content Quality</span>
                    <span className="text-sm text-gray-600">30 points</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Methodology</span>
                    <span className="text-sm text-gray-600">25 points</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Analysis</span>
                    <span className="text-sm text-gray-600">25 points</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Formatting</span>
                    <span className="text-sm text-gray-600">20 points</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Send className="h-4 w-4 mr-2" />
                Publish Grade
              </Button>
              <Button variant="outline" className="w-full">
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
