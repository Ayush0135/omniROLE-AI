import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import PaymentRequest, User
from app.schemas import PaymentRequestCreate, PaymentRequestResponse
from app.engine.supabase_sync import SupabaseSyncEngine

logger = logging.getLogger("payments_api")
router = APIRouter(prefix="/payments", tags=["UPI Payment Verification"])


@router.post("/submit", response_model=PaymentRequestResponse, status_code=status.HTTP_201_CREATED)
async def submit_payment_request(
    pay_in: PaymentRequestCreate,
    db: Session = Depends(get_db)
):
    # Check if UTR already submitted
    existing = db.query(PaymentRequest).filter(PaymentRequest.utr_number == pay_in.utr_number.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Transaction UTR Number has already been submitted for verification."
        )

    req = PaymentRequest(
        user_email=pay_in.user_email.strip().lower(),
        plan_name=pay_in.plan_name,
        amount_inr=pay_in.amount_inr,
        utr_number=pay_in.utr_number.strip(),
        screenshot_url=pay_in.screenshot_url,
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    await SupabaseSyncEngine.sync_payment_request(
        pay_id=req.id,
        user_email=req.user_email,
        plan_name=req.plan_name,
        amount_inr=req.amount_inr,
        utr_number=req.utr_number,
        status="pending"
    )

    # Real-time WebSocket push to Admin tabs
    from app.engine.websocket_manager import ws_manager
    await ws_manager.broadcast_to_admins("NEW_PAYMENT_SUBMITTED", {
        "id": req.id,
        "user_email": req.user_email,
        "plan_name": req.plan_name,
        "amount_inr": req.amount_inr,
        "utr_number": req.utr_number,
    })

    return req


@router.get("/requests", response_model=List[PaymentRequestResponse])
def list_payment_requests(db: Session = Depends(get_db)):
    return db.query(PaymentRequest).order_by(PaymentRequest.created_at.desc()).all()


@router.post("/{pay_id}/approve", response_model=PaymentRequestResponse)
async def approve_payment_request(pay_id: str, db: Session = Depends(get_db)):
    from app.models import CustomPlan
    from app.engine.email_engine import EmailEngine
    from app.engine.websocket_manager import ws_manager

    req = db.query(PaymentRequest).filter(PaymentRequest.id == pay_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment request not found.")

    req.status = "approved"

    # Calculative Plan Limits Calculation
    token_limit = 500000
    max_roles = 25
    custom_plan = db.query(CustomPlan).filter(CustomPlan.name == req.plan_name).first()

    if custom_plan:
        token_limit = custom_plan.monthly_token_limit
        max_roles = custom_plan.max_roles
    elif "Enterprise" in req.plan_name:
        token_limit = 5000000
        max_roles = 999

    # Update target user plan & unlock service permissions
    user = db.query(User).filter(User.email == req.user_email).first()
    if user:
        user.plan = req.plan_name
        user.monthly_token_limit = token_limit
        user.status = "active"
        user.web_search_allowed = True
        user.code_executor_allowed = True
        user.vector_rag_allowed = True

        await SupabaseSyncEngine.sync_user(
            user_id=user.id,
            email=user.email,
            name=user.name,
            plan=user.plan,
            is_admin=user.is_admin
        )
    else:
        new_user = User(
            email=req.user_email,
            name=req.user_email.split("@")[0],
            plan=req.plan_name,
            monthly_token_limit=token_limit,
            status="active",
            web_search_allowed=True,
            code_executor_allowed=True,
            vector_rag_allowed=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        await SupabaseSyncEngine.sync_user(
            user_id=new_user.id,
            email=new_user.email,
            name=new_user.name,
            plan=new_user.plan,
            is_admin=False
        )

    db.commit()
    db.refresh(req)

    await SupabaseSyncEngine.sync_payment_request(
        pay_id=req.id,
        user_email=req.user_email,
        plan_name=req.plan_name,
        amount_inr=req.amount_inr,
        utr_number=req.utr_number,
        status="approved"
    )

    # 1. Real-time WebSocket push notification
    await ws_manager.broadcast_to_all("PAYMENT_APPROVED", {
        "id": req.id,
        "user_email": req.user_email,
        "plan_name": req.plan_name,
        "monthly_token_limit": token_limit,
        "max_roles": max_roles,
        "status": "approved",
    })

    # 2. Automated SMTP Email Notification via 23tec2cs758@vgu.ac.in
    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #050507; color: #e4e4e7; margin: 0; padding: 24px; }}
        .card {{ max-width: 550px; margin: 0 auto; background: #0d0d12; border: 1px solid #27272a; border-radius: 16px; padding: 32px; }}
        .badge {{ background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; display: inline-block; margin-bottom: 16px; }}
        .title {{ font-size: 24px; font-weight: 900; color: #ffffff; margin-bottom: 12px; }}
        .item {{ background: #14141d; border: 1px solid #272738; padding: 12px 16px; border-radius: 10px; margin-bottom: 10px; font-size: 13px; color: #e4e4e7; }}
        .footer {{ font-size: 11px; color: #71717a; margin-top: 24px; border-top: 1px solid #1f1f26; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">PAYMENT VERIFIED & APPROVED</div>
        <div class="title">Your {req.plan_name} Service is Now Active!</div>
        <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 20px;">
          Your manual UPI transaction (UTR: <strong>{req.utr_number}</strong>) has been verified by the Admin.
        </p>

        <div class="item">⚡ <strong>Monthly Token Quota:</strong> {token_limit:,} Tokens</div>
        <div class="item">🤖 <strong>Active AI Roles Allowed:</strong> Up to {max_roles} Roles</div>
        <div class="item">🔌 <strong>Multi-Connectors:</strong> All 6 Connectors Enabled (Web, Code, Vector RAG)</div>
        <div class="item">🚀 <strong>Execution Speed:</strong> Sub-110ms Groq LPU Engine</div>

        <a href="http://localhost:3000/dashboard" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 13px; margin-top: 16px;">Go to Dashboard &rarr;</a>

        <div class="footer">OmniRole AI Billing Engine &bull; 23tec2cs758@vgu.ac.in</div>
      </div>
    </body>
    </html>
    """
    EmailEngine.send_email(
        to_email=req.user_email,
        subject=f"🎉 Payment Approved - Your OmniRole AI {req.plan_name} is Active!",
        html_content=email_html,
        text_content=f"Your payment of ₹{req.amount_inr} (UTR: {req.utr_number}) has been approved! Your {req.plan_name} is now active with {token_limit:,} monthly tokens."
    )

    return req


@router.post("/{pay_id}/reject", response_model=PaymentRequestResponse)
async def reject_payment_request(pay_id: str, db: Session = Depends(get_db)):
    req = db.query(PaymentRequest).filter(PaymentRequest.id == pay_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment request not found.")

    req.status = "rejected"
    db.commit()
    db.refresh(req)

    await SupabaseSyncEngine.sync_payment_request(
        pay_id=req.id,
        user_email=req.user_email,
        plan_name=req.plan_name,
        amount_inr=req.amount_inr,
        utr_number=req.utr_number,
        status="rejected"
    )

    # Real-time WebSocket push
    from app.engine.websocket_manager import ws_manager
    await ws_manager.broadcast_to_all("PAYMENT_REJECTED", {
        "id": req.id,
        "user_email": req.user_email,
        "status": "rejected",
    })

    return req
