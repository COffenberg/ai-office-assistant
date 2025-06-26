
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Mail, User, Shield } from 'lucide-react';
import { useInvitation } from '@/hooks/useInvitation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const { invitation, isLoading, acceptInvitation, isAcceptingInvitation, isAccepted } = useInvitation(token);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    if (user && invitation) {
      // User is already logged in, just accept the invitation
      acceptInvitation(token!);
    }
  }, [user, invitation, token, acceptInvitation]);

  useEffect(() => {
    if (isAccepted) {
      toast.success('Welcome to the team!');
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    }
  }, [isAccepted, navigate]);

  const handleCreateAccount = async () => {
    if (!invitation || !token) return;

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsCreatingAccount(true);

    try {
      // Sign up the user
      const { error } = await signUp(invitation.email, password, invitation.full_name, invitation.role);
      
      if (error) {
        toast.error(error.message);
        setIsCreatingAccount(false);
        return;
      }

      // Accept the invitation
      acceptInvitation(token);
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading invitation...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
              variant="outline"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAccepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">Welcome to the Team!</CardTitle>
            <CardDescription>
              Your invitation has been accepted successfully. Redirecting you to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <CardTitle>Accept Your Invitation</CardTitle>
          <CardDescription>
            You've been invited to join our team. Complete your account setup below.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Name:</span>
              <span className="font-medium">{invitation.full_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Email:</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Role:</span>
              <Badge variant={invitation.role === 'admin' ? 'destructive' : 'outline'}>
                {invitation.role}
              </Badge>
            </div>
          </div>

          {!user ? (
            // User needs to create an account
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Create Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreateAccount}
                disabled={isCreatingAccount || !password || !confirmPassword}
                className="w-full"
              >
                {isCreatingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account & Accept Invitation'
                )}
              </Button>
            </div>
          ) : (
            // User is logged in, just accept invitation
            <Button 
              onClick={() => acceptInvitation(token!)}
              disabled={isAcceptingInvitation}
              className="w-full"
            >
              {isAcceptingInvitation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Accepting Invitation...
                </>
              ) : (
                'Accept Invitation'
              )}
            </Button>
          )}

          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="text-sm text-gray-600"
            >
              Already have an account? Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
