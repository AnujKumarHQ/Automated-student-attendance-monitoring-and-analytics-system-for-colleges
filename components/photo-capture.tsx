"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, RotateCcw, Check, X, Download } from "lucide-react"
import { useData } from "@/lib/data-context"

interface PhotoCaptureProps {
  studentId?: number
  onPhotosCapture?: (photos: string[]) => void
  mode?: "training" | "recognition"
}

export { PhotoCapture }
export default PhotoCapture

function PhotoCapture({ studentId, onPhotosCapture, mode = "training" }: PhotoCaptureProps) {
  const { updateStudentFaceData } = useData()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
  const [currentAngle, setCurrentAngle] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const angles = [
    { name: "Front View", instruction: "Look straight at the camera" },
    { name: "Left Profile", instruction: "Turn your head slightly to the left" },
    { name: "Right Profile", instruction: "Turn your head slightly to the right" },
    { name: "Slight Up", instruction: "Tilt your head slightly up" },
    { name: "Slight Down", instruction: "Tilt your head slightly down" },
  ]

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsStreaming(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please ensure camera permissions are granted.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsStreaming(false)
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to base64
    const photoData = canvas.toDataURL("image/jpeg", 0.8)

    const newPhotos = [...capturedPhotos, photoData]
    setCapturedPhotos(newPhotos)

    // Move to next angle or finish
    if (currentAngle < angles.length - 1) {
      setCurrentAngle(currentAngle + 1)
    } else {
      // All photos captured
      if (mode === "training" && studentId) {
        // Store the first photo as the primary face data for recognition
        updateStudentFaceData(studentId, photoData)
      }

      if (onPhotosCapture) {
        onPhotosCapture(newPhotos)
      }

      stopCamera()
    }
  }, [capturedPhotos, currentAngle, angles.length, mode, studentId, updateStudentFaceData, onPhotosCapture, stopCamera])

  const retakePhoto = useCallback(() => {
    if (capturedPhotos.length > 0) {
      const newPhotos = capturedPhotos.slice(0, -1)
      setCapturedPhotos(newPhotos)
      setCurrentAngle(Math.max(0, currentAngle - 1))
    }
  }, [capturedPhotos, currentAngle])

  const resetCapture = useCallback(() => {
    setCapturedPhotos([])
    setCurrentAngle(0)
    if (!isStreaming) {
      startCamera()
    }
  }, [isStreaming, startCamera])

  const downloadPhotos = useCallback(() => {
    capturedPhotos.forEach((photo, index) => {
      const link = document.createElement("a")
      link.href = photo
      link.download = `face-photo-${angles[index]?.name.toLowerCase().replace(" ", "-")}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
  }, [capturedPhotos, angles])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>
              {mode === "training" ? "Face Registration" : "Face Recognition"} -
              {capturedPhotos.length === angles.length ? "Complete" : `Step ${currentAngle + 1} of ${angles.length}`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Feed */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-80 object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            {!isStreaming && capturedPhotos.length < angles.length && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <Button onClick={startCamera} size="lg">
                  <Camera className="h-5 w-5 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}

            {/* Overlay instructions */}
            {isStreaming && capturedPhotos.length < angles.length && (
              <div className="absolute bottom-4 left-4 right-4">
                <Card className="bg-black/70 text-white border-0">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Badge variant="secondary" className="mb-2">
                        {angles[currentAngle]?.name}
                      </Badge>
                      <p className="text-sm">{angles[currentAngle]?.instruction}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {isStreaming && capturedPhotos.length < angles.length && (
              <>
                <Button onClick={capturePhoto} size="lg" className="bg-green-600 hover:bg-green-700">
                  <Camera className="h-5 w-5 mr-2" />
                  Capture Photo
                </Button>
                {capturedPhotos.length > 0 && (
                  <Button onClick={retakePhoto} variant="outline">
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Retake Last
                  </Button>
                )}
              </>
            )}

            {capturedPhotos.length === angles.length && (
              <div className="flex space-x-4">
                <Button onClick={resetCapture} variant="outline">
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Start Over
                </Button>
                <Button onClick={downloadPhotos} variant="outline">
                  <Download className="h-5 w-5 mr-2" />
                  Download Photos
                </Button>
              </div>
            )}

            {isStreaming && (
              <Button onClick={stopCamera} variant="outline">
                <X className="h-5 w-5 mr-2" />
                Stop Camera
              </Button>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="grid grid-cols-5 gap-2">
            {angles.map((angle, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg text-center text-xs ${
                  index < capturedPhotos.length
                    ? "bg-green-100 text-green-800"
                    : index === currentAngle
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {index < capturedPhotos.length ? (
                  <Check className="h-4 w-4 mx-auto mb-1" />
                ) : (
                  <Camera className="h-4 w-4 mx-auto mb-1" />
                )}
                <div>{angle.name}</div>
              </div>
            ))}
          </div>

          {/* Captured Photos Preview */}
          {capturedPhotos.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Captured Photos ({capturedPhotos.length})</h4>
              <div className="grid grid-cols-5 gap-2">
                {capturedPhotos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo || "/placeholder.svg"}
                      alt={`Captured ${angles[index]?.name}`}
                      className="w-full h-20 object-cover rounded-lg border"
                    />
                    <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs px-1 py-0">
                      {angles[index]?.name}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {capturedPhotos.length === angles.length && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">
                {mode === "training" ? "Face registration completed successfully!" : "Face recognition data captured!"}
              </p>
              <p className="text-green-600 text-sm mt-1">
                {mode === "training"
                  ? "The system can now recognize this student during attendance."
                  : "Processing for attendance marking..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
