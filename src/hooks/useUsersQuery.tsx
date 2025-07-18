
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export const useUsersQuery = () => {
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      console.log('Fetching users and invitations...');
      
      // Fetch existing users from profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Fetch only pending invitations (exclude accepted ones)
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('invitations')
        .select('*')
        .eq('status', 'pending')
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('Error fetching invitations:', invitationsError);
        throw invitationsError;
      }

      console.log('Fetched profiles:', profilesData?.length || 0);
      console.log('Fetched pending invitations:', invitationsData?.length || 0);

      // Get emails from existing profiles to avoid duplicates
      const existingEmails = new Set(profilesData.map(profile => profile.email));

      // Filter out invitations for emails that already have profiles
      const validInvitations = invitationsData.filter(invitation => {
        if (existingEmails.has(invitation.email)) {
          console.warn(`Invitation for ${invitation.email} skipped - user already exists in profiles`);
          return false;
        }
        return true;
      });

      // Combine users and invitations
      const combinedUsers: User[] = [
        ...profilesData.map(profile => ({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          status: profile.status,
          created_at: profile.created_at,
          type: 'user' as const,
          email_sent: true // Existing users don't need email invitations
        })),
        ...validInvitations.map(invitation => ({
          id: invitation.id,
          email: invitation.email,
          full_name: invitation.full_name,
          role: invitation.role,
          status: 'pending_invitation',
          created_at: invitation.created_at,
          type: 'invitation' as const,
          invitation_id: invitation.id,
          expires_at: invitation.expires_at,
          token: invitation.token,
          email_sent: false // Will be updated when email is sent
        }))
      ];

      return combinedUsers.sort((a, b) => 
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      );
    },
  });

  return {
    users: users || [],
    usersLoading,
  };
};
