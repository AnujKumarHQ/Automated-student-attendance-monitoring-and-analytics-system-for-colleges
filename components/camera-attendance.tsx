import React, { useRef, useState } from "react";

export default function CameraAttendance({ subjectName, classTime }: { subjectName: string, classTime: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  React.useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utter = new window.SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utter);
    }
  };

  const captureAndRecognize = async () => {
    setProcessing(true);
    setMessage("");
    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    if (!video) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    try {
      const res = await fetch("/api/attendance/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          subject_name: subjectName,
          class_time: classTime,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.match) {
          setMessage(
            `Face recognized, attendance marked for ${data.student_id} (Confidence: ${data.confidence})`
          );
          speak("Your attendance has been marked");
        } else {
          setMessage("No match found, please try again");
        }
      } else {
        setMessage(data.error || "Recognition failed");
      }
    } catch (e) {
      setMessage("Error during recognition");
    }
    setProcessing(false);
  };

  return (
    <div>
      <video ref={videoRef} autoPlay style={{ width: 320, height: 240 }} />
      <button onClick={captureAndRecognize} disabled={processing}>
        {processing ? "Processing..." : "Capture & Recognize"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
