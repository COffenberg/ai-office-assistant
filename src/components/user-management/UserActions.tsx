
import { Button } from "@/components/ui/button";
import { Trash2, Eye, EyeOff, Send, Copy } from "lucide-react";
import { toast } from "sonner";

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

interface UserActionsProps {
  user: User;
  onDeleteUser: (userId: string, type: 'user' | 'invitation') => void;
  onToggleUserStatus: (userId: string, currentStatus: string) => void;
  onResendInvitation: (user: User) => void;
  isDeletingUser: boolean;
  isUpdatingStatus: boolean;
  isResendingInvitation: boolean;
}

export const UserActions = ({
  user,
  onDeleteUser,
  onToggleUserStatus,
  onResendInvitation,
  isDeletingUser,
  isUpdatingStatus,
  isResendingInvitation
}: UserActionsProps) => {
  const isInvitationExpired = (expiresAt?: string) => {
    return expiresAt && new Date(expiresAt) < new Date();
  };

  const handleCopyInvitationLink = (token: string) => {
    const invitationUrl = `${window.location.origin}/accept-invitation/${token}`;
    navigator.clipboard.writeText(invitationUrl);
    toast.success('Invitation link copied to clipboard');
  };

  const handleDeleteUser = (userId: string, type: 'user' | 'invitation') => {
    const itemType = type === 'invitation' ? 'invitation' : 'user';
    if (window.confirm(`Are you sure you want to delete this ${itemType}? This action cannot be undone.`)) {
      onDeleteUser(userId, type);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {user.type === 'invitation' && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResendInvitation(user)}
            disabled={isResendingInvitation || isInvitationExpired(user.expires_at)}
            title="Resend invitation email"
          >
            <Send className="w-4 h-4" />
          </Button>
          {user.token && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyInvitationLink(user.token!)}
              title="Copy invitation link"
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}
        </>
      )}
      {user.type === 'user' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleUserStatus(user.id, user.status || 'active')}
          disabled={isUpdatingStatus}
          title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
        >
          {user.status === 'active' ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDeleteUser(user.id, user.type)}
        disabled={isDeletingUser}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        title={`Delete ${user.type}`}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};
