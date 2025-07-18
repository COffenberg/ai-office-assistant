import { Link } from 'react-router-dom';
import { BookOpen, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const LandingMenu = () => {
  const { profile, signOut } = useAuth();

  const menuItems = [
    {
      title: 'Learning Hub',
      description: 'Access training materials, documents, videos, and quizzes',
      icon: BookOpen,
      path: '/hub',
      color: 'from-primary/20 to-accent/20'
    },
    {
      title: 'Chatbot',
      description: 'Chat with our AI assistant about company documents and knowledge',
      icon: MessageSquare,
      path: profile?.role === 'admin' ? '/admin' : '/employee',
      color: 'from-accent/20 to-primary/20'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-6xl mx-auto">
        <div className="absolute top-6 right-6">
          <Button
            onClick={signOut}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
        
        <div className="text-center mb-12">
          <h1 className="heading-display text-foreground mb-4">
            Welcome to Your Workspace
          </h1>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Choose how you'd like to work today. Access our learning platform or chat with our AI assistant.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              to={item.path}
              className="group glass-card-interactive p-8 text-center hover:-translate-y-1 transition-all duration-micro block"
            >
              <div className={`w-20 h-20 mx-auto mb-6 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center transition-transform duration-micro group-hover:scale-110`}>
                <item.icon className="w-10 h-10 text-primary" />
              </div>
              
              <h2 className="heading-subsection text-foreground mb-3">
                {item.title}
              </h2>
              
              <p className="text-caption text-muted-foreground leading-relaxed">
                {item.description}
              </p>
              
              <div className="mt-6 pt-4 border-t border-border-glass">
                <span className="text-micro text-primary font-semibold tracking-wider">
                  GET STARTED →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingMenu;