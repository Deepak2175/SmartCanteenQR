import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { useState } from "react";
import { ArrowLeft, CreditCard, Smartphone, Banknote, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

type PaymentMethod = "upi" | "card" | "cash";
type PaymentStatus = "idle" | "processing" | "success";

export default function StudentCheckout() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [pickupTime, setPickupTime] = useState("Now");

  const { data: cartItems } = trpc.cart.list.useQuery();
  const createOrder = trpc.order.create.useMutation({
    onSuccess: (data) => {
      utils.cart.list.invalidate();
      toast.success("Order placed successfully!");
      navigate(`/qr/${data.orderId}`);
    },
    onError: (err) => {
      toast.error(err.message);
      setPaymentStatus("idle");
    },
  });

  const totalAmount = cartItems?.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  ) || 0;
  const finalAmount = totalAmount * 1.05;

  const handlePayment = async () => {
    setPaymentStatus("processing");

    if (paymentMethod !== "cash") {
      toast.success("Payment is in process");
    }

    createOrder.mutate({
      paymentMethod,
      pickupTime: pickupTime === "Now" ? undefined : pickupTime,
    });
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center h-screen px-4">
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <button
          onClick={() => navigate("/menu")}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-card z-40 border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/cart")}
          className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Checkout</h1>
      </div>

      {/* Order Summary */}
      <div className="px-4 py-4">
        <h2 className="font-semibold mb-3">Order Summary</h2>
        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          {cartItems.map((item) => (
            <div key={item.cartItemId} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.name} x{item.quantity}
              </span>
              <span>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (5%)</span>
              <span>₹{(totalAmount * 0.05).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span>
              <span className="text-green-600">₹{finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pickup Time */}
      <div className="px-4 mb-4">
        <h2 className="font-semibold mb-3">Pickup Time</h2>
        <div className="grid grid-cols-2 gap-2">
          {["Now", "9:15 - 10:15 AM", "11:30 - 12:30 PM", "5:15 - 6:15 PM"].map((time) => (
            <button
              key={time}
              onClick={() => setPickupTime(time)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                pickupTime === time
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="px-4 mb-4">
        <h2 className="font-semibold mb-3">Payment Method</h2>
        <div className="space-y-2">
          <button
            onClick={() => setPaymentMethod("upi")}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              paymentMethod === "upi"
                ? "border-green-500 bg-green-50"
                : "border-border bg-card"
            }`}
          >
            <Smartphone className="h-5 w-5 text-green-600" />
            <div className="text-left flex-1">
              <p className="font-medium text-sm">UPI Payment</p>
              <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm</p>
            </div>
            {paymentMethod === "upi" && <Check className="h-5 w-5 text-green-600" />}
          </button>

          <button
            onClick={() => setPaymentMethod("card")}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              paymentMethod === "card"
                ? "border-green-500 bg-green-50"
                : "border-border bg-card"
            }`}
          >
            <CreditCard className="h-5 w-5 text-blue-600" />
            <div className="text-left flex-1">
              <p className="font-medium text-sm">Credit/Debit Card</p>
              <p className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</p>
            </div>
            {paymentMethod === "card" && <Check className="h-5 w-5 text-green-600" />}
          </button>

          <button
            onClick={() => setPaymentMethod("cash")}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "cash"
                ? "border-green-500 bg-green-50"
                : "border-border bg-card"
            }`}
          >
            <Banknote className="h-5 w-5 text-orange-600" />
            <div className="text-left flex-1">
              <p className="font-medium text-sm">Cash on Collection</p>
              <p className="text-xs text-muted-foreground">Pay when you collect</p>
            </div>
            {paymentMethod === "cash" && <Check className="h-5 w-5 text-green-600" />}
          </button>
        </div>
      </div>

      {/* Pay Button */}
      <div className="px-4 mt-4">
        <button
          onClick={handlePayment}
          disabled={paymentStatus === "processing" || paymentStatus === "success"}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {paymentStatus === "processing" && <Loader2 className="h-5 w-5 animate-spin" />}
          {paymentStatus === "success" && <Check className="h-5 w-5" />}
          {paymentStatus === "idle" && (paymentMethod === "cash" ? "Place Order" : `Pay ₹${finalAmount.toFixed(2)}`)}
          {paymentStatus === "processing" && "Processing..."}
          {paymentStatus === "success" && (paymentMethod === "cash" ? "Order Placed!" : "Payment Successful!")}
        </button>
      </div>
    </div>
  );
}
