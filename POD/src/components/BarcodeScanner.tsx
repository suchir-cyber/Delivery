import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

import { Loader2 } from "lucide-react";     
import { useToast } from "../hooks/use-toast"
interface BarcodeScannerProps {
  onScanSuccess: (code: string) => void;
}

export const BarcodeScanner = ({ onScanSuccess }: BarcodeScannerProps) => {
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode("barcode-reader");
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 300, height: 150 },
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      },
      formatsToSupport: [
        "CODE_128",
        "CODE_39",
        "EAN_13",
        "EAN_8",
        "UPC_A",
        "UPC_E",
        "ITF",
        "CODABAR"
      ]
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
          title: "Barcode Scanned",
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
        <div id="barcode-reader" className="w-full min-h-[300px]" />
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-accent w-3/4 h-24 rounded-lg animate-pulse" />
          </div>
        )}
      </div>
      <p className="text-sm text-center text-muted-foreground">
        Position the barcode within the frame
      </p>
      <p className="text-sm text-center text-muted-foreground">
        Supported formats: CODE_128, CODE_39, EAN_13, EAN_8, UPC_A, UPC_E, ITF, CODABAR
      </p>
      <p className="text-sm text-center text-muted-foreground">
        Try to keep the barcode steady for a few seconds for better recognition in a mid-light area.
      </p>
    </div>
  );
};
