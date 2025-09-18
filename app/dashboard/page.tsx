"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { useData } from "@/lib/data-context"

const lineChartData = [
  { time: "00:00", present: 32, absent: 15, attendance: 12 },
  { time: "01:00", present: 38, absent: 18, attendance: 25 },
  { time: "02:00", present: 42, absent: 12, attendance: 35 },
  { time: "03:00", present: 45, absent: 28, attendance: 42 },
  { time: "04:00", present: 48, absent: 18, attendance: 32 },
  { time: "05:00", present: 82, absent: 8, attendance: 48 },
  { time: "06:00", present: 56, absent: 12, attendance: 38 },
]

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { getStats, students, teachers, subjects } = useData()
  const stats = getStats()

  // Get user type from localStorage
  const userType = typeof window !== "undefined" ? localStorage.getItem("attendify-user-type") : null

  // Only show Analyse items for students
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

  // Move these after useData destructuring
  const recentActivities = [
    { time: "32 min", activity: `New teacher created (${teachers.length} total)` },
    { time: "56 min", activity: `Student attendance updated` },
    { time: "2 hrs", activity: `Absence application processed` },
  ]

  const radarData = subjects.slice(0, 6).map((subject) => ({
    subject: subject.name,
    allocated: Math.floor(Math.random() * 40) + 60, // Random for demo
    actual: Math.floor(Math.random() * 40) + 50, // Random for demo
  }))

  const filteredSidebarItems = userType === "student" ? sidebarItems : [...sidebarItems, ...manageItems]

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

          {/* MANAGE Section (hidden for students) */}
          {userType !== "student" && (
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
          )}

          {/* CHAL CHLA NIKAL Section */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">CHAL CHLA NIKAL</p>
            <button
              onClick={() => (window.location.href = "/")}
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
              <DropdownMenu>
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
            <h2 className="text-3xl font-bold text-blue-600 mb-2">Dashboard</h2>
            <div className="text-sm text-gray-500">
              <span>Home</span> <span className="mx-2">/</span> <span>Dashboard</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-blue-600">Present</CardTitle>
                    <span className="text-xs text-gray-500">Today</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalPresent}</div>
                  <div className="text-xs text-gray-500">{stats.attendanceRate}% attendance rate</div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-blue-600">Absent</CardTitle>
                    <span className="text-xs text-gray-500">Today</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalAbsent}</div>
                  <div className="text-xs text-gray-500">{100 - stats.attendanceRate}% absence rate</div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-blue-600">Students</CardTitle>
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalStudents}</div>
                  <div className="text-xs text-gray-500">{stats.totalSubjects} subjects</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <div className="lg:col-span-1">
              <Card className="bg-white h-fit">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-green-600">Recent Activities</CardTitle>
                    <span className="text-xs text-gray-500">Today</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <span className="text-xs text-gray-500 mt-1 min-w-[3rem]">{activity.time}</span>
                      <span className="text-sm text-gray-700">{activity.activity}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Reports Chart */}
            <div className="lg:col-span-2">
              <Card className="bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-green-600">Reports</CardTitle>
                    <span className="text-xs text-gray-500">Today</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineChartData}>
                        <XAxis dataKey="time" axisLine={false} tickLine={false} className="text-xs" />
                        <YAxis axisLine={false} tickLine={false} className="text-xs" />
                        <Line type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="absent" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="attendance" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Report */}
            <div className="lg:col-span-2">
              <Card className="bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-green-600">Subject Report</CardTitle>
                    <span className="text-xs text-gray-500">This Month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" className="text-xs" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
                        <Radar
                          name="Allocated Budget"
                          dataKey="allocated"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.1}
                        />
                        <Radar
                          name="Actual Spending"
                          dataKey="actual"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.1}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
