
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
      console.log('Sending invitation email:', data);
      
      const { data: result, error } = await supabase.functions.invoke('send-invitation', {
        body: data,
      });

      if (error) {
        console.error('Error sending invitation email:', error);
        throw new Error(`Failed to send invitation email: ${error.message}`);
      }

      console.log('Invitation email sent successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Email sending mutation successful:', data);
      toast.success('Invitation email sent successfully!');
    },
    onError: (error: any) => {
      console.error('Send invitation email error:', error);
      toast.error(`Failed to send invitation email: ${error.message}`);
    },
  });

  return {
    sendInvitationEmail: sendInvitationEmailMutation.mutate,
    isSendingEmail: sendInvitationEmailMutation.isPending,
    emailSendingError: sendInvitationEmailMutation.error,
    emailSendingSuccess: sendInvitationEmailMutation.isSuccess,
  };
};
