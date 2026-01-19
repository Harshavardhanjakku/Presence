import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Calendar,
  LogOut,
  Settings,
  UserPlus,
  Download,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  Plus,
  Edit,
  Trash2,
  X,
  Save
} from 'lucide-react';
import { db } from '@/lib/mockDb';
import { toast } from '@/hooks/use-toast';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isImporting, setIsImporting] = useState(false);
  const [isFacultyDialogOpen, setIsFacultyDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [facultyFormData, setFacultyFormData] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    phone: '',
    subjects: [] as string[]
  });

  // Get analytics data
  const stats = db.getAttendanceStats();
  const defaulters = db.getDefaulters();
  const departments = db.getDepartments();
  const subjects = db.getSubjects();
  const students = db.getStudents();
  const faculty = db.getFaculty();

  // Chart data - dynamically calculated from actual attendance records
  const attendanceData = db.getWeeklyAttendanceTrend();
  const pieData = db.getAttendanceDistribution();

  const handleResetDatabase = () => {
    db.resetDatabase();
    toast({
      title: 'Database Reset',
      description: 'Sample data has been restored successfully.',
    });
  };

  const handleExportToExcel = () => {
    try {
      db.exportToExcel();
      toast({
        title: 'Export Successful',
        description: 'Data has been exported to Excel file: attendance_data.xlsx',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'An error occurred while exporting data.',
        variant: 'destructive'
      });
    }
  };

  // Faculty Management Handlers
  const handleAddFaculty = () => {
    setSelectedFaculty(null);
    setFacultyFormData({
      name: '',
      email: '',
      password: '',
      departmentId: '',
      phone: '',
      subjects: []
    });
    setIsFacultyDialogOpen(true);
  };

  const handleEditFaculty = (facultyId: string) => {
    const faculty = db.getFaculty().find(f => f.id === facultyId);
    if (faculty) {
      setSelectedFaculty(facultyId);
      setFacultyFormData({
        name: faculty.name,
        email: faculty.email,
        password: '', // Don't show password
        departmentId: faculty.departmentId,
        phone: faculty.phone,
        subjects: faculty.subjects
      });
      setIsFacultyDialogOpen(true);
    }
  };

  const handleDeleteFaculty = (facultyId: string) => {
    setSelectedFaculty(facultyId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteFaculty = () => {
    if (selectedFaculty) {
      try {
        db.deleteFaculty(selectedFaculty);
        toast({
          title: 'Faculty Deleted',
          description: 'Faculty member has been removed successfully.',
        });
        setIsDeleteDialogOpen(false);
        setSelectedFaculty(null);
      } catch (error: any) {
        toast({
          title: 'Delete Failed',
          description: error.message || 'An error occurred while deleting faculty.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleSaveFaculty = () => {
    try {
      // Validation
      if (!facultyFormData.name || !facultyFormData.email || !facultyFormData.departmentId) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
          variant: 'destructive'
        });
        return;
      }

      if (!selectedFaculty && !facultyFormData.password) {
        toast({
          title: 'Validation Error',
          description: 'Password is required for new faculty.',
          variant: 'destructive'
        });
        return;
      }

      if (selectedFaculty) {
        // Update existing
        db.updateFaculty(selectedFaculty, {
          name: facultyFormData.name,
          email: facultyFormData.email,
          password: facultyFormData.password || undefined, // Only update if provided
          departmentId: facultyFormData.departmentId,
          phone: facultyFormData.phone,
          subjects: facultyFormData.subjects
        });
        toast({
          title: 'Faculty Updated',
          description: 'Faculty member has been updated successfully.',
        });
      } else {
        // Add new
        db.addFaculty({
          name: facultyFormData.name,
          email: facultyFormData.email,
          password: facultyFormData.password,
          departmentId: facultyFormData.departmentId,
          phone: facultyFormData.phone,
          subjects: facultyFormData.subjects
        });
        toast({
          title: 'Faculty Added',
          description: 'New faculty member has been added successfully.',
        });
      }

      setIsFacultyDialogOpen(false);
      setSelectedFaculty(null);
      setFacultyFormData({
        name: '',
        email: '',
        password: '',
        departmentId: '',
        phone: '',
        subjects: []
      });
    } catch (error: any) {
      toast({
        title: 'Operation Failed',
        description: error.message || 'An error occurred.',
        variant: 'destructive'
      });
    }
  };

  const toggleSubject = (subjectId: string) => {
    setFacultyFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(id => id !== subjectId)
        : [...prev.subjects, subjectId]
    }));
  };

  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an Excel file (.xlsx or .xls)',
        variant: 'destructive'
      });
      return;
    }

    setIsImporting(true);
    try {
      await db.importFromExcel(file);
      toast({
        title: 'Import Successful',
        description: 'Data has been imported from Excel file and saved to localStorage.',
      });
      // Refresh page to show updated data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message || 'An error occurred while importing data.',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
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
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="faculty">Manage Faculty</TabsTrigger>
            <TabsTrigger value="reports">Data Management</TabsTrigger>
            <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">Across all departments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Faculty</CardTitle>
                  <GraduationCap className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalFaculty}</div>
                  <p className="text-xs text-muted-foreground">Active professors</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.overallAttendancePercentage}%</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.presentClasses} / {stats.totalClasses} classes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Defaulters</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">{stats.defaultersCount}</div>
                  <p className="text-xs text-muted-foreground">Students below 85%</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Attendance Trend</CardTitle>
                  <CardDescription>Average attendance percentage by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={attendanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Distribution</CardTitle>
                  <CardDescription>Student categorization by attendance percentage</CardDescription>
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
                        <span className="font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>View and manage all students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Roll Number</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Department</th>
                        <th className="text-left p-2">Section</th>
                        <th className="text-left p-2">Year</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 10).map((student) => {
                        const dept = departments.find(d => d.id === student.departmentId);
                        return (
                          <tr key={student.id} className="border-b">
                            <td className="p-2 font-mono text-sm">{student.rollNumber}</td>
                            <td className="p-2">{student.name}</td>
                            <td className="p-2">{dept?.code}</td>
                            <td className="p-2">
                              <Badge variant="secondary">{student.section}</Badge>
                            </td>
                            <td className="p-2">{student.year}</td>
                            <td className="p-2">
                              <Button variant="outline" size="sm">Edit</Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Faculty Tab */}
          <TabsContent value="faculty">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Faculty Management</CardTitle>
                    <CardDescription>Add, edit, or remove faculty members</CardDescription>
                  </div>
                  <Button onClick={handleAddFaculty}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Faculty
                  </Button>
                </CardHeader>
                <CardContent>
                  {faculty.length === 0 ? (
                    <div className="text-center py-12">
                      <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No faculty members found</p>
                      <Button onClick={handleAddFaculty}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Faculty Member
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Name</th>
                            <th className="text-left p-3">Email</th>
                            <th className="text-left p-3">Department</th>
                            <th className="text-left p-3">Subjects</th>
                            <th className="text-left p-3">Contact</th>
                            <th className="text-left p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {faculty.map((member) => {
                            const dept = departments.find(d => d.id === member.departmentId);
                            const memberSubjects = subjects.filter(s => member.subjects.includes(s.id));
                            return (
                              <tr key={member.id} className="border-b hover:bg-muted/50">
                                <td className="p-3 font-medium">{member.name}</td>
                                <td className="p-3 text-sm text-muted-foreground">{member.email}</td>
                                <td className="p-3">
                                  <Badge variant="secondary">{dept?.code || 'N/A'}</Badge>
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-wrap gap-1">
                                    {memberSubjects.length > 0 ? (
                                      memberSubjects.map(subject => (
                                        <Badge key={subject.id} variant="outline" className="text-xs">
                                          {subject.code}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-xs text-muted-foreground">No subjects</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-sm">{member.phone}</td>
                                <td className="p-3">
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditFaculty(member.id)}
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleDeleteFaculty(member.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Add/Edit Faculty Dialog */}
            <Dialog open={isFacultyDialogOpen} onOpenChange={setIsFacultyDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedFaculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedFaculty 
                      ? 'Update faculty member information. Leave password blank to keep current password.'
                      : 'Fill in the details to add a new faculty member.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="faculty-name">Full Name *</Label>
                      <Input
                        id="faculty-name"
                        value={facultyFormData.name}
                        onChange={(e) => setFacultyFormData({...facultyFormData, name: e.target.value})}
                        placeholder="Dr. John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faculty-email">Email *</Label>
                      <Input
                        id="faculty-email"
                        type="email"
                        value={facultyFormData.email}
                        onChange={(e) => setFacultyFormData({...facultyFormData, email: e.target.value})}
                        placeholder="john.doe@university.edu"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="faculty-password">
                        Password {selectedFaculty ? '(leave blank to keep current)' : '*'}
                      </Label>
                      <Input
                        id="faculty-password"
                        type="password"
                        value={facultyFormData.password}
                        onChange={(e) => setFacultyFormData({...facultyFormData, password: e.target.value})}
                        placeholder={selectedFaculty ? "Leave blank to keep current" : "Enter password"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faculty-phone">Phone</Label>
                      <Input
                        id="faculty-phone"
                        type="tel"
                        value={facultyFormData.phone}
                        onChange={(e) => setFacultyFormData({...facultyFormData, phone: e.target.value})}
                        placeholder="+1-555-0100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faculty-department">Department *</Label>
                    <Select 
                      value={facultyFormData.departmentId} 
                      onValueChange={(value) => setFacultyFormData({...facultyFormData, departmentId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.code} - {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Assigned Subjects</Label>
                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                      {subjects.filter(s => s.departmentId === facultyFormData.departmentId).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No subjects available for selected department</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {subjects
                            .filter(s => s.departmentId === facultyFormData.departmentId)
                            .map(subject => (
                              <div key={subject.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`subject-${subject.id}`}
                                  checked={facultyFormData.subjects.includes(subject.id)}
                                  onCheckedChange={() => toggleSubject(subject.id)}
                                />
                                <label
                                  htmlFor={`subject-${subject.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {subject.code} - {subject.name}
                                </label>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsFacultyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveFaculty}>
                    <Save className="w-4 h-4 mr-2" />
                    {selectedFaculty ? 'Update' : 'Add'} Faculty
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the faculty member
                    and all associated attendance records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDeleteFaculty} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="grid gap-6">
              {/* Excel Export/Import */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileSpreadsheet className="w-5 h-5 mr-2" />
                    Excel Data Management
                  </CardTitle>
                  <CardDescription>Export all data to Excel or import data from Excel file</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">Export Data to Excel</h3>
                      <p className="text-sm text-muted-foreground">
                        Download all data (including passwords) to Excel file.
                      </p>
                      <p className="text-xs font-medium text-primary">
                        File: <code className="bg-primary/10 px-1 py-0.5 rounded">attendance_data.xlsx</code>
                      </p>
                      <Button 
                        onClick={handleExportToExcel}
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Excel File
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium">Import Data</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload Excel file to import/update all data. Credentials will be imported from the file.
                      </p>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleImportFromExcel}
                          disabled={isImporting}
                          className="hidden"
                          id="excel-import"
                        />
                        <Button 
                          asChild
                          variant="outline"
                          className="w-full"
                          disabled={isImporting}
                        >
                          <label htmlFor="excel-import" className="cursor-pointer flex items-center justify-center">
                            {isImporting ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Import from Excel
                              </>
                            )}
                          </label>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Excel File Format:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>The Excel file should contain sheets: <strong>Students, Faculty, Admins, Departments, Subjects, Attendance</strong></li>
                      <li><strong>Students:</strong> Roll Number, Name, Email, <span className="text-primary font-semibold">Password</span>, Department, Section, Year, Phone</li>
                      <li><strong>Faculty:</strong> Name, Email, <span className="text-primary font-semibold">Password</span>, Department, Phone, Subjects</li>
                      <li><strong>Admins:</strong> Name, Email, <span className="text-primary font-semibold">Password</span></li>
                      <li><strong>Departments:</strong> Code, Name, Head</li>
                      <li><strong>Subjects:</strong> Code, Name, Department, Credits</li>
                      <li><strong>Attendance:</strong> Date, Student Roll Number, Subject Code, Faculty, Status, Section</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Note:</strong> Data is stored in browser localStorage. Use "Download Excel File" to export all data including credentials.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Other Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Generate Reports</CardTitle>
                  <CardDescription>Download attendance and analytics reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button className="justify-start h-auto p-4 flex-col items-start">
                      <Download className="w-5 h-5 mb-2 self-center" />
                      <div className="text-left">
                        <div className="font-medium">Student Attendance Report</div>
                        <div className="text-sm text-muted-foreground">Detailed attendance by student</div>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="justify-start h-auto p-4 flex-col items-start">
                      <Download className="w-5 h-5 mb-2 self-center" />
                      <div className="text-left">
                        <div className="font-medium">Subject-wise Report</div>
                        <div className="text-sm text-muted-foreground">Attendance by subject</div>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="justify-start h-auto p-4 flex-col items-start">
                      <Download className="w-5 h-5 mb-2 self-center" />
                      <div className="text-left">
                        <div className="font-medium">Defaulters List</div>
                        <div className="text-sm text-muted-foreground">Students below 85%</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Defaulters Tab */}
          <TabsContent value="defaulters">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Defaulters</CardTitle>
                <CardDescription>Students with less than 85% attendance</CardDescription>
              </CardHeader>
              <CardContent>
                {defaulters.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No defaulters found. Great job!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Roll Number</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Department</th>
                          <th className="text-left p-2">Attendance %</th>
                          <th className="text-left p-2">Classes</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {defaulters.map((student) => {
                          const dept = departments.find(d => d.id === student.departmentId);
                          return (
                            <tr key={student.id} className="border-b">
                              <td className="p-2 font-mono text-sm">{student.rollNumber}</td>
                              <td className="p-2">{student.name}</td>
                              <td className="p-2">{dept?.code}</td>
                              <td className="p-2">
                                <Badge variant="destructive">
                                  {student.attendancePercentage}%
                                </Badge>
                              </td>
                              <td className="p-2 text-sm">
                                {student.presentClasses} / {student.totalClasses}
                              </td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-warning border-warning">
                                  Warning Sent
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};