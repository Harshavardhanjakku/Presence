import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  BookOpen,
  Users,
  Calendar as CalendarIcon,
  Save,
  Download,
  LogOut,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { db } from '@/lib/mockDb';
import { toast } from '@/hooks/use-toast';

export const FacultyLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>({});

  // Get faculty data
  const faculty = db.getFaculty().find(f => f.id === user?.id);
  const subjects = db.getSubjects().filter(s => faculty?.subjects.includes(s.id));
  const departments = db.getDepartments();
  const allStudents = db.getStudents();

  // Get students for selected section and department
  const studentsInSection = allStudents.filter(s => 
    s.departmentId === faculty?.departmentId && 
    (selectedSection === '' || s.section === selectedSection)
  );

  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: isPresent
    }));
  };

  const handleSaveAttendance = () => {
    if (!selectedSubject || !selectedSection) {
      toast({
        title: 'Error',
        description: 'Please select subject and section',
        variant: 'destructive'
      });
      return;
    }

    const records = studentsInSection.map(student => ({
      studentId: student.id,
      subjectId: selectedSubject,
      facultyId: user!.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      status: attendanceData[student.id] ? 'present' as const : 'absent' as const,
      section: selectedSection
    }));

    db.markAttendance(records);
    
    toast({
      title: 'Success',
      description: `Attendance saved for ${studentsInSection.length} students`,
    });

    // Reset form
    setAttendanceData({});
  };

  const handleSelectAll = (isPresent: boolean) => {
    const newData: Record<string, boolean> = {};
    studentsInSection.forEach(student => {
      newData[student.id] = isPresent;
    });
    setAttendanceData(newData);
  };

  const getAttendanceStats = () => {
    const totalStudents = studentsInSection.length;
    const presentCount = Object.values(attendanceData).filter(Boolean).length;
    const absentCount = totalStudents - presentCount;
    return { totalStudents, presentCount, absentCount };
  };

  const stats = getAttendanceStats();

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-success-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Faculty Dashboard</h1>
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
            <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
            <TabsTrigger value="reports">My Reports</TabsTrigger>
            <TabsTrigger value="subjects">My Subjects</TabsTrigger>
          </TabsList>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
                <CardDescription>Select subject, section, and date to mark attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !selectedDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Section</label>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Section A</SelectItem>
                        <SelectItem value="B">Section B</SelectItem>
                        <SelectItem value="C">Section C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quick Actions</label>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSelectAll(true)}
                        className="flex-1"
                      >
                        All Present
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSelectAll(false)}
                        className="flex-1"
                      >
                        All Absent
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                {studentsInSection.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{stats.totalStudents}</div>
                      <div className="text-sm text-muted-foreground">Total Students</div>
                    </div>
                    <div className="text-center p-4 bg-success/10 rounded-lg">
                      <div className="text-2xl font-bold text-success">{stats.presentCount}</div>
                      <div className="text-sm text-muted-foreground">Present</div>
                    </div>
                    <div className="text-center p-4 bg-destructive/10 rounded-lg">
                      <div className="text-2xl font-bold text-destructive">{stats.absentCount}</div>
                      <div className="text-sm text-muted-foreground">Absent</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Student List */}
            {selectedSubject && selectedSection && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Students in Section {selectedSection}</CardTitle>
                    <CardDescription>
                      {subjects.find(s => s.id === selectedSubject)?.name} - {format(selectedDate, 'PPP')}
                    </CardDescription>
                  </div>
                  <Button onClick={handleSaveAttendance} disabled={studentsInSection.length === 0}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Attendance
                  </Button>
                </CardHeader>
                <CardContent>
                  {studentsInSection.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No students found in this section</p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {studentsInSection.map((student, index) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.rollNumber}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`present-${student.id}`}
                                checked={attendanceData[student.id] === true}
                                onCheckedChange={(checked) => 
                                  handleAttendanceChange(student.id, checked === true)
                                }
                              />
                              <label 
                                htmlFor={`present-${student.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                Present
                              </label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`absent-${student.id}`}
                                checked={attendanceData[student.id] === false}
                                onCheckedChange={(checked) => 
                                  handleAttendanceChange(student.id, checked !== true)
                                }
                              />
                              <label 
                                htmlFor={`absent-${student.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                Absent
                              </label>
                            </div>
                            
                            <div className="w-8 h-8 flex items-center justify-center">
                              {attendanceData[student.id] === true && (
                                <CheckCircle className="w-5 h-5 text-success" />
                              )}
                              {attendanceData[student.id] === false && (
                                <XCircle className="w-5 h-5 text-destructive" />
                              )}
                              {attendanceData[student.id] === undefined && (
                                <Clock className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Reports</CardTitle>
                <CardDescription>Download reports for your subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex-col">
                    <Download className="w-8 h-8 mb-2" />
                    <div className="text-center">
                      <div className="font-medium">Subject-wise Report</div>
                      <div className="text-sm text-muted-foreground">Download attendance by subject</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex-col">
                    <Download className="w-8 h-8 mb-2" />
                    <div className="text-center">
                      <div className="font-medium">Section-wise Report</div>
                      <div className="text-sm text-muted-foreground">Download attendance by section</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>My Subjects</CardTitle>
                <CardDescription>Subjects assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <BookOpen className="w-8 h-8 text-primary" />
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Code: {subject.code} • Credits: {subject.credits}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{subject.credits} Credits</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};