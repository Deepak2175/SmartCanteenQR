import { trpc } from "@/providers/trpc";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, ShoppingCart, Plus, Minus, Leaf, Beef, Coffee, Cookie, CakeSlice } from "lucide-react";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { toast } from "sonner";

const categories = [
  { key: "all", label: "All", icon: null },
  { key: "veg", label: "Veg", icon: Leaf },
  { key: "non_veg", label: "Non-Veg", icon: Beef },
  { key: "beverage", label: "Drinks", icon: Coffee },
  { key: "snack", label: "Snacks", icon: Cookie },
  { key: "dessert", label: "Dessert", icon: CakeSlice },
];

export default function StudentMenu() {
  const navigate = useNavigate();
  const { isAuthenticated } = useStudentAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const { data: foodItems, isLoading } = trpc.food.list.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    search: searchQuery || undefined,
    availableOnly: true,
  });

  const { data: cartItems } = trpc.cart.list.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.list.invalidate();
      toast.success("Added to cart!");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleAddToCart = (foodId: number) => {
    if (!isAuthenticated) {
      toast.error("Please login first");
      navigate("/student-login");
      return;
    }
    const qty = quantities[foodId] || 1;
    addToCart.mutate({ foodId, quantity: qty });
    setQuantities((prev) => ({ ...prev, [foodId]: 1 }));
  };

  const updateQty = (foodId: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[foodId] || 1;
      const next = Math.max(1, Math.min(current + delta, 10));
      return { ...prev, [foodId]: next };
    });
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-card z-40 border-b border-border px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Menu</h1>
          <button
            onClick={() => navigate("/cart")}
            className="relative p-2 bg-muted rounded-full"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search food items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? "bg-green-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Food Items List */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-3 border border-border animate-pulse">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </div>
              </div>
            </div>
          ))
        ) : foodItems?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No items found</p>
          </div>
        ) : (
          foodItems?.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-xl p-3 border border-border shadow-sm"
            >
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                  <img
                    src={item.imageUrl || "/placeholder-food.jpg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            item.category === "veg"
                              ? "bg-green-100 text-green-700"
                              : item.category === "non_veg"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.category.replace("_", "-")}
                        </span>
                        {item.servingTime && (
                          <span className="text-[10px] text-muted-foreground">
                            {item.servingTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-green-600 font-bold text-sm">
                      ₹{item.price}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-muted rounded-full">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">
                          {quantities[item.id] || 1}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleAddToCart(item.id)}
                        disabled={addToCart.isPending}
                        className="bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => navigate("/cart")}
            className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold shadow-lg flex items-center justify-between px-6 active:scale-[0.98] transition-transform"
          >
            <span>View Cart ({cartCount} items)</span>
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
