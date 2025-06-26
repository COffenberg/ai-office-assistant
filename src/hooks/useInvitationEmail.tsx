
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendInvitationEmailData {
  invitationId: string;
  email: string;
  fullName: string;
  role: string;
  token: string;
}

export const useInvitationEmail = () => {
  const sendInvitationEmailMutation = useMutation({
    mutationFn: async (data: SendInvitationEmailData) => {
      const { data: result, error } = await supabase.functions.invoke('send-invitation', {
        body: data,
      });

      if (error) {
        console.error('Error sending invitation email:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Invitation email sent successfully!');
    },
    onError: (error: any) => {
      console.error('Send invitation email error:', error);
      toast.error(error.message || 'Failed to send invitation email');
    },
  });

  return {
    sendInvitationEmail: sendInvitationEmailMutation.mutate,
    isSendingEmail: sendInvitationEmailMutation.isPending,
  };
};
