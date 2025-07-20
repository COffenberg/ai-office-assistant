import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users, BookOpen, Lock, Unlock, UserCheck, Settings } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

interface Student {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface CategoryAccess {
  category_id: string;
  granted: boolean;
}

interface StudentAccess {
  student: Student;
  access: Record<string, CategoryAccess>;
}

const StudentAccessManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentAccess, setStudentAccess] = useState<Record<string, CategoryAccess>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { categories } = useCategories();
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentAccess(selectedStudent.id);
    }
  }, [selectedStudent, categories]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAccess = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_category_access')
        .select('category_id')
        .eq('user_id', studentId);

      if (error) throw error;

      // Create access object with all categories
      const accessMap: Record<string, CategoryAccess> = {};
      
      // Initialize all categories as not granted
      const allCategories = [...categories];
      categories.forEach(category => {
        accessMap[category.id] = { category_id: category.id, granted: false };
        // Add sub-categories
        if (category.subCategories) {
          category.subCategories.forEach(subCat => {
            accessMap[subCat.id] = { category_id: subCat.id, granted: false };
          });
        }
      });

      // Mark granted categories
      data?.forEach(access => {
        if (accessMap[access.category_id]) {
          accessMap[access.category_id].granted = true;
        }
      });

      setStudentAccess(accessMap);
    } catch (error) {
      console.error('Error fetching student access:', error);
      toast({
        title: "Error",
        description: "Failed to fetch student access",
        variant: "destructive",
      });
    }
  };

  const handleAccessToggle = async (categoryId: string, granted: boolean) => {
    if (!selectedStudent) return;

    try {
      setSaving(true);
      
      if (granted) {
        // Grant access
        const { error } = await supabase
          .from('student_category_access')
          .insert({
            user_id: selectedStudent.id,
            category_id: categoryId,
            granted_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
      } else {
        // Revoke access
        const { error } = await supabase
          .from('student_category_access')
          .delete()
          .eq('user_id', selectedStudent.id)
          .eq('category_id', categoryId);

        if (error) throw error;
      }

      // Update local state
      setStudentAccess(prev => ({
        ...prev,
        [categoryId]: { category_id: categoryId, granted }
      }));

      toast({
        title: "Success",
        description: `Access ${granted ? 'granted' : 'revoked'} successfully`,
      });

    } catch (error) {
      console.error('Error updating access:', error);
      toast({
        title: "Error",
        description: "Failed to update access",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const renderCategoryAccess = (category: any, level = 0) => {
    const hasAccess = studentAccess[category.id]?.granted || false;
    const indentClass = level > 0 ? 'ml-6' : '';

    return (
      <div key={category.id} className={`space-y-3 ${indentClass}`}>
        <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-md ${level > 0 ? 'bg-muted' : 'bg-primary/10'}`}>
              <BookOpen className={`w-4 h-4 ${level > 0 ? 'text-muted-foreground' : 'text-primary'}`} />
            </div>
            <div>
              <div className="font-medium">{category.name}</div>
              {category.description && (
                <div className="text-sm text-muted-foreground">{category.description}</div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {level > 0 ? 'Sub-category' : 'Category'}
                </Badge>
                {category.courses && category.courses.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {category.courses.length} courses
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hasAccess ? (
              <Badge variant="default" className="text-xs">
                <UserCheck className="w-3 h-3 mr-1" />
                Access Granted
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                No Access
              </Badge>
            )}
            <Switch
              checked={hasAccess}
              onCheckedChange={(checked) => handleAccessToggle(category.id, checked)}
              disabled={saving}
            />
          </div>
        </div>

        {/* Render sub-categories */}
        {category.subCategories && category.subCategories.length > 0 && (
          <div className="space-y-2">
            {category.subCategories.map((subCategory: any) => 
              renderCategoryAccess(subCategory, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Students List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Students ({filteredStudents.length})
            </CardTitle>
            <CardDescription>
              Select a student to manage their access to categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedStudent?.id === student.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getStudentInitials(student.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {student.full_name || 'No name'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {student.email}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No students found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Access Management */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Category Access Management
            </CardTitle>
            <CardDescription>
              {selectedStudent 
                ? `Manage access permissions for ${selectedStudent.full_name || selectedStudent.email}`
                : "Select a student to manage their category access"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedStudent ? (
              <div className="space-y-4">
                {/* Student Info */}
                <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getStudentInitials(selectedStudent.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedStudent.full_name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">{selectedStudent.email}</div>
                  </div>
                  <Badge variant="outline">Employee</Badge>
                </div>

                <Separator />

                {/* Categories Access */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Learning Categories</h3>
                    <Badge variant="secondary" className="text-xs">
                      {Object.values(studentAccess).filter(access => access.granted).length} of {Object.keys(studentAccess).length} granted
                    </Badge>
                  </div>

                  {categories.length > 0 ? (
                    <div className="space-y-4">
                      {categories.map((category) => renderCategoryAccess(category))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No categories available</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">Select a Student</h3>
                <p className="text-sm">Choose a student from the list to manage their access to learning categories</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAccessManagement;