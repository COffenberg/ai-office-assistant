import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  name: string;
  description: string;
  parent_category_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  order_index: number;
  courses?: Course[];
  subCategories?: Category[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  module_type: string;
  created_at: string;
  updated_at: string;
  content?: ContentItem[];
}

export interface ContentItem {
  id: string;
  module_id: string;
  content_type: 'document' | 'audio' | 'quiz' | 'text';
  content_data: any;
  order_index: number;
  created_at: string;
  updated_at: string;
  title?: string; // Optional title derived from content_data
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCategories = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get user profile to check role
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const userRole = profileData?.role;

      // Fetch all categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (categoriesError) throw categoriesError;

      // For non-admin users, get their access permissions
      let allowedCategoryIds: string[] = [];
      if (userRole !== 'admin') {
        const { data: accessData, error: accessError } = await supabase
          .from('student_category_access')
          .select('category_id')
          .eq('user_id', user.id);

        if (accessError) throw accessError;
        allowedCategoryIds = accessData?.map(access => access.category_id) || [];
      }

      // Fetch courses based on user role and permissions
      let coursesQuery = supabase
        .from('courses')
        .select(`
          *,
          course_modules(
            id,
            course_id,
            title,
            description,
            order_index,
            module_type,
            created_at,
            updated_at,
            course_content(
              id,
              module_id,
              content_type,
              content_data,
              order_index,
              created_at,
              updated_at
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Show all courses that the user has access to via category permissions
      // For admin users: show all courses
      // For non-admin users: show all courses in their accessible categories
      if (userRole !== 'admin') {
        // Filter courses to only those in categories the user has access to
        if (allowedCategoryIds.length > 0) {
          coursesQuery = coursesQuery.in('category_id', allowedCategoryIds);
        } else {
          // If user has no category access, show no courses
          coursesQuery = coursesQuery.eq('category_id', 'no-access');
        }
      }

      const { data: coursesData, error: coursesError } = await coursesQuery;

      if (coursesError) throw coursesError;

      // Organize data hierarchically
      const parentCategories = categoriesData?.filter(cat => !cat.parent_category_id) || [];
      const subCategories = categoriesData?.filter(cat => cat.parent_category_id) || [];

      const organizedCategories = parentCategories.map(category => {
        const categorySubCategories = subCategories.filter(sub => sub.parent_category_id === category.id);
        const categoryCourses = coursesData?.filter(course => 
          course.category_id === category.id && 
          (userRole === 'admin' || course.is_published)
        ).map(course => {
          const { course_modules, ...courseWithoutModules } = course;
          return {
            ...courseWithoutModules,
            modules: (course_modules || []).map(module => {
              const { course_content, ...moduleWithoutContent } = module;
              return {
                ...moduleWithoutContent,
                content: (course_content || []).map(content => ({
                  ...content,
                  content_type: content.content_type as 'document' | 'audio' | 'quiz' | 'text'
                }))
              };
            })
          };
        }) || [];
        
        const subCategoriesWithCourses = categorySubCategories.map(subCat => ({
          ...subCat,
          courses: coursesData?.filter(course => 
            course.category_id === subCat.id && 
            (userRole === 'admin' || course.is_published)
          ).map(course => {
            const { course_modules, ...courseWithoutModules } = course;
            return {
              ...courseWithoutModules,
              modules: (course_modules || []).map(module => {
                const { course_content, ...moduleWithoutContent } = module;
                return {
                  ...moduleWithoutContent,
                  content: (course_content || []).map(content => ({
                    ...content,
                    content_type: content.content_type as 'document' | 'audio' | 'quiz' | 'text'
                  }))
                };
              })
            };
          }) || [],
          subCategories: []
        }));

        return {
          ...category,
          courses: categoryCourses,
          subCategories: subCategoriesWithCourses
        };
      });

      // Filter categories based on user role and permissions
      let filteredCategories = organizedCategories;

      if (userRole !== 'admin') {
        // For non-admin users, filter based on access permissions
        filteredCategories = organizedCategories.filter(category => {
          // Check if user has access to this category
          const hasDirectAccess = allowedCategoryIds.includes(category.id);
          
          // Check if user has access to any sub-categories
          const accessibleSubCategories = category.subCategories?.filter(subCat => 
            allowedCategoryIds.includes(subCat.id)
          ) || [];

          // Only include categories/sub-categories the user has access to
          if (hasDirectAccess || accessibleSubCategories.length > 0) {
            return {
              ...category,
              // Only show courses if user has direct access to this category
              courses: hasDirectAccess ? category.courses : [],
              // Only show accessible sub-categories
              subCategories: accessibleSubCategories
            };
          }

          return false;
        }).map(category => {
          // Filter sub-categories to only show accessible ones
          const accessibleSubCategories = category.subCategories?.filter(subCat => 
            allowedCategoryIds.includes(subCat.id)
          ) || [];

          return {
            ...category,
            courses: allowedCategoryIds.includes(category.id) ? category.courses : [],
            subCategories: accessibleSubCategories
          };
        });
      }

      setCategories(filteredCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name: string, description: string, parentCategoryId?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name,
          description,
          parent_category_id: parentCategoryId || null,
          created_by: user.id,
          order_index: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `${parentCategoryId ? 'Sub-category' : 'Category'} created successfully`,
      });

      fetchCategories(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: `Failed to create ${parentCategoryId ? 'sub-category' : 'category'}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category updated successfully",
      });

      fetchCategories();
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const addCategoryAttachment = async (categoryId: string, file: File) => {
    try {
      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = `categories/${categoryId}/${fileName}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const uploadedFile = {
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size
      };
      
      if (!uploadedFile) throw new Error('File upload failed');

      const { error } = await supabase
        .from('category_attachments')
        .insert({
          category_id: categoryId,
          file_name: uploadedFile.name,
          file_path: uploadedFile.url,
          file_type: uploadedFile.type,
          file_size: uploadedFile.size,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "File attached to category successfully",
      });

      fetchCategories();
    } catch (error) {
      console.error('Error adding category attachment:', error);
      toast({
        title: "Error",
        description: "Failed to attach file to category",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getCategoryAttachments = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('category_attachments')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching category attachments:', error);
      return [];
    }
  };

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryAttachment,
    getCategoryAttachments,
    refetch: fetchCategories
  };
};