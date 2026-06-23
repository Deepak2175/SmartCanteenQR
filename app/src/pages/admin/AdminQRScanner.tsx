import { trpc } from "@/providers/trpc";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  QrCode,
  CheckCircle,
  User,
  Mail,
  Phone,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import jsQR from "jsqr";

export default function AdminQRScanner() {
  const utils = trpc.useUtils();
  const [scannedData, setScannedData] = useState<string>("");
  const [verification, setVerification] = useState<{
    valid: boolean;
    order: {
      id: number;
      tokenNumber: number;
      totalAmount: number;
      orderStatus: string;
      paymentMethod: string;
      paymentStatus: string;
      studentName: string;
      studentEmail: string;
      studentPhone: string;
      items: { foodName: string; quantity: number; unitPrice: number }[];
    };
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const metadataHandlerRef = useRef<(() => void) | null>(null);

  const scanQr = trpc.order.scanQr.useMutation({
    onSuccess: (data) => {
      setVerification(data);
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

  const scanQrRef = useRef(scanQr);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (metadataHandlerRef.current && videoRef.current) {
      videoRef.current.removeEventListener("loadedmetadata", metadataHandlerRef.current);
      metadataHandlerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const stopCameraRef = useRef(stopCamera);

  useEffect(() => {
    scanQrRef.current = scanQr;
    stopCameraRef.current = stopCamera;
  });

  const decodeFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < 2) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      setScannedData(code.data);
      scanQrRef.current.mutate({ qrData: code.data });
      stopCameraRef.current();
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.setAttribute("autoplay", "");
      video.setAttribute("playsinline", "");
      await video.play();
      const metadataHandler = () => {
        video.width = video.videoWidth;
        video.height = video.videoHeight;
      };
      metadataHandlerRef.current = metadataHandler;
      video.addEventListener("loadedmetadata", metadataHandler);
      setIsScanning(true);
      scanTimerRef.current = setInterval(decodeFrame, 500);
    } catch {
      toast.error("Camera access denied. Use manual entry.");
    }
  }, [decodeFrame]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Area */}
        <div className="space-y-4">
          {/* Camera View */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border">
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
                  <canvas ref={canvasRef} className="hidden" />
                  {/* Scan overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-green-400 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400" />
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-pulse" 
                        style={{ animation: "scan 2s linear infinite" }} 
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Scanning...
                  </div>
                </div>
              ) : (
                <div className="aspect-square max-w-sm mx-auto bg-muted rounded-xl flex flex-col items-center justify-center">
                  <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
                  <button
                    onClick={startCamera}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Camera className="h-4 w-4 inline mr-2" />
                    Start Camera
                  </button>
                  <p className="text-xs text-muted-foreground mt-3">Or use manual entry below</p>
                </div>
              )}
            </div>
          </div>

          {/* Manual Entry */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-4">
            <h3 className="font-semibold text-sm mb-3">Manual QR Entry</h3>
            <div className="flex gap-2">
              <textarea
                value={scannedData}
                onChange={(e) => setScannedData(e.target.value)}
                placeholder='Paste QR data here (e.g., {"orderId":1,...})'
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
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
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="bg-green-600 text-white p-4 flex items-center gap-3">
                <CheckCircle className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">QR Code Valid</h3>
                  <p className="text-green-100 text-sm">Order verified successfully</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Student Info */}
                <div className="bg-background rounded-lg p-3">
                  <h4 className="text-sm font-semibold mb-2">Student Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{verification.order.studentName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{verification.order.studentEmail}</span>
                    </div>
                    {verification.order.studentPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
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
                        <span className="text-muted-foreground">
                          {item.foodName} x{item.quantity}
                        </span>
                          <span>₹{(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-green-600">
                      ₹{Number(verification.order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Token #{verification.order.tokenNumber}</span>
                  <span className="capitalize text-muted-foreground">{verification.order.paymentMethod}</span>
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
            <div className="bg-card rounded-xl border border-border shadow-sm h-full min-h-[300px] flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <QrCode className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-muted-foreground mb-1">No QR Scanned</h3>
              <p className="text-sm text-muted-foreground text-center">
                Scan a student&apos;s QR code or enter it manually to verify and collect the order.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
