import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  progress_percentage: number;
  status: string;
  started_at?: string;
  completed_at?: string;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  completed: boolean;
  completed_at?: string;
}

export const useCourseProgress = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const getCourseProgress = async (courseId: string): Promise<CourseProgress | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching course progress:', error);
      return null;
    }
  };

  const startCourse = async (courseId: string): Promise<CourseProgress | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      
      // Check if progress already exists
      const existingProgress = await getCourseProgress(courseId);
      if (existingProgress) {
        return existingProgress;
      }

      const { data, error } = await supabase
        .from('user_course_progress')
        .insert({
          user_id: user.id,
          course_id: courseId,
          progress_percentage: 0,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Course Started",
        description: "You've successfully started this course!",
      });

      return data;
    } catch (error) {
      console.error('Error starting course:', error);
      toast({
        title: "Error",
        description: "Failed to start course",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = async (moduleId: string): Promise<ModuleProgress | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_module_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching module progress:', error);
      return null;
    }
  };

  const completeModule = async (moduleId: string, courseId: string): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);

      // Mark module as completed
      await supabase
        .from('user_module_progress')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          completed: true,
          completed_at: new Date().toISOString()
        });

      // Update course progress
      await updateCourseProgress(courseId);

      toast({
        title: "Module Completed",
        description: "Great job! You've completed this module.",
      });
    } catch (error) {
      console.error('Error completing module:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uncompleteModule = async (moduleId: string, courseId: string): Promise<void> => {
    if (!user) return;

    try {
      setLoading(true);

      // Mark module as uncompleted
      await supabase
        .from('user_module_progress')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          completed: false,
          completed_at: null
        });

      // Update course progress
      await updateCourseProgress(courseId);

      toast({
        title: "Module Reset",
        description: "You can now re-answer the questions in this module.",
      });
    } catch (error) {
      console.error('Error uncompleting module:', error);
      toast({
        title: "Error",
        description: "Failed to reset module",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCourseProgress = async (courseId: string): Promise<void> => {
    if (!user) return;

    try {
      // Get all modules for this course
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (modulesError) throw modulesError;

      if (!modules || modules.length === 0) return;

      // Get completed modules count
      const { data: completedModules, error: progressError } = await supabase
        .from('user_module_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .in('module_id', modules.map(m => m.id));

      if (progressError) throw progressError;

      const completedCount = completedModules?.length || 0;
      const totalCount = modules.length;
      const progressPercentage = Math.round((completedCount / totalCount) * 100);
      const isCompleted = progressPercentage === 100;

      // Update course progress
      await supabase
        .from('user_course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          progress_percentage: progressPercentage,
          status: isCompleted ? 'completed' : 'in_progress',
          completed_at: isCompleted ? new Date().toISOString() : null
        });

    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  };

  const getAllCourseProgress = async (): Promise<CourseProgress[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all course progress:', error);
      return [];
    }
  };

  return {
    loading,
    getCourseProgress,
    startCourse,
    getModuleProgress,
    completeModule,
    uncompleteModule,
    updateCourseProgress,
    getAllCourseProgress
  };
};