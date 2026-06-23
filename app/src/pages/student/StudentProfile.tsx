import { trpc } from "@/providers/trpc";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { User, Mail, Phone, LogOut, Flag, ArrowLeft, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StudentProfile() {
  const { student, isAuthenticated, isLoading, logout } = useStudentAuth();
  const navigate = useNavigate();
  const [showReport, setShowReport] = useState(false);
  const [issue, setIssue] = useState("");
  const [issueDesc, setIssueDesc] = useState("");

  const reportMutation = trpc.reports.reportIssue.useMutation({
    onSuccess: () => {
      toast.success("Report submitted successfully");
      setShowReport(false);
      setIssue("");
      setIssueDesc("");
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/student-login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto flex items-center justify-center h-screen">
        <div className="animate-pulse space-y-4 w-full px-4">
          <div className="w-20 h-20 bg-muted rounded-full mx-auto" />
          <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
          <div className="h-3 bg-muted rounded w-1/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (!student) return null;

  const handleSubmitReport = () => {
    if (!issue.trim()) {
      toast.error("Please describe the issue");
      return;
    }
    reportMutation.mutate({ issue, description: issueDesc || undefined });
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="px-4 py-6">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">{student.name}</h2>
          <div className="flex items-center justify-center gap-1 mt-1 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span>{student.email}</span>
          </div>
          {student.phone && (
            <div className="flex items-center justify-center gap-1 mt-1 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{student.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 space-y-3">
        {/* Report Issue Button */}
        <button
          onClick={() => setShowReport(!showReport)}
          className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Flag className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-sm">Report an Issue</p>
            <p className="text-xs text-muted-foreground">Report problems with food or orders</p>
          </div>
        </button>

        {/* Report Form */}
        {showReport && (
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
            <textarea
              placeholder="What went wrong? (e.g., food quality, missing items, delay)"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
            <input
              type="text"
              placeholder="Additional details (optional)"
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={handleSubmitReport}
              disabled={reportMutation.isPending || !issue.trim()}
              className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70"
            >
              {reportMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {reportMutation.isPending ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-red-100 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <LogOut className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-sm text-red-600">Logout</p>
            <p className="text-xs text-muted-foreground">Sign out of your account</p>
          </div>
        </button>
      </div>
    </div>
  );
}
