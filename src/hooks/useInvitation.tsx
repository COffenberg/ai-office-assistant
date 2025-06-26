
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface InvitationData {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  expires_at: string;
  invited_by: string;
}

export const useInvitation = (token?: string) => {
  const { user } = useAuth();

  // Fetch invitation details by token
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase.rpc('get_invitation_by_token', {
        invitation_token: token
      });

      if (error) {
        console.error('Error fetching invitation:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0] as InvitationData : null;
    },
    enabled: !!token,
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationToken: string) => {
      if (!user) {
        throw new Error('User must be authenticated to accept invitation');
      }

      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_token: invitationToken,
        user_id: user.id
      });

      if (error) {
        console.error('Error accepting invitation:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Invitation accepted successfully! Welcome to the team.');
    },
    onError: (error: any) => {
      console.error('Accept invitation error:', error);
      toast.error(error.message || 'Failed to accept invitation');
    },
  });

  return {
    invitation,
    isLoading,
    error,
    acceptInvitation: acceptInvitationMutation.mutate,
    isAcceptingInvitation: acceptInvitationMutation.isPending,
    isAccepted: acceptInvitationMutation.isSuccess,
  };
};
