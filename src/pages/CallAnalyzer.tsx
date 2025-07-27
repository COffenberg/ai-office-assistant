import { useState } from 'react';
import BackToMenuLink from '@/components/BackToMenuLink';
import DepartmentSelection from '@/components/call-analyzer/DepartmentSelection';
import DepartmentView from '@/components/call-analyzer/DepartmentView';
import AnalysisCreation from '@/components/call-analyzer/AnalysisCreation';
import Dashboard from '@/components/call-analyzer/Dashboard';
import QuestionBank from '@/components/call-analyzer/QuestionBank';
import Automations from '@/components/call-analyzer/Automations';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Upload, 
  Clock, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  Building,
  Bell
} from 'lucide-react';

type View = 
  | 'dashboard'
  | 'departments' 
  | 'department-view'
  | 'upload'
  | 'analysis-queue'
  | 'results'
  | 'automations'
  | 'question-bank'
  | 'notifications'
  | 'settings'
  | 'analysis-creation';

interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  analysisCount: number;
}

const CallAnalyzer = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'departments', label: 'Departments', icon: Building },
    { id: 'upload', label: 'Upload Calls', icon: Upload },
    { id: 'analysis-queue', label: 'Analysis Queue', icon: Clock },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'automations', label: 'Automations', icon: Settings },
    { id: 'question-bank', label: 'Question Bank', icon: HelpCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    setCurrentView('department-view');
  };

  const handleCreateAnalysis = () => {
    setCurrentView('analysis-creation');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} />;
      case 'departments':
        return <DepartmentSelection onDepartmentSelect={handleDepartmentSelect} />;
      case 'department-view':
        return (
          <DepartmentView 
            department={selectedDepartment!}
            onBack={() => setCurrentView('departments')}
            onCreateAnalysis={handleCreateAnalysis}
          />
        );
      case 'analysis-creation':
        return (
          <AnalysisCreation 
            department={selectedDepartment!}
            onBack={() => setCurrentView('department-view')}
          />
        );
      case 'question-bank':
        return <QuestionBank onBack={() => setCurrentView('dashboard')} />;
      case 'automations':
        return <Automations onBack={() => setCurrentView('dashboard')} />;
      default:
        return (
          <div className="text-center mt-20">
            <h2 className="heading-display text-foreground mb-4">
              {navigationItems.find(item => item.id === currentView)?.label}
            </h2>
            <p className="text-body text-muted-foreground">
              Work in progress…
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-card border-r border-border p-6 min-h-screen">
          <BackToMenuLink />
          
          <div className="mt-16">
            <h1 className="heading-display text-foreground mb-8">
              Call Analyzer
            </h1>
            
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentView === item.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setCurrentView(item.id as View)}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CallAnalyzer;