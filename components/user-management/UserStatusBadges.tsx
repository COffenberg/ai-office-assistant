
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, User, Mail, XCircle } from "lucide-react";

interface UserStatusBadgesProps {
  status: string;
  expiresAt?: string;
  emailSent?: boolean;
  role: string;
  type: 'user' | 'invitation';
}

export const UserStatusBadges = ({ status, expiresAt, emailSent, role, type }: UserStatusBadgesProps) => {
  const getStatusBadge = (status: string, expiresAt?: string, emailSent?: boolean) => {
    if (status === 'pending_invitation') {
      const isExpired = expiresAt && new Date(expiresAt) < new Date();
      
      if (isExpired) {
        return (
          <Badge variant="destructive" className="border-red-300 text-red-700 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>Expired Invitation</span>
          </Badge>
        );
      }
      
      return (
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-yellow-300 text-yellow-700 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Pending Invitation</span>
          </Badge>
          {emailSent === false && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <XCircle className="w-3 h-3" />
              <span>Email Failed</span>
            </Badge>
          )}
        </div>
      );
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? 
      <Badge variant="destructive">Admin</Badge> : 
      <Badge variant="outline">Employee</Badge>;
  };

  const getTypeBadge = (type: 'user' | 'invitation') => {
    return type === 'user' ? 
      <Badge variant="default" className="flex items-center space-x-1">
        <User className="w-3 h-3" />
        <span>User</span>
      </Badge> : 
      <Badge variant="outline" className="flex items-center space-x-1">
        <Mail className="w-3 h-3" />
        <span>Invitation</span>
      </Badge>;
  };

  return {
    statusBadge: getStatusBadge(status, expiresAt, emailSent),
    roleBadge: getRoleBadge(role),
    typeBadge: getTypeBadge(type)
  };
};
