"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LoginPage() {
  const [userType, setUserType] = useState("teacher")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [selectedInstitution, setSelectedInstitution] = useState("")

  // Registration modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    name: "",
    course: "",
    email: "",
    username: "",
    password: "",
    semester: "",
  })
  const { addStudent } = require("@/lib/data-context").useData()

  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRegisterForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegisterStudent = () => {
    if (!registerForm.name || !registerForm.username || !registerForm.password || !registerForm.course) {
      alert("Please fill all required fields.")
      return
    }
    addStudent({
      name: registerForm.name,
      course: registerForm.course,
      email: registerForm.email,
      username: registerForm.username,
      password: registerForm.password,
      semester: registerForm.semester,
    })
    setIsRegisterModalOpen(false)
    setRegisterForm({ name: "", course: "", email: "", username: "", password: "", semester: "" })
    alert("Student registered! You can now sign in.")
  }

  const institutions = [
    "Punjab University, Chandigarh",
    "Panjab University, Chandigarh",
    "Guru Nanak Dev University, Amritsar",
    "Punjabi University, Patiala",
    "Thapar Institute of Engineering & Technology, Patiala",
    "Lovely Professional University, Phagwara",
    "Chandigarh University, Mohali",
    "DAV College, Chandigarh",
    "Government College for Girls, Chandigarh",
    "Post Graduate Government College, Chandigarh",
    "Punjab Engineering College, Chandigarh",
    "Chitkara University, Rajpura",
    "Sant Longowal Institute of Engineering & Technology, Longowal",
    "Dr. B.R. Ambedkar National Institute of Technology, Jalandhar",
    "Indian Institute of Technology Ropar",
    "All India Institute of Medical Sciences, Bathinda",
    "Government Medical College, Patiala",
    "Khalsa College, Amritsar",
    "Guru Gobind Singh College for Women, Chandigarh",
    "Government College, Ludhiana",
  ]

  const handleSignIn = () => {
    if (!selectedInstitution) {
      alert("Please select your institution before signing in.")
      return
    }

    // If signing in as the demo student 'anuj', ensure their totals are set so the dashboard shows low attendance
    try {
        if (userType === "student" && username === "anuj") {
        const saved = JSON.parse(localStorage.getItem("attendify-students") || "[]")
        const existingIndex = saved.findIndex((s: any) => s.username === "anuj")
        if (existingIndex > -1) {
          // set totals so overall attendance ≈ 61% (11 present / 18 total)
          saved[existingIndex].totalPresentDay = 11
          saved[existingIndex].totalAbsenceDay = 7
        } else {
          // add a demo Anuj record if not present
          saved.push({ id: 4, name: "Anuj Kumar", email: "anuj@example.com", username: "anuj", password: "anuj", course: "BIT", semester: "First", totalPresentDay: 11, totalAbsenceDay: 7 })
        }
        localStorage.setItem("attendify-students", JSON.stringify(saved))
      }
    } catch (e) {
      // ignore localStorage errors
    }

    localStorage.setItem("attendify-user-type", userType)
    localStorage.setItem("attendify-username", username)
    localStorage.setItem("attendify-institution", selectedInstitution)

    if (userType === "student") {
      window.location.href = "/student-dashboard"
    } else {
      window.location.href = "/dashboard"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-50">
      {/* Header */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendify</h1>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Hero Content */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">Attendance</h2>
              <h2 className="text-5xl font-bold text-blue-600 leading-tight">for your business</h2>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
              Quickly track attendance and get concise class reports.
            </p>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md bg-white shadow-lg border-0">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="institution" className="text-sm font-medium text-gray-700">
                    Select Your Institution
                  </Label>
                  <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose your school or college" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map((institution) => (
                        <SelectItem key={institution} value={institution}>
                          {institution}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      userType === "teacher" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setUserType("teacher")}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        userType === "teacher" ? "border-blue-500" : "border-gray-300"
                      }`}
                    >
                      {userType === "teacher" && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                    </div>
                    <span className="text-sm font-medium text-gray-700">Teacher</span>
                  </div>

                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      userType === "admin" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setUserType("admin")}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        userType === "admin" ? "border-blue-500" : "border-gray-300"
                      }`}
                    >
                      {userType === "admin" && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                    </div>
                    <span className="text-sm font-medium text-gray-700">Admin</span>
                  </div>

                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      userType === "student" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setUserType("student")}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        userType === "student" ? "border-green-500" : "border-gray-300"
                      }`}
                    >
                      {userType === "student" && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                    </div>
                    <span className="text-sm font-medium text-gray-700">Student</span>
                  </div>
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-700">
                    Remember me
                  </Label>
                </div>

                {/* Sign In Button */}
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  onClick={handleSignIn}
                >
                  Sign in
                </Button>

                {/* Forgot Password Link */}
                <div className="text-center">
                  <button className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                    Forgot password?
                  </button>
                </div>

                {/* Register Link */}
                <div className="text-center text-sm text-gray-600">
                  {"Don't have an account? "}
                  <button
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    onClick={() => setIsRegisterModalOpen(true)}
                  >
                    Register here
                  </button>
                </div>

                {/* Registration Modal */}
                {isRegisterModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 relative">
                      <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setIsRegisterModalOpen(false)}
                      >
                        &times;
                      </button>
                      <h2 className="text-2xl font-bold mb-4 text-gray-900">Student Registration</h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            name="name"
                            value={registerForm.name}
                            onChange={handleRegisterInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Username</label>
                          <input
                            type="text"
                            name="username"
                            value={registerForm.username}
                            onChange={handleRegisterInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Password</label>
                          <input
                            type="password"
                            name="password"
                            value={registerForm.password}
                            onChange={handleRegisterInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={registerForm.email}
                            onChange={handleRegisterInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Course</label>
                          <input
                            type="text"
                            name="course"
                            value={registerForm.course}
                            onChange={handleRegisterInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Semester</label>
                          <input
                            type="text"
                            name="semester"
                            value={registerForm.semester}
                            onChange={handleRegisterInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors mt-4"
                          onClick={handleRegisterStudent}
                        >
                          Register
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
