import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Trophy, Clock, Search, LogOut, ArrowLeft, ChevronRight, Folder, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { Link } from 'react-router-dom';

interface EmployeeLearningHubProps {
  isAdminUserMode?: boolean;
  onBackToAdmin?: () => void;
}

const CourseCatalog = () => {
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
            Your admin hasn't created any courses yet
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
                      <CourseCard key={course.id} course={course} />
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
                                <CourseCard key={course.id} course={course} />
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

const CourseCard = ({ course }: { course: any }) => {
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
            <span>0%</span>
          </div>
          <Progress value={0} className="w-full" />
          <Button className="w-full" disabled={!course.is_published}>
            {course.is_published ? "Start Course" : "Coming Soon"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const EmployeeLearningHub = ({ isAdminUserMode = false, onBackToAdmin }: EmployeeLearningHubProps) => {
  const [activeTab, setActiveTab] = useState('my-courses');
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Continue Learning Section */}
            <Card className="md:col-span-2 lg:col-span-3">
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
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No courses in progress</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start a new course to begin your learning journey
                  </p>
                  <Button>Browse Available Courses</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Completed Courses */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Completed Courses</h3>
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Complete your first course to see it here
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <CourseCatalog />
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
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">courses finished</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Learning Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0h</div>
                <p className="text-sm text-muted-foreground">total time spent</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className="w-5 h-5" />
                  Certificates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">certificates earned</p>
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
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Complete courses to earn achievements
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default EmployeeLearningHub;