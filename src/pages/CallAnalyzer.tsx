import { useState } from 'react';
import { NavLink, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import BackToMenuLink from '@/components/BackToMenuLink';
import DepartmentSelection from '@/components/call-analyzer/DepartmentSelection';
import DepartmentHome from '@/components/call-analyzer/DepartmentHome';
import DepartmentAnalysesList from '@/components/call-analyzer/DepartmentAnalysesList';
import AnalysisCreation from '@/components/call-analyzer/AnalysisCreation';
import Automations from '@/components/call-analyzer/Automations';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Settings, 
  Building
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  analysisCount: number;
}

const CallAnalyzer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const navigationItems = [
    { to: '/call-analyzer/departments', label: 'Departments', icon: Building },
    { to: '/call-analyzer/analysis-queue', label: 'Analysis Queue', icon: Clock },
    { to: '/call-analyzer/automations', label: 'Automations', icon: Settings },
  ];

  const isDepartmentsSelector = location.pathname === '/call-analyzer/departments';

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    navigate(`/call-analyzer/departments/${department.id}`, { state: { department } });
  };

  const handleCreateAnalysis = () => {
    if (selectedDepartment) {
      navigate('/call-analyzer/analysis/create');
    }
  };

  // Restore department from navigation state if available
  const stateDept = (location.state as any)?.department as Department | undefined;
  if (stateDept && (!selectedDepartment || selectedDepartment.id !== stateDept.id)) {
    setSelectedDepartment(stateDept);
  }

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
                  <NavLink key={item.to} to={item.to} end>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </Button>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {!isDepartmentsSelector && (
            <div className="flex justify-end mb-4">
              <Button onClick={handleCreateAnalysis} disabled={!selectedDepartment}>
                + Create Analysis
              </Button>
            </div>
          )}

          <Routes>
            {/* Default: /call-analyzer -> /call-analyzer/departments */}
            <Route index element={<Navigate to="departments" replace />} />

            {/* Core screens */}
            <Route 
              path="departments" 
              element={<DepartmentSelection onDepartmentSelect={handleDepartmentSelect} />} 
            />
            <Route 
              path="departments/:id" 
              element={
                selectedDepartment ? (
                  <DepartmentHome 
                    department={selectedDepartment}
                  />
                ) : (
                  <Navigate to="../departments" replace />
                )
              } 
            />
            <Route
              path="departments/:id/analyses"
              element={<DepartmentAnalysesList />}
            />
            <Route 
              path="analysis/create" 
              element={
                selectedDepartment ? (
                  <AnalysisCreation 
                    department={selectedDepartment}
                    onBack={() => navigate(`../departments/${selectedDepartment.id}`)}
                  />
                ) : (
                  <Navigate to="../departments" replace />
                )
              } 
            />
            <Route 
              path="analysis-queue" 
              element={
                <div className="text-center mt-20">
                  <h2 className="heading-display text-foreground mb-4">
                    Analysis Queue
                  </h2>
                  <p className="text-body text-muted-foreground">
                    Work in progress…
                  </p>
                </div>
              } 
            />
            <Route 
              path="automations" 
              element={<Automations onBack={() => navigate('../departments')} />} 
            />

            {/* Legacy redirects: removed modules */}
            <Route path="dashboard" element={<Navigate to="../departments" replace />} />
            <Route path="results" element={<Navigate to="../departments" replace />} />
            <Route path="question-bank" element={<Navigate to="../departments" replace />} />
            <Route path="notifications" element={<Navigate to="../departments" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="departments" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default CallAnalyzer;