import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import EditDepartmentDialog from '@/components/call-analyzer/EditDepartmentDialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCallAnalyzerPrefs } from '@/hooks/useCallAnalyzerPrefs';

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
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { startingDepartmentId, setStartingDepartmentId } = useCallAnalyzerPrefs();
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [startSearch, setStartSearch] = useState('');
  const initialDepartments: Department[] = [
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

  const [deptList, setDeptList] = useState<Department[]>(initialDepartments);

  const itemsPerPage = 25;
  const filteredDepartmentsRaw = deptList.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredDepartments = filteredDepartmentsRaw.filter(dept =>
    dept.name.toLowerCase().includes(startSearch.toLowerCase()) ||
    dept.description?.toLowerCase().includes(startSearch.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDepartmentsRaw.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDepartments = filteredDepartmentsRaw.slice(startIndex, startIndex + itemsPerPage);

  const handleCreateDepartment = () => {
    // TODO: Implement department creation
    console.log('Creating department:', newDepartment);
    setIsCreateDialogOpen(false);
    setNewDepartment({ name: '', description: '' });
  };

  const handleEditDepartmentSave = (updated: any) => {
    setDeptList((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
    setSelectedDepartment(updated as Department);
    setIsEditDialogOpen(false);
  };

  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditDialogOpen(true);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="heading-display text-foreground">Departments</h1>
          <p className="text-muted-foreground">Manage teams and run analyses.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={startingDepartmentId ? 'secondary' : 'default'}
            onClick={() => setIsStartDialogOpen(true)}
          >
            {startingDepartmentId ? 'Change Starting Department' : 'Select Starting Department'}
          </Button>
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
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search departments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          aria-label="Search departments"
        />
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedDepartments.map((department) => {
            const canEdit = true; // TODO: integrate RBAC
            const Title = (
              <h3 className="font-semibold text-lg truncate" title={department.name}>
                {department.name}
              </h3>
            );
              return (
                <Card key={department.id} className="group glass-card-interactive">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Building className="w-8 h-8 text-primary" />
                    </div>
                    <div className="mb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="font-semibold text-lg truncate" title={department.name}>
                            {department.name}
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent>{department.name}</TooltipContent>
                      </Tooltip>
                    </div>
                    <p
                      className="text-sm text-muted-foreground max-h-10 overflow-hidden"
                      title={department.description || 'No description yet.'}
                    >
                      {department.description || 'No description yet.'}
                    </p>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button className="w-full sm:w-auto" onClick={() => onDepartmentSelect(department)}>
                        Open
                      </Button>
                      {canEdit ? (
                        <Button
                          variant="secondary"
                          className="w-full sm:w-auto"
                          onClick={() => openEditDialog(department)}
                        >
                          Edit
                        </Button>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="w-full sm:w-auto">
                              <Button variant="secondary" className="w-full sm:w-auto" disabled aria-disabled>
                                Edit
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>You don’t have permission to edit this department.</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
          })}
        </div>
      </TooltipProvider>

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

      {/* Starting Department Picker */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Starting Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={startSearch}
                onChange={(e) => setStartSearch(e.target.value)}
                className="pl-10"
                aria-label="Search departments"
              />
            </div>
            <RadioGroup
              defaultValue={startingDepartmentId || ''}
              onValueChange={(val) => {
                setStartingDepartmentId(val);
                setIsStartDialogOpen(false);
              }}
              className="space-y-2"
            >
              {filteredDepartments.map((d) => (
                <label key={d.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={d.id} id={`start-${d.id}`} />
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-[60ch]">
                      {d.description || 'No description yet.'}
                    </div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
        </DialogContent>
      </Dialog>

      <EditDepartmentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        department={selectedDepartment}
        onSave={handleEditDepartmentSave}
      />
    </div>
  );
};

export default DepartmentSelection;