import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, BookOpen } from "lucide-react";

const LandingMenu: React.FC = () => {
  const navigate = useNavigate();

  const handleChatbotClick = () => {
    navigate("/employee");
  };

  const handleLearningHubClick = () => {
    navigate("/hub");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="heading-display text-foreground mb-4">
            Welcome to Your Workspace
          </h1>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Choose your tool to get started. Access our AI chatbot for instant assistance or explore the learning hub for comprehensive resources.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 h-96">
          {/* Learning Hub Card */}
          <Card 
            className="glass-card-interactive cursor-pointer group h-full"
            onClick={handleLearningHubClick}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="mb-6 p-4 rounded-full bg-primary-glass group-hover:bg-primary/10 transition-colors duration-micro">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <h2 className="heading-subsection text-card-foreground mb-4">
                Learning Hub
              </h2>
              <p className="text-body text-muted-foreground leading-relaxed">
                Access comprehensive learning materials, documentation, and training resources to enhance your knowledge and skills.
              </p>
            </CardContent>
          </Card>

          {/* Chatbot Card */}
          <Card 
            className="glass-card-interactive cursor-pointer group h-full"
            onClick={handleChatbotClick}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="mb-6 p-4 rounded-full bg-accent-glass group-hover:bg-accent/10 transition-colors duration-micro">
                <MessageSquare className="h-12 w-12 text-accent" />
              </div>
              <h2 className="heading-subsection text-card-foreground mb-4">
                AI Assistant
              </h2>
              <p className="text-body text-muted-foreground leading-relaxed">
                Get instant answers to your questions with our intelligent AI chatbot. Ask about policies, procedures, and more.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingMenu;