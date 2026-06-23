import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { useEffect, useState } from "react";
import { QrCode, Clock, CheckCircle, ChefHat, Package, XCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "text-yellow-600 bg-yellow-50", icon: Clock },
  preparing: { label: "Preparing", color: "text-orange-600 bg-orange-50", icon: ChefHat },
  ready: { label: "Ready", color: "text-green-600 bg-green-50", icon: Package },
  collected: { label: "Collected", color: "text-blue-600 bg-blue-50", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-600 bg-red-50", icon: XCircle },
};

export default function StudentOrders() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useStudentAuth();
  const { data: orders, isLoading } = trpc.order.myOrders.useQuery(undefined, {
    retry: false,
  });
  const utils = trpc.useUtils();
  const [cancellingOrders, setCancellingOrders] = useState<Set<number>>(new Set());
  const cancelMutation = trpc.order.cancel.useMutation({
    onSuccess: () => {
      setCancellingOrders(new Set());
      utils.order.myOrders.invalidate();
    },
    onError: () => {
      setCancellingOrders(new Set());
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/student-login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center h-[70vh] px-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <QrCode className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold mb-2">No orders yet</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          Your order history will appear here.
        </p>
        <button
          onClick={() => navigate("/menu")}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
        >
          Order Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-card z-40 border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold">My Orders</h1>
        <p className="text-sm text-muted-foreground">{orders.length} orders</p>
      </div>

      {/* Orders List */}
      <div className="px-4 py-4 space-y-3">
        {orders.map((order) => {
          const status = statusConfig[order.orderStatus] || statusConfig.pending;
          const StatusIcon = status.icon;
          const isActive = order.orderStatus === "pending" || order.orderStatus === "preparing" || order.orderStatus === "ready";

          return (
            <div
              key={order.id}
              className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">Token #{order.tokenNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${status.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    <span className="text-xs font-medium">{status.label}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.foodName} x{item.quantity}
                      </span>
                      <span className="text-muted-foreground">
                        ₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="font-bold text-green-600">
                    ₹{Number(order.totalAmount).toFixed(2)}
                  </span>
                  <div className="flex gap-2">
                    {(order.orderStatus === "pending" || order.orderStatus === "preparing") && (
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to cancel this order?")) {
                            setCancellingOrders((prev) => new Set(prev).add(order.id));
                            cancelMutation.mutate({ id: order.id });
                          }
                        }}
                        disabled={cancellingOrders.has(order.id)}
                        className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-medium active:scale-95 transition-transform disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" />
                        {cancellingOrders.has(order.id) ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                    {isActive && order.qrCode && (
                      <button
                        onClick={() => navigate(`/qr/${order.id}`)}
                        className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-medium active:scale-95 transition-transform"
                      >
                        <QrCode className="h-3 w-3" />
                        Show QR
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
