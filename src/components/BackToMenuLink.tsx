import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackToMenuLink: React.FC = () => {
  return (
    <div className="absolute top-6 left-6 z-10">
      <Link
        to="/menu"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-micro group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-micro" />
        Back to menu
      </Link>
    </div>
  );
};

export default BackToMenuLink;