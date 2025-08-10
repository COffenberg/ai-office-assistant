import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building,
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  analysisCount: number;
}

interface DepartmentSelectionProps {
  onDepartmentSelect: (department: Department) => void;
  onRunAnalysis?: (department: Department) => void;
}

const DepartmentSelection = ({ onDepartmentSelect }: DepartmentSelectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [lastActivityFilter, setLastActivityFilter] = useState<'all' | '7' | '30' | '90'>('all');
  const [sortBy, setSortBy] = useState<'activity' | 'name' | 'analyses'>('activity');

  const departments: Department[] = [
    {
      id: '1',
      name: 'Customer Care',
      description: 'Customer support and service calls',
      createdAt: new Date('2024-01-15'),
      analysisCount: 45
    },
    {
      id: '2',
      name: 'Sales Development',
      description: 'Outbound sales and lead generation',
      createdAt: new Date('2024-02-01'),
      analysisCount: 32
    },
    {
      id: '3',
      name: 'Retention',
      description: 'Customer retention and win-back calls',
      createdAt: new Date('2024-02-15'),
      analysisCount: 28
    },
    {
      id: '4',
      name: 'Tele Sales',
      description: 'Direct sales calls and closing',
      createdAt: new Date('2024-03-01'),
      analysisCount: 67
    },
    {
      id: '5',
      name: 'MCC',
      description: 'Multi-channel contact center',
      createdAt: new Date('2024-03-10'),
      analysisCount: 12
    },
  ];

  const itemsPerPage = 25;
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDepartments = filteredDepartments.slice(startIndex, startIndex + itemsPerPage);

  const handleCreateDepartment = () => {
    // TODO: Implement department creation
    console.log('Creating department:', newDepartment);
    setIsCreateDialogOpen(false);
    setNewDepartment({ name: '', description: '' });
  };

  const handleDeleteDepartment = () => {
    // TODO: Implement department deletion
    console.log('Deleting department:', selectedDepartment);
    setIsDeleteDialogOpen(false);
    setSelectedDepartment(null);
  };

  const openDeleteDialog = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="heading-display text-foreground">Departments</h1>
          <p className="text-muted-foreground">Manage teams and run analyses.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  placeholder="e.g., Customer Care"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  placeholder="Brief description of this department's role"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDepartment}>
                  Create Department
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filters */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="border rounded-md p-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="all">Status: All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          className="border rounded-md p-2"
          value={lastActivityFilter}
          onChange={(e) => setLastActivityFilter(e.target.value as any)}
        >
          <option value="all">Last activity: All</option>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </select>
        <select
          className="border rounded-md p-2 md:col-span-2 lg:col-span-1"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="activity">Sort by: Last Activity</option>
          <option value="name">Name A–Z</option>
          <option value="analyses">Analyses (desc)</option>
        </select>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedDepartments.map((department) => (
          <Card key={department.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{department.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {department.analysisCount} analyses
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => openDeleteDialog(department)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Mini-metrics */}
              <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                <div className="rounded-md border p-2 text-center">
                  <div className="font-medium">Analyses (30d)</div>
                  <div className="text-muted-foreground">{Math.min( department.analysisCount, 30 )}</div>
                </div>
                <div className="rounded-md border p-2 text-center">
                  <div className="font-medium">Files (30d)</div>
                  <div className="text-muted-foreground">{department.analysisCount * 3}</div>
                </div>
                <div className="rounded-md border p-2 text-center">
                  <div className="font-medium">Active Users</div>
                  <div className="text-muted-foreground">{Math.max(1, Math.floor(department.analysisCount/5))}</div>
                </div>
              </div>

              {/* Status + Last activity */}
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1">Active</span>
                <span className="text-muted-foreground">Last activity: {department.createdAt.toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button className="flex-1" variant="outline" onClick={() => onDepartmentSelect(department)}>
                  Open
                </Button>
                <Button className="flex-1" onClick={() => onDepartmentSelect(department)}>
                  Run Analysis
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      Manage Members
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(department)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDepartment?.name}"? 
              This action cannot be undone, but past analyses will be preserved in read-only mode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDepartment} className="bg-destructive hover:bg-destructive/90">
              Delete Department
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DepartmentSelection;