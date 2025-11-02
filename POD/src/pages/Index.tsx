import { useState } from "react";
import { AWBInput } from "../components/AWBInput";
import { MediaCapture } from "../components/MediaCapture";
import { CheckCircle2 } from "lucide-react";

const Index = () => {
  const [currentStep, setCurrentStep] = useState<"awb" | "media" | "success">("awb");
  const [awbNumber, setAwbNumber] = useState("");

  const handleAWBConfirmed = (awb: string) => {
    setAwbNumber(awb);
    setCurrentStep("media");
  };

  const handleComplete = () => {
    setCurrentStep("success");
  };

  const handleReset = () => {
    setAwbNumber("");
    setCurrentStep("awb");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl bg-card text-card-foreground shadow-lg rounded-lg p-6 md:p-8">
        {currentStep === "awb" && <AWBInput onAWBConfirmed={handleAWBConfirmed} />}
        
        {currentStep === "media" && (
          <MediaCapture
            awbNumber={awbNumber}
            onBack={() => setCurrentStep("awb")}
            onComplete={handleComplete}
          />
        )}

        {currentStep === "success" && (
          <div className="text-center space-y-6 py-12">
            <div className="flex justify-center">
              <CheckCircle2 className="h-24 w-24 text-accent" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Upload Complete!</h2>
              <p className="text-muted-foreground">
                Media successfully uploaded for AWB: {awbNumber}
              </p>
            </div>
            <button onClick={handleReset} className="mt-4">
              Scan Another Delivery
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
