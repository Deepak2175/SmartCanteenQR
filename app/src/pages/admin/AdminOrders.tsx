import { trpc } from "@/providers/trpc";
import { useState } from "react";
import {
  Search,
  ChefHat,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";

const tabs = ["all", "pending", "preparing", "ready", "collected"];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  preparing: { label: "Preparing", color: "bg-orange-100 text-orange-700", icon: ChefHat },
  ready: { label: "Ready", color: "bg-green-100 text-green-700", icon: Package },
  collected: { label: "Collected", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function AdminOrders() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: orders, isLoading } = trpc.order.list.useQuery({
    status: activeTab,
  });

  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      utils.order.list.invalidate();
      utils.reports.dashboardStats.invalidate();
      toast.success("Order status updated!");
    },
  });

  const filteredOrders = orders?.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.tokenNumber.toString().includes(query) ||
      order.orderStatus.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by token number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-card text-green-700 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredOrders?.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders?.map((order) => {
            const status = statusConfig[order.orderStatus] || statusConfig.pending;
            const StatusIcon = status.icon;
            const canAdvance = order.orderStatus !== "collected" && order.orderStatus !== "cancelled";

            const nextStatus: Record<string, string> = {
              pending: "preparing",
              preparing: "ready",
              ready: "collected",
            };

            return (
              <div
                key={order.id}
                className="bg-card rounded-xl border border-border shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${status.color.split(" ")[0]}`}>
                      <StatusIcon className={`h-4 w-4 ${status.color.split(" ")[1]}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Token #{order.tokenNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.orderDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">
                    ₹{Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="capitalize">{order.paymentMethod}</span>
                    <span className={order.paymentStatus === "paid" ? "text-green-600" : "text-red-600"}>
                      {order.paymentStatus}
                    </span>
                    {order.qrCode && (
                      <span className="flex items-center gap-1">
                        <QrCode className="h-3 w-3" /> QR Generated
                      </span>
                    )}
                  </div>
                  {canAdvance && nextStatus[order.orderStatus] && (
                    <button
                      onClick={() =>
                        updateStatus.mutate({
                          id: order.id,
                          status: nextStatus[order.orderStatus] as "pending" | "preparing" | "ready" | "collected" | "cancelled",
                        })
                      }
                      disabled={updateStatus.isPending}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium active:scale-95 transition-transform disabled:opacity-50"
                    >
                      Mark as {nextStatus[order.orderStatus]}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
