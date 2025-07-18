"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Eye, EyeOff, ArrowRight } from "lucide-react";
import { register } from "./actions";
import type { RegisterState } from "@/types/authentication";
import { toast } from "react-toastify";
import { redirect } from "next/navigation";

const registerAction = async (formData: any) => {
  const registerState: RegisterState = await register(formData);
  // Handle an unsuccessful registerState with a toast message
  if (registerState?.success == false) {
    toast.error("Error: " + registerState.message);
    return;
  }
  // Successful registration
  toast.success("Account created successfully!");

  // Send user to the chat
  redirect("/chat");
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              AI Office Assistant
            </h1>
            <p className="text-gray-600 mt-1">Create your account</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold">
              Create your account
            </CardTitle>
            <CardDescription>
              Enter your information to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">
                  Invite Code
                </Label>
                <Input
                  id="code"
                  name="code"
                  type="code"
                  placeholder="Enter your company's invite code"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                formAction={registerAction}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </form>

            <div className="flex items-center justify-center text-sm">
              <span className="text-gray-600">Already have an account?</span>
              <button
                onClick={() => redirect("/auth/login")}
                type="button"
                className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
