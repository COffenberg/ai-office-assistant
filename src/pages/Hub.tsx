import BackToMenuLink from '@/components/BackToMenuLink';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import AdminLearningHub from '@/components/AdminLearningHub';
import EmployeeLearningHub from '@/components/EmployeeLearningHub';

const Hub = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BackToMenuLink />
      
      {profile?.role === 'admin' ? <AdminLearningHub /> : <EmployeeLearningHub />}
    </div>
  );
};

export default Hub;