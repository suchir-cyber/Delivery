import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useToast } from "../hooks/use-toast";

interface QRScannerProps {
  onScanSuccess: (code: string) => void;
}

export const QRScanner = ({ onScanSuccess }: QRScannerProps) => {
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      formatsToSupport: ["QR_CODE"]
    };

    setIsScanning(true);

    scanner.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        if (isRunningRef.current) {
          scanner.stop().then(() => {
            isRunningRef.current = false;
          }).catch(console.error);
        }
        onScanSuccess(decodedText);
        toast({
          title: "QR Code Scanned",
          description: `AWB: ${decodedText}`,
        });
      },
      (errorMessage) => {
        // Silent error handling for continuous scanning
      }
    ).then(() => {
      isRunningRef.current = true;
    }).catch((err) => {
      console.error("Error starting scanner:", err);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
      setIsScanning(false);
    });

    return () => {
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().then(() => {
          isRunningRef.current = false;
        }).catch(console.error);
      }
    };
  }, [onScanSuccess, toast]);

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <div id="qr-reader" className="w-full min-h-[300px]" />
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-accent w-1/2 h-1/2 rounded-lg animate-pulse" />
          </div>
        )}
      </div>
      <p className="text-sm text-center text-muted-foreground">
        Position the QR code within the frame
      </p>
      <p className="text-sm text-center text-muted-foreground">
        Try to keep the QR code steady for a few seconds for better recognition in a mid-light area.
      </p>
    </div>
  );
};
