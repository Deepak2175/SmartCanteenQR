import { trpc } from "@/providers/trpc";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { useNavigate } from "react-router";
import {
  Clock,
  UtensilsCrossed,
  Users,
  Timer,
  ChevronRight,
  ShoppingCart,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";

const timeSlots = ["Now", "9:15 - 10:15 AM", "11:30 - 12:30 PM", "5:15 - 6:15 PM"];

export default function StudentHome() {
  const { student } = useStudentAuth();
  const navigate = useNavigate();
  const { data: settings } = trpc.canteen.getSettings.useQuery();
  const { data: foodItems } = trpc.food.list.useQuery({ availableOnly: true });
  const { data: cartItems } = trpc.cart.list.useQuery(undefined, {
    retry: false,
  });
  const { data: stats } = trpc.order.stats.useQuery();

  const [selectedTime, setSelectedTime] = useState("Now");
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const isOpen = settings?.isOpen ?? true;
  const popularItems = foodItems?.slice(0, 6) || [];

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">
              Hi{student ? `, ${student.name.split(" ")[0]}` : " there"}!
            </h1>
            <p className="text-green-100 text-sm">{greeting}, Choose your order time</p>
          </div>
          {cartItems && cartItems.length > 0 && (
            <button
              onClick={() => navigate("/cart")}
              className="relative p-2 bg-green-700 rounded-full"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            </button>
          )}
        </div>

        {/* Time Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedTime(slot)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedTime === slot
                  ? "bg-white text-green-700"
                  : "bg-green-700 text-green-100"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Canteen Status */}
      <div className="px-4 -mt-4">
        <div
          className={`rounded-xl p-4 shadow-sm border ${
            isOpen
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <div>
                <p className="font-semibold text-sm">
                  Canteen {isOpen ? "Open" : "Closed"}
                </p>
                <p className="text-xs text-gray-500">
                  {settings?.openingTime || "08:00"} - {settings?.closingTime || "20:00"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Clock className="h-5 w-5 text-gray-400 inline" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Grid */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <UtensilsCrossed className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-500">Menu Items</span>
            </div>
            <p className="text-2xl font-bold">{foodItems?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-gray-500">Live Queue</span>
            </div>
            <p className="text-2xl font-bold">
              {(stats?.pendingOrders || 0) + (stats?.preparingOrders || 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-500">Current Token</span>
            </div>
            <p className="text-2xl font-bold">{settings?.currentToken || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-gray-500">Avg. Wait</span>
            </div>
            <p className="text-2xl font-bold">12m</p>
          </div>
        </div>
      </div>

      {/* Popular Items */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Most Popular</h2>
          <button
            onClick={() => navigate("/menu")}
            className="text-green-600 text-sm font-medium flex items-center gap-0.5"
          >
            View All <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {popularItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate("/menu")}
              className="snap-start flex-shrink-0 w-36 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left active:scale-95 transition-transform"
            >
              <div className="h-24 bg-gray-100 relative">
                <img
                  src={item.imageUrl || "/placeholder-food.jpg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-2">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-green-600 font-bold text-sm">₹{item.price}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-2 mb-8">
        <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/menu")}
            className="bg-green-600 text-white rounded-xl p-4 text-left active:scale-95 transition-transform"
          >
            <UtensilsCrossed className="h-6 w-6 mb-2" />
            <p className="font-semibold text-sm">Order Food</p>
            <p className="text-green-100 text-xs mt-1">Browse menu & order</p>
          </button>
          <button
            onClick={() => navigate("/orders")}
            className="bg-orange-500 text-white rounded-xl p-4 text-left active:scale-95 transition-transform"
          >
            <ClipboardList className="h-6 w-6 mb-2" />
            <p className="font-semibold text-sm">My Orders</p>
            <p className="text-orange-100 text-xs mt-1">Track your orders</p>
          </button>
        </div>
      </div>
    </div>
  );
}
