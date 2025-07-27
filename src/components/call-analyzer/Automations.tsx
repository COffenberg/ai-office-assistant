import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Search, 
  Play, 
  Pause, 
  Settings, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AutomationsProps {
  onBack: () => void;
}

interface Automation {
  id: string;
  name: string;
  department: string;
  lastRun: Date | null;
  nextRun: Date;
  status: 'active' | 'paused' | 'error';
  errors: number;
  frequency: string;
  questions: number;
}

interface AutomationRun {
  id: string;
  date: Date;
  status: 'success' | 'failed' | 'partial';
  filesProcessed: number;
  duration: string;
  errors?: string[];
}

const Automations = ({ onBack }: AutomationsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const automations: Automation[] = [
    {
      id: '1',
      name: 'Weekly Sales Quality Review',
      department: 'Sales Development',
      lastRun: new Date('2024-11-18'),
      nextRun: new Date('2024-11-25'),
      status: 'active',
      errors: 0,
      frequency: 'Weekly (Mondays)',
      questions: 5
    },
    {
      id: '2',
      name: 'Daily Customer Care Analysis',
      department: 'Customer Care',
      lastRun: new Date('2024-11-19'),
      nextRun: new Date('2024-11-20'),
      status: 'active',
      errors: 0,
      frequency: 'Daily',
      questions: 3
    },
    {
      id: '3',
      name: 'Monthly Retention Review',
      department: 'Retention',
      lastRun: new Date('2024-10-31'),
      nextRun: new Date('2024-11-30'),
      status: 'error',
      errors: 3,
      frequency: 'Monthly',
      questions: 8
    },
    {
      id: '4',
      name: 'Training Impact Assessment',
      department: 'All',
      lastRun: null,
      nextRun: new Date('2024-11-22'),
      status: 'paused',
      errors: 0,
      frequency: 'Bi-weekly',
      questions: 4
    }
  ];

  const automationRuns: AutomationRun[] = [
    {
      id: '1',
      date: new Date('2024-11-18'),
      status: 'success',
      filesProcessed: 127,
      duration: '12m 34s'
    },
    {
      id: '2',
      date: new Date('2024-11-11'),
      status: 'success',
      filesProcessed: 98,
      duration: '8m 45s'
    },
    {
      id: '3',
      date: new Date('2024-11-04'),
      status: 'partial',
      filesProcessed: 89,
      duration: '15m 12s',
      errors: ['3 files failed transcription']
    },
    {
      id: '4',
      date: new Date('2024-10-28'),
      status: 'failed',
      filesProcessed: 0,
      duration: '2m 15s',
      errors: ['Data source connection failed', 'Authentication error']
    }
  ];

  const filteredAutomations = automations.filter(automation =>
    automation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    automation.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'paused':
        return <Badge variant="outline"><Pause className="w-3 h-3 mr-1" />Paused</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRunStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Success</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewHistory = (automation: Automation) => {
    setSelectedAutomation(automation);
    setIsHistoryDialogOpen(true);
  };

  const formatTimeUntilRun = (nextRun: Date) => {
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="heading-display text-foreground">Automations</h1>
          <p className="text-muted-foreground">Manage your scheduled analysis automations</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search automations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {automations.filter(a => a.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Pause className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold">
                  {automations.filter(a => a.status === 'paused').length}
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
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold">
                  {automations.filter(a => a.status === 'error').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Next Run</p>
                <p className="text-2xl font-bold">
                  {formatTimeUntilRun(
                    automations
                      .filter(a => a.status === 'active')
                      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime())[0]?.nextRun || new Date()
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Automation Name</th>
                  <th className="text-left py-2 font-medium">Department</th>
                  <th className="text-left py-2 font-medium">Last Run</th>
                  <th className="text-left py-2 font-medium">Next Run</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Errors</th>
                  <th className="text-left py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAutomations.map((automation) => (
                  <tr key={automation.id} className="border-b hover:bg-muted/50">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{automation.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {automation.frequency} • {automation.questions} questions
                        </p>
                      </div>
                    </td>
                    <td className="py-3">{automation.department}</td>
                    <td className="py-3">
                      {automation.lastRun ? automation.lastRun.toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3">
                      <div>
                        <p>{automation.nextRun.toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          in {formatTimeUntilRun(automation.nextRun)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3">{getStatusBadge(automation.status)}</td>
                    <td className="py-3">
                      {automation.errors > 0 ? (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-red-600 p-0 h-auto"
                          onClick={() => handleViewHistory(automation)}
                        >
                          {automation.errors} errors
                        </Button>
                      ) : (
                        <span className="text-green-600">No errors</span>
                      )}
                    </td>
                    <td className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewHistory(automation)}>
                            <Calendar className="w-4 h-4 mr-2" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Edit Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {automation.status === 'active' ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Resume
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAutomation?.name} - Run History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Past 30 runs for this automation
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {automationRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{run.date.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {run.filesProcessed} files • {run.duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getRunStatusBadge(run.status)}
                    {run.errors && run.errors.length > 0 && (
                      <div className="text-sm text-red-600">
                        {run.errors.map((error, index) => (
                          <p key={index}>{error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Automations;