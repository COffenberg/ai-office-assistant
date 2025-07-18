"use client";

import { Button } from "@/components/ui/button";
import { Shield, User } from "lucide-react";

const fillAdminCredentials = () => {
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;
  if (emailInput) emailInput.value = "admin@company.com";
  if (passwordInput) passwordInput.value = "admin123";
};

const fillEmployeeCredentials = () => {
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;
  if (emailInput) emailInput.value = "employee@company.com";
  if (passwordInput) passwordInput.value = "employee123";
};

export default function FillCredentials() {
  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium text-gray-700">
        Quick Test Login
      </p>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full h-11 justify-start bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          onClick={fillAdminCredentials}
        >
          <Shield className="w-4 h-4 mr-3" />
          Fill Admin Credentials
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 justify-start bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          onClick={fillEmployeeCredentials}
        >
          <User className="w-4 h-4 mr-3" />
          Fill Employee Credentials
        </Button>
      </div>
    </div>
  );
}
