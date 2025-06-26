
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useInvitationEmail } from './useInvitationEmail';

interface CreateUserData {
  email: string;
  fullName: string;
  role: 'admin' | 'employee';
}

export const useUserCreation = () => {
  const queryClient = useQueryClient();
  const { sendInvitationEmail, isSendingEmail, emailSendingError } = useInvitationEmail();

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      console.log('Creating user invitation:', userData);
      
      const { data, error } = await supabase.rpc('create_user_invitation', {
        user_email: userData.email,
        user_full_name: userData.fullName,
        user_role: userData.role,
      });

      if (error) {
        console.error('Error creating user invitation:', error);
        throw error;
      }

      console.log('User invitation created with ID:', data);

      // Fetch the invitation details to get the token
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', data)
        .single();

      if (invitationError) {
        console.error('Error fetching invitation details:', invitationError);
        throw invitationError;
      }

      console.log('Invitation details fetched:', invitation);

      // Send invitation email
      try {
        await new Promise((resolve, reject) => {
          sendInvitationEmail({
            invitationId: invitation.id,
            email: invitation.email,
            fullName: invitation.full_name,
            role: invitation.role,
            token: invitation.token,
          });
          
          // Wait a bit to let the mutation complete
          setTimeout(() => {
            if (emailSendingError) {
              reject(emailSendingError);
            } else {
              resolve(true);
            }
          }, 2000);
        });
        
        console.log('Invitation email sent successfully');
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        toast.error('Invitation created but email failed to send. Use the resend button.');
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

  return {
    createUser: createUserMutation.mutate,
    isCreatingUser: createUserMutation.isPending,
  };
};
