import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Trophy, Clock, Search, LogOut, ArrowLeft, ChevronRight, Folder, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { Link } from 'react-router-dom';
import CourseViewer from './CourseViewer';

interface EmployeeLearningHubProps {
  isAdminUserMode?: boolean;
  onBackToAdmin?: () => void;
}

const CourseCatalog = ({ 
  onStartCourse, 
  courseProgresses,
  userRole 
}: { 
  onStartCourse: (courseId: string) => void;
  courseProgresses: Record<string, any>;
  userRole?: string;
}) => {
  const { categories, loading } = useCategories();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground">No Courses Available</h3>
          <p className="text-sm text-muted-foreground">
            {userRole === 'admin' 
              ? "No courses have been created yet" 
              : "No published courses are available at the moment"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full">
        {categories.map((category) => (
          <AccordionItem key={category.id} value={category.id}>
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-semibold">{category.name}</div>
                  {category.description && (
                    <div className="text-sm text-muted-foreground">{category.description}</div>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* Direct courses in this category */}
              {category.courses && category.courses.length > 0 && (
                  <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Courses</h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ml-4">
                    {category.courses.map((course) => (
                      <CourseCard 
                        key={course.id} 
                        course={course} 
                        onStartCourse={onStartCourse}
                        courseProgress={courseProgresses[course.id]}
                        userRole={userRole}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-categories */}
              {category.subCategories && category.subCategories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Sub-categories</h4>
                  <Accordion type="multiple" className="w-full ml-4">
                    {category.subCategories.map((subCategory) => (
                      <AccordionItem key={subCategory.id} value={subCategory.id}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-secondary" />
                            <div>
                              <div className="font-medium">{subCategory.name}</div>
                              {subCategory.description && (
                                <div className="text-sm text-muted-foreground">{subCategory.description}</div>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {subCategory.courses && subCategory.courses.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 ml-4">
                              {subCategory.courses.map((course) => (
                                <CourseCard 
                                  key={course.id} 
                                  course={course} 
                                  onStartCourse={onStartCourse}
                                  courseProgress={courseProgresses[course.id]}
                                  userRole={userRole}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground ml-4">No courses in this sub-category yet</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

const CourseCard = ({ course, onStartCourse, courseProgress, userRole }: { 
  course: any; 
  onStartCourse: (courseId: string) => void;
  courseProgress: any;
  userRole?: string;
}) => {
  const progress = courseProgress?.progress_percentage || 0;
  const hasStarted = courseProgress && courseProgress.status !== 'not_started';
  const canAccess = userRole === 'admin' || course.is_published;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant={course.is_published ? "default" : "secondary"}>
            {course.is_published ? "Published" : "Draft"}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            <span>{course.modules?.length || 0} modules</span>
          </div>
        </div>
        <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
        {course.description && (
          <CardDescription className="text-sm">
            {course.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          <Button 
            className="w-full" 
            disabled={!canAccess}
            onClick={() => onStartCourse(course.id)}
          >
            {!canAccess 
              ? userRole === 'admin' ? "Draft Course" : "Coming Soon"
              : hasStarted 
                ? "Continue Course" 
                : "Start Course"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const EmployeeLearningHub = ({ isAdminUserMode = false, onBackToAdmin }: EmployeeLearningHubProps) => {
  const [activeTab, setActiveTab] = useState('my-courses');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courseProgresses, setCourseProgresses] = useState<Record<string, any>>({});
  const [inProgressCourses, setInProgressCourses] = useState<any[]>([]);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  
  const { signOut, profile } = useAuth();
  const { getAllCourseProgress } = useCourseProgress();

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const allProgress = await getAllCourseProgress();
      
      // Create progress lookup
      const progressLookup: Record<string, any> = {};
      allProgress.forEach(progress => {
        progressLookup[progress.course_id] = progress;
      });
      setCourseProgresses(progressLookup);

      // Filter courses by status
      const inProgress = allProgress.filter(p => p.status === 'in_progress');
      const completed = allProgress.filter(p => p.status === 'completed');
      
      setInProgressCourses(inProgress);
      setCompletedCourses(completed);
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleStartCourse = (courseId: string) => {
    setSelectedCourse(courseId);
  };

  const handleBackFromCourse = () => {
    setSelectedCourse(null);
    loadProgressData(); // Refresh progress when returning
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background shadow-sm border-b relative">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/menu" className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="heading-display text-foreground">Learning Hub</h1>
                <p className="text-body text-muted-foreground">
                  {isAdminUserMode 
                    ? "Testing user experience as admin" 
                    : "Continue your learning journey"
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isAdminUserMode && onBackToAdmin && (
                <Button variant="outline" onClick={onBackToAdmin} className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Admin View</span>
                </Button>
              )}
              {!isAdminUserMode && (
                <Button variant="outline" onClick={handleSignOut} className="flex items-center space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {selectedCourse ? (
          <CourseViewer 
            courseId={selectedCourse} 
            onBack={handleBackFromCourse}
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Button variant="outline" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Browse Courses
              </Button>
            </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-courses" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            My Courses
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Course Catalog
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-courses" className="space-y-4">
          {/* Continue Learning Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Continue Learning
              </CardTitle>
              <CardDescription>
                Pick up where you left off
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inProgressCourses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inProgressCourses.map((progress) => (
                    <Card key={progress.course_id} className="hover:shadow-md transition-shadow cursor-pointer" 
                          onClick={() => handleStartCourse(progress.course_id)}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Course in Progress</CardTitle>
                        <CardDescription>Continue where you left off</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{progress.progress_percentage}%</span>
                          </div>
                          <Progress value={progress.progress_percentage} className="w-full" />
                          <Button className="w-full">
                            Continue Course
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No courses in progress</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start a new course to begin your learning journey
                  </p>
                  <Button onClick={() => setActiveTab('catalog')}>Browse Available Courses</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Completed Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedCourses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedCourses.map((progress) => (
                    <Card key={progress.course_id} className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleStartCourse(progress.course_id)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Completed</Badge>
                          <Trophy className="w-4 h-4 text-yellow-500" />
                        </div>
                        <CardTitle className="text-lg">Completed Course</CardTitle>
                        <CardDescription>Review your completed work</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button className="w-full" variant="outline">
                          Review Course
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Complete your first course to see it here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <CourseCatalog 
            onStartCourse={handleStartCourse}
            courseProgresses={courseProgresses}
            userRole={profile?.role}
          />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Courses Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedCourses.length}</div>
                <p className="text-sm text-muted-foreground">courses finished</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  Courses in Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{inProgressCourses.length}</div>
                <p className="text-sm text-muted-foreground">courses started</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="w-5 h-5" />
                  Average Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {inProgressCourses.length > 0 
                    ? Math.round(inProgressCourses.reduce((acc, course) => acc + course.progress_percentage, 0) / inProgressCourses.length)
                    : 0
                  }%
                </div>
                <p className="text-sm text-muted-foreground">average completion</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>
                Your latest learning milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedCourses.length > 0 ? (
                <div className="space-y-3">
                  {completedCourses.slice(0, 5).map((progress) => (
                    <div key={progress.course_id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <div className="flex-1">
                        <p className="font-medium">Course Completed!</p>
                        <p className="text-sm text-muted-foreground">
                          Completed on {new Date(progress.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Complete courses to earn achievements
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeLearningHub;