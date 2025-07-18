
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

      // Check if the edge function returned an error
      if (result && !result.success) {
        console.error('Edge function returned error:', result);
        throw new Error(result.error || 'Failed to send invitation email');
      }

      console.log('Invitation email sent successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Email sending mutation successful:', data);
      
      // Show different messages based on the email address
      if (data.debugInfo?.resendTestMode?.includes("test mode")) {
        toast.success('Invitation created! Note: In test mode, emails can only be sent to casper.offenberg.jensen@gmail.com. Use the copy link button to share with others.');
      } else {
        toast.success('Invitation email sent successfully!');
      }
    },
    onError: (error: any) => {
      console.error('Send invitation email error:', error);
      
      // Show more specific error messages
      if (error.message.includes('casper.offenberg.jensen@gmail.com')) {
        toast.error('Email can only be sent to casper.offenberg.jensen@gmail.com in test mode. Use the copy link button to share the invitation.');
      } else {
        toast.error(`Failed to send invitation email: ${error.message}`);
      }
    },
  });

  return {
    sendInvitationEmail: sendInvitationEmailMutation.mutate,
    isSendingEmail: sendInvitationEmailMutation.isPending,
    emailSendingError: sendInvitationEmailMutation.error,
    emailSendingSuccess: sendInvitationEmailMutation.isSuccess,
  };
};
