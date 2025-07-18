import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackToMenuLink = () => {
  return (
    <div className="absolute top-6 left-6 z-10">
      <Link
        to="/menu"
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-micro hover-lift"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to menu
      </Link>
    </div>
  );
};

export default BackToMenuLink;