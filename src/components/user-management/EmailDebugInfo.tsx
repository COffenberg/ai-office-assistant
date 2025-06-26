
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EmailDebugInfo = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Debugging Help</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>If emails are not being received:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check spam/junk folder</li>
            <li>Verify the email address is correct</li>
            <li>Use the "Copy invitation link" button as a backup</li>
            <li>Check the browser console for error messages</li>
          </ul>
          <p className="mt-4"><strong>Email Status Indicators:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Pending Invitation:</strong> Email should be sent</li>
            <li><strong>Email Failed:</strong> Use resend button or copy link</li>
            <li><strong>Expired Invitation:</strong> Create a new invitation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
