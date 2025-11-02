import { useState, useRef, useEffect } from "react";
import { Camera, Video, Upload, ChevronLeft, Circle, Square, Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { supabase } from "../integrations/supabase/client";

interface MediaCaptureProps {
  awbNumber: string;
  onBack: () => void;
  onComplete: () => void;
}

export const MediaCapture = ({ awbNumber, onBack, onComplete }: MediaCaptureProps) => {
  const { toast } = useToast();
  const [mediaType, setMediaType] = useState<"photo" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCamera && mediaType) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [showCamera, mediaType, previewUrl]);

  useEffect(() => {
     if (!previewUrl) return;
     const v = previewVideoRef.current;
     if (!v) return;
     // ensure the element reloads the new blob URL and try to play (autoplay may be blocked)
     v.src = previewUrl;
     v.load();
     v.play().catch(() => {
       // autoplay blocked — UI still shows controls so user can press play
       console.debug("Autoplay blocked for preview video");
   });
   }, [previewUrl]);


  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: mediaType === "video",
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const MAX_PHOTO_SIZE = 3 * 1024 * 1024; // 3MB
            if (blob.size > MAX_PHOTO_SIZE) {
              toast({
                title: "File Too Large",
                description: "Photos must be under 3MB.",
                variant: "destructive",
              });
              return;
            }
            const file = new File([blob], `photo-${Date.now()}.png`, { type: "image/png" });
            setCapturedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setShowCamera(false);
          }
        }, "image/png");
      }
    }
  };

  // In the startRecording function, replace the existing recorder.onstop logic:

