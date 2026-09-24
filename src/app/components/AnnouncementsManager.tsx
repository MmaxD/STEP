import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../apiConfig";
import { Bell, Send, AlertCircle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

export function AnnouncementsManager() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, priority }),
      });

      if (res.ok) {
        setStatusMsg({
          text: "Announcement published successfully to all teachers!",
          type: "success",
        });
        setTitle("");
        setMessage("");
        setPriority("medium");
      } else {
        setStatusMsg({
          text: "Failed to publish announcement.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({
        text: "Network error. Could not connect to server.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
            <p className="text-gray-500">
              Broadcast important updates to all faculty dashboards
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle>Create New Broadcast</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {statusMsg && (
              <div
                className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${statusMsg.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}
              >
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Subject / Title
                </label>
                <Input
                  placeholder="e.g. End of Term Grading Deadline"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Priority Level
                </label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">
                      <span className="text-red-600 font-medium">
                        High Priority / Urgent
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Message Body
                </label>
                <Textarea
                  placeholder="Type the full announcement details here..."
                  className="min-h-[150px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 min-w-[200px] h-12 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" /> Broadcast Now
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
