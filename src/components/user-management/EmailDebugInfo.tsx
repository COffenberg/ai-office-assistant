
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EmailDebugInfo = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Current Email Configuration:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Email service: Resend (Test Mode)</li>
            <li>Test emails can only be sent to: <code>casper.offenberg.jensen@gmail.com</code></li>
            <li>All other email addresses will show an error</li>
          </ul>
          
          <p className="mt-4"><strong>How to use invitations:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>For testing:</strong> Create invitations for <code>casper.offenberg.jensen@gmail.com</code></li>
            <li><strong>For other users:</strong> Use the "Copy invitation link" button and share manually</li>
            <li><strong>Email forwarding:</strong> Forward test emails to intended recipients</li>
          </ul>
          
          <p className="mt-4"><strong>Troubleshooting:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check the browser console for detailed error messages</li>
            <li>Errors will now show the real reason instead of false success</li>
            <li>Use invitation links as a backup when emails fail</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
