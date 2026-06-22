import { trpc } from "@/providers/trpc";
import { useState, useRef, useCallback } from "react";
import {
  QrCode,
  CheckCircle,
  User,
  Mail,
  Phone,
  Camera,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminQRScanner() {
  const utils = trpc.useUtils();
  const [scannedData, setScannedData] = useState<string>("");
  const [verification, setVerification] = useState<{
    valid: boolean;
    order: {
      id: number;
      tokenNumber: number;
      totalAmount: string;
      orderStatus: string;
      paymentMethod: string;
      paymentStatus: string;
      studentName: string;
      studentEmail: string;
      studentPhone: string;
      items: { foodName: string; quantity: number; unitPrice: string }[];
    };
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const scanQr = trpc.order.scanQr.useMutation({
    onSuccess: (data) => {
      setVerification(data as typeof verification);
      toast.success("QR code verified!");
    },
    onError: (err) => {
      setVerification(null);
      toast.error(err.message);
    },
  });

  const markCollected = trpc.order.markCollected.useMutation({
    onSuccess: () => {
      utils.order.list.invalidate();
      utils.canteen.getSettings.invalidate();
      setVerification(null);
      setScannedData("");
      toast.success("Order marked as collected!");
    },
  });

  const handleManualScan = () => {
    if (!scannedData.trim()) {
      toast.error("Please enter QR data");
      return;
    }
    scanQr.mutate({ qrData: scannedData });
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsScanning(true);
    } catch {
      toast.error("Camera access denied. Use manual entry.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Simulate QR scan from camera
  const simulateScan = () => {
    // In a real app, this would decode the QR from the video frame
    // For demo, we'll just show the manual entry
    stopCamera();
    toast.info("Use the manual QR entry below");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Area */}
        <div className="space-y-4">
          {/* Camera View */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4" />
                QR Scanner
              </h2>
            </div>
            <div className="p-4">
              {isScanning ? (
                <div className="relative aspect-square max-w-sm mx-auto bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {/* Scan overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-green-400 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400" />
                      {/* Scan line */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-pulse" 
                        style={{ animation: "scan 2s linear infinite" }} 
                      />
                    </div>
                  </div>
                  <button
                    onClick={simulateScan}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-gray-800 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    <RefreshCw className="h-4 w-4 inline mr-1" />
                    Simulate Scan
                  </button>
                </div>
              ) : (
                <div className="aspect-square max-w-sm mx-auto bg-gray-100 rounded-xl flex flex-col items-center justify-center">
                  <QrCode className="h-16 w-16 text-gray-300 mb-4" />
                  <button
                    onClick={startCamera}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Camera className="h-4 w-4 inline mr-2" />
                    Start Camera
                  </button>
                  <p className="text-xs text-gray-400 mt-3">Or use manual entry below</p>
                </div>
              )}
            </div>
          </div>

          {/* Manual Entry */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-sm mb-3">Manual QR Entry</h3>
            <div className="flex gap-2">
              <textarea
                value={scannedData}
                onChange={(e) => setScannedData(e.target.value)}
                placeholder='Paste QR data here (e.g., {"orderId":1,...})'
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
              />
              <button
                onClick={handleManualScan}
                disabled={scanQr.isPending}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform disabled:opacity-50 self-end"
              >
                {scanQr.isPending ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        </div>

        {/* Verification Result */}
        <div>
          {verification ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-green-600 text-white p-4 flex items-center gap-3">
                <CheckCircle className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">QR Code Valid</h3>
                  <p className="text-green-100 text-sm">Order verified successfully</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Student Info */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold mb-2">Student Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{verification.order.studentName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{verification.order.studentEmail}</span>
                    </div>
                    {verification.order.studentPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{verification.order.studentPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Info */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Order Details</h4>
                  <div className="space-y-1">
                    {verification.order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.foodName} x{item.quantity}
                        </span>
                          <span>₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-green-600">
                      ₹{Number(verification.order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Token #{verification.order.tokenNumber}</span>
                  <span className="capitalize text-gray-500">{verification.order.paymentMethod}</span>
                </div>

                <button
                  onClick={() => markCollected.mutate({ orderId: verification.order.id })}
                  disabled={markCollected.isPending}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {markCollected.isPending ? "Processing..." : "Mark as Collected"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full min-h-[300px] flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <QrCode className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-500 mb-1">No QR Scanned</h3>
              <p className="text-sm text-gray-400 text-center">
                Scan a student&apos;s QR code or enter it manually to verify and collect the order.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
