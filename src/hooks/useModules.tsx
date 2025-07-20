import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { CourseModule, ContentItem } from './useCategories';

export const useModules = () => {
  const [loading, setLoading] = useState(false);

  const createModule = async (courseId: string, title: string, description: string, moduleType: string = 'content') => {
    try {
      setLoading(true);
      
      // Get the next order index
      const { data: existingModules } = await supabase
        .from('course_modules')
        .select('order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingModules && existingModules.length > 0 
        ? existingModules[0].order_index + 1 
        : 0;

      const { data, error } = await supabase
        .from('course_modules')
        .insert({
          course_id: courseId,
          title,
          description,
          module_type: moduleType,
          order_index: nextOrderIndex
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating module:', error);
      toast({
        title: "Error",
        description: "Failed to create module",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateModule = async (id: string, updates: Partial<CourseModule>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating module:', error);
      toast({
        title: "Error",
        description: "Failed to update module",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteModule = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Module deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addContentToModule = async (
    moduleId: string, 
    contentType: 'document' | 'audio' | 'quiz' | 'text',
    contentData: any,
    title?: string
  ) => {
    try {
      setLoading(true);
      
      // Get the next order index
      const { data: existingContent } = await supabase
        .from('course_content')
        .select('order_index')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingContent && existingContent.length > 0 
        ? existingContent[0].order_index + 1 
        : 0;

      const { data, error } = await supabase
        .from('course_content')
        .insert({
          module_id: moduleId,
          content_type: contentType,
          content_data: {
            ...contentData,
            title: title || contentData.title || `${contentType} content`
          },
          order_index: nextOrderIndex
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content added to module successfully",
      });

      return data;
    } catch (error) {
      console.error('Error adding content to module:', error);
      toast({
        title: "Error",
        description: "Failed to add content to module",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (id: string, updates: Partial<ContentItem>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('course_content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteContent = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('course_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createModule,
    updateModule,
    deleteModule,
    addContentToModule,
    updateContent,
    deleteContent
  };
};