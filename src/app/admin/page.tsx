"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Users,
  BarChart3,
  Brain,
  Bug,
  MessageSquare,
  ArrowLeft,
  Eye,
  LogOut,
  Download,
  X,
  CheckCircle,
} from "lucide-react";

import UploadDocument from "@/components/admin/uploadDocument";

export default async function AdminHomePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="p-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Manage documents, knowledge base, and analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">
                  {data.user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium">{data.user.email}</span>
              <span className="text-gray-500">
                <b>Admin</b>
              </span>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Eye className="h-4 w-4 mr-2" />
              User View
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="px-6 py-4">
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Q&A Management
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Knowledge Gaps
            </TabsTrigger>
            <TabsTrigger value="debug" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Debug Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-6 space-y-6">
            {/* Upload Documents Section */}
            <UploadDocument />
            {/* Uploaded Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents (1)</CardTitle>
                <CardDescription>
                  Manage your uploaded knowledge base documents with AI
                  processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          Test document - Home Alarm System.docx
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <span>DOCX</span>
                          <span>16.4 KB</span>
                          <span>Uploaded: 7/16/2025</span>
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Processed
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-blue-600 border-blue-200"
                          >
                            AI Enhanced
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Based on the information provided from the document
                          "Test document - Home Alarm System.docx", here are the
                          key details extracted: ### Contact Details: -
                          **Installation Reports Email:**
                          techsupport@assistant.com - **Technical Support
                          Email:** techsupport@assistant.com ### Installation
                          Procedures: The document mentions procedures related
                          to the installation and configuration of the home
                          alarm...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tab contents would go here */}
          <TabsContent value="qa">
            <Card>
              <CardHeader>
                <CardTitle>Q&A Management</CardTitle>
                <CardDescription>
                  Manage questions and answers in your knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Q&A management content would go here...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  User management content would go here...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  View usage statistics and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Analytics content would go here...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Gaps</CardTitle>
                <CardDescription>
                  Identify and address gaps in your knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Knowledge gaps content would go here...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debug">
            <Card>
              <CardHeader>
                <CardTitle>Debug Tools</CardTitle>
                <CardDescription>
                  Debug and troubleshoot system issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Debug tools content would go here...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
