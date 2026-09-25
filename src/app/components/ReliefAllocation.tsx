import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from "../../apiConfig";

interface Substitute {
  id: number;
  name: string;
  subject_specialty: string;
  priority_level: number; 
}

interface Allocation {
  time_slot: string;
  section: string;
  subject_to_cover: string;
  room: string;
  assigned_substitutes: Substitute[];
  priority_used: string;
  is_uncovered: boolean;
}

interface LeaveRequest {
  id: number;
  teacher_id: number;
  teacher_name: string;
  leave_date: string;
  reason: string;
  status: string;
}

export default function ReliefAllocation() {
  // Real Data States
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [activeLeave, setActiveLeave] = useState<LeaveRequest | null>(null);
  
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<Record<string, { substitute_id: number, section: string }>>({});

  // 1. Fetch real approved leaves from the database on page load
  // commit fails
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/approved-leaves`);
        const data = await response.json();
        setLeaveRequests(data);
      } catch (error) {
        console.error("Failed to fetch leave requests", error);
      }
    };
    fetchLeaves();
  }, []);

  // 2. Fetch Relief Plan for the selected active leave
  const handleCheckReliefPlan = async () => {
    if (!activeLeave) return;

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/allocate-relief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: activeLeave.teacher_id,
          leave_date: activeLeave.leave_date 
        })
      });
      
      const data = await response.json();
      setAllocations(data.allocations || []);
      
      // Auto-select the first available Priority 1 substitute for convenience
      const initialSelections: Record<string, { substitute_id: number, section: string }> = {};
      (data.allocations || []).forEach((alloc: Allocation) => {
        if (alloc.assigned_substitutes.length > 0) {
          initialSelections[alloc.time_slot] = {
            substitute_id: alloc.assigned_substitutes[0].id,
            section: alloc.section
          };
        }
      });
      setSelectedAssignments(initialSelections);
      
    } catch (error) {
      console.error("Failed to fetch relief plan", error);
      setMessage("Failed to load relief allocations.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubstitute = (timeSlot: string, section: string, substituteId: string) => {
    setSelectedAssignments(prev => ({
      ...prev,
      [timeSlot]: {
        substitute_id: parseInt(substituteId),
        section: section
      }
    }));
  };

  // 3. Save Confirmed Plan
  const handleSaveReliefPlan = async () => {
    if (!activeLeave) return;

    const dateObj = new Date(activeLeave.leave_date);
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = daysOfWeek[dateObj.getDay()];

    const assignmentsArray = Object.entries(selectedAssignments).map(([time_slot, data]) => ({
      time_slot: time_slot,
      substitute_id: data.substitute_id,
      section: data.section
    }));

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/confirm-relief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          absent_teacher_id: activeLeave.teacher_id,
          day_of_week: dayOfWeek,
          assignments: assignmentsArray
        })
      });

      const result = await response.json();
      setMessage(result.message);
      
      if (response.ok) {
         setTimeout(() => setAllocations([]), 3000); 
      }
    } catch (error) {
      console.error("Failed to save relief plan", error);
      setMessage("Failed to save the relief plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Relief Teacher Allocation</h2>
          <p className="text-blue-100 text-sm">Manage class coverage for absent faculty</p>
        </div>

        <div className="p-6">
          
          {/* DB Leave Selection Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Approved Leave Request</label>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
              onChange={(e) => {
                const selected = leaveRequests.find(l => l.id === parseInt(e.target.value));
                setActiveLeave(selected || null);
                setAllocations([]); // Reset grid when changing teachers
                setMessage(null);
              }}
              defaultValue=""
            >
              <option value="" disabled>-- Select an absent teacher --</option>
              {leaveRequests.map((leave) => (
                <option key={leave.id} value={leave.id}>
                  {leave.leave_date} - {leave.teacher_name} (ID: {leave.teacher_id})
                </option>
              ))}
            </select>
          </div>

          {/* Leave Request Summary Card */}
          {activeLeave ? (
            <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center mb-6 border border-gray-200">
              <div>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Leave Request Details</p>
                <p className="text-lg font-medium text-gray-800 mt-1">
                  {activeLeave.teacher_name} <span className="text-gray-500 text-base font-normal">| ID: {activeLeave.teacher_id}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Date: <span className="font-semibold">{new Date(activeLeave.leave_date).toLocaleDateString()}</span> • Reason: {activeLeave.reason}
                </p>
              </div>
              <button 
                onClick={handleCheckReliefPlan}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded shadow transition duration-150 disabled:opacity-50"
              >
                {loading && allocations.length === 0 ? "Loading..." : "Generate Relief Plan"}
              </button>
            </div>
          ) : (
             <div className="text-center text-gray-500 py-12 border-2 border-dashed border-gray-200 rounded-lg">
               Please select a leave request from the dropdown above to continue.
             </div>
          )}

          {/* Feedback Message */}
          {message && (
            <div className={`p-4 mb-6 rounded ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          {/* Allocation Grid */}
          {allocations.length > 0 && activeLeave && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Class Coverage Assignments</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slot</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class / Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select Substitute</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allocations.map((alloc) => (
                      <tr key={alloc.time_slot} className={alloc.is_uncovered ? "bg-red-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{alloc.time_slot}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {alloc.section} <br/> <span className="text-xs text-gray-500">{alloc.room}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{alloc.subject_to_cover}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {alloc.is_uncovered ? (
                            <span className="text-red-600 font-semibold text-sm">⚠️ No available teachers</span>
                          ) : (
                            <select
                              value={selectedAssignments[alloc.time_slot]?.substitute_id || ""}
                              onChange={(e) => handleSelectSubstitute(alloc.time_slot, alloc.section, e.target.value)}
                              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                            >
                              {alloc.assigned_substitutes.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.name} ({sub.priority_level === 1 ? "Same Subject" : sub.subject_specialty})
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-end space-x-4 border-t pt-4">
                <button 
                  onClick={() => setAllocations([])}
                  className="px-6 py-2 border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveReliefPlan}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 shadow transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Confirm & Save Plan"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}