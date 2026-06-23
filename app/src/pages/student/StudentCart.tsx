import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function StudentCart() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: cartItems, isLoading } = trpc.cart.list.useQuery();

  const updateQuantity = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
  });

  const removeItem = trpc.cart.remove.useMutation({
    onSuccess: () => {
      utils.cart.list.invalidate();
      toast.success("Item removed");
    },
  });

  const totalAmount = cartItems?.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  ) || 0;

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center h-[70vh] px-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          Looks like you haven&apos;t added any items yet.
        </p>
        <button
          onClick={() => navigate("/menu")}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-card z-40 border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/menu")}
          className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">My Cart</h1>
        <span className="text-sm text-muted-foreground">({cartItems.length} items)</span>
      </div>

      {/* Cart Items */}
      <div className="px-4 py-4 space-y-3">
        {cartItems.map((item) => (
          <div
            key={item.cartItemId}
            className="bg-card rounded-xl p-3 border border-border shadow-sm"
          >
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                <img
                  src={item.imageUrl || "/placeholder-food.jpg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm">{item.name}</h3>
                  <button
                    onClick={() => removeItem.mutate({ cartItemId: item.cartItemId })}
                    className="p-1 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-green-600 font-bold text-sm mt-1">
                  ₹{item.price}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    Subtotal: ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2 bg-muted rounded-full">
                    <button
                      onClick={() => {
                        if (item.quantity <= 1) {
                          removeItem.mutate({ cartItemId: item.cartItemId });
                        } else {
                          updateQuantity.mutate({
                            cartItemId: item.cartItemId,
                            quantity: item.quantity - 1,
                          });
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        if (item.stock > 0 && item.quantity < item.stock) {
                          updateQuantity.mutate({
                            cartItemId: item.cartItemId,
                            quantity: item.quantity + 1,
                          });
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Price Summary */}
      <div className="px-4 py-4 bg-card border-t border-border">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (5%)</span>
            <span>₹{(totalAmount * 0.05).toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-green-600">₹{(totalAmount * 1.05).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40">
        <button
          onClick={() => navigate("/checkout")}
          className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold shadow-lg active:scale-[0.98] transition-transform"
        >
          Proceed to Checkout — ₹{(totalAmount * 1.05).toFixed(2)}
        </button>
      </div>
    </div>
  );
}
