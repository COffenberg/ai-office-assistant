import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  FolderPlus, 
  BookOpen, 
  FileText, 
  Volume2, 
  HelpCircle,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Upload,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useCategories, type Category, type Course, type CourseModule, type ContentItem } from '@/hooks/useCategories';
import { useCourses } from '@/hooks/useCourses';
import { useModules } from '@/hooks/useModules';
import { useFileUpload } from '@/hooks/useFileUpload';
import { QuizBuilder } from './QuizBuilder';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CourseManagement = () => {
  const { categories, loading: categoriesLoading, createCategory, addCategoryAttachment, refetch } = useCategories();
  const { loading: coursesLoading, createCourse, fetchCourseWithModules, addCourseAttachment } = useCourses();
  const { loading: modulesLoading, createModule, addContentToModule } = useModules();
  const { uploading, uploadProgress, uploadFile } = useFileUpload();
  
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [openSubCategories, setOpenSubCategories] = useState<Set<string>>(new Set());
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSubCategoryDialog, setShowSubCategoryDialog] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [subCategoryForm, setSubCategoryForm] = useState({ name: '', description: '' });
  const [courseForm, setCourseForm] = useState({ title: '', description: '' });

  const toggleCategory = (categoryId: string) => {
    const newOpen = new Set(openCategories);
    if (newOpen.has(categoryId)) {
      newOpen.delete(categoryId);
    } else {
      newOpen.add(categoryId);
    }
    setOpenCategories(newOpen);
  };

  const toggleSubCategory = (subCategoryId: string) => {
    const newOpen = new Set(openSubCategories);
    if (newOpen.has(subCategoryId)) {
      newOpen.delete(subCategoryId);
    } else {
      newOpen.add(subCategoryId);
    }
    setOpenSubCategories(newOpen);
  };

  const handleCreateCategory = async () => {
    try {
      await createCategory(categoryForm.name, categoryForm.description);
      setShowCategoryDialog(false);
      setCategoryForm({ name: '', description: '' });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleCreateSubCategory = async () => {
    try {
      await createCategory(subCategoryForm.name, subCategoryForm.description, selectedParentCategory);
      setShowSubCategoryDialog(false);
      setSubCategoryForm({ name: '', description: '' });
      setSelectedParentCategory('');
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleCreateCourse = async () => {
    try {
      await createCourse(courseForm.title, courseForm.description, selectedCategory);
      setShowCourseDialog(false);
      setCourseForm({ title: '', description: '' });
      setSelectedCategory('');
      refetch(); // Refresh categories to show new course
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const openCourseBuilder = async (course: Course) => {
    try {
      const fullCourse = await fetchCourseWithModules(course.id);
      setSelectedCourse(fullCourse as Course);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (selectedCourse) {
    return <CourseBuilder course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Course Management</h2>
          <p className="text-muted-foreground">Organize your courses into categories and manage content</p>
        </div>
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4" />
              Create Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Categories help organize your courses by topic or department.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category Name</label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Safety Training, IT Skills"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Brief description of this category"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCategory}
                  disabled={categoriesLoading || !categoryForm.name.trim()}
                >
                  {categoriesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Category"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <FolderPlus className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Categories Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first category to organize your courses
            </p>
            <Button 
              onClick={() => setShowCategoryDialog(true)}
              disabled={categoriesLoading}
            >
              Create First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <CategoryCard 
              key={category.id} 
              category={category}
              openCategories={openCategories}
              openSubCategories={openSubCategories}
              toggleCategory={toggleCategory}
              toggleSubCategory={toggleSubCategory}
              onCreateCourse={(categoryId) => {
                setSelectedCategory(categoryId);
                setShowCourseDialog(true);
              }}
              onCreateSubCategory={(categoryId) => {
                setSelectedParentCategory(categoryId);
                setShowSubCategoryDialog(true);
              }}
              onEditCourse={openCourseBuilder}
            />
          ))}
        </div>
      )}

      {/* Create Sub-Category Dialog */}
      <Dialog open={showSubCategoryDialog} onOpenChange={setShowSubCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Sub-Category</DialogTitle>
            <DialogDescription>
              Add a sub-category to organize courses within this category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Sub-Category Name</label>
              <Input
                value={subCategoryForm.name}
                onChange={(e) => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })}
                placeholder="e.g., Basic Safety, Advanced Procedures"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={subCategoryForm.description}
                onChange={(e) => setSubCategoryForm({ ...subCategoryForm, description: e.target.value })}
                placeholder="Brief description of this sub-category"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSubCategoryDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSubCategory}
                disabled={categoriesLoading || !subCategoryForm.name.trim()}
              >
                {categoriesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Sub-Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Add a new course to the selected category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Course Title</label>
              <Input
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                placeholder="e.g., Workplace Safety Fundamentals"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="What will students learn in this course?"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCourseDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCourse}
                disabled={coursesLoading || !courseForm.title.trim()}
              >
                {coursesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Course"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Category Card Component with Sub-Categories
interface CategoryCardProps {
  category: Category;
  openCategories: Set<string>;
  openSubCategories: Set<string>;
  toggleCategory: (id: string) => void;
  toggleSubCategory: (id: string) => void;
  onCreateCourse: (categoryId: string) => void;
  onCreateSubCategory: (categoryId: string) => void;
  onEditCourse: (course: Course) => void;
}

const CategoryCard = ({ 
  category, 
  openCategories, 
  openSubCategories,
  toggleCategory, 
  toggleSubCategory,
  onCreateCourse, 
  onCreateSubCategory,
  onEditCourse 
}: CategoryCardProps) => {
  const { addCategoryAttachment } = useCategories();
  const { addCourseAttachment } = useCourses();
  const totalCourses = (category.courses?.length || 0) + 
    (category.subCategories?.reduce((sum, sub) => sum + (sub.courses?.length || 0), 0) || 0);

  const handleCategoryFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      await addCategoryAttachment(category.id, file);
    } catch (error) {
      // Error handling is done in the hook
    }
    
    // Reset the input
    event.target.value = '';
  };

  const handleCourseFileUpload = async (courseId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      await addCourseAttachment(courseId, file);
    } catch (error) {
      // Error handling is done in the hook
    }
    
    // Reset the input
    event.target.value = '';
  };

  return (
    <Card>
      <Collapsible
        open={openCategories.has(category.id)}
        onOpenChange={() => toggleCategory(category.id)}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {openCategories.has(category.id) ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
                <div>
                  <CardTitle className="text-left">{category.name}</CardTitle>
                  <CardDescription className="text-left">
                    {category.description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {totalCourses} courses
                </Badge>
                <Badge variant="outline">
                  {category.subCategories?.length || 0} sub-categories
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateSubCategory(category.id);
                  }}
                  title="Add Sub-Category"
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateCourse(category.id);
                  }}
                  title="Add Course"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    title="Upload Files"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp3,.wav,.m4a,.jpg,.jpeg,.png,.gif,.webp,.svg"
                    onChange={handleCategoryFileUpload}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            
            {/* Direct courses in this category */}
            {category.courses?.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Direct Courses</h4>
                <div className="grid gap-2">
                  {category.courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">{course.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {course.modules?.length || 0} modules
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditCourse(course)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Upload Files"
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                          <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.mp3,.wav,.m4a,.jpg,.jpeg,.png,.gif,.webp,.svg"
                            onChange={(e) => handleCourseFileUpload(course.id, e)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-categories */}
            {category.subCategories?.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Sub-Categories</h4>
                <div className="space-y-2">
                  {category.subCategories.map((subCategory) => (
                    <SubCategoryCard
                      key={subCategory.id}
                      subCategory={subCategory}
                      openSubCategories={openSubCategories}
                      toggleSubCategory={toggleSubCategory}
                      onCreateCourse={onCreateCourse}
                      onEditCourse={onEditCourse}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {(category.courses?.length === 0 && category.subCategories?.length === 0) && (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No courses or sub-categories yet</p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => onCreateSubCategory(category.id)}
                  >
                    Add Sub-Category
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onCreateCourse(category.id)}
                  >
                    Add Course
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// Sub-Category Card Component
interface SubCategoryCardProps {
  subCategory: Category;
  openSubCategories: Set<string>;
  toggleSubCategory: (id: string) => void;
  onCreateCourse: (categoryId: string) => void;
  onEditCourse: (course: Course) => void;
}

const SubCategoryCard = ({
  subCategory,
  openSubCategories,
  toggleSubCategory,
  onCreateCourse,
  onEditCourse
}: SubCategoryCardProps) => {
  const { addCategoryAttachment } = useCategories();
  const { addCourseAttachment } = useCourses();

  const handleSubCategoryFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      await addCategoryAttachment(subCategory.id, file);
    } catch (error) {
      // Error handling is done in the hook
    }
    
    // Reset the input
    event.target.value = '';
  };

  const handleCourseFileUpload = async (courseId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      await addCourseAttachment(courseId, file);
    } catch (error) {
      // Error handling is done in the hook
    }
    
    // Reset the input
    event.target.value = '';
  };
  return (
    <div className="border-l-2 border-muted ml-4 pl-4">
      <Collapsible
        open={openSubCategories.has(subCategory.id)}
        onOpenChange={() => toggleSubCategory(subCategory.id)}
      >
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer hover:bg-muted/50 transition-colors rounded p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {openSubCategories.has(subCategory.id) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <div>
                  <h4 className="font-medium">{subCategory.name}</h4>
                  <p className="text-sm text-muted-foreground">{subCategory.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {subCategory.courses?.length || 0} courses
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateCourse(subCategory.id);
                  }}
                  title="Add Course"
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    title="Upload Files"
                  >
                    <Upload className="w-3 h-3" />
                  </Button>
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp3,.wav,.m4a,.jpg,.jpeg,.png,.gif,.webp,.svg"
                    onChange={handleSubCategoryFileUpload}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 ml-7">
            {subCategory.courses?.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">No courses in this sub-category</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCreateCourse(subCategory.id)}
                >
                  Add First Course
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {subCategory.courses?.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <h5 className="text-sm font-medium">{course.title}</h5>
                      <p className="text-xs text-muted-foreground">{course.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {course.modules?.length || 0} modules
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCourse(course)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Upload Files"
                        >
                          <Upload className="w-3 h-3" />
                        </Button>
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.mp3,.wav,.m4a,.jpg,.jpeg,.png,.gif,.webp,.svg"
                          onChange={(e) => handleCourseFileUpload(course.id, e)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Course Builder Component
const CourseBuilder = ({ course, onBack }: { course: Course; onBack: () => void }) => {
  const { loading: modulesLoading, createModule } = useModules();
  const [modules, setModules] = useState<CourseModule[]>(course.modules || []);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });

  const handleCreateModule = async () => {
    try {
      const newModule = await createModule(course.id, moduleForm.title, moduleForm.description);
      if (newModule) {
        setModules([...modules, { ...newModule, content: [] }]);
        setShowModuleDialog(false);
        setModuleForm({ title: '', description: '' });
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Categories
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{course.title}</h2>
          <p className="text-muted-foreground">{course.description}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Course Modules
            </CardTitle>
            <CardDescription>
              Organize your course content into modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full mb-4" onClick={() => setShowModuleDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
            
            {modules.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No modules added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedModule(module)}
                  >
                    <div>
                      <h4 className="font-medium">{module.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {module.content?.length || 0} content items
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Module {index + 1}</Badge>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Types</CardTitle>
            <CardDescription>
              Types of content you can add to modules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <h4 className="font-medium">Documents</h4>
                  <p className="text-sm text-muted-foreground">PDFs, Word docs, presentations</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Volume2 className="w-8 h-8 text-green-500" />
                <div>
                  <h4 className="font-medium">Audio Files</h4>
                  <p className="text-sm text-muted-foreground">MP3, WAV recordings and lectures</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <HelpCircle className="w-8 h-8 text-purple-500" />
                <div>
                  <h4 className="font-medium">Quizzes</h4>
                  <p className="text-sm text-muted-foreground">Interactive assessments and tests</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Module</DialogTitle>
            <DialogDescription>
              Add a new learning module to organize your course content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Module Title</label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="e.g., Introduction to Safety Protocols"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="What will this module cover?"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateModule}
                disabled={modulesLoading || !moduleForm.title.trim()}
              >
                {modulesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Module"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedModule && (
        <ModuleContentManager 
          module={selectedModule} 
          onBack={() => setSelectedModule(null)} 
        />
      )}
    </div>
  );
};

// Module Content Manager Component
const ModuleContentManager = ({ module, onBack }: { module: CourseModule; onBack: () => void }) => {
  const { addContentToModule, updateContent, deleteContent } = useModules();
  const { uploading, uploadProgress, uploadFile } = useFileUpload();
  const { toast } = useToast();
  const [content, setContent] = useState<ContentItem[]>(module.content || []);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadType, setUploadType] = useState<'document' | 'audio'>('document');
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const uploadedFile = await uploadFile(file);
    
    if (uploadedFile) {
      try {
        const contentData = {
          title: file.name,
          url: uploadedFile.url,
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          fileType: uploadedFile.type
        };

        const newContent = await addContentToModule(module.id, uploadType, contentData);
        if (newContent) {
          setContent([...content, newContent as ContentItem]);
          setShowFileUpload(false);
        }
      } catch (error) {
        // Error handling is done in the hook
      }
    }
    
    // Reset the input
    event.target.value = '';
  };

  const handleEditContent = (item: ContentItem) => {
    if (item.content_type === 'quiz') {
      setEditingContent(item);
      setShowQuizBuilder(true);
    } else {
      // For non-quiz content, you could add an edit dialog here
      toast({
        title: "Info",
        description: "Editing for this content type is not yet implemented",
      });
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteContent(contentId);
        setContent(content.filter(item => item.id !== contentId));
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back to Modules
          </Button>
          <div>
            <CardTitle>{module.title}</CardTitle>
            <CardDescription>{module.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => {
              setUploadType('document');
              setShowFileUpload(true);
            }}
            disabled={uploading}
          >
            <FileText className="w-4 h-4" />
            Add Document
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => {
              setUploadType('audio');
              setShowFileUpload(true);
            }}
            disabled={uploading}
          >
            <Volume2 className="w-4 h-4" />
            Add Audio
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowQuizBuilder(true)}
          >
            <HelpCircle className="w-4 h-4" />
            Create Quiz
          </Button>
        </div>

        {/* File Upload Section */}
        {showFileUpload && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload {uploadType === 'document' ? 'Document' : 'Audio File'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Input
                    type="file"
                    accept={uploadType === 'document' ? '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg' : '.mp3,.wav,.m4a'}
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {uploadType === 'document' 
                      ? 'Supported formats: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, GIF, WEBP, SVG' 
                      : 'Supported formats: MP3, WAV, M4A'
                    }
                  </p>
                </div>
                
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFileUpload(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz Builder */}
        {showQuizBuilder && (
          <QuizBuilder
            moduleId={module.id}
            existingContent={editingContent ? [editingContent] : []}
            onSave={async () => {
              setShowQuizBuilder(false);
              setEditingContent(null);
              // Refresh content by re-fetching from server
              try {
                const { data } = await supabase
                  .from('course_content')
                  .select('*')
                  .eq('module_id', module.id)
                  .order('order_index');
                if (data) {
                  setContent(data as ContentItem[]);
                }
              } catch (error) {
                console.error('Error refreshing content:', error);
              }
            }}
            onCancel={() => {
              setShowQuizBuilder(false);
              setEditingContent(null);
            }}
          />
        )}

        {!showQuizBuilder && content.length === 0 ? (
          <div className="text-center py-8">
            <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No content added to this module yet</p>
          </div>
        ) : !showQuizBuilder ? (
          <div className="space-y-2">
            {content.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {item.content_type === 'document' && <FileText className="w-5 h-5 text-blue-500" />}
                {item.content_type === 'audio' && <Volume2 className="w-5 h-5 text-green-500" />}
                {item.content_type === 'quiz' && <HelpCircle className="w-5 h-5 text-purple-500" />}
                <div className="flex-1">
                  <h4 className="font-medium">{item.content_data?.title || `${item.content_type} content`}</h4>
                  <p className="text-sm text-muted-foreground capitalize">{item.content_type}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEditContent(item)}
                  title="Edit content"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteContent(item.id)}
                  title="Delete content"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default CourseManagement;