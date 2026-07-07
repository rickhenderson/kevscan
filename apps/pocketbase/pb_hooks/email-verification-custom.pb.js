
/// <reference path="../pb_data/types.d.ts" />

// Send custom branded verification email
onRecordAfterCreateSuccess((e) => {
  // Only process auth records from the users collection
  if (e.record.collection().name !== "users") {
    e.next();
    return;
  }

  // Only send verification email if email is not yet verified
  if (e.record.get("verified")) {
    e.next();
    return;
  }

  // Get the app URL from request origin or PocketBase configuration
  let appUrl = "";
  
  if (e.requestInfo && e.requestInfo.headers) {
    const origin = e.requestInfo.headers.get("origin");
    const referer = e.requestInfo.headers.get("referer");
    
    if (origin) {
      appUrl = origin;
    } else if (referer) {
      const url = new URL(referer);
      appUrl = url.origin;
    }
  }
  
  if (!appUrl) {
    const settings = $app.settings();
    if (settings && settings.meta && settings.meta.appUrl) {
      appUrl = settings.meta.appUrl;
    }
  }
  
  if (!appUrl) {
    appUrl = $app.baseUrl();
  }
  
  appUrl = appUrl.replace(/\/$/, "");
  
  // Generate proper verification token using PocketBase's internal method for verification
  let token = "";
  try {
    // $app.newRecordVerifyToken is the standard PB v0.23+ interface to generate a verification JWT
    token = $app.newRecordVerifyToken(e.record);
  } catch (err) {
    console.error("Failed to generate internal verification token:", err);
    return;
  }
  
  // Build verification link
  const verificationLink = appUrl + "/verify-email?token=" + token;
  
  // Send custom branded email
  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: "CISA KEV Scanner by Hidden Security"
    },
    to: [{ address: e.record.get("email") }],
    subject: "Verify Your Email - CISA KEV Scanner",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a1a1a; color: #ffffff; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">CISA KEV Scanner</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #cccccc;">by Hidden Security</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0;">
          <h2 style="color: #1a1a1a; margin-top: 0;">Verify Your Email Address</h2>
          
          <p style="color: #333333; line-height: 1.6;">
            Welcome to CISA KEV Scanner! To complete your registration and start scanning for vulnerabilities, 
            please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="display: inline-block; background-color: #0066cc; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666666; font-size: 12px; line-height: 1.6;">
            Or copy and paste this link in your browser:<br>
            <span style="word-break: break-all; color: #0066cc;">${verificationLink}</span>
          </p>
          
          <p style="color: #666666; font-size: 12px; margin-top: 20px;">
            This verification link will expire in 7 days.
          </p>
          
          <p style="color: #666666; font-size: 12px;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
        
        <div style="padding: 20px; background-color: #f0f0f0; text-align: center; font-size: 11px; color: #666666;">
          <p style="margin: 0;">© 2024 Hidden Security. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">CISA KEV Scanner - Vulnerability Management Platform</p>
        </div>
      </div>
    `
  });
  
  try {
    $app.newMailClient().send(message);
  } catch (err) {
    console.error("Failed to send custom verification email:", err);
  }
  
  e.next();
}, "users");
