"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, UserCheck, Zap, AlertCircle } from "lucide-react"
import { useData, type Student } from "@/lib/data-context"

interface LiveVideoFeedProps {
  enrolledStudents: Student[]
  onAttendanceMarked?: (studentId: number, studentName: string) => void
  onRecognitionResult?: (result: string, isSuccess: boolean) => void
  className?: string
}

export default function LiveVideoFeed({
  enrolledStudents,
  onAttendanceMarked,
  onRecognitionResult,
  className = "",
}: LiveVideoFeedProps) {
  const { recognizeFace, markAttendance } = useData()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [isActive, setIsActive] = useState(false)
  const [isAutoMode, setIsAutoMode] = useState(false)
  const [recognitionResult, setRecognitionResult] = useState<string>("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [recognizedStudents, setRecognizedStudents] = useState<Set<number>>(new Set())
  const [frameCount, setFrameCount] = useState(0)

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
        streamRef.current = stream
        setIsActive(true)
        setRecognitionResult("")
        setFrameCount(0)
        console.log("[v0] Camera started successfully")
      }
    } catch (error) {
      console.error("[v0] Error accessing camera:", error)
      const errorMessage = "Camera access denied or not available"
      setRecognitionResult(errorMessage)
      setIsSuccess(false)
      if (onRecognitionResult) {
        onRecognitionResult(errorMessage, false)
      }
    }
  }, [onRecognitionResult])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsActive(false)
    setIsAutoMode(false)
    setRecognitionResult("")
    setFrameCount(0)
    console.log("[v0] Camera stopped")
  }, [])

  const captureAndRecognize = useCallback(() => {
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
    const capturedFaceData = canvas.toDataURL("image/jpeg", 0.8)

    // Attempt face recognition
    const recognizedStudent = recognizeFace(capturedFaceData, enrolledStudents)

    if (recognizedStudent && !recognizedStudents.has(recognizedStudent.id)) {
      const successMessage = `✅ Recognized: ${recognizedStudent.name} - Attendance Marked!`
      setRecognitionResult(successMessage)
      setIsSuccess(true)

      // Add to recognized students to prevent duplicate marking
      setRecognizedStudents((prev) => new Set([...prev, recognizedStudent.id]))

      // Notify parent component
      if (onAttendanceMarked) {
        onAttendanceMarked(recognizedStudent.id, recognizedStudent.name)
      }

      if (onRecognitionResult) {
        onRecognitionResult(successMessage, true)
      }

      console.log("[v0] Student recognized:", recognizedStudent.name)
    } else if (recognizedStudent && recognizedStudents.has(recognizedStudent.id)) {
      const alreadyMarkedMessage = `⚠️ ${recognizedStudent.name} already marked present`
      setRecognitionResult(alreadyMarkedMessage)
      setIsSuccess(false)

      if (onRecognitionResult) {
        onRecognitionResult(alreadyMarkedMessage, false)
      }
    } else {
      const noMatchMessage = "❌ Face not recognized. Please try again or mark manually."
      setRecognitionResult(noMatchMessage)
      setIsSuccess(false)

      if (onRecognitionResult) {
        onRecognitionResult(noMatchMessage, false)
      }
    }

    setFrameCount((prev) => prev + 1)
  }, [enrolledStudents, recognizedStudents, recognizeFace, onAttendanceMarked, onRecognitionResult])

  const toggleAutoMode = useCallback(() => {
    if (!isAutoMode) {
      // Start auto recognition
      setIsAutoMode(true)
      intervalRef.current = setInterval(() => {
        captureAndRecognize()
      }, 2000) // Capture every 2 seconds
      console.log("[v0] Auto recognition mode started")
    } else {
      // Stop auto recognition
      setIsAutoMode(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      console.log("[v0] Auto recognition mode stopped")
    }
  }, [isAutoMode, captureAndRecognize])

  const resetRecognition = useCallback(() => {
    setRecognizedStudents(new Set())
    setRecognitionResult("")
    setFrameCount(0)
    console.log("[v0] Recognition data reset")
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const studentsWithFaceData = enrolledStudents.filter((student) => student.faceData)

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Live Face Recognition</span>
            </div>
            <div className="flex items-center space-x-2">
              {isActive && (
                <Badge variant={isAutoMode ? "default" : "secondary"}>{isAutoMode ? "Auto Mode" : "Manual Mode"}</Badge>
              )}
              {frameCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  Frames: {frameCount}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Feed */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-80 object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Camera not active</p>
                  <Button onClick={startCamera} size="lg">
                    <Camera className="h-5 w-5 mr-2" />
                    Start Camera
                  </Button>
                </div>
              </div>
            )}

            {/* Live indicator */}
            {isActive && (
              <div className="absolute top-4 left-4">
                <Badge variant="destructive" className="animate-pulse">
                  ● LIVE
                </Badge>
              </div>
            )}

            {/* Auto mode indicator */}
            {isActive && isAutoMode && (
              <div className="absolute top-4 right-4">
                <Badge variant="default" className="animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  AUTO
                </Badge>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-center">
            {!isActive ? (
              <Button onClick={startCamera} size="lg" className="bg-green-600 hover:bg-green-700">
                <Camera className="h-5 w-5 mr-2" />
                Start Camera
              </Button>
            ) : (
              <>
                <Button onClick={captureAndRecognize} disabled={isAutoMode} className="bg-blue-600 hover:bg-blue-700">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Capture & Recognize
                </Button>

                <Button onClick={toggleAutoMode} variant={isAutoMode ? "destructive" : "default"}>
                  <Zap className="h-4 w-4 mr-2" />
                  {isAutoMode ? "Stop Auto" : "Start Auto"}
                </Button>

                <Button onClick={resetRecognition} variant="outline">
                  Reset
                </Button>

                <Button onClick={stopCamera} variant="outline">
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop Camera
                </Button>
              </>
            )}
          </div>

          {/* Recognition Result */}
          {recognitionResult && (
            <div
              className={`p-4 rounded-lg text-center font-medium ${
                isSuccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {recognitionResult}
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{enrolledStudents.length}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{studentsWithFaceData.length}</div>
              <div className="text-sm text-gray-600">With Face Data</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{recognizedStudents.size}</div>
              <div className="text-sm text-gray-600">Recognized</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {enrolledStudents.length - recognizedStudents.size}
              </div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
              <div>
                <p>
                  <strong>Manual Mode:</strong> Click "Capture & Recognize" to identify faces one at a time.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Zap className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p>
                  <strong>Auto Mode:</strong> Automatically captures and recognizes faces every 2 seconds.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <UserCheck className="h-4 w-4 mt-0.5 text-purple-500" />
              <div>
                <p>
                  <strong>Recognition:</strong> Only students with registered face data can be automatically recognized.
                </p>
              </div>
            </div>
          </div>

          {/* Students without face data warning */}
          {studentsWithFaceData.length < enrolledStudents.length && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">
                  {enrolledStudents.length - studentsWithFaceData.length} students don't have face data registered
                </span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                These students will need to register their faces or be marked manually.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
