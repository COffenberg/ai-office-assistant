import React from "react";
import BackToMenuLink from "@/components/BackToMenuLink";

const Hub: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <BackToMenuLink />
      
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted-glass mb-6">
              <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse"></div>
            </div>
          </div>
          
          <h1 className="heading-section text-foreground mb-4">
            Work in progress…
          </h1>
          
          <p className="text-body text-muted-foreground max-w-md mx-auto">
            The Learning Hub is currently under development. Check back soon for comprehensive learning resources and documentation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hub;