
import { useUserCreation } from './useUserCreation';
import { useUserDeletion } from './useUserDeletion';
import { useUserStatusUpdate } from './useUserStatusUpdate';
import { useInvitationResend } from './useInvitationResend';
import { useUsersQuery } from './useUsersQuery';

export const useUserManagement = () => {
  const { users, usersLoading } = useUsersQuery();
  const { createUser, isCreatingUser } = useUserCreation();
  const { deleteUser, isDeletingUser } = useUserDeletion();
  const { updateUserStatus, isUpdatingStatus } = useUserStatusUpdate();
  const { resendInvitation, isResendingInvitation } = useInvitationResend();

  return {
    users,
    usersLoading,
    createUser,
    isCreatingUser,
    deleteUser,
    isDeletingUser,
    updateUserStatus,
    isUpdatingStatus,
    resendInvitation,
    isResendingInvitation,
  };
};
