import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Clock, 
  BarChart3, 
  Building,
  AlertTriangle,
  CheckCircle,
  PlayCircle
} from 'lucide-react';

type View = 
  | 'dashboard'
  | 'departments' 
  | 'upload'
  | 'analysis-queue'
  | 'results'
  | 'automations'
  | 'question-bank'
  | 'notifications'
  | 'settings';

interface DashboardProps {
  onNavigate: (view: View) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const recentUploads = [
    { id: '1', name: 'Sales Team - Week 45', files: 127, status: 'completed', department: 'Sales' },
    { id: '2', name: 'Customer Care - Daily', files: 45, status: 'processing', department: 'Customer Care' },
    { id: '3', name: 'Retention - Q4 Review', files: 89, status: 'failed', department: 'Retention' },
  ];

  const kpis = [
    { title: 'Total Analyses', value: '1,247', icon: BarChart3, change: '+12%' },
    { title: 'Files Processed', value: '45,892', icon: Upload, change: '+8%' },
    { title: 'Active Departments', value: '8', icon: Building, change: '+2' },
    { title: 'Processing Queue', value: '23', icon: Clock, change: '-5' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><PlayCircle className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="heading-display text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your call analysis activity</p>
        </div>
        <Button onClick={() => onNavigate('departments')} className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Create Analysis
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{kpi.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUploads.map((upload) => (
                <div key={upload.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{upload.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {upload.files} files • {upload.department}
                    </p>
                  </div>
                  {getStatusBadge(upload.status)}
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => onNavigate('analysis-queue')}
            >
              View All
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onNavigate('departments')}
              >
                <Building className="w-4 h-4 mr-2" />
                Manage Departments
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onNavigate('question-bank')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Question Bank
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onNavigate('automations')}
              >
                <Clock className="w-4 h-4 mr-2" />
                View Automations
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => onNavigate('results')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm">3 files failed transcription in Customer Care department</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Automation "Weekly Sales Review" will run in 2 hours</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;