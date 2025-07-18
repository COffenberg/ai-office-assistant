
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserStatusBadges } from "./UserStatusBadges";
import { UserActions } from "./UserActions";

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

interface UserTableProps {
  users: User[];
  onDeleteUser: (userId: string, type: 'user' | 'invitation') => void;
  onToggleUserStatus: (userId: string, currentStatus: string) => void;
  onResendInvitation: (user: User) => void;
  isDeletingUser: boolean;
  isUpdatingStatus: boolean;
  isResendingInvitation: boolean;
}

export const UserTable = ({
  users,
  onDeleteUser,
  onToggleUserStatus,
  onResendInvitation,
  isDeletingUser,
  isUpdatingStatus,
  isResendingInvitation
}: UserTableProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>  
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const badges = UserStatusBadges({ 
              status: user.status || 'active', 
              expiresAt: user.expires_at, 
              emailSent: user.email_sent,
              role: user.role,
              type: user.type
            });
            
            return (
              <TableRow key={user.id}>
                <TableCell>{badges.typeBadge}</TableCell>
                <TableCell className="font-medium">
                  {user.full_name || 'No name'}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{badges.roleBadge}</TableCell>
                <TableCell>{badges.statusBadge}</TableCell>
                <TableCell>{formatDate(user.created_at || '')}</TableCell>
                <TableCell>
                  <UserActions
                    user={user}
                    onDeleteUser={onDeleteUser}
                    onToggleUserStatus={onToggleUserStatus}
                    onResendInvitation={onResendInvitation}
                    isDeletingUser={isDeletingUser}
                    isUpdatingStatus={isUpdatingStatus}
                    isResendingInvitation={isResendingInvitation}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
