
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateUserData {
  email: string;
  fullName: string;
  role: 'admin' | 'employee';
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'employee';
  status: string | null;
  created_at: string | null;
  type: 'user' | 'invitation';
  invitation_id?: string;
  expires_at?: string;
}

export const useUserManagement = () => {
  const queryClient = useQueryClient();

  // Fetch all users and invitations
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Fetch existing users from profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Fetch pending invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('invitations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('Error fetching invitations:', invitationsError);
        throw invitationsError;
      }

      // Combine users and invitations
      const combinedUsers: User[] = [
        ...profilesData.map(profile => ({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          status: profile.status,
          created_at: profile.created_at,
          type: 'user' as const
        })),
        ...invitationsData.map(invitation => ({
          id: invitation.id,
          email: invitation.email,
          full_name: invitation.full_name,
          role: invitation.role,
          status: 'pending_invitation',
          created_at: invitation.created_at,
          type: 'invitation' as const,
          invitation_id: invitation.id,
          expires_at: invitation.expires_at
        }))
      ];

      return combinedUsers.sort((a, b) => 
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
    },
  });

  // Create user invitation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const { data, error } = await supabase.rpc('create_user_invitation', {
        user_email: userData.email,
        user_full_name: userData.fullName,
        user_role: userData.role,
      });

      if (error) {
        console.error('Error creating user invitation:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast.success('User invitation created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      console.error('Create user error:', error);
      toast.error(error.message || 'Failed to create user invitation');
    },
  });

  // Delete user or invitation
  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId, type }: { userId: string; type: 'user' | 'invitation' }) => {
      if (type === 'invitation') {
        const { error } = await supabase
          .from('invitations')
          .delete()
          .eq('id', userId);

        if (error) {
          console.error('Error deleting invitation:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (error) {
          console.error('Error deleting user:', error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      console.error('Delete user error:', error);
      toast.error(error.message || 'Failed to delete user');
    },
  });

  // Update user status (only for real users, not invitations)
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('User status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      console.error('Update user status error:', error);
      toast.error(error.message || 'Failed to update user status');
    },
  });

  return {
    users: users || [],
    usersLoading,
    createUser: createUserMutation.mutate,
    isCreatingUser: createUserMutation.isPending,
    deleteUser: deleteUserMutation.mutate,
    isDeletingUser: deleteUserMutation.isPending,
    updateUserStatus: updateUserStatusMutation.mutate,
    isUpdatingStatus: updateUserStatusMutation.isPending,
  };
};
