import { trpc } from "@/providers/trpc";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function StudentQR() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown

  const parsedOrderId = orderId ? Number(orderId) : NaN;
  const { data: order, isLoading } = trpc.order.getById.useQuery(
    { id: parsedOrderId },
    { enabled: !isNaN(parsedOrderId), retry: false }
  );

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto flex items-center justify-center h-screen">
        <div className="animate-pulse">
          <div className="w-64 h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center h-screen px-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold mb-2">Order not found</h2>
        <button
          onClick={() => navigate("/orders")}
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const isCollected = order.collectionStatus;

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/orders")}
          className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Order Token</h1>
      </div>

      <div className="px-4 py-6">
        {/* Token Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Token Header */}
          <div className="bg-green-600 text-white p-6 text-center">
            <p className="text-green-100 text-sm mb-1">Token Number</p>
            <p className="text-5xl font-bold">#{order.tokenNumber}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              {isCollected ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Collected</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Valid for {formatTime(timeLeft)}</span>
                </>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="p-6 flex flex-col items-center">
            {isCollected ? (
              <div className="w-48 h-48 bg-muted rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Already Collected</p>
                </div>
              </div>
            ) : (
              <>
                {order.qrCode ? (
                  <img
                    src={order.qrCode}
                    alt="Order QR Code"
                    className="w-56 h-56"
                  />
                ) : (
                  <div className="w-56 h-56 bg-muted rounded-xl flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">QR Code not available</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Show this QR code at the collection counter to collect your food
                </p>
              </>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 mt-4">
          <h3 className="font-semibold mb-3">Order Details</h3>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.foodName} x{item.quantity}
                </span>
                <span>₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-3">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-green-600">₹{Number(order.totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Payment</span>
              <span className="capitalize">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Status</span>
              <span className="capitalize font-medium">{order.orderStatus}</span>
            </div>
            {order.pickupTime && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Pickup</span>
                <span>{order.pickupTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        {!isCollected && (
          <div className="bg-blue-50 rounded-xl p-4 mt-4 border border-blue-100">
            <h4 className="font-semibold text-sm text-blue-800 mb-2">Collection Instructions</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>1. Show this QR code at the collection counter</li>
              <li>2. Wait for the staff to scan and verify</li>
              <li>3. Collect your food once verified</li>
              <li>4. This QR code is valid until collected</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
