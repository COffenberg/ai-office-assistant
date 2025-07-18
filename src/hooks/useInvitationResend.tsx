
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useInvitationEmail } from './useInvitationEmail';

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
  token?: string;
  email_sent?: boolean;
}

export const useInvitationResend = () => {
  const { sendInvitationEmail, isSendingEmail, emailSendingError } = useInvitationEmail();

  const resendInvitationMutation = useMutation({
    mutationFn: async (user: User) => {
      console.log('Resending invitation email for:', user.email);
      
      if (user.type !== 'invitation' || !user.token) {
        throw new Error('Invalid invitation data');
      }

      return new Promise((resolve, reject) => {
        sendInvitationEmail({
          invitationId: user.id,
          email: user.email,
          fullName: user.full_name || '',
          role: user.role,
          token: user.token,
        });
        
        // Wait for the email mutation to complete
        setTimeout(() => {
          if (emailSendingError) {
            reject(emailSendingError);
          } else {
            resolve(true);
          }
        }, 2000);
      });
    },
    onSuccess: () => {
      toast.success('Invitation email resent successfully');
    },
    onError: (error: any) => {
      console.error('Resend invitation error:', error);
      toast.error(error.message || 'Failed to resend invitation');
    },
  });

  return {
    resendInvitation: resendInvitationMutation.mutate,
    isResendingInvitation: resendInvitationMutation.isPending || isSendingEmail,
  };
};
