import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Calendar, 
  FileAudio, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  analysisCount: number;
}

interface Analysis {
  id: string;
  name: string;
  createdAt: Date;
  status: 'completed' | 'processing' | 'failed' | 'draft';
  fileCount: number;
  questions: number;
  results?: string;
}

interface DepartmentViewProps {
  department: Department;
  onBack: () => void;
  onCreateAnalysis: () => void;
}

const DepartmentView = ({ department, onBack, onCreateAnalysis }: DepartmentViewProps) => {
  const analyses: Analysis[] = [
    {
      id: '1',
      name: 'Weekly Quality Review - Week 45',
      createdAt: new Date('2024-11-15'),
      status: 'completed',
      fileCount: 127,
      questions: 8,
      results: 'Average call quality improved by 12%'
    },
    {
      id: '2',
      name: 'Customer Satisfaction Analysis',
      createdAt: new Date('2024-11-10'),
      status: 'processing',
      fileCount: 89,
      questions: 5
    },
    {
      id: '3',
      name: 'Sales Script Effectiveness',
      createdAt: new Date('2024-11-05'),
      status: 'completed',
      fileCount: 156,
      questions: 12,
      results: 'Script A performs 23% better than Script B'
    },
    {
      id: '4',
      name: 'October Monthly Review',
      createdAt: new Date('2024-10-31'),
      status: 'failed',
      fileCount: 203,
      questions: 10
    },
    {
      id: '5',
      name: 'Training Impact Assessment',
      createdAt: new Date('2024-10-28'),
      status: 'draft',
      fileCount: 45,
      questions: 6
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Play className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'draft':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusActions = (analysis: Analysis) => {
    switch (analysis.status) {
      case 'completed':
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">View Results</Button>
            <Button variant="outline" size="sm">Export</Button>
          </div>
        );
      case 'processing':
        return <Button variant="outline" size="sm">View Progress</Button>;
      case 'failed':
        return <Button variant="outline" size="sm">Retry</Button>;
      case 'draft':
        return <Button variant="outline" size="sm">Continue</Button>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Departments
        </Button>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="heading-display text-foreground">{department.name}</h1>
          <p className="text-muted-foreground">{department.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Created {department.createdAt.toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              {department.analysisCount} total analyses
            </span>
          </div>
        </div>
        <Button onClick={onCreateAnalysis} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Analysis
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search analyses..."
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {analyses.filter(a => a.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">
                  {analyses.filter(a => a.status === 'processing').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">
                  {analyses.filter(a => a.status === 'draft').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">
                  {analyses.filter(a => a.status === 'failed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyses List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{analysis.name}</h3>
                    {getStatusBadge(analysis.status)}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {analysis.createdAt.toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileAudio className="w-3 h-3" />
                      {analysis.fileCount} files
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {analysis.questions} questions
                    </span>
                  </div>
                  {analysis.results && (
                    <p className="text-sm text-green-700 mt-1 font-medium">
                      {analysis.results}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  {getStatusActions(analysis)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentView;