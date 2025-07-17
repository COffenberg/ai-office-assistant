import BackToMenuLink from '@/components/BackToMenuLink';

const Hub = () => {
  return (
    <div className="min-h-screen bg-background">
      <BackToMenuLink />
      
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="heading-display text-foreground mb-4">
            Learning Hub
          </h1>
          <p className="text-body text-muted-foreground">
            Work in progress...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hub;