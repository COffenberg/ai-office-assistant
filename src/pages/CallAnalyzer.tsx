import BackToMenuLink from '@/components/BackToMenuLink';

const CallAnalyzer = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full max-w-4xl mx-auto">
        <BackToMenuLink />
        
        <div className="text-center mt-20">
          <h1 className="heading-display text-foreground mb-8">
            Call Analyzer
          </h1>
          <p className="text-body text-muted-foreground">
            Work in progress…
          </p>
        </div>
      </div>
    </div>
  );
};

export default CallAnalyzer;