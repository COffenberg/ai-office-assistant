import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, MessageSquare } from 'lucide-react';

const LandingMenu: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-muted-foreground">
            Choose how you'd like to get started
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
          <Card 
            className="glass-card hover-lift cursor-pointer group transition-all duration-medium"
            onClick={() => navigate('/hub')}
          >
            <CardContent className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="mb-6 p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-medium">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Learning Hub
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Access training materials, documentation, and learning resources to enhance your knowledge.
              </p>
            </CardContent>
          </Card>

          <Card 
            className="glass-card hover-lift cursor-pointer group transition-all duration-medium"
            onClick={() => navigate('/employee')}
          >
            <CardContent className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="mb-6 p-4 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors duration-medium">
                <MessageSquare className="h-12 w-12 text-accent" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Chatbot
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Get instant answers to your questions with our intelligent knowledge assistant.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingMenu;