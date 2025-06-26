
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut, User, Eye } from "lucide-react";

interface AdminDashboardHeaderProps {
  onBack: () => void;
  onSignOut: () => void;
  onSwitchToUserView: () => void;
  profile: any;
}

const AdminDashboardHeader = ({ 
  onBack, 
  onSignOut, 
  onSwitchToUserView, 
  profile 
}: AdminDashboardHeaderProps) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage documents, knowledge base, and analytics</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{profile.full_name || profile.email}</span>
                <Badge variant="outline" className="text-xs">
                  {profile.role}
                </Badge>
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={onSwitchToUserView}
              className="flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Switch to User View</span>
            </Button>
            <Button variant="outline" onClick={onSignOut} className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHeader;
