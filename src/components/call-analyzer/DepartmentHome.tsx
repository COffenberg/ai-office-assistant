import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, Cog, FileClock, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface Props {
  department: Department;
}

export default function DepartmentHome({ department }: Props) {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/call-analyzer/departments');
  };

  const Tile = ({
    title,
    description,
    icon: Icon,
    onClick,
    disabled,
  }: {
    title: string;
    description: string;
    icon: any;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`group glass-card-interactive p-8 text-left hover:-translate-y-1 transition-all duration-micro rounded-xl border border-border w-full ${
        disabled ? 'opacity-60 cursor-not-allowed hover:translate-y-0' : ''
      }`}
    >
      <div className="w-20 h-20 mb-6 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center transition-transform duration-micro group-hover:scale-110">
        <Icon className="w-10 h-10 text-primary" />
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="heading-subsection text-foreground mb-2">{title}</h3>
          <p className="text-caption text-muted-foreground max-w-[46ch]">{description}</p>
        </div>
        {!disabled && <ChevronRight className="w-5 h-5 text-muted-foreground mt-1" />}
      </div>
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to departments
        </Button>
        <h1 className="heading-display text-foreground mt-2">{department.name}</h1>
        {department.description && (
          <p className="text-muted-foreground mt-1">{department.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Tile
          title="Create Analysis"
          description="Start a new call analysis for this department."
          icon={PlayCircle}
          onClick={() => navigate('/call-analyzer/analysis/create')}
        />
        <Tile
          title="Create Automation"
          description="Set up recurring or rule-based automations."
          icon={Cog}
          disabled
        />
        <Tile
          title="Previous Analyses"
          description="Browse the history of analyses and statuses."
          icon={FileClock}
          onClick={() => navigate(`/call-analyzer/departments/${department.id}/analyses`)}
        />
      </div>
    </div>
  );
}
