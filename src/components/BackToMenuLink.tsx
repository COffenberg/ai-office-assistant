import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackToMenuLink: React.FC = () => {
  return (
    <div className="p-4">
      <Link 
        to="/menu" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to menu
      </Link>
    </div>
  );
};

export default BackToMenuLink;