
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
    
    console.log("=== INVITATION EMAIL DEBUG ===");
    console.log("Sending invitation email request:");
    console.log("- Email:", email);
    console.log("- Full Name:", fullName);
    console.log("- Role:", role);
    console.log("- Token:", token);
    console.log("- Invitation ID:", invitationId);

    // Check if RESEND_API_KEY is available
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("ERROR: RESEND_API_KEY is not configured");
      throw new Error("Email service is not configured. Please contact administrator.");
    }
    console.log("RESEND_API_KEY is configured:", resendApiKey ? "Yes" : "No");

    // Construct the correct invitation URL
    const baseUrl = "https://ai-office-assistant.lovable.app";
    const acceptUrl = `${baseUrl}/accept-invitation/${token}`;
    console.log("Invitation URL:", acceptUrl);

    // For testing, use the admin's email address since Resend is in test mode
    const fromEmail = "Office Assistant <onboarding@resend.dev>";
    console.log("From email:", fromEmail);

    console.log("Attempting to send email...");
    const emailResponse = await resend.emails.send({
      from: fromEmail,
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

    console.log("Email response:", JSON.stringify(emailResponse, null, 2));

    // Check if the email was actually sent successfully
    if (emailResponse.error) {
      console.error("=== EMAIL SENDING FAILED ===");
      console.error("Resend API Error:", emailResponse.error);
      
      // Return a proper error response
      return new Response(JSON.stringify({ 
        success: false,
        error: emailResponse.error.message || "Failed to send email",
        details: emailResponse.error,
        debugInfo: {
          email,
          acceptUrl,
          fromEmail,
          resendTestMode: "Emails can only be sent to casper.offenberg.jensen@gmail.com in test mode"
        }
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    console.log("Email sent successfully!");
    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse,
      debugInfo: {
        email,
        acceptUrl,
        fromEmail,
        resendTestMode: email !== "casper.offenberg.jensen@gmail.com" ? 
          "Note: In test mode, emails can only be sent to casper.offenberg.jensen@gmail.com" : 
          "Email sent to verified test address"
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("=== EMAIL SENDING ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: "Check the function logs for more information"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
