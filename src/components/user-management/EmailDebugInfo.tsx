
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EmailDebugInfo = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email System Status & Security Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Current Email Configuration:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Email service: Resend (Test Mode)</li>
            <li>Test emails can only be sent to: <code>casper.offenberg.jensen@gmail.com</code></li>
            <li>All other email addresses will show an error</li>
          </ul>
          
          <p className="mt-4"><strong>Secure Invitation Process:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>New users only:</strong> Invitations can only be accepted by creating new accounts</li>
            <li><strong>Email verification required:</strong> Users must verify their email after signing up</li>
            <li><strong>Profile protection:</strong> Existing user profiles cannot be overwritten</li>
            <li><strong>Email matching:</strong> The invitation email must match the account email</li>
            <li><strong>Duplicate prevention:</strong> System automatically handles duplicate invitations</li>
          </ul>
          
          <p className="mt-4"><strong>How to use invitations:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>For testing:</strong> Create invitations for <code>casper.offenberg.jensen@gmail.com</code></li>
            <li><strong>For other users:</strong> Use the "Copy invitation link" button and share manually</li>
            <li><strong>Email forwarding:</strong> Forward test emails to intended recipients</li>
            <li><strong>New users:</strong> Recipients must create new accounts, not use existing ones</li>
            <li><strong>Existing users:</strong> System will prevent creating invitations for active users</li>
          </ul>
          
          <p className="mt-4"><strong>Error Handling:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Active users:</strong> Cannot create invitations for users who already have accounts</li>
            <li><strong>Pending invitations:</strong> Only one pending invitation per email address</li>
            <li><strong>Accepted invitations:</strong> Old accepted invitations are automatically cleaned up</li>
            <li><strong>Clear messages:</strong> Specific error messages guide you on what to do</li>
          </ul>
          
          <p className="mt-4"><strong>Troubleshooting:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Users must create new accounts with the exact invitation email</li>
            <li>Existing users cannot accept invitations (prevents account overwrites)</li>
            <li>Email verification is required before invitation acceptance</li>
            <li>Check the browser console for detailed error messages</li>
            <li>Use invitation links as backup when emails fail</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
