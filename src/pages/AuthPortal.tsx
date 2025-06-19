
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Shield, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const AuthPortal = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, profile } = useAuth();

  // Redirect authenticated users
  useEffect(() => {
    if (user && profile) {
      const redirectTo = profile.role === 'admin' ? '/admin' : '/employee';
      navigate(redirectTo, { replace: true });
    }
  }, [user, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (!error) {
        // Navigation will happen automatically via useEffect above
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin(e as any);
    }
  };

  const handleTestLogin = async (role: 'admin' | 'employee') => {
    // For testing purposes - in production, remove these test accounts
    const testCredentials = {
      admin: { email: 'admin@test.com', password: 'admin123' },
      employee: { email: 'employee@test.com', password: 'employee123' }
    };

    setEmail(testCredentials[role].email);
    setPassword(testCredentials[role].password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">AI Office Assistant</h1>
          <p className="text-slate-600 mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={!email || !password || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => navigate('/signup')}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={isLoading}
              >
                Create account
              </button>
              <button
                onClick={() => navigate('/forgotpassword')}
                className="text-slate-600 hover:text-slate-700"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            {/* Testing Buttons */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center mb-3">Quick Test Login:</p>
              <div className="space-y-2">
                <Button
                  onClick={() => handleTestLogin('admin')}
                  variant="outline"
                  className="w-full h-10 border-blue-200 text-blue-700 hover:bg-blue-50"
                  disabled={isLoading}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Fill Admin Credentials
                </Button>
                <Button
                  onClick={() => handleTestLogin('employee')}
                  variant="outline"
                  className="w-full h-10 border-green-200 text-green-700 hover:bg-green-50"
                  disabled={isLoading}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Fill Employee Credentials
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPortal;
