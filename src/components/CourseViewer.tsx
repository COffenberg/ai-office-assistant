import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, BookOpen, Play, CheckCircle, FileText, Volume2, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { useAuth } from '@/hooks/useAuth';
interface CourseViewerProps {
  courseId: string;
  onBack: () => void;
}

interface CourseWithModules {
  id: string;
  title: string;
  description?: string;
  is_published: boolean;
  modules: {
    id: string;
    title: string;
    description?: string;
    module_type: string;
    order_index: number;
    content: {
      id: string;
      content_type: string;
      content_data: any;
      order_index: number;
    }[];
  }[];
}

const CourseViewer = ({ courseId, onBack }: CourseViewerProps) => {
  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [moduleProgress, setModuleProgress] = useState<Record<string, boolean>>({});
  const [courseProgress, setCourseProgress] = useState<any>(null);

  const { fetchCourseWithModules } = useCourses();
  const { 
    getCourseProgress, 
    startCourse, 
    getModuleProgress, 
    completeModule, 
    updateCourseProgress 
  } = useCourseProgress();
  const { user } = useAuth();

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      
      // Fetch course with modules
      const courseData = await fetchCourseWithModules(courseId);
      setCourse(courseData as CourseWithModules);

      // Load progress data
      if (user) {
        const progress = await getCourseProgress(courseId);
        setCourseProgress(progress);

        // Load module progress
        const moduleProgressData: Record<string, boolean> = {};
        for (const module of courseData.modules) {
          const modProgress = await getModuleProgress(module.id);
          moduleProgressData[module.id] = modProgress?.completed || false;
        }
        setModuleProgress(moduleProgressData);
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourse = async () => {
    if (!user) return;
    
    const progress = await startCourse(courseId);
    if (progress) {
      setCourseProgress(progress);
    }
  };

  const handleCompleteModule = async (moduleId: string) => {
    if (!user) return;

    await completeModule(moduleId, courseId);
    
    // Update local state
    setModuleProgress(prev => ({
      ...prev,
      [moduleId]: true
    }));

    // Refresh course progress
    const updatedProgress = await getCourseProgress(courseId);
    setCourseProgress(updatedProgress);
  };

  const renderContent = (content: any) => {
    const contentData = content.content_data as any;

    switch (content.content_type) {
      case 'text':
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {contentData.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p>{contentData.content}</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'document':
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {contentData.title}
              </CardTitle>
              {contentData.description && (
                <CardDescription>{contentData.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {contentData.attachedFiles?.map((file: any, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <FileText className="w-4 h-4" />
                  <span className="flex-1">{file.name}</span>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 'audio':
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                {contentData.title}
              </CardTitle>
              {contentData.description && (
                <CardDescription>{contentData.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {contentData.attachedFiles?.map((file: any, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <Volume2 className="w-4 h-4" />
                  <span className="flex-1">{file.name}</span>
                  <Button size="sm" variant="outline">
                    <Play className="w-4 h-4 mr-1" />
                    Play
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 'quiz':
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                {contentData.title}
              </CardTitle>
              {contentData.description && (
                <CardDescription>{contentData.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {contentData.questions?.length || 0} questions
                  </span>
                  <Button size="sm">
                    Start Quiz
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const progressPercentage = courseProgress?.progress_percentage || 0;
  const hasStarted = courseProgress && courseProgress.status !== 'not_started';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{course?.title}</h1>
                <p className="text-muted-foreground">{course?.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {courseProgress && courseProgress.status !== 'not_started' && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Progress:</span>
                  <Progress value={courseProgress.progress_percentage} className="w-20" />
                  <span className="text-sm font-medium">{courseProgress.progress_percentage}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-6 py-6">
        {!courseProgress || courseProgress.status === 'not_started' ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <BookOpen className="w-6 h-6" />
                Start Your Learning Journey
              </CardTitle>
              <CardDescription>
                Ready to begin this course? Click below to get started!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="grid gap-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline">{course?.modules?.length || 0} modules</Badge>
                  <span>•</span>
                  <span>Self-paced learning</span>
                </div>
              </div>
              <Button size="lg" onClick={handleStartCourse} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Start Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Course Modules</h2>
              <p className="text-muted-foreground">Complete each module to progress through the course</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {course?.modules?.map((module, index) => {
                const isCompleted = moduleProgress[module.id];
                const completedModules = Object.values(moduleProgress).filter(Boolean).length;
                const isAccessible = index === 0 || completedModules >= index;
                const isActive = activeModule === module.id;
                
                return (
                  <Card key={module.id} className={`transition-all ${isCompleted ? 'border-green-200 bg-green-50/30' : ''} ${!isAccessible ? 'opacity-60' : ''}`}>
                    <CardHeader 
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${!isAccessible ? 'cursor-not-allowed' : ''}`}
                      onClick={() => isAccessible && setActiveModule(isActive ? null : module.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCompleted 
                              ? 'bg-green-100 border-2 border-green-300' 
                              : isAccessible 
                                ? 'bg-primary/10 border-2 border-primary' 
                                : 'bg-muted border-2 border-muted-foreground'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <span className={isAccessible ? 'text-primary' : 'text-muted-foreground'}>{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{module.title}</CardTitle>
                            <CardDescription className="text-base">{module.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isCompleted && (
                            <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                              Completed
                            </Badge>
                          )}
                          {!isCompleted && isAccessible && (
                            <Badge variant="secondary">
                              {module.content?.length || 0} items
                            </Badge>
                          )}
                          {!isAccessible && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Locked
                            </Badge>
                          )}
                          {isAccessible && (
                            isActive ? 
                              <ChevronDown className="w-5 h-5" /> : 
                              <ChevronRight className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isActive && isAccessible && (
                      <CardContent>
                        <div className="space-y-4">
                          {module.content && module.content.length > 0 ? (
                            <div className="space-y-4">
                              {module.content.map((content, contentIndex) => (
                                <div key={content.id} className="border rounded-lg p-4 bg-background">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Item {contentIndex + 1}
                                    </span>
                                  </div>
                                  {renderContent(content)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No content available for this module</p>
                            </div>
                          )}
                          
                          {!isCompleted && (
                            <div className="pt-4 border-t">
                              <Button 
                                onClick={() => handleCompleteModule(module.id)}
                                className="w-full"
                                size="lg"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Module as Complete
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                    
                    {!isAccessible && (
                      <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p>Complete the previous modules to unlock this content</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseViewer;