import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../apiConfig";
import {
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Alert, AlertDescription } from "@/app/components/ui/alert";

export function LeaveForm() {
  const [leaveType, setLeaveType] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [availableCasual, setAvailableCasual] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Fetch teacher ID and available casual leaves on mount
  useEffect(() => {
    // Check multiple common localStorage keys, or fallback to '1' for testing
    const userId =
      localStorage.getItem("loggedInUserId") ||
      localStorage.getItem("userId") ||
      localStorage.getItem("teacher_id") ||
      "1";

    console.log("Teacher ID resolved to:", userId);

    setTeacherId(userId);
    setError(""); // Clear any previous errors

    const fetchAvailableCasual = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/leave-availability?teacherId=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableCasual(data.availableCasual);
        } else {
          console.error("Failed to fetch availability:", response.statusText);
        }
      } catch (err) {
        console.error("Failed to fetch available casual leaves:", err);
      }
    };
    fetchAvailableCasual();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!teacherId) {
      setError("User not logged in. Please log in first.");
      return;
    }

    const leaveTypeValue = leaveType.trim();
    const dateValue = date.trim();
    const reasonValue = reason.trim();

    if (!leaveTypeValue || !dateValue || !reasonValue) {
      setError("Please fill in all fields (marked with *)");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    if (leaveTypeValue === "casual" && availableCasual <= 0) {
      setError("No casual leaves available.");
      setLoading(false);
      return;
    }

    try {
      const parsedTeacherId = parseInt(teacherId, 10) || 1;

      const response = await fetch(`${API_BASE_URL}/leave-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Send both snake_case and camelCase to fit any database route structure
          teacher_id: parsedTeacherId,
          teacherId: parsedTeacherId,
          leave_type: leaveTypeValue,
          leaveType: leaveTypeValue,
          leave_date: dateValue,
          date: dateValue,
          reason: reasonValue,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Leave request submitted successfully.");
        // Reset form inputs
        setLeaveType("");
        setDate("");
        setReason("");
        if (leaveTypeValue === "casual") {
          setAvailableCasual((prev) => prev - 1);
        }
      } else {
        setError(data.message || data.error || "Failed to submit leave request.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Leave Request Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!teacherId ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Login Required
              </h2>
              <p className="text-gray-600">
                Please log in first to access the leave form.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label className="text-base font-medium">
                  Leave Type <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={leaveType}
                  onValueChange={setLeaveType}
                  className="mt-3 space-y-2"
                >
                  <div
                    className={`flex items-center space-x-2 p-3 border-2 rounded-lg transition-all ${
                      leaveType === "sick"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <RadioGroupItem value="sick" id="sick" />
                    <Label htmlFor="sick" className="cursor-pointer flex-1">
                      Sick Leave (Auto-approved)
                    </Label>
                  </div>
                  <div
                    className={`flex items-center space-x-2 p-3 border-2 rounded-lg transition-all ${
                      leaveType === "casual"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    } ${availableCasual <= 0 ? "opacity-50" : ""}`}
                  >
                    <RadioGroupItem
                      value="casual"
                      id="casual"
                      disabled={availableCasual <= 0}
                    />
                    <Label htmlFor="casual" className="cursor-pointer flex-1">
                      Casual Leave (Available: {availableCasual}/5)
                    </Label>
                  </div>
                  <div
                    className={`flex items-center space-x-2 p-3 border-2 rounded-lg transition-all ${
                      leaveType === "working"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <RadioGroupItem value="working" id="working" />
                    <Label htmlFor="working" className="cursor-pointer flex-1">
                      Working Leave (Requires Principal Approval)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="date">
                  Leave Date <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDate(e.target.value)
                    }
                    className="pl-10"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">
                  Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for your leave request..."
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setReason(e.target.value)
                  }
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Leave Request"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}