import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: stats } = trpc.reports.dashboardStats.useQuery();
  const { data: recentOrders } = trpc.order.list.useQuery({ status: "all" });
  const { data: settings } = trpc.canteen.getSettings.useQuery();

  const kpiCards = [
    {
      label: "Total Revenue",
      value: `₹${(stats?.totalRevenue || 0).toFixed(2)}`,
      color: "text-green-600",
      bgColor: "bg-green-50",
      icon: DollarSign,
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders || 0,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      icon: ShoppingBag,
    },
    {
      label: "Pending Orders",
      value: stats?.pendingOrders || 0,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      icon: Clock,
    },
    {
      label: "Today Revenue",
      value: `₹${(stats?.todayRevenue || 0).toFixed(2)}`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      icon: TrendingUp,
    },
  ];

  const activeOrders = recentOrders?.filter(
    (o) => o.orderStatus === "pending" || o.orderStatus === "preparing" || o.orderStatus === "ready"
  ).slice(0, 5) || [];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    preparing: "bg-orange-100 text-orange-700",
    ready: "bg-green-100 text-green-700",
    collected: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card rounded-xl p-5 border border-border shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-lg">Active Orders</h2>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-sm text-green-600 font-medium flex items-center gap-1 hover:underline"
            >
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {activeOrders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No active orders
              </div>
            ) : (
              activeOrders.map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-accent transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Token #{order.tokenNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.orderStatus]}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.orderDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-green-600">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{order.paymentMethod}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Canteen Status */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-lg">Canteen Status</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${settings?.isOpen ? "bg-green-500" : "bg-red-500"}`} />
                <span className={`text-sm font-medium ${settings?.isOpen ? "text-green-600" : "text-red-600"}`}>
                  {settings?.isOpen ? "Open" : "Closed"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Opening Time</span>
              <span className="text-sm font-medium">{settings?.openingTime || "08:00"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Closing Time</span>
              <span className="text-sm font-medium">{settings?.closingTime || "20:00"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Token</span>
              <span className="text-sm font-medium">#{settings?.currentToken || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Token</span>
              <span className="text-sm font-medium">#{settings?.lastTokenNumber || 100}</span>
            </div>

            <div className="pt-3 border-t border-border">
              <button
                onClick={() => navigate("/admin/settings")}
                className="w-full text-center text-sm text-green-600 font-medium hover:underline"
              >
                Manage Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
