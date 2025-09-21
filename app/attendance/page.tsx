"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Bell,
  Search,
  BarChart3,
  UserCheck,
  UserX,
  FileText,
  GraduationCap,
  User,
  BookOpen,
  LogOut,
  ChevronDown,
} from "lucide-react"
import { useData } from "@/lib/data-context"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const sections = ["A", "B", "C", "D"]

export default function AttendancePage() {
  const [activeNav, setActiveNav] = useState("attendance")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { students, subjects, seedPatternedAttendance } = useData()
  const { attendance, timetable } = useData()

  const subjectNames = subjects.map((subject) => subject.name)
  const [selectedSubject, setSelectedSubject] = useState(subjectNames[0] || "")
  const [selectedSection, setSelectedSection] = useState("A")
  const [selectedDate, setSelectedDate] = useState("2023/03/15")
  const [selectedCourse, setSelectedCourse] = useState("All")

  const courses = ["All", ...Array.from(new Set(students.map((student) => student.course).filter(Boolean)))]

  const filteredStudents =
    selectedCourse === "All" ? students : students.filter((student) => student.course === selectedCourse)

  // --- Analytics helpers ---
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f7f", "#a4de6c"]

  const getAbsenceByDay = () => {
    // returns array of { day: 'Monday', absent: N }
    const byDay: Record<string, number> = {}
    attendance.forEach((rec) => {
      if (rec.status === "absent") {
        const tt = timetable.find((t) => t.id === rec.timetableEntryId)
        const day = tt ? tt.day : new Date(rec.date).toLocaleDateString(undefined, { weekday: "long" })
        byDay[day] = (byDay[day] || 0) + 1
      }
    })
    return Object.keys(byDay).map((d) => ({ day: d, absent: byDay[d] }))
  }

  const getAbsenceBySubject = () => {
    const bySub: Record<string, number> = {}
    attendance.forEach((rec) => {
      if (rec.status === "absent") {
        const subject = subjects.find((s) => s.id === rec.subjectId)
        const name = subject ? subject.name : `Subject ${rec.subjectId}`
        bySub[name] = (bySub[name] || 0) + 1
      }
    })
    return Object.keys(bySub).map((k) => ({ subject: k, absent: bySub[k] }))
  }

  const getAbsenceByTime = () => {
    const byTime: Record<string, number> = {}
    attendance.forEach((rec) => {
      if (rec.status === "absent") {
        const tt = timetable.find((t) => t.id === rec.timetableEntryId)
        const slot = tt ? tt.timeSlot : "Unknown"
        byTime[slot] = (byTime[slot] || 0) + 1
      }
    })
    return Object.keys(byTime).map((k) => ({ time: k, absent: byTime[k] }))
  }

  // Simple linear regression predictor for next N days of absences (based on past daily totals)
  const predictNextNDays = (n = 7) => {
    // build ordered array of dates -> absent counts
    const map: Record<string, number> = {}
    attendance.forEach((rec) => {
      if (rec.status === "absent") {
        map[rec.date] = (map[rec.date] || 0) + 1
      }
    })
    const dates = Object.keys(map).sort()
    if (dates.length < 2) return []
    // x = index, y = count
    const xs = dates.map((_, i) => i)
    const ys = dates.map((d) => map[d])
    const xMean = xs.reduce((a, b) => a + b, 0) / xs.length
    const yMean = ys.reduce((a, b) => a + b, 0) / ys.length
    let num = 0
    let den = 0
    for (let i = 0; i < xs.length; i++) {
      num += (xs[i] - xMean) * (ys[i] - yMean)
      den += (xs[i] - xMean) ** 2
    }
    const slope = den === 0 ? 0 : num / den
    const intercept = yMean - slope * xMean

    // forecast next n indices
    const forecasts: { date: string; predictedAbsent: number }[] = []
    const lastIndex = xs[xs.length - 1]
    const lastDate = new Date(dates[dates.length - 1])
    for (let i = 1; i <= n; i++) {
      const idx = lastIndex + i
      const pred = Math.max(0, Math.round(intercept + slope * idx))
      const d = new Date(lastDate)
      d.setDate(lastDate.getDate() + i)
      forecasts.push({ date: d.toISOString().split("T")[0], predictedAbsent: pred })
    }
    return forecasts
  }

  const prescriptiveSuggestions = () => {
    const bySub = getAbsenceBySubject().sort((a, b) => b.absent - a.absent)
    const topSubject = bySub[0]
    const byDay = getAbsenceByDay().sort((a, b) => b.absent - a.absent)
    const topDay = byDay[0]
    const suggestions: string[] = []
    if (topSubject && topSubject.absent > 0) {
      suggestions.push(`High absences in ${topSubject.subject}. Consider targeted counselling or attendance incentives.`)
    }
    if (topDay && topDay.absent > 0) {
      suggestions.push(`Students are frequently absent on ${topDay.day}. Check for schedule conflicts or common reasons.`)
    }
    const forecasts = predictNextNDays(7)
    const rising = forecasts.length > 0 && forecasts[forecasts.length - 1].predictedAbsent > (attendance.filter(r=>r.status==="absent").length / Math.max(1, new Set(attendance.map(a=>a.date)).size))
    if (rising) suggestions.push("Projected rise in absences next week. Consider reminders, parent outreach, or adjusting class timings.")
    if (suggestions.length === 0) suggestions.push("No strong absence patterns detected. Continue monitoring.")
    return { suggestions, forecasts }
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, href: "/dashboard" },
    { id: "attendance", label: "Attendance", icon: UserCheck, href: "/attendance" },
    { id: "absence", label: "Absence", icon: UserX, href: "/attendance" },
    { id: "report", label: "Report", icon: FileText, href: "/report" },
  ]

  const manageItems = [
    { id: "teacher", label: "Teacher", icon: GraduationCap, href: "/teacher" },
    { id: "student", label: "Student", icon: User, href: "/student" },
    { id: "subject", label: "Subject", icon: BookOpen, href: "/subject" },
  ]

  const handleNavigation = (item: any) => {
    if (item.href) {
      window.location.href = item.href
    } else {
      setActiveNav(item.id)
    }
  }

  const handleLogout = () => {
    window.location.href = "/"
  }

  // (removed non-functional Generate Sheet button and handler)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Attendify</h1>
        </div>

        <nav className="px-4 space-y-1">
          {/* ANALYSE Section */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">ANALYSE</p>
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeNav === item.id
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* MANAGE Section */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">MANAGE</p>
            {manageItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeNav === item.id
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* CHAL CHLA NIKAL Section */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">CHAL CHLA NIKAL</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search" className="pl-10 w-80 bg-gray-50 border-gray-200" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-600 text-xs p-0 flex items-center justify-center">
                  1
                </Badge>
              </Button>

              <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-50">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Peterpan</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-blue-600 mb-2">Attendance</h2>
            <div className="text-sm text-gray-500">
              <span>Track</span> <span className="mx-2">/</span> <span>Attendance</span> <span className="mx-2">/</span>{" "}
              <span>Attendance sheet</span>
            </div>
          </div>

          <Card className="bg-white mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectNames.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">Course</label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">Section</label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">Date</label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023/03/15">2023/03/15</SelectItem>
                      <SelectItem value="2023/03/14">2023/03/14</SelectItem>
                      <SelectItem value="2023/03/13">2023/03/13</SelectItem>
                      <SelectItem value="2023/03/12">2023/03/12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="mt-2">
                    <Button onClick={() => seedPatternedAttendance(14)} variant="outline">
                      Generate Demo Data (14 days)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Subject Report {selectedCourse !== "All" && `- ${selectedCourse} Students`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">#</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Student name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Course</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Semester</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total Present Day</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total Absence Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={student.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-900">{index + 1}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{student.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{student.course || "N/A"}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{student.semester || "First"}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{student.totalPresentDay || 0}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{student.totalAbsenceDay || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Absence Analytics */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Absence by Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={getAbsenceByDay()}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="absent" fill="#ff7f7f" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Absence by Subject (Top)</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={getAbsenceBySubject()} dataKey="absent" nameKey="subject" outerRadius={80} label>
                        {getAbsenceBySubject().map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Absence by Time-slot</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={getAbsenceByTime()}>
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="absent" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Forecast: Next 7 days absence</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <LineChart data={prescriptiveSuggestions().forecasts}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="predictedAbsent" stroke="#ff7300" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-gray-700">
                  {prescriptiveSuggestions().suggestions.map((s, i) => (
                    <div key={i} className="mb-2">• {s}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
