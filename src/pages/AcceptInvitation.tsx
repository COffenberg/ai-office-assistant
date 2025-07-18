
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Mail, User, Shield, AlertCircle } from 'lucide-react';
import { useInvitation } from '@/hooks/useInvitation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, signUp, signOut } = useAuth();
  const { invitation, isLoading, acceptInvitation, isAcceptingInvitation, isAccepted } = useInvitation(token);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    // If user is already logged in, show warning and option to sign out
    if (user && invitation) {
      toast.warning('You are already logged in. Please sign out to accept this invitation with a new account.');
    }
  }, [user, invitation]);

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
      // Sign up the user with the invitation email
      const { error } = await signUp(invitation.email, password, invitation.full_name, invitation.role);
      
      if (error) {
        console.error('Sign up error:', error);
        toast.error(error.message || 'Failed to create account');
        setIsCreatingAccount(false);
        return;
      }

      // Note: The user will need to verify their email first
      toast.success('Account created! Please check your email to verify your account, then return to accept the invitation.');
      
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleAcceptInvitation = () => {
    if (!token || !user) return;
    
    // Check if the logged-in user's email matches the invitation email
    if (user.email !== invitation?.email) {
      toast.error(`This invitation is for ${invitation?.email}, but you are logged in as ${user.email}. Please sign out and create a new account with the correct email.`);
      return;
    }

    acceptInvitation(token);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully. You can now create a new account to accept the invitation.');
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
            You've been invited to join our team. Follow the steps below to accept.
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

          {user ? (
            // User is logged in - show warning and options
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Already logged in</p>
                    <p className="text-yellow-700 mt-1">
                      You are currently logged in as <strong>{user.email}</strong>. 
                      {user.email === invitation.email ? 
                        ' You can accept this invitation directly.' : 
                        ' To accept this invitation, you need to sign out and create a new account.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {user.email === invitation.email ? (
                <Button 
                  onClick={handleAcceptInvitation}
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
              ) : (
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full"
                >
                  Sign Out to Accept Invitation
                </Button>
              )}
            </div>
          ) : (
            // User needs to create an account
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Create New Account</p>
                    <p className="text-blue-700 mt-1">
                      You need to create a new account with the email <strong>{invitation.email}</strong> to accept this invitation.
                    </p>
                  </div>
                </div>
              </div>

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
                  'Create Account'
                )}
              </Button>
              <p className="text-xs text-gray-600 text-center">
                After creating your account, you'll need to verify your email before you can accept the invitation.
              </p>
            </div>
          )}

          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="text-sm text-gray-600"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
