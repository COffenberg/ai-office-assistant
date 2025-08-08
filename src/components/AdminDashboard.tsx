
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, BarChart3, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { useQAPairs } from "@/hooks/useQAPairs";
import { useDocumentProcessing } from "@/hooks/useDocumentProcessing";
import AdminDashboardHeader from "./dashboard/AdminDashboardHeader";
import DocumentsTab from "./dashboard/DocumentsTab";
import QATab from "./dashboard/QATab";
import AdminAnalytics from "./AdminAnalytics";
// Removed KnowledgeGapManager import after merging into Analytics
import DocumentProcessingTest from "./DocumentProcessingTest";
import EmployeeDashboard from "./EmployeeDashboard";
import UserManagement from "./UserManagement";

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const { signOut, profile } = useAuth();
  const [isInUserView, setIsInUserView] = useState(false);

  const { 
    documents, 
    isLoading: documentsLoading, 
    uploadProgress, 
    uploadDocument, 
    deleteDocument, 
    downloadDocument,
    isUploading,
    isDeleting 
  } = useDocuments();

  const { processDocument, processingStatus } = useDocumentProcessing();

  const {
    qaPairs,
    isLoading: qaPairsLoading,
    createQAPair,
    deleteQAPair,
    isCreating,
    isDeleting: isDeletingQA
  } = useQAPairs();

  const handleSignOut = async () => {
    await signOut();
  };

  // If admin is in user view mode, show the EmployeeDashboard
  if (isInUserView) {
    return (
      <EmployeeDashboard 
        onBack={() => setIsInUserView(false)}
        isAdminUserMode={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboardHeader
        onBack={onBack}
        onSignOut={handleSignOut}
        onSwitchToUserView={() => setIsInUserView(true)}
        profile={profile}
      />

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Q&A Management</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="debug" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Debug Tools</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            <DocumentsTab
              documents={documents}
              documentsLoading={documentsLoading}
              uploadProgress={uploadProgress}
              isUploading={isUploading}
              isDeleting={isDeleting}
              processingStatus={processingStatus}
              uploadDocument={uploadDocument}
              deleteDocument={deleteDocument}
              downloadDocument={downloadDocument}
              processDocument={processDocument}
            />
          </TabsContent>

          <TabsContent value="qa" className="space-y-6">
            <QATab
              qaPairs={qaPairs}
              qaPairsLoading={qaPairsLoading}
              isCreating={isCreating}
              isDeletingQA={isDeletingQA}
              createQAPair={createQAPair}
              deleteQAPair={deleteQAPair}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AdminAnalytics />
          </TabsContent>


          <TabsContent value="debug" className="space-y-6">
            <DocumentProcessingTest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
