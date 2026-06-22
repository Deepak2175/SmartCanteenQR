import { trpc } from "@/providers/trpc";
import { BarChart3, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";

export default function AdminReports() {
  const { data: dashboardStats } = trpc.reports.dashboardStats.useQuery();
  const { data: salesByDate } = trpc.reports.salesByDate.useQuery();
  const { data: salesByCategory } = trpc.reports.salesByCategory.useQuery();
  const { data: topItems } = trpc.reports.topSellingItems.useQuery();

  const categoryColors: Record<string, string> = {
    veg: "bg-green-500",
    non_veg: "bg-red-500",
    beverage: "bg-blue-500",
    snack: "bg-orange-500",
    dessert: "bg-pink-500",
  };

  const maxSales = Math.max(...(salesByCategory?.map((s) => s.sales) || [1]));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold">₹{(dashboardStats?.totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total Orders</span>
          </div>
          <p className="text-2xl font-bold">{dashboardStats?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Avg Order Value</span>
          </div>
          <p className="text-2xl font-bold">₹{(dashboardStats?.avgOrderValue || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Today&apos;s Revenue</span>
          </div>
          <p className="text-2xl font-bold">₹{(dashboardStats?.todayRevenue || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-lg mb-4">Sales by Category</h2>
          {salesByCategory && salesByCategory.length > 0 ? (
            <div className="space-y-3">
              {salesByCategory.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize font-medium">{cat.category.replace("_", "-")}</span>
                    <span className="text-gray-500">₹{cat.sales.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${categoryColors[cat.category] || "bg-gray-500"}`}
                      style={{ width: `${Math.min(100, (cat.sales / maxSales) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No data available</p>
          )}
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-lg mb-4">Top Selling Items</h2>
          {topItems && topItems.length > 0 ? (
            <div className="space-y-3">
              {topItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-gray-400">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{item.foodName}</span>
                      <span className="text-sm text-gray-500">{item.totalQuantity} sold</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                      <div
                        className="h-2 bg-green-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (item.totalQuantity / (topItems[0]?.totalQuantity || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Sales by Date Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-lg mb-4">Daily Sales</h2>
        {salesByDate && salesByDate.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-2 h-48 min-w-max px-2">
              {salesByDate.slice(-14).map((day) => {
                const maxVal = Math.max(...salesByDate.map((d) => d.sales));
                const height = maxVal > 0 ? (day.sales / maxVal) * 100 : 0;
                return (
                  <div key={day.date} className="flex flex-col items-center gap-1 flex-1 min-w-[40px]">
                    <span className="text-[10px] text-gray-500">${Math.round(day.sales)}</span>
                    <div
                      className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {new Date(day.date).toLocaleDateString()}: ₹{day.sales.toFixed(2)}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">No sales data available</p>
        )}
      </div>
    </div>
  );
}
