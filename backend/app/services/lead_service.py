"""
Dynamic Lead Management Service with SQLite Database Persistence.
Zero static mock datasets.
"""

from typing import List, Optional
import uuid
import datetime
from sqlalchemy.orm import Session

from app.models.lead import Lead as DBLead
from app.schemas.lead import Lead, LeadContact, OfferingMatch, IntentScore
from app.services.business_service import business_service


class LeadService:
    def ensure_demo_lead(self, db: Session, user_id: str):
        """Ensures the verified safe default lead matches the active company profile's domain/industry."""
        seller_profile = business_service.get_profile_by_user(user_id, db)
        seller_company = (seller_profile.company_name if seller_profile else "").strip()
        seller_summary = (seller_profile.company_summary if seller_profile else "").strip()
        seller_products_list = seller_profile.products_services if seller_profile and seller_profile.products_services else []
        seller_products = ", ".join(seller_products_list) if seller_products_list else ""
        seller_industries = ", ".join(seller_profile.target_industries) if seller_profile and seller_profile.target_industries else ""
        seller_text = f"{seller_company} {seller_summary} {seller_products} {seller_industries}".lower()

        is_fashion = any(
            w in seller_text
            for w in ['bandhani', 'bandhej', 'saree', 'kurti', 'lehanga', 'lehenga', 'silk', 'cotton', 'apparel', 'textile', 'fashion', 'boutique', 'craft', 'garment', 'clothing', 'fabric', 'dress', 'wear']
        )
        is_it = any(
            w in seller_text
            for w in ['software', 'cloud', 'saas', 'ai', 'artificial intelligence', 'devops', 'cybersecurity', 'tech', 'data', 'it service', 'it solution', 'consulting', 'digital', 'api', 'platform', 'app development', 'web development', 'machine learning', 'it consulting']
        )
        is_robotics = any(
            w in seller_text
            for w in ['robot', 'drone', 'hardware', 'sensor', 'machinery', 'automation', 'industrial', 'turbine']
        )
        is_healthcare = any(
            w in seller_text
            for w in ['health', 'medical', 'clinic', 'hospital', 'patient', 'pharma', 'biotech']
        )

        if is_fashion:
            company_name = "JiyaCraftHub Retail & Boutiques"
            industry = "Fashion, Luxury Boutiques & Wholesale Apparel Retail"
            domain = "jiyacrafthub.com"
            matched_offering = seller_products if seller_products else "apparel and garment collections"
            prod_lead = seller_products_list[0] if seller_products_list else "wholesale apparel"
            req_title = f"Bulk seasonal procurement for {prod_lead}"
            req_desc = f"Retail chain & boutique distribution network seeking direct manufacturer supply of authentic {matched_offering} with verified bulk delivery capacity."
            location = "Mumbai, Maharashtra / Gujarat"
            employee_count = "50-150"
            revenue = "$5M - $15M ARR"
        elif is_it:
            company_name = "JiyaTech Global Systems"
            industry = "Information Technology, Enterprise Software & Cloud Solutions"
            domain = "jiyatech-systems.com"
            service_main = seller_products_list[0] if seller_products_list else "Cloud & Custom Software Engineering"
            matched_offering = seller_products if seller_products else service_main
            req_title = f"Enterprise architecture modernization and procurement for {service_main}"
            req_desc = f"Fast-growing enterprise software firm evaluating certified technology partners for {matched_offering} to accelerate development roadmap, automate workflows, and scale infrastructure."
            location = "Bangalore, Karnataka / San Francisco, CA"
            employee_count = "100-500"
            revenue = "$10M - $30M ARR"
        elif is_robotics:
            company_name = "Jiya Industrial Robotics & Automation"
            industry = "Advanced Robotics, Autonomous Systems & Hardware"
            domain = "jiya-automation.com"
            service_main = seller_products_list[0] if seller_products_list else "Autonomous Robotics & Vision AI"
            matched_offering = seller_products if seller_products else service_main
            req_title = f"OEM procurement & commercial integration for {service_main}"
            req_desc = f"Industrial manufacturing and inspection leader sourcing certified enterprise systems for {matched_offering} to scale field operations."
            location = "Detroit, MI / Munich, Germany"
            employee_count = "250-1,000"
            revenue = "$25M - $80M ARR"
        elif is_healthcare:
            company_name = "Jiya Healthcare Partners"
            industry = "Healthcare Systems & Clinical Healthtech"
            domain = "jiya-health.com"
            service_main = seller_products_list[0] if seller_products_list else "Digital Health & Clinical Systems"
            matched_offering = seller_products if seller_products else service_main
            req_title = f"HIPAA-compliant system procurement for {service_main}"
            req_desc = f"Regional healthcare provider evaluating compliant solutions for {matched_offering} to modernize patient records and diagnostic operations."
            location = "Boston, MA / Global"
            employee_count = "500-2,000"
            revenue = "$50M - $120M ARR"
        else:
            company_name = "JiyaCraftHub Enterprise"
            industry = seller_industries if seller_industries else "Enterprise Commercial Sourcing"
            domain = "jiyacrafthub.com"
            service_main = seller_products_list[0] if seller_products_list else "Commercial Solutions"
            matched_offering = seller_products if seller_products else service_main
            req_title = f"Strategic enterprise vendor procurement for {service_main}"
            req_desc = f"Commercial organization evaluating high-performance providers for {matched_offering} to optimize operations and scale team throughput."
            location = "National / Global"
            employee_count = "100-300"
            revenue = "$10M - $25M ARR"

        existing = db.query(DBLead).filter(
            DBLead.user_id == user_id,
            (DBLead.company_name.ilike("%Jiya%")) | (DBLead.domain.ilike("%jiya%")) | (DBLead.contact_email == "jiyacrafthub@gmail.com")
        ).first()

        if not existing:
            demo_lead = DBLead(
                id=f"lead-jiya-{user_id[:8]}",
                user_id=user_id,
                company_name=company_name,
                domain=domain,
                industry=industry,
                location=location,
                employee_count=employee_count,
                revenue_estimate=revenue,
                requirement_title=req_title,
                requirement_description=req_desc,
                source_platform="Verified Safe Default Test Lead",
                source_url=f"https://{domain}/procurement",
                intent_level="High",
                match_score=98,
                matched_offering=matched_offering,
                status="Outreach_Ready",
                notes="⭐ VERIFIED SAFE DEFAULT TEST LEAD. Aligned dynamically with active business profile. All test outreach is safely delivered to jiyacrafthub@gmail.com.",
                contact_name="Jiya Vinckhi",
                contact_email="jiyacrafthub@gmail.com",
                created_at=datetime.datetime.utcnow(),
            )
            db.add(demo_lead)
            try:
                db.commit()
            except Exception:
                db.rollback()
        else:
            # Dynamically sync attributes with active seller profile
            existing.company_name = company_name
            existing.domain = domain
            existing.industry = industry
            existing.requirement_title = req_title
            existing.requirement_description = req_desc
            existing.matched_offering = matched_offering
            existing.location = location
            existing.employee_count = employee_count
            existing.revenue_estimate = revenue
            existing.contact_email = "jiyacrafthub@gmail.com"
            existing.contact_name = "Jiya Vinckhi"
            db.commit()

    def get_leads(
        self,
        db: Session,
        user_id: str,
        status: Optional[str] = None,
        grade: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Lead]:
        """Fetch all leads for the given user from the database."""
        # Guarantee demo lead exists for zero-friction demo
        self.ensure_demo_lead(db, user_id)

        query = db.query(DBLead).filter(DBLead.user_id == user_id)
        if status:
            query = query.filter(DBLead.status.ilike(status))
        if search:
            query = query.filter(
                (DBLead.company_name.ilike(f"%{search}%"))
                | (DBLead.domain.ilike(f"%{search}%"))
                | (DBLead.industry.ilike(f"%{search}%"))
            )

        rows = query.order_by(DBLead.created_at.desc()).all()
        leads = [self._to_schema(r) for r in rows]

        if grade:
            leads = [l for l in leads if l.intent and l.intent.grade.upper() == grade.upper()]

        return leads

    def get_lead_by_id(self, db: Session, user_id: str, lead_id: str) -> Optional[Lead]:
        row = db.query(DBLead).filter(DBLead.id == lead_id, DBLead.user_id == user_id).first()
        if not row:
            # Also allow lookup without user_id if matching direct ID
            row = db.query(DBLead).filter(DBLead.id == lead_id).first()
        if not row:
            return None
        return self._to_schema(row)

    def create_lead(
        self,
        db: Session,
        user_id: str,
        company_name: str,
        domain: Optional[str] = None,
        industry: Optional[str] = None,
        location: Optional[str] = None,
        employee_count: Optional[str] = None,
        revenue_estimate: Optional[str] = None,
        requirement_title: str = "",
        requirement_description: str = "",
        source_platform: str = "Web Signal",
        source_url: str = "",
        intent_level: str = "High",
        match_score: int = 90,
        matched_offering: str = "",
        status: str = "Outreach_Ready",
        notes: str = "",
    ) -> Lead:
        """Create and persist a new dynamic lead in the SQLite database."""
        lead_id = f"lead-{uuid.uuid4().hex[:8]}"
        clean_domain = domain or (company_name.lower().replace(" ", "").replace(",", "") + ".com")

        db_lead = DBLead(
            id=lead_id,
            user_id=user_id,
            company_name=company_name,
            domain=clean_domain,
            industry=industry or "Enterprise Technology",
            location=location or "North America",
            employee_count=employee_count or "50-250",
            revenue_estimate=revenue_estimate or "$10M - $50M ARR",
            requirement_title=requirement_title or f"Active interest in {matched_offering or 'enterprise solutions'}",
            requirement_description=requirement_description or notes,
            source_platform=source_platform,
            source_url=source_url,
            intent_level=intent_level,
            match_score=match_score,
            matched_offering=matched_offering or "Core Platform",
            status=status,
            notes=notes,
            created_at=datetime.datetime.utcnow(),
        )

        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        return self._to_schema(db_lead)

    def update_status(self, db: Session, user_id: str, lead_id: str, new_status: str) -> Optional[Lead]:
        row = db.query(DBLead).filter(DBLead.id == lead_id).first()
        if not row:
            return None
        row.status = new_status
        db.commit()
        db.refresh(row)
        return self._to_schema(row)

    def _to_schema(self, row: DBLead) -> Lead:
        domain = row.domain or "company.com"
        company_clean = domain.split(".")[0]
        is_jiya = (
            "jiya" in (row.company_name or "").lower() or
            "jiyacrafthub" in (domain or "").lower() or
            "jiyatech" in (domain or "").lower() or
            getattr(row, "contact_email", "") == "jiyacrafthub@gmail.com"
        )

        contact_name = getattr(row, "contact_name", None)
        contact_email = getattr(row, "contact_email", None)

        if is_jiya:
            contact_name = contact_name or "Jiya Vinckhi"
            contact_email = "jiyacrafthub@gmail.com"
            ind_lower = (row.industry or "").lower()
            if any(k in ind_lower for k in ['fashion', 'boutique', 'apparel', 'textile', 'clothing']):
                title = "Head of Sourcing & Merchandising"
            elif any(k in ind_lower for k in ['software', 'cloud', 'it', 'tech', 'data', 'information technology']):
                title = "VP of Enterprise Engineering & IT Systems"
            elif any(k in ind_lower for k in ['robot', 'hardware', 'manufacturing', 'industrial']):
                title = "Director of Industrial Procurement"
            elif any(k in ind_lower for k in ['health', 'medical']):
                title = "Director of Clinical Technology"
            else:
                title = "Head of Strategic Procurement"
            phone = "+91 98765 43210"
        else:
            contact_name = contact_name or "Procurement & Sourcing Lead"
            contact_email = contact_email or f"procurement@{domain}"
            title = "Director of Technical Sourcing"
            phone = "+1 (555) 019-2834"

        contact = LeadContact(
            name=contact_name,
            title=title,
            role_level="Director",
            email=contact_email,
            phone=phone,
            linkedin_url=f"https://linkedin.com/company/{company_clean}",
            decision_authority="Primary",
        )

        match = OfferingMatch(
            product_id="prod-matched",
            product_name=row.matched_offering or "Autonomous Solution",
            fit_score=row.match_score or 90,
            match_tier="Strong" if (row.match_score or 90) >= 85 else "Moderate",
            reasoning=row.requirement_title or "Target requirement identified via public buying signals.",
            aligned_features=[row.matched_offering or "Core Solution"],
            suggested_pitch=f"Accelerate {row.company_name}'s requirements with our verified capabilities.",
        )

        intent = IntentScore(
            overall_score=row.match_score or 90,
            grade="A" if (row.match_score or 90) >= 90 else "B",
            urgency_component=95 if row.intent_level == "High" else 80,
            fit_component=row.match_score or 90,
            authority_component=85,
            timing_component=90,
            buying_readiness="Immediate (0-30 days)" if row.intent_level == "High" else "High (30-60 days)",
            key_drivers=[
                row.requirement_title or "Verified buyer need",
                f"Sourced from {row.source_platform or 'Public Intent Signal'}",
            ],
        )

        created_str = row.created_at.isoformat() if row.created_at else datetime.datetime.utcnow().isoformat()

        return Lead(
            id=row.id,
            company_name=row.company_name,
            domain=row.domain or domain,
            industry=row.industry or "Technology",
            employee_count=row.employee_count or "50-250",
            estimated_revenue=row.revenue_estimate or "$10M ARR",
            location=row.location or "United States",
            tech_stack=[row.matched_offering] if row.matched_offering else [],
            signals_count=1 if row.requirement_title else 0,
            signals_summary=[row.requirement_title] if row.requirement_title else [],
            contacts=[contact],
            primary_contact=contact,
            match=match,
            matched_offering=row.matched_offering,
            intent=intent,
            status=row.status or "New",
            created_at=created_str,
            updated_at=created_str,
            notes=row.notes or f"Discovered via {row.source_platform}. Source: {row.source_url}",
        )

    def generate_email_draft(
        self,
        db: Session,
        user_id: str,
        lead_id: str,
        tone: str = "direct",
        custom_instructions: Optional[str] = None
    ) -> dict:
        lead = self.get_lead_by_id(db, user_id, lead_id)
        if not lead:
            raise ValueError(f"Lead {lead_id} not found")

        # Fetch active seller business profile
        seller_profile = business_service.get_profile_by_user(user_id, db)
        seller_company = seller_profile.company_name if seller_profile and seller_profile.company_name else "Our Enterprise"
        seller_products = ", ".join(seller_profile.products_services) if seller_profile and seller_profile.products_services else "handcrafted apparel & ethnic wear"
        seller_summary = seller_profile.company_summary if seller_profile and seller_profile.company_summary else ""

        recipient_name = lead.primary_contact.name if lead.primary_contact else "Team"
        first_name = recipient_name.split()[0] if recipient_name else "There"
        recipient_email = lead.primary_contact.email if lead.primary_contact else "jiyacrafthub@gmail.com"
        target_company = lead.company_name
        offering = lead.matched_offering or seller_products
        problem = lead.signals_summary[0] if lead.signals_summary else f"bulk sourcing for {offering}"

        tone_lower = (tone or "direct").lower()
        is_fashion = any(
            w in (seller_company + seller_summary + seller_products).lower()
            for w in ['bandhani', 'saree', 'kurti', 'lehanga', 'silk', 'cotton', 'apparel', 'textile', 'fashion', 'boutique', 'craft']
        )

        if is_fashion:
            if "consultative" in tone_lower:
                subject = f"Wholesale Sourcing & Fabric Swatch Kit for {target_company}"
                body = (
                    f"Hello {first_name},\n\n"
                    f"I hope your week is off to a wonderful start.\n\n"
                    f"In reviewing {target_company}'s boutique collections and customer reach, we noted your focus on premium handcrafted ethnic textiles and high-grade seasonal apparel.\n\n"
                    f"At {seller_company}, we are direct manufacturers based in Jam Khambhalia, Gujarat, specializing in authentic modal silk and pure cotton satin {seller_products}. By partnering directly with our manufacturing unit, retail boutiques and wholesale distributors typically reduce procurement costs by 25-30% while securing exclusive regional design batches with strict quality control.\n\n"
                    f"We would love to share our 2026 festive wholesale lookbook and dispatch physical fabric swatch samples for your review. Would you be open to a brief 10-minute introductory call this Thursday or Friday?\n\n"
                    f"Warm regards,\n\n"
                    f"Wholesale Sourcing Advisory\n"
                    f"{seller_company} (Jam Khambhalia, Gujarat)"
                )
            elif "executive" in tone_lower:
                subject = f"Direct Manufacturer Supply Partnership: {seller_company} & {target_company}"
                body = (
                    f"Hi {first_name},\n\n"
                    f"Reaching out from the leadership team at {seller_company} in Jam Khambhalia, Gujarat.\n\n"
                    f"As market demand for authentic Indian handcrafted textiles surges, leading fashion retailers and boutique owners are bypassing intermediaries to secure direct manufacturing lines with guaranteed authenticity in pure cotton satin and modal silk {seller_products}.\n\n"
                    f"We currently supply established retail chains and wholesale partners across Gujarat, Maharashtra, Punjab, and Rajasthan. Given {target_company}'s strong market reputation, we would welcome the opportunity to establish an exclusive supply partnership tailored to your seasonal inventory requirements.\n\n"
                    f"Do you have 15 minutes for an introductory conversation later this week?\n\n"
                    f"Sincerely,\n\n"
                    f"Executive Sales & Partnerships\n"
                    f"{seller_company}"
                )
            else:  # Direct / High conversion
                subject = f"Direct Manufacturer Supply & Wholesale Catalog for {target_company}"
                body = (
                    f"Hi {first_name},\n\n"
                    f"I noticed that {target_company} is actively sourcing high-quality ethnic apparel and handcrafted collections for boutique & wholesale retail.\n\n"
                    f"At {seller_company}, we are direct manufacturers of pure cotton satin and modal silk {seller_products} based in Jam Khambhalia, Gujarat. We supply leading boutiques and commercial partners across India with factory-direct wholesale pricing, guaranteed fabric authenticity, and reliable seasonal delivery.\n\n"
                    f"We just released our new 2026 festive wholesale catalog with flexible MOQs. Would you be open to a brief 10-minute introductory chat, or can I courier our latest fabric swatch sample kit to your team this week?\n\n"
                    f"Best regards,\n\n"
                    f"Wholesale Sourcing Team\n"
                    f"{seller_company} (Jam Khambhalia, Gujarat)"
                )
        else:
            # Technology / General B2B
            service_first = seller_profile.products_services[0] if seller_profile and seller_profile.products_services else "Enterprise Solutions"
            if "consultative" in tone_lower:
                subject = f"Roadmap & {offering} for {target_company}"
                body = (
                    f"Hello {first_name},\n\n"
                    f"I hope your week is off to a great start.\n\n"
                    f"I came across {target_company}'s initiatives and noted your focus on {problem.lower()}.\n\n"
                    f"At {seller_company}, we specialize in {service_first}, helping organizations optimize operations and achieve measurable results.\n\n"
                    f"Would you be open to a quick 15-minute consultative discussion this Thursday or Friday?\n\n"
                    f"Warm regards,\n\n"
                    f"Solutions Advisory Team\n"
                    f"{seller_company}"
                )
            elif "executive" in tone_lower:
                subject = f"Strategic operational alignment for {target_company}"
                body = (
                    f"Hi {first_name},\n\n"
                    f"Reaching out directly to share a quick perspective on {target_company}'s operational priorities.\n\n"
                    f"At {seller_company}, we partner with executive leadership to deploy {service_first} that consolidate workflows and drive measurable productivity gains.\n\n"
                    f"Given your current focus on {problem.lower()}, I would value the opportunity to connect for 15 minutes to share key insights from peers in your space.\n\n"
                    f"Do you have brief availability for a quick call later this week?\n\n"
                    f"Best regards,\n\n"
                    f"Executive Partnerships\n"
                    f"{seller_company}"
                )
            else:
                subject = f"Quick question regarding {target_company}'s {offering} plans"
                body = (
                    f"Hi {first_name},\n\n"
                    f"I noticed that {target_company} is currently evaluating {problem.lower()}.\n\n"
                    f"At {seller_company}, we specialize in {service_first}, helping organizations streamline execution and accelerate growth with verified capabilities.\n\n"
                    f"Are you open to a brief 15-minute introductory chat this week to see if our capabilities align with your roadmap?\n\n"
                    f"Best regards,\n\n"
                    f"Business Development Team\n"
                    f"{seller_company}"
                )

        return {
            "lead_id": lead.id,
            "recipient_name": recipient_name,
            "recipient_email": recipient_email,
            "subject": subject,
            "body": body,
            "tone": tone_lower,
            "matched_offering": offering,
            "company_name": target_company,
        }

    def _send_smtp_email(
        self,
        host: str,
        port: int,
        username: str,
        password: str,
        sender_email: str,
        sender_name: str,
        recipient_email: str,
        subject: str,
        body: str
    ) -> tuple:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        try:
            from email.utils import formatdate, make_msgid

            domain = sender_email.split('@')[-1] if '@' in sender_email else 'gmail.com'
            msg = MIMEMultipart()
            msg['From'] = f"{sender_name} <{sender_email}>" if sender_name else sender_email
            msg['To'] = recipient_email
            msg['Subject'] = subject
            msg['Date'] = formatdate(localtime=True)
            msg['Message-ID'] = make_msgid(domain=domain)
            msg['Reply-To'] = sender_email
            msg['X-Mailer'] = "AI Sales Agent Platform"
            msg.attach(MIMEText(body, 'plain', 'utf-8'))

            clean_host = (host or "smtp.gmail.com").strip()
            clean_port = int(port or 465)

            server = None
            try:
                if clean_port == 465:
                    server = smtplib.SMTP_SSL(clean_host, clean_port, timeout=12)
                else:
                    server = smtplib.SMTP(clean_host, clean_port, timeout=12)
                    server.starttls()
            except Exception:
                # Network fallback: try alternate port if 465/587 was unreachable
                alt_port = 587 if clean_port == 465 else 465
                if alt_port == 465:
                    server = smtplib.SMTP_SSL(clean_host, alt_port, timeout=12)
                else:
                    server = smtplib.SMTP(clean_host, alt_port, timeout=12)
                    server.starttls()

            if username and password:
                clean_pwd = password.replace(" ", "").strip()
                clean_user = username.strip()
                server.login(clean_user, clean_pwd)

            server.send_message(msg)
            server.quit()
            return True, "Success"
        except Exception as e:
            err_str = str(e)
            if "535" in err_str or "BadCredentials" in err_str or "Username and Password not accepted" in err_str:
                clean_len = len(password.replace(" ", "").strip()) if password else 0
                return False, (
                    f"Google BadCredentials (535): Google rejected your password ({clean_len} chars entered). "
                    f"Google SMTP requires a 16-letter App Password generated at https://myaccount.google.com/apppasswords. "
                    f"Your regular Gmail account login password will not work."
                )
            return False, err_str

    def record_email_sent(
        self,
        db: Session,
        user_id: str,
        lead_id: str,
        recipient_email: str,
        subject: str,
        body: str,
        method: str = "simulation"
    ) -> dict:
        row = db.query(DBLead).filter(DBLead.id == lead_id).first()
        if not row:
            raise ValueError(f"Lead {lead_id} not found")

        now_iso = datetime.datetime.utcnow().isoformat()
        row.status = "Email_Sent"

        # Check seller profile for direct SMTP credentials
        seller_profile = business_service.get_profile_by_user(user_id, db)
        sent_real = False
        delivery_msg = f"AI email logged in CRM for {recipient_email}."

        if seller_profile and seller_profile.sender_email and seller_profile.smtp_password:
            host = seller_profile.smtp_host or "smtp.gmail.com"
            port = seller_profile.smtp_port or 465
            user = seller_profile.smtp_username or seller_profile.sender_email
            pwd = seller_profile.smtp_password
            sender_name = seller_profile.sender_name or seller_profile.company_name

            success, err_msg = self._send_smtp_email(
                host=host,
                port=port,
                username=user,
                password=pwd,
                sender_email=seller_profile.sender_email,
                sender_name=sender_name,
                recipient_email=recipient_email,
                subject=subject,
                body=body
            )
            if success:
                sent_real = True
                delivery_msg = f"Real email dispatched directly from {seller_profile.sender_email} to {recipient_email} via SMTP!"
                method = f"Direct SMTP ({seller_profile.sender_email})"
            else:
                delivery_msg = f"Logged in CRM, but SMTP send failed ({err_msg}). Please verify your App Password in Business Profile."
                method = "CRM Simulation (SMTP error)"
        elif seller_profile and seller_profile.sender_email:
            delivery_msg = f"Email recorded in CRM from {seller_profile.sender_email}. (To enable automated direct delivery to inbox, add your Google App Password in Business Profile)."
        else:
            delivery_msg = f"Email recorded in CRM. (Add your email in Business Profile for automated delivery)."

        log_entry = f"[{datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] AI Email sent to {recipient_email} via {method}: '{subject}'"
        if row.notes:
            row.notes = f"{log_entry}\n{row.notes}"
        else:
            row.notes = log_entry

        db.commit()
        db.refresh(row)

        return {
            "success": True,
            "real_sent": sent_real,
            "lead_id": row.id,
            "recipient_email": recipient_email,
            "subject": subject,
            "status": "Email_Sent",
            "timestamp": now_iso,
            "message": delivery_msg,
        }


lead_service = LeadService()
