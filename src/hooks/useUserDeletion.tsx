
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUserDeletion = () => {
  const queryClient = useQueryClient();

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

  return {
    deleteUser: deleteUserMutation.mutate,
    isDeletingUser: deleteUserMutation.isPending,
  };
};
