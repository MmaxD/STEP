import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../apiConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Clock, Check, X, Loader2, CheckCircle2 } from "lucide-react";

export function PendingLeaves() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [notification, setNotification] = useState<{ type: "success" | "danger"; message: string } | null>(null);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      // Endpoint dynamically switches based on active tab
      const endpoint =
        activeTab === "pending"
          ? `${API_BASE_URL}/principal/pending-leaves`
          : `${API_BASE_URL}/principal/approved-leaves`;

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      } else {
        setLeaves([]);
      }
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [activeTab]);

  const handleStatusChange = async (id: number, status: "approved" | "rejected", teacherName?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/leave-requests/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setNotification({
          type: status === "approved" ? "success" : "danger",
          message: `Leave request for ${teacherName || "Teacher"} was ${status} successfully! Email sent.`,
        });

        setLeaves((prev) => prev.filter((leave) => leave.id !== id));
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification({
          type: "danger",
          message: "Failed to update leave request status.",
        });
      }
    } catch (err) {
      console.error("Error updating leave status:", err);
      setNotification({
        type: "danger",
        message: "Failed to update leave request status.",
      });
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm my-6">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="text-lg flex items-center gap-2">
          {activeTab === "pending" ? (
            <>
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Teacher Leave Requests
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Approved & Auto-Approved Leaves
            </>
          )}
        </CardTitle>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeTab === "pending" ? "default" : "outline"}
            onClick={() => setActiveTab("pending")}
            className={activeTab === "pending" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
          >
            Pending Requests
          </Button>
          <Button
            size="sm"
            variant={activeTab === "approved" ? "default" : "outline"}
            onClick={() => setActiveTab("approved")}
            className={activeTab === "approved" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
          >
            View Approved Leaves
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {notification && (
          <div
            className={`p-3 mb-4 rounded-md text-sm font-medium flex items-center gap-2 border transition-all duration-300 ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <span>{notification.type === "success" ? "✅" : "❌"}</span>
            <span>{notification.message}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            {activeTab === "pending" ? "No pending leave requests found." : "No approved leaves found."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher ID</TableHead>
                <TableHead>Teacher Name</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">
                  {activeTab === "pending" ? "Actions" : "Status"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    T-{leave.teacher_id}
                  </TableCell>
                  <TableCell className="font-medium">{leave.teacher_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`capitalize ${
                        leave.leave_type?.toLowerCase().includes("sick")
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {leave.leave_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {leave.leave_date ? String(leave.leave_date).split("T")[0] : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 max-w-xs truncate">
                    {leave.reason}
                  </TableCell>
                  <TableCell className="text-right">
                    {activeTab === "pending" ? (
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                          onClick={() => handleStatusChange(leave.id, "approved", leave.teacher_name)}
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 px-3"
                          onClick={() => handleStatusChange(leave.id, "rejected", leave.teacher_name)}
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                        {leave.leave_type?.toLowerCase().includes("sick") ? "Auto-Approved" : "Approved"}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}