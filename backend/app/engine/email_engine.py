import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from app.config import settings

logger = logging.getLogger("email_engine")


class EmailEngine:
    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str, text_content: str = "") -> bool:
        """
        Sends HTML & plain-text email using Gmail SMTP SSL/TLS server with App Password authentication.
        """
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email

            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10.0) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())

            logger.info(f"Email successfully dispatched to {to_email} via SMTP ({settings.SMTP_USER})")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    @staticmethod
    def send_otp_email(to_email: str, otp_code: str) -> bool:
        """
        Dispatches a 6-digit OTP verification code to user email.
        """
        subject = f"🔐 Your OmniRole AI Verification Code: {otp_code}"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #050507; color: #e4e4e7; margin: 0; padding: 24px; }}
            .card {{ max-width: 500px; margin: 0 auto; background: #0d0d12; border: 1px solid #27272a; border-radius: 16px; padding: 32px; text-align: center; }}
            .logo {{ font-size: 20px; font-weight: 900; color: #3b82f6; letter-spacing: -0.5px; margin-bottom: 20px; }}
            .otp {{ font-size: 36px; font-weight: 900; color: #3b82f6; letter-spacing: 6px; background: #14141d; border: 1px solid #272738; padding: 16px; border-radius: 12px; margin: 24px 0; display: inline-block; }}
            .footer {{ font-size: 11px; color: #71717a; margin-top: 24px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">⚡ OmniRole AI</div>
            <h2 style="color: #ffffff; margin-bottom: 8px;">Security Verification Code</h2>
            <p style="font-size: 13px; color: #a1a1aa;">Use the code below to complete your login or registration session.</p>
            <div class="otp">{otp_code}</div>
            <p style="font-size: 12px; color: #71717a;">This code will expire in 10 minutes. If you did not request this code, please ignore this message.</p>
            <div class="footer">Sent securely via OmniRole AI Platform &bull; {settings.SMTP_USER}</div>
          </div>
        </body>
        </html>
        """
        return EmailEngine.send_email(to_email, subject, html, f"Your OmniRole AI OTP Code is: {otp_code}")

    @staticmethod
    def send_promo_email(to_email: str, title: str, message_body: str, action_url: Optional[str] = None, banner_badge: str = "SPECIAL OFFER") -> bool:
        """
        Dispatches a promotional email or announcement to user email.
        """
        subject = f"🔥 {title} - OmniRole AI Exclusive"
        btn_html = f'<a href="{action_url}" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 13px; margin-top: 16px;">Claim Offer Now &rarr;</a>' if action_url else ''

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #050507; color: #e4e4e7; margin: 0; padding: 24px; }}
            .card {{ max-width: 550px; margin: 0 auto; background: #0d0d12; border: 1px solid #27272a; border-radius: 16px; padding: 32px; }}
            .badge {{ background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; display: inline-block; margin-bottom: 16px; }}
            .title {{ font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 12px; line-height: 1.3; }}
            .body {{ font-size: 13px; color: #d4d4d8; line-height: 1.6; margin-bottom: 20px; }}
            .footer {{ font-size: 11px; color: #71717a; border-top: 1px solid #1f1f26; padding-top: 16px; margin-top: 24px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">{banner_badge}</div>
            <div class="title">{title}</div>
            <div class="body">{message_body}</div>
            {btn_html}
            <div class="footer">OmniRole AI Enterprise Notifications &bull; {settings.SMTP_USER}</div>
          </div>
        </body>
        </html>
        """
        return EmailEngine.send_email(to_email, subject, html, f"{title}\n\n{message_body}")
