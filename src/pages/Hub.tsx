import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Hub: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="p-4">
        <Link 
          to="/menu" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to menu
        </Link>
      </div>
      
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Learning Hub
          </h1>
          <p className="text-muted-foreground">
            Work in progress…
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hub;