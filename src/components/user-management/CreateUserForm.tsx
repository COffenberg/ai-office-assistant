
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface CreateUserFormProps {
  onCreateUser: (data: { email: string; fullName: string; role: 'admin' | 'employee' }) => void;
  isCreatingUser: boolean;
}

export const CreateUserForm = ({ onCreateUser, isCreatingUser }: CreateUserFormProps) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'employee'>('employee');

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

    onCreateUser({
      email: newUserEmail.trim(),
      fullName: newUserName.trim(),
      role: newUserRole,
    });

    // Reset form
    setNewUserEmail('');
    setNewUserName('');
    setNewUserRole('employee');
  };

  return (
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
  );
};
