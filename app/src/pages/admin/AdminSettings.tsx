import { trpc } from "@/providers/trpc";
import { useState, useEffect } from "react";
import {
  Clock,
  Store,
  RotateCcw,
  Save,
  AlertTriangle,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.canteen.getSettings.useQuery();

  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("20:00");
  const [isOpen, setIsOpen] = useState(true);
  const [crowdLevel, setCrowdLevel] = useState<"low" | "medium" | "high">("low");

  useEffect(() => {
    if (settings) {
      setOpeningTime(settings.openingTime);
      setClosingTime(settings.closingTime);
      setIsOpen(Boolean(settings.isOpen));
      setCrowdLevel((settings.crowdLevel as "low" | "medium" | "high") || "low");
    }
  }, [settings]);

  const updateSettings = trpc.canteen.updateSettings.useMutation({
    onSuccess: () => {
      utils.canteen.getSettings.invalidate();
      toast.success("Settings updated!");
    },
  });

  const resetToken = trpc.canteen.resetToken.useMutation({
    onSuccess: () => {
      utils.canteen.getSettings.invalidate();
      toast.success("Token counter reset!");
    },
  });

  const handleSave = () => {
    updateSettings.mutate({
      openingTime,
      closingTime,
      isOpen,
      crowdLevel,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Canteen Settings */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-50 rounded-lg">
            <Store className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Canteen Settings</h2>
            <p className="text-sm text-muted-foreground">Manage operating hours and status</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Open/Closed Toggle */}
          <div className="flex items-center justify-between p-4 bg-background rounded-xl">
            <div>
              <p className="font-medium text-sm">Canteen Status</p>
              <p className="text-xs text-muted-foreground">Control if students can place orders</p>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isOpen ? "bg-green-500" : "bg-muted-foreground/30"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-card rounded-full shadow transition-transform ${
                  isOpen ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Opening Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Opening Time
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Closing Time
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Crowd Level */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Crowd Level
            </label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setCrowdLevel(level)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    crowdLevel === level
                      ? level === "low"
                        ? "bg-green-600 text-white"
                        : level === "medium"
                        ? "bg-yellow-500 text-white"
                        : "bg-red-500 text-white"
                      : "bg-background text-muted-foreground border border-border"
                  }`}
                >
                  {level === "low" ? "Low" : level === "medium" ? "Medium" : "High"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold active:scale-[0.98] transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Token Management */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-50 rounded-lg">
            <RotateCcw className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Token Management</h2>
            <p className="text-sm text-muted-foreground">Reset the token counter</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">Warning</p>
              <p className="text-xs text-orange-600 mt-1">
                Resetting the token counter will set the current token back to 0 and
                the last token number back to 100. This should typically be done at
                the start of a new day.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-background rounded-xl mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Token</p>
            <p className="text-2xl font-bold">#{settings?.currentToken || 0}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Last Token</p>
            <p className="text-2xl font-bold">#{settings?.lastTokenNumber || 100}</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm("Are you sure you want to reset the token counter?")) {
              resetToken.mutate();
            }
          }}
          disabled={resetToken.isPending}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold active:scale-[0.98] transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          {resetToken.isPending ? "Resetting..." : "Reset Token Counter"}
        </button>
      </div>
    </div>
  );
}
