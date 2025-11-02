import { useState } from "react";
import { Scan, Keyboard } from "lucide-react";
import { BarcodeScanner } from "./BarcodeScanner";
import { QRScanner } from "./QRScanner";

interface AWBInputProps {
  onAWBConfirmed: (awb: string) => void;
}

export const AWBInput = ({ onAWBConfirmed }: AWBInputProps) => {
  const [manualAWB, setManualAWB] = useState("");
  const [scanMode, setScanMode] = useState<"barcode" | "qr">("barcode");
  const [activeTab, setActiveTab] = useState<"scan" | "manual">("scan");

  const handleManualSubmit = () => {
    if (manualAWB.trim()) {
      onAWBConfirmed(manualAWB.trim());
    }
  };

  const handleScanSuccess = (code: string) => {
    onAWBConfirmed(code);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">POD Scanner</h1>
        <p className="text-muted-foreground">Scan or enter AWB number to begin</p>
      </div>

            <div>
              <div className="grid w-full grid-cols-2 gap-2">
                  <button onClick={() => setActiveTab("scan")} className={`py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-200 ${activeTab === 'scan' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                    <Scan className="h-5 w-5 mr-2" />
                    Scan Code
                  </button>
                  <button onClick={() => setActiveTab("manual")} className={`py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-200 ${activeTab === 'manual' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                    <Keyboard className="h-5 w-5 mr-2" />
                    Manual Entry
                  </button>
                </div>
      
                {activeTab === "scan" && (
                  <div className="p-4 md:p-6 border border-border rounded-lg mt-4">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <button
                          className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 ${scanMode === 'barcode' ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                          onClick={() => setScanMode("barcode")}
                        >
                          Barcode
                        </button>
                        <button
                          className={`flex-1 py-2 px-3 rounded-md transition-colors duration-200 ${scanMode === 'qr' ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                          onClick={() => setScanMode("qr")}
                        >
                          QR Code
                        </button>
                      </div>
      
                      {scanMode === "barcode" ? (
                        <BarcodeScanner onScanSuccess={handleScanSuccess} />
                      ) : (
                        <QRScanner onScanSuccess={handleScanSuccess} />
                      )}
                    </div>
                  </div>
                )}
      
                {activeTab === "manual" && (
                  <div className="p-4 md:p-6 border border-border rounded-lg mt-4">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="awb-number" className="text-sm font-medium text-foreground mb-2 block">
                          AWB Number
                        </label>
                        <input
                          id="awb-number"
                          type="text"
                          placeholder="Enter AWB number"
                          value={manualAWB}
                          onChange={(e) => setManualAWB(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                        />
                      </div>
                      <button 
                        onClick={handleManualSubmit} 
                        className="w-full"
                        disabled={!manualAWB.trim()}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </div>    </div>
  );
};