// ...existing code...
const startRecording = () => {
  if (stream && mediaType === "video") {
    setRecordedChunks([]);
    const chunks: Blob[] = [];

    // pick a supported mime type
    const mime =
      (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported("video/webm;codecs=vp8"))
        ? "video/webm;codecs=vp8"
        : "video/webm";

    try {
      const recorder = new MediaRecorder(stream, { mimeType: mime });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);

        if (chunks.length === 0) {
          toast({
            title: "Video Capture Failed",
            description: "No video data was recorded. Please try again.",
            variant: "destructive",
          });
          return;
        }

        try {
          // combine chunks into blob
          const blob = new Blob(chunks, { type: mime });
          const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

          if (blob.size > MAX_VIDEO_SIZE) {
            toast({
              title: "File Too Large",
              description: "Videos must be under 10MB.",
              variant: "destructive",
            });
            return;
          }

          const file = new File([blob], `video-${Date.now()}.webm`, { type: mime });

          // revoke previous preview URL if any
          if (previewUrl) {
            try { URL.revokeObjectURL(previewUrl); } catch {}
          }

          const url = URL.createObjectURL(blob);

          // update state
          setRecordedChunks(chunks);
          setCapturedFile(file);
          setPreviewUrl(url);
          setShowCamera(false);
          setRecordedChunks([]);

          // robustly attach to preview element and try to play
          const v = previewVideoRef.current;
          if (v) {
            v.onerror = (e) => {
              console.error("Preview video error", e);
              toast({
                title: "Preview Error",
                description: "Could not play the recorded video. Please retake or upload a file.",
                variant: "destructive",
              });
            };
            v.onloadedmetadata = () => {
              // mute to allow autoplay in many browsers then try play
              v.muted = true;
              v.play().catch(() => {
                console.debug("Autoplay blocked for preview video");
              });
            };
            v.src = url;
            v.load();
          }

        } catch (err) {
          console.error("Error creating video preview:", err);
          toast({
            title: "Preview Error",
            description: "Could not create video preview. Please try again.",
            variant: "destructive",
          });
        }
      };

      setMediaRecorder(recorder);
      // shorter timeslice to ensure ondataavailable fires during recording
      recorder.start(200);
      setIsRecording(true);

      // Stop after 10 seconds
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          toast({
            title: "Video Recorded",
            description: "Recording stopped after 10 seconds.",
          });
        }
      }, 10000);

    } catch (err) {
      console.error("Error setting up recorder:", err);
      toast({
        title: "Recording Error",
        description: "Could not start recording. Please try again.",
        variant: "destructive",
      });
    }
  }
};
// ...existing code...

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      // onstop will setIsRecording(false
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const MAX_PHOTO_SIZE = 3 * 1024 * 1024; // 3MB
    const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

    if (mediaType === "photo" && file.size > MAX_PHOTO_SIZE) {
      toast({
        title: "File Too Large",
        description: "Photos must be under 3MB.",
        variant: "destructive",
      });
      return;
    }

    if (mediaType === "video" && file.size > MAX_VIDEO_SIZE) {
      toast({
        title: "File Too Large",
        description: "Videos must be under 10MB.",
        variant: "destructive",
      });
      return;
    }

    console.debug("Uploaded file size (bytes):", file.size, "type:", file.type);
    setCapturedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

 const handleSubmit = async () => {
  if (!capturedFile) {
    toast({
      title: "No file selected",
      description: "Please capture or upload a file first.",
      variant: "destructive",
    });
    return;
  }

  setIsUploading(true);

  try {
    const isVideo = capturedFile.type.startsWith("video/");
    const resourceType = isVideo ? 'video' : 'image';
    
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // Direct upload to Cloudinary for BOTH images and videos
    const formData = new FormData();
    formData.append('file', capturedFile);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', `Flipkart/awb/${awbNumber}`);
    formData.append('resource_type', resourceType);
   
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary error:', errorData);
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    console.log('Upload successful:', data.secure_url);

    toast({
      title: "Upload Successful",
      description: `${isVideo ? 'Video' : 'Photo'} uploaded for AWB: ${awbNumber}`,
    });
    onComplete();

  } catch (error: any) {
    console.error("Upload error:", error);
    toast({
      title: "Upload Failed",
      description: error?.message || "Failed to upload media.",
      variant: "destructive",
    });
  } finally {
    setIsUploading(false);
  }
};

  const resetCapture = () => {
    setCapturedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setMediaType(null);
    setShowCamera(false);
    stopCamera();
    setRecordedChunks([]); // Ensure recorded chunks are cleared on reset
    setIsRecording(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-full bg-muted hover:bg-muted/80">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Capture Media</h2>
          <p className="text-sm text-muted-foreground">AWB: {awbNumber}</p>
        </div>
      </div>

      {!mediaType ? (
        <div className="p-6 border border-border rounded-lg">

          <div className="space-y-6">
            <p className="text-center text-muted-foreground text-lg">Select media type</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                className="h-32 flex flex-col items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg shadow-sm"
                onClick={() => setMediaType("photo")}
              >
                <Camera className="h-8 w-8" />
                Photo
              </button>
              <button
                className="h-32 flex flex-col items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg shadow-sm"
                onClick={() => setMediaType("video")}
              >
                <Video className="h-8 w-8" />
                Video
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 border border-border rounded-lg">
          <div className="space-y-6">
            {previewUrl ? (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                  {mediaType === "photo" ? (
                   <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                    // use previewVideoRef so we can call load/play when URL changes
                     <video
                       ref={previewVideoRef}
                       src={previewUrl}
                       controls
                       playsInline
                       className="w-full h-full object-contain"
                     >
                       <source src={previewUrl} type="video/webm" />
                       Your browser does not support the video tag.
                     </video>
                   )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={resetCapture} className="bg-muted text-muted-foreground hover:bg-muted/80">
                    Retake
                  </button>
                  <button onClick={handleSubmit} disabled={isUploading} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {isUploading ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>
              </div>
            ) : showCamera ? (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center relative">
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                  <canvas ref={canvasRef} className="hidden" />
                  {mediaType === "video" && isRecording && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md flex items-center">
                      <Circle className="h-3 w-3 mr-1 fill-white" /> REC
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  {mediaType === "photo" ? (
                    <button onClick={takePhoto} className="p-4 rounded-full bg-primary text-primary-foreground shadow-lg">
                      <Camera className="h-6 w-6" />
                    </button>
                  ) : (
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-4 rounded-full shadow-lg ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'} text-primary-foreground`}
                    >
                      {isRecording ? <Square className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                    </button>
                  )}
                </div>
                <button className="w-full bg-muted text-muted-foreground hover:bg-muted/80" onClick={resetCapture}>
                  Cancel Capture
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center font-medium text-lg">
                  {mediaType === "photo" ? "Capture Photo" : "Record Video"}
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  {mediaType === "photo" ? "(max 3MB)" : "(max 10MB)"}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    className="h-24 flex flex-col items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg shadow-sm"
                    onClick={() => setShowCamera(true)}
                  >
                    {mediaType === "photo" ? <Camera className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                    Capture
                  </button>
                  <button
                    className="h-24 flex flex-col items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6" />
                    Upload File
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mediaType === "photo" ? "image/*" : "video/*"}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden" // Standard file input for uploading existing files
                />

                <button className="w-full bg-muted text-muted-foreground hover:bg-muted/80" onClick={() => setMediaType(null)}>
                  Back to Selection
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};