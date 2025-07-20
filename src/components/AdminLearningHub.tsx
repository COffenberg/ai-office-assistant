import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, Users, BarChart3, Settings, User, Eye, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import BackToMenuLink from '@/components/BackToMenuLink';
import EmployeeLearningHub from './EmployeeLearningHub';
import CourseManagement from './CourseManagement';

const AdminLearningHub = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [isInUserView, setIsInUserView] = useState(false);
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSwitchToUserView = () => {
    setIsInUserView(true);
  };

  const handleBackToAdminView = () => {
    setIsInUserView(false);
  };

  if (isInUserView) {
    return <EmployeeLearningHub isAdminUserMode={true} onBackToAdmin={handleBackToAdminView} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background shadow-sm border-b relative">
        <BackToMenuLink />
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-display text-foreground">Learning Hub - Admin</h1>
              <p className="text-body text-muted-foreground">
                Create and manage courses for your team
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {profile && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{profile.full_name || profile.email}</span>
                  <Badge variant="outline" className="text-xs">
                    {profile.role}
                  </Badge>
                </div>
              )}
              <Button 
                variant="outline" 
                onClick={handleSwitchToUserView}
                className="flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Switch to User View</span>
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Course
          </Button>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="course-builder" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Course Builder
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>


        <TabsContent value="course-builder" className="space-y-4">
          <CourseManagement />
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Plus className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-foreground">Create New Course</h3>
                <p className="text-sm text-muted-foreground">
                  Start building a new learning experience
                </p>
              </CardContent>
            </Card>
            
            {/* Placeholder for existing courses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sample Course</CardTitle>
                <CardDescription>
                  This is what a course card will look like
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">0 students enrolled</span>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>
                View and manage student enrollments and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Student management interface will go here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">courses created</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">students enrolled</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">average completion</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">learning hours</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Hub Settings</CardTitle>
              <CardDescription>
                Configure your learning hub preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings interface will go here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default AdminLearningHub;