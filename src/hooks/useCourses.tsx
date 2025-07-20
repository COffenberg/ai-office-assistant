import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { Course, CourseModule, ContentItem } from './useCategories';

export const useCourses = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createCourse = async (title: string, description: string, categoryId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title,
          description,
          category_id: categoryId,
          created_by: user.id,
          is_published: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseWithModules = async (courseId: string) => {
    try {
      setLoading(true);
      
      // Fetch course details
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch modules for this course
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch content for each module
      const modulesWithContent = await Promise.all(
        modules.map(async (module) => {
          const { data: content, error: contentError } = await supabase
            .from('course_content')
            .select('*')
            .eq('module_id', module.id)
            .order('order_index', { ascending: true });

          if (contentError) throw contentError;

          return {
            ...module,
            content: content || []
          };
        })
      );

      return {
        ...course,
        modules: modulesWithContent
      };
    } catch (error) {
      console.error('Error fetching course with modules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch course details",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createCourse,
    updateCourse,
    deleteCourse,
    fetchCourseWithModules
  };
};