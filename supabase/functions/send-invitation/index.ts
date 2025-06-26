
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  invitationId: string;
  email: string;
  fullName: string;
  role: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitationId, email, fullName, role, token }: InvitationEmailRequest = await req.json();
    
    console.log("Sending invitation email to:", email);

    const acceptUrl = `${Deno.env.get("SUPABASE_URL")?.replace('//', '//ai-office-assistant.lovable.app/')}/accept-invitation/${token}`;

    const emailResponse = await resend.emails.send({
      from: "Office Assistant <onboarding@resend.dev>",
      to: [email],
      subject: "You're invited to join our team!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">You're Invited!</h1>
          
          <p style="font-size: 16px; color: #555;">
            Hello ${fullName},
          </p>
          
          <p style="font-size: 16px; color: #555;">
            You've been invited to join our team as a <strong>${role}</strong>. 
            Click the button below to accept your invitation and create your account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold; 
                      display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Or copy and paste this link into your browser:
          </p>
          <p style="font-size: 14px; color: #666; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${acceptUrl}
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This invitation will expire in 7 days. If you didn't expect this invitation, 
            you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            Office Assistant Team
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
