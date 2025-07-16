
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Settings } from "lucide-react";

interface EmployeeDashboardHeaderProps {
  onBack: () => void;
  onLogout: () => void;
  isAdminUserMode?: boolean;
}

const EmployeeDashboardHeader = ({ onBack, onLogout, isAdminUserMode = false }: EmployeeDashboardHeaderProps) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-sm text-gray-600">
                {isAdminUserMode 
                  ? "Testing user experience as admin" 
                  : "Ask questions about company policies and procedures"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isAdminUserMode && (
              <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Back to Admin Dashboard</span>
              </Button>
            )}
            {!isAdminUserMode && (
              <Button variant="outline" onClick={onLogout} className="flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboardHeader;
