import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, BookOpen, Play, CheckCircle, FileText, Volume2, HelpCircle } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
      </div>

      {/* Course Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={course.is_published ? "default" : "secondary"}>
                  {course.is_published ? "Published" : "Draft"}
                </Badge>
                {hasStarted && (
                  <Badge variant="outline">
                    {courseProgress.status === 'completed' ? 'Completed' : 'In Progress'}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              {course.description && (
                <CardDescription className="text-base">{course.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {course.modules.length} modules
              </span>
            </div>
          </div>

          {hasStarted && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>
          )}

          {!hasStarted && course.is_published && (
            <Button onClick={handleStartCourse} className="w-fit">
              <Play className="w-4 h-4 mr-2" />
              Start Course
            </Button>
          )}
        </CardHeader>
      </Card>

      {/* Course Modules */}
      {hasStarted && (
        <Card>
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
            <CardDescription>
              Navigate through the modules to complete the course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" value={activeModule || undefined} onValueChange={setActiveModule} className="w-full">
              {course.modules.map((module, index) => {
                const isCompleted = moduleProgress[module.id];
                const completedModules = Object.values(moduleProgress).filter(Boolean).length;
                const isAccessible = index === 0 || completedModules >= index;

                return (
                  <AccordionItem key={module.id} value={module.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : isAccessible 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{module.title}</div>
                          {module.description && (
                            <div className="text-sm text-muted-foreground">{module.description}</div>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-auto">
                          {module.content.length} items
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {isAccessible ? (
                        <>
                          {module.content.map((content) => (
                            <div key={content.id}>
                              {renderContent(content)}
                            </div>
                          ))}
                          
                          {!isCompleted && (
                            <div className="pt-4 border-t">
                              <Button 
                                onClick={() => handleCompleteModule(module.id)}
                                className="w-full"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Module as Complete
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Complete the previous modules to unlock this content</p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseViewer;