
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserManagement } from "@/hooks/useUserManagement";
import { CreateUserForm } from "./user-management/CreateUserForm";
import { UserTable } from "./user-management/UserTable";
import { EmailDebugInfo } from "./user-management/EmailDebugInfo";

const UserManagement = () => {
  const {
    users,
    usersLoading,
    createUser,
    isCreatingUser,
    deleteUser,
    isDeletingUser,
    updateUserStatus,
    isUpdatingStatus,
    resendInvitation,
    isResendingInvitation
  } = useUserManagement();

  const handleToggleUserStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateUserStatus({ userId, status: newStatus });
  };

  const handleDeleteUser = (userId: string, type: 'user' | 'invitation') => {
    deleteUser({ userId, type });
  };

  return (
    <div className="space-y-6">
      <CreateUserForm 
        onCreateUser={createUser}
        isCreatingUser={isCreatingUser}
      />

      <Card>
        <CardHeader>
          <CardTitle>Users & Invitations ({users.length})</CardTitle>
          <CardDescription>
            Manage all user accounts and pending invitations. Check the status column for email delivery status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8 text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users or invitations found</div>
          ) : (
            <UserTable
              users={users}
              onDeleteUser={handleDeleteUser}
              onToggleUserStatus={handleToggleUserStatus}
              onResendInvitation={resendInvitation}
              isDeletingUser={isDeletingUser}
              isUpdatingStatus={isUpdatingStatus}
              isResendingInvitation={isResendingInvitation}
            />
          )}
        </CardContent>
      </Card>

      <EmailDebugInfo />
    </div>
  );
};

export default UserManagement;
