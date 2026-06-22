import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { useState } from "react";
import { ArrowLeft, CreditCard, Smartphone, Banknote, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

type PaymentMethod = "upi" | "card" | "cash";
type PaymentStatus = "idle" | "processing" | "success" | "failed";

export default function StudentCheckout() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [upiId, setUpiId] = useState("");
  const [pickupTime, setPickupTime] = useState("Now");

  const { data: cartItems } = trpc.cart.list.useQuery();
  const processUpi = trpc.payment.processUpi.useMutation();
  const processCard = trpc.payment.processCard.useMutation();
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
    if (paymentMethod === "upi" && !upiId.trim()) {
      toast.error("Please enter your UPI ID");
      return;
    }

    setPaymentStatus("processing");

    try {
      let result;
      if (paymentMethod === "upi") {
        result = await processUpi.mutateAsync({ amount: finalAmount, upiId });
      } else if (paymentMethod === "card") {
        result = await processCard.mutateAsync({
          amount: finalAmount,
          cardNumber: "0000000000000000",
          expiry: "12/25",
          cvv: "123",
        });
      } else {
        // Cash - skip payment processing
        result = { success: true, transactionId: "CASH" };
      }

      if (result.success) {
        setPaymentStatus("success");
        // Create order after successful payment
        setTimeout(() => {
          createOrder.mutate({
            paymentMethod,
            pickupTime: pickupTime === "Now" ? undefined : pickupTime,
          });
        }, 1000);
      } else {
        setPaymentStatus("failed");
        toast.error(result.message || "Payment failed");
      }
    } catch {
      setPaymentStatus("failed");
      toast.error("Payment processing error");
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center h-screen px-4">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
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
      <div className="sticky top-0 bg-white z-40 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/cart")}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Checkout</h1>
      </div>

      {/* Order Summary */}
      <div className="px-4 py-4">
        <h2 className="font-semibold mb-3">Order Summary</h2>
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          {cartItems.map((item) => (
            <div key={item.cartItemId} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.name} x{item.quantity}
              </span>
              <span>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax (5%)</span>
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
                  : "bg-gray-100 text-gray-600"
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
                : "border-gray-200 bg-white"
            }`}
          >
            <Smartphone className="h-5 w-5 text-green-600" />
            <div className="text-left flex-1">
              <p className="font-medium text-sm">UPI Payment</p>
              <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</p>
            </div>
            {paymentMethod === "upi" && <Check className="h-5 w-5 text-green-600" />}
          </button>

          {paymentMethod === "upi" && (
            <div className="px-4 pb-2">
              <input
                type="text"
                placeholder="Enter UPI ID (e.g., name@upi)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <button
            onClick={() => setPaymentMethod("card")}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              paymentMethod === "card"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <CreditCard className="h-5 w-5 text-blue-600" />
            <div className="text-left flex-1">
              <p className="font-medium text-sm">Credit/Debit Card</p>
              <p className="text-xs text-gray-500">Visa, Mastercard, RuPay</p>
            </div>
            {paymentMethod === "card" && <Check className="h-5 w-5 text-green-600" />}
          </button>

          <button
            onClick={() => setPaymentMethod("cash")}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "cash"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <Banknote className="h-5 w-5 text-orange-600" />
            <div className="text-left flex-1">
              <p className="font-medium text-sm">Cash on Collection</p>
              <p className="text-xs text-gray-500">Pay when you collect</p>
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
          {paymentStatus === "idle" && `Pay ₹${finalAmount.toFixed(2)}`}
          {paymentStatus === "processing" && "Processing..."}
          {paymentStatus === "success" && "Payment Successful!"}
          {paymentStatus === "failed" && "Retry Payment"}
        </button>

        {paymentStatus === "failed" && (
          <button
            onClick={() => setPaymentStatus("idle")}
            className="w-full mt-2 py-2 text-gray-500 text-sm"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
