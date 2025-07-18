
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminDashboard from "@/components/AdminDashboard";
import EmployeeDashboard from "@/components/EmployeeDashboard";
import { Users, FileText, MessageSquare, Search } from "lucide-react";

const Index = () => {
  const [userRole, setUserRole] = useState<'admin' | 'employee' | null>(null);

  if (userRole === 'admin') {
    return <AdminDashboard onBack={() => setUserRole(null)} />;
  }

  if (userRole === 'employee') {
    return <EmployeeDashboard onBack={() => setUserRole(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Office Assistant</h1>
                <p className="text-sm text-gray-600">Internal Knowledge Management System</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Enterprise Ready
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your AI Assistant
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get instant answers from your company's internal knowledge base. 
            Upload documents and manage Q&A pairs for your team.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-300"
                onClick={() => setUserRole('admin')}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-700 transition-colors">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Administrator</CardTitle>
              <CardDescription className="text-base">
                Manage documents and knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-700">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Upload PDF, DOC, DOCX files</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span>Add manual Q&A pairs</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <Search className="w-5 h-5 text-blue-600" />
                  <span>Manage knowledge base</span>
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Continue as Admin
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-green-300"
                onClick={() => setUserRole('employee')}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-700 transition-colors">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Employee</CardTitle>
              <CardDescription className="text-base">
                Ask questions and get instant answers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-700">
                  <Search className="w-5 h-5 text-green-600" />
                  <span>Ask questions instantly</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span>Access company knowledge</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <span>View question history</span>
                </div>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Continue as Employee
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-8">
            Why Choose AI Office Assistant?
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Internal Only</h4>
              <p className="text-gray-600 text-sm">Uses only your company's internal documents and knowledge</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Instant Answers</h4>
              <p className="text-gray-600 text-sm">Get immediate responses to your company-specific questions</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Role-Based</h4>
              <p className="text-gray-600 text-sm">Different interfaces for administrators and employees</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
