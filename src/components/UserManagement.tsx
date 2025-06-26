
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Trash2, Eye, EyeOff, Clock, User, Mail, Send, Copy, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { toast } from "sonner";

const UserManagement = () => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'employee'>('employee');

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

  const handleCreateUser = () => {
    if (!newUserEmail.trim() || !newUserName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    console.log('Creating user with data:', {
      email: newUserEmail.trim(),
      fullName: newUserName.trim(),
      role: newUserRole,
    });

    createUser({
      email: newUserEmail.trim(),
      fullName: newUserName.trim(),
      role: newUserRole,
    });

    // Reset form
    setNewUserEmail('');
    setNewUserName('');
    setNewUserRole('employee');
  };

  const handleDeleteUser = (userId: string, type: 'user' | 'invitation') => {
    const itemType = type === 'invitation' ? 'invitation' : 'user';
    if (window.confirm(`Are you sure you want to delete this ${itemType}? This action cannot be undone.`)) {
      deleteUser({ userId, type });
    }
  };

  const handleToggleUserStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateUserStatus({ userId, status: newStatus });
  };

  const handleResendInvitation = (user: any) => {
    console.log('Resending invitation for user:', user);
    resendInvitation(user);
  };

  const handleCopyInvitationLink = (token: string) => {
    const invitationUrl = `${window.location.origin}/accept-invitation/${token}`;
    navigator.clipboard.writeText(invitationUrl);
    toast.success('Invitation link copied to clipboard');
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isInvitationExpired = (expiresAt?: string) => {
    return expiresAt && new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Create User Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <span>Invite New User</span>
          </CardTitle>
          <CardDescription>
            Send an invitation to create a new user account. They will receive an email with instructions to complete their signup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userEmail">Email Address</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="Enter email address"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="userName">Full Name</Label>
              <Input
                id="userName"
                type="text"
                placeholder="Enter full name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="userRole">Role</Label>
            <Select value={newUserRole} onValueChange={(value: 'admin' | 'employee') => setNewUserRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleCreateUser} 
            disabled={isCreatingUser || !newUserEmail.trim() || !newUserName.trim()}
            className="w-full md:w-auto"
          >
            {isCreatingUser ? 'Creating Invitation...' : 'Create Invitation & Send Email'}
          </Button>
        </CardContent>
      </Card>

      {/* Users List */}
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
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{getTypeBadge(user.type)}</TableCell>
                      <TableCell className="font-medium">
                        {user.full_name || 'No name'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status || 'active', user.expires_at, user.email_sent)}</TableCell>
                      <TableCell>{formatDate(user.created_at || '')}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {user.type === 'invitation' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResendInvitation(user)}
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
                              onClick={() => handleToggleUserStatus(user.id, user.status || 'active')}
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Email Debugging Help</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>If emails are not being received:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check spam/junk folder</li>
              <li>Verify the email address is correct</li>
              <li>Use the "Copy invitation link" button as a backup</li>
              <li>Check the browser console for error messages</li>
            </ul>
            <p className="mt-4"><strong>Email Status Indicators:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Pending Invitation:</strong> Email should be sent</li>
              <li><strong>Email Failed:</strong> Use resend button or copy link</li>
              <li><strong>Expired Invitation:</strong> Create a new invitation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
