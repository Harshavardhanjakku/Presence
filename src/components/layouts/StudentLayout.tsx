import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  BookOpen,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Users,
  LogOut,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { db } from '@/lib/mockDb';
import { format, parseISO } from 'date-fns';

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Get student data
  const student = db.getStudents().find(s => s.id === user?.id);
  const department = db.getDepartments().find(d => d.id === student?.departmentId);
  const studentAttendance = db.getStudentAttendance(user?.id || '');

  // Calculate overall attendance
  const overallStats = studentAttendance.reduce(
    (acc, subject) => {
      acc.totalClasses += subject.total;
      acc.presentClasses += subject.present;
      return acc;
    },
    { totalClasses: 0, presentClasses: 0 }
  );

  const overallPercentage = overallStats.totalClasses > 0 
    ? Math.round((overallStats.presentClasses / overallStats.totalClasses) * 100 * 100) / 100
    : 0;

  // Chart data for subject-wise attendance
  const subjectChartData = studentAttendance.map(item => ({
    name: item.subject?.code || 'Unknown',
    percentage: item.percentage,
    present: item.present,
    absent: item.total - item.present
  }));

  // Pie chart data for overall attendance
  const pieData = [
    { name: 'Present', value: overallStats.presentClasses, color: '#10B981' },
    { name: 'Absent', value: overallStats.totalClasses - overallStats.presentClasses, color: '#EF4444' }
  ];

  // Get attendance status and warnings
  const getAttendanceStatus = () => {
    if (overallPercentage >= 90) return { status: 'excellent', color: 'success', message: 'Excellent attendance!' };
    if (overallPercentage >= 85) return { status: 'good', color: 'primary', message: 'Good attendance' };
    if (overallPercentage >= 75) return { status: 'warning', color: 'warning', message: 'Attendance below recommended level' };
    return { status: 'critical', color: 'destructive', message: 'Critical: Attendance too low!' };
  };

  const attendanceStatus = getAttendanceStatus();

  // Get recent attendance - dynamically calculated from actual attendance records
  const recentAttendance = db.getRecentAttendance(user?.id || '');

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Student Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="attendance">My Attendance</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Student Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Roll Number</p>
                    <p className="font-medium">{student?.rollNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{department?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Section</p>
                    <p className="font-medium">Section {student?.section}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-medium">{student?.year} Year</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Attendance</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-2xl">{overallPercentage}%</p>
                      <Badge variant={attendanceStatus.color as any}>
                        {attendanceStatus.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                  <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallStats.totalClasses}</div>
                  <p className="text-xs text-muted-foreground">All subjects combined</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
                  <CheckCircle className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{overallStats.presentClasses}</div>
                  <p className="text-xs text-muted-foreground">Present in class</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classes Missed</CardTitle>
                  <XCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {overallStats.totalClasses - overallStats.presentClasses}
                  </div>
                  <p className="text-xs text-muted-foreground">Absent from class</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallPercentage}%</div>
                  <p className="text-xs text-muted-foreground">{attendanceStatus.message}</p>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Warning */}
            {overallPercentage < 85 && (
              <Card className="border-warning bg-warning/5">
                <CardHeader>
                  <CardTitle className="flex items-center text-warning">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Attendance Warning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Your attendance is below the required 85%. You need to attend more classes to meet the minimum requirement.
                    {overallPercentage < 75 && (
                      <span className="block mt-2 font-medium text-destructive">
                        Warning: You may not be eligible to appear for exams if attendance doesn't improve.
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subject-wise Attendance</CardTitle>
                  <CardDescription>Your attendance percentage by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={subjectChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Overall Attendance Breakdown</CardTitle>
                  <CardDescription>Present vs Absent classes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {pieData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}
                        </div>
                        <span className="font-medium">{item.value} classes</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Attendance */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
                <CardDescription>Your attendance for the last few classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAttendance.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <p className="font-medium">{record.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(record.date), 'PPP')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={record.status === 'present' ? 'default' : 'destructive'}>
                        {record.status === 'present' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {record.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Attendance</CardTitle>
                <CardDescription>Subject-wise attendance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {studentAttendance.map((item) => (
                    <div key={item.subject?.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{item.subject?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Code: {item.subject?.code} • Credits: {item.subject?.credits}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{item.percentage}%</div>
                          <div className="text-sm text-muted-foreground">
                            {item.present} / {item.total} classes
                          </div>
                        </div>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Present: {item.present}</span>
                        <span>Absent: {item.total - item.present}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>My Subjects</CardTitle>
                <CardDescription>All subjects you are enrolled in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {studentAttendance.map((item) => (
                    <div key={item.subject?.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <BookOpen className="w-8 h-8 text-primary" />
                        <div>
                          <div className="font-medium">{item.subject?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Code: {item.subject?.code} • Credits: {item.subject?.credits}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={item.percentage >= 85 ? 'default' : 'destructive'}>
                          {item.percentage}%
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.present}/{item.total} classes
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your academic and personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="text-lg font-medium">{student?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Roll Number</label>
                      <p className="text-lg font-medium">{student?.rollNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-lg font-medium">{student?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-lg font-medium">{student?.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Department</label>
                      <p className="text-lg font-medium">{department?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Section</label>
                      <p className="text-lg font-medium">Section {student?.section}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Academic Year</label>
                      <p className="text-lg font-medium">{student?.year} Year</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};