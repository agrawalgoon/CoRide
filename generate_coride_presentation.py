import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color definitions
    DARK_GREEN = RGBColor(15, 81, 50)       # #0F5132 (Brand Primary)
    EMERALD = RGBColor(16, 185, 129)        # #10B981 (Active Accent)
    DARK_SLATE = RGBColor(15, 23, 42)       # #0F172A (Charcoal text)
    LIGHT_BG = RGBColor(248, 250, 252)      # #F8FAFC (Card fill)
    CARD_BORDER = RGBColor(226, 232, 240)   # #E2E8F0
    WHITE = RGBColor(255, 255, 255)
    MUTED_TEXT = RGBColor(100, 116, 139)    # #64748B
    ACCENT_AMBER = RGBColor(217, 119, 6)
    LIGHT_GREEN = RGBColor(236, 253, 245)   # #ECFDF5 (Pill badge)

    def add_header(slide, title_text, category_text, slide_number):
        # Header banner shape
        banner = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.9))
        banner.fill.solid()
        banner.fill.fore_color.rgb = WHITE
        banner.line.color.rgb = CARD_BORDER
        banner.line.width = Pt(1)

        # Category pill
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(0.52), Inches(2.2), Inches(0.32))
        pill.fill.solid()
        pill.fill.fore_color.rgb = LIGHT_GREEN
        pill.line.color.rgb = EMERALD
        pill.line.width = Pt(1)
        tf_pill = pill.text_frame
        tf_pill.text = category_text.upper()
        p_pill = tf_pill.paragraphs[0]
        p_pill.font.size = Pt(9)
        p_pill.font.bold = True
        p_pill.font.color.rgb = DARK_GREEN
        p_pill.alignment = PP_ALIGN.CENTER

        # Slide Title
        tx_box = slide.shapes.add_textbox(Inches(3.3), Inches(0.45), Inches(8.0), Inches(0.5))
        tf = tx_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(20)
        p.font.bold = True
        p.font.color.rgb = DARK_SLATE

        # Slide Number Badge
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(11.4), Inches(0.52), Inches(0.9), Inches(0.32))
        badge.fill.solid()
        badge.fill.fore_color.rgb = DARK_GREEN
        badge.line.fill.background()
        tf_b = badge.text_frame
        tf_b.text = f"{slide_number} / 17"
        p_b = tf_b.paragraphs[0]
        p_b.font.size = Pt(10)
        p_b.font.bold = True
        p_b.font.color.rgb = WHITE
        p_b.alignment = PP_ALIGN.CENTER

    def add_card(slide, left, top, width, height, title, items, bg_color=LIGHT_BG, border_color=CARD_BORDER, title_color=DARK_GREEN):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.2)
        tf.margin_bottom = Inches(0.2)

        if title:
            p_title = tf.paragraphs[0]
            p_title.text = title
            p_title.font.size = Pt(14)
            p_title.font.bold = True
            p_title.font.color.rgb = title_color
            p_title.space_after = Pt(8)

        first = True if not title else False
        for item in items:
            p = tf.add_paragraph() if not first else tf.paragraphs[0]
            first = False
            p.text = f"•  {item}"
            p.font.size = Pt(11)
            p.font.color.rgb = DARK_SLATE
            p.space_after = Pt(5)

    def set_speaker_notes(slide, notes_text):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = notes_text

    # ==========================================
    # SLIDE 1: TITLE & PROBLEM STATEMENT
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    add_header(s1, "Problem Statement: The Urban & Campus Commuter Crisis", "Problem Statement", 1)

    # Core problem callout banner
    prob_banner = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(1.1))
    prob_banner.fill.solid()
    prob_banner.fill.fore_color.rgb = LIGHT_GREEN
    prob_banner.line.color.rgb = EMERALD
    prob_banner.line.width = Pt(1.5)
    tf1 = prob_banner.text_frame
    tf1.word_wrap = True
    tf1.margin_left = Inches(0.3)
    tf1.margin_top = Inches(0.15)
    p1 = tf1.paragraphs[0]
    p1.text = "Core Problem Statement:"
    p1.font.bold = True
    p1.font.size = Pt(12)
    p1.font.color.rgb = DARK_GREEN
    p2 = tf1.add_paragraph()
    p2.text = "Daily commuters across educational campuses and corporate tech corridors face escalating travel expenses while thousands of single-occupancy personal vehicles commute with empty seats. Existing informal coordination lacks schedule synchronisation and trust, while commercial ride-hailing apps rely on rigid flat rates or straight-line distance calculations that lead to inequitable, distorted cost sharing."
    p2.font.size = Pt(11)
    p2.font.color.rgb = DARK_SLATE

    # 3 Pillars of Problem
    add_card(s1, Inches(0.8), Inches(2.8), Inches(3.7), Inches(4.2), "1. Economic & Vehicle Inefficiency", [
        "Escalating fuel prices and vehicle maintenance inflate individual daily commuting expenses.",
        "Over 75% of private vehicles commute with 3 to 4 empty passenger seats.",
        "Significant underutilization of existing automotive assets across fixed travel corridors.",
        "Lack of incentive structures to encourage seat-sharing among daily commuters."
    ])

    add_card(s1, Inches(4.81), Inches(2.8), Inches(3.7), Inches(4.2), "2. Coordination & Peer Discovery", [
        "Difficulty discovering compatible colleagues or students travelling along similar routes.",
        "Informal WhatsApp/Telegram groups lack structured search, seat locks, and booking logs.",
        "Absence of institutional trust and identity verification creates safety apprehensions.",
        "Manual time coordination fails due to rigid schedules and lack of recurring trip pairing."
    ])

    add_card(s1, Inches(8.83), Inches(2.8), Inches(3.7), Inches(4.2), "3. Inequitable Distance & Cost Models", [
        "Straight-line (Euclidean) distance ignores actual road curves, detours, and traffic networks.",
        "Passengers on winding road segments are either overcharged or drivers are undercompensated.",
        "Fixed commercial fares fail to reflect actual proportional fuel consumption and distance.",
        "Absence of transparent, verifiable seat-level cost-splitting causes financial disputes."
    ])

    set_speaker_notes(s1, """Speaker Notes for Slide 1 (Problem Statement):
"Good morning respected evaluators. Today I am presenting CoRide, a smart ride-sharing and carpooling platform engineered specifically for university campuses and corporate technology parks. 

To understand why CoRide is necessary, let us look at the current commuting landscape. Commuters in university hubs and tech corridors face skyrocketing fuel costs, yet thousands of cars travel every single day with only the driver inside. Simultaneously, informal carpool coordination through messaging groups breaks down because there is no automated schedule matching, no seat locking, and no institutional verification. 

Crucially, most academic and rudimentary carpool systems calculate fares using straight-line Euclidean distance between GPS points. In real road networks, geographic obstacles and one-way streets make road travel 20% to 40% longer. When costs are split using straight lines, either the driver absorbs heavy losses or passengers are unfairly billed. CoRide resolves these fundamental challenges through road-route-based distance calculation, institutional trust, and automated ride matching."
""")

    # ==========================================
    # SLIDE 2: INTRODUCTION
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Introduction: CoRide Smart Carpooling Platform", "Introduction", 2)

    add_card(s2, Inches(0.8), Inches(1.5), Inches(5.7), Inches(2.6), "What is CoRide?", [
        "A full-stack, closed-loop ride-sharing platform connecting verified commuters.",
        "Specialized for institutional hubs (colleges, universities, corporate tech parks).",
        "Enables vehicle owners to offer vacant seats along their routine daily commute.",
        "Provides prospective passengers with smart search, matching, and seat reservation workflows."
    ])

    add_card(s2, Inches(6.83), Inches(1.5), Inches(5.7), Inches(2.6), "Why a Digital Platform is Critical", [
        "Replaces fragmented, manual messaging with structured, transactional workflows.",
        "Automates route-corridor alignment and schedule synchronization within 15-30 min windows.",
        "Enforces institutional domain verification (@stanford.edu, corporate SSO) for peer trust.",
        "Guarantees fare transparency and accountability through dynamic boarding verification."
    ])

    add_card(s2, Inches(0.8), Inches(4.3), Inches(11.733), Inches(2.7), "End-to-End Operational Lifecycle", [
        "Step 1: Driver Profile & Verification — Vehicle owner registers car details and verifies institutional credentials.",
        "Step 2: Ride Publishing — Driver schedules commute (origin, destination, time, seats, and rate/km).",
        "Step 3: Multi-Factor Discovery — Commuters search matching corridors; system filters spatial and temporal overlap.",
        "Step 4: Authoritative Road Quoting — OSRM road-routing calculates true driving distance and precise seat cost.",
        "Step 5: Atomic Booking & Confirmation — Passenger requests seat; driver accepts/rejects; seats update atomically.",
        "Step 6: Attendance & Boarding — Driver starts trip; passenger scans rotating Dynamic TOTP QR pass with geofencing."
    ], bg_color=WHITE, border_color=DARK_GREEN)

    set_speaker_notes(s2, """Speaker Notes for Slide 2 (Introduction):
"Slide 2 introduces CoRide. Carpooling fundamentally means sharing empty seats in private vehicles for mutually beneficial travel. While commercial giants like Uber and Ola focus on on-demand commercial taxi aggregation with unfamiliar drivers, CoRide focuses on routine, recurring commutes between verified members of the same organization.

Our platform provides an end-to-end digital lifecycle: from vehicle registration and recurring ride scheduling, to automated corridor matching, real driving-distance fare quotes via OSRM, atomic seat reservation, and a tamper-proof dynamic QR attendance audit trail. This transforms casual, unreliable carpooling into a dependable daily mobility utility."
""")

    # ==========================================
    # SLIDE 3: GAPS IDENTIFIED IN EXISTING SYSTEMS
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Gaps Identified in Existing Commute Solutions", "Gap Analysis", 3)

    add_card(s3, Inches(0.8), Inches(1.5), Inches(3.7), Inches(5.5), "Gap 1: Trust & Security Void", [
        "Existing Limitation: Commercial apps (Uber Share, BlaBlaCar) match unverified strangers without affiliation checks.",
        "Effect on Users: Commuters—especially female passengers—experience significant security apprehensions and safety risks.",
        "CoRide Solution: Institutional verification using enterprise/university email OTP domain white-listing, ID badge audits, and DL verification."
    ])

    add_card(s3, Inches(4.81), Inches(1.5), Inches(3.7), Inches(5.5), "Gap 2: The Straight-Line Fare Error", [
        "Existing Limitation: Academic models rely on straight-line Haversine math, ignoring road topology and winding curves.",
        "Effect on Users: Severe cost misallocations; drivers incur fuel losses on detours while passengers face disputed fares.",
        "CoRide Solution: Integration with OSRM (Open Source Routing Machine) driving-distance engine, paired with vector forward-ordering and road-winding fallbacks."
    ])

    add_card(s3, Inches(8.83), Inches(1.5), Inches(3.7), Inches(5.5), "Gap 3: Rigid Rides vs Recurring Needs", [
        "Existing Limitation: Apps focus on ad-hoc one-off trips; zero native support for recurring 5-day weekly shift synchronisation.",
        "Effect on Users: Users must re-search, re-negotiate, and re-book twice daily every single weekday.",
        "CoRide Solution: Automated recurring ride engine that generates parent-child scheduled instances across weekly active days with batch management."
    ])

    set_speaker_notes(s3, """Speaker Notes for Slide 3 (Gaps Identified):
"On Slide 3, we analyze the critical gaps in both existing commercial applications and prior academic literature. 
First, commercial ridesharing apps match strangers. For university students and corporate employees, safety and peer trust are non-negotiable. CoRide bridges this with closed-loop institutional verification.
Second, earlier prototypes calculate travel distances as the crow flies using the Haversine formula. In cities with rivers, highways, and one-way grids, straight-line distance is fundamentally flawed. CoRide integrates road-network routing through OSRM to determine actual tarmac distances.
Third, existing platforms treat rides as isolated ad-hoc transactions. Commuters need routine daily rides. CoRide introduces automated recurring schedule generation with atomic seat management."
""")

    # ==========================================
    # SLIDE 4: OBJECTIVES OF CORIDE
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Project Objectives: Primary & Technical Goals", "Objectives", 4)

    add_card(s4, Inches(0.8), Inches(1.5), Inches(5.7), Inches(2.7), "Primary Functional Objectives", [
        "User & Organization Onboarding: Secure authentication with institutional domain verification.",
        "Vehicle Management: Enable drivers to register verified vehicles with seating capacities.",
        "Ride Creation & Recurrence: Allow drivers to publish single or recurring weekday commutes.",
        "Corridor-Based Ride Discovery: Empower passengers to find rides aligned with their routes."
    ])

    add_card(s4, Inches(6.83), Inches(1.5), Inches(5.7), Inches(2.7), "Technical Engineering Objectives", [
        "Multi-Factor Matching Engine: Implement weighted scoring (Route 40%, Time 25%, Org 15%, Pref 10%, Rating 10%).",
        "Road-Route Distance Integration: Replace Euclidean distance with OSRM driving route APIs.",
        "Parametric Route Geometry: Enforce vector dot-product alignment and corridor perpendicular thresholds (max 10 km).",
        "Atomic Booking Transactions: Prevent overbooking and race conditions using ACID database transactions."
    ])

    add_card(s4, Inches(0.8), Inches(4.4), Inches(5.7), Inches(2.6), "Status: Implemented Features", [
        "JWT Authentication & Organization OTP domain verification.",
        "Full CRUD for Vehicles and Ride publishing.",
        "Recurring Ride Generator across scheduled weekdays.",
        "OSRM Road-Network Distance & Fair Pricing Quote module.",
        "Atomic Prisma Booking with Seat Decrementing & Rollback.",
        "Rotating Dynamic TOTP QR Boarding Pass with Geofence audit."
    ], bg_color=LIGHT_GREEN, border_color=EMERALD)

    add_card(s4, Inches(6.83), Inches(4.4), Inches(5.7), Inches(2.6), "Status: Under Active / Planned Dev", [
        "Self-hosted OSRM container with multi-waypoint TSP optimization.",
        "Automated OCR scanning for Govt Driving License and RC books.",
        "WebSocket-driven real-time live GPS transit tracking.",
        "Integrated UPI/Escrow payment gateway for automated splits."
    ], bg_color=LIGHT_BG, border_color=ACCENT_AMBER)

    set_speaker_notes(s4, """Speaker Notes for Slide 4 (Objectives):
"Slide 4 delineates our project objectives, strictly categorized into primary user objectives and technical engineering objectives, clearly distinguishing what is fully implemented from what is in active development.

Our primary objective was to deliver a complete, responsive carpool platform with institutional trust. Technically, our objectives focused on multi-factor weighted matching, road-network distance calculation, atomic concurrency handling to eliminate overbooking, and dynamic QR boarding verification. As highlighted in the bottom panels, our core backend services, routing algorithms, database transactions, and client interfaces are fully implemented and verified in the repository."
""")

    # ==========================================
    # SLIDE 5: LITERATURE REVIEW
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Literature Review: Comparative Analysis & Research Gaps", "Literature Review", 5)

    # Table with literature review
    rows, cols = 6, 6
    table_shape = s5.shapes.add_table(rows, cols, Inches(0.8), Inches(1.5), Inches(11.733), Inches(4.5))
    table = table_shape.table
    table.columns[0].width = Inches(1.8) # Author & Year
    table.columns[1].width = Inches(2.3) # Title & Venue
    table.columns[2].width = Inches(1.9) # Focus & Approach
    table.columns[3].width = Inches(2.0) # Main Findings
    table.columns[4].width = Inches(1.8) # Relevance to CoRide
    table.columns[5].width = Inches(1.933) # Gap Addressed

    headers = ["Author & Year", "Paper Title & Venue", "Focus & Method", "Key Findings", "Relevance", "Gap Addressed by CoRide"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.fill.solid()
        cell.fill.fore_color.rgb = DARK_GREEN
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = WHITE
        p.alignment = PP_ALIGN.CENTER

    data = [
        ("Beed et al. (2021)", "Hybrid Multi-Objective Carpool Route Optimization (Comp. Res. & Mod.)", "Genetic Algorithm (GA) + A* pathfinding on road network", "Superior detour minimization over standard GA algorithms", "Validates road-network routing over straight line", "Lacks institutional trust, verification, and recurring booking"),
        ("Pelzer et al. (2015)", "Partition-Based Match Making for Dynamic Ridesharing (IEEE T-ITS)", "Spatial partitioning on Singapore urban trip dataset", "30% reduction in matchmaking computation time", "Inspires CoRide spatial corridor bounding box filter", "No recurring schedule support or transparent fare-sharing formula"),
        ("Xia et al. (2019)", "Carpooling Algorithm with Common Departure (IEEE IUCC)", "Global cost optimization for shared origin transit hubs", "Minimizes system-wide vehicle detours and congestion", "Directly models campus & tech-park hub departures", "Centralized theoretical model; lacks user confirmation & mobile UI"),
        ("Chau et al. (2022)", "Decentralized Ride-Sharing with Fair Cost-Sharing (IEEE T-ITS)", "Cooperative game theory & stable cost-splitting", "Proves fair cost-sharing approximates social optimality", "Underpins CoRide segment-based fair cost sharing", "Theoretical study on taxi data; lacks full software implementation"),
        ("Qin et al. (2021)", "Reinforcement Learning for Ridesharing: Survey (arXiv:2105.01099)", "Comprehensive survey on RL for matching & dispatching", "Identifies multi-objective coordination challenges", "Provides algorithmic benchmark for matching systems", "Academic survey; CoRide delivers working heuristic implementation")
    ]

    for row_idx, row_data in enumerate(data, start=1):
        for col_idx, text in enumerate(row_data):
            cell = table.cell(row_idx, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = WHITE if row_idx % 2 != 0 else LIGHT_BG
            p = cell.text_frame.paragraphs[0]
            p.text = text
            p.font.size = Pt(8.5)
            p.font.color.rgb = DARK_SLATE

    # Research gap summary box
    gap_box = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.1), Inches(11.733), Inches(0.9))
    gap_box.fill.solid()
    gap_box.fill.fore_color.rgb = LIGHT_GREEN
    gap_box.line.color.rgb = EMERALD
    tf_gap = gap_box.text_frame
    tf_gap.word_wrap = True
    p_g = tf_gap.paragraphs[0]
    p_g.text = "Identified Research Gap Motivating CoRide:"
    p_g.font.bold = True
    p_g.font.size = Pt(10)
    p_g.font.color.rgb = DARK_GREEN
    p_g2 = tf_gap.add_paragraph()
    p_g2.text = "Prior literature focuses heavily on isolated mathematical routing or theoretical cost-sharing proofs on taxi datasets, but completely omits the socio-technical integration required for adoption: institutional peer verification, recurring weekday commute synchronization, and tamper-resistant digital boarding verification."
    p_g2.font.size = Pt(9.5)
    p_g2.font.color.rgb = DARK_SLATE

    set_speaker_notes(s5, """Speaker Notes for Slide 5 (Literature Review):
"Slide 5 outlines our literature survey. We reviewed authentic IEEE, Elsevier, and arXiv publications. 
Beed et al. (2021) demonstrated that road-network routing using A* outperforms straight-line models. Pelzer et al. (2015) in IEEE Transactions on Intelligent Transportation Systems proved that spatial partitioning accelerates large-scale matching. Xia et al. (2019) investigated common departure hubs for corporate campuses, while Chau et al. (2022) established theoretical proofs for fair cost sharing. Finally, Qin et al. (2021) on arXiv provided an exhaustive survey on rideshare dispatching.

The overarching research gap is evident: existing academic studies offer sophisticated theoretical formulations but lack a complete, deployable software ecosystem combining institutional trust, recurring weekly scheduling, and dynamic road routing."
""")

    # ==========================================
    # SLIDE 6: HIGH-LEVEL SYSTEM ARCHITECTURE
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "High-Level System Architecture", "Architecture", 6)

    # 4 Architecture Columns (Tiers)
    add_card(s6, Inches(0.8), Inches(1.5), Inches(2.7), Inches(5.5), "1. Client Tier (Presentation)", [
        "Mobile-First Responsive Web Application built with React 19 & Vite.",
        "Tailwind CSS 3.4 design tokens (Deep Forest Green #0F5132 & White).",
        "React-Leaflet & OpenStreetMap interactive mapping component.",
        "QR Code Generator (Driver) & HTML5 Camera QR Scanner (Passenger).",
        "Context-based state management (AuthContext, active commute hooks)."
    ])

    add_card(s6, Inches(3.8), Inches(1.5), Inches(2.7), Inches(5.5), "2. Application / API Tier", [
        "Node.js runtime with Express.js RESTful API framework.",
        "Security middleware: Helmet.js, CORS, Morgan HTTP logger.",
        "JWT Authentication & Role-Based Access Control (USER, ADMIN).",
        "Controllers: Auth, Users, Vehicles, Rides, Bookings, Attendance.",
        "Async error handling with centralized JSON error responder."
    ])

    add_card(s6, Inches(6.8), Inches(1.5), Inches(2.7), Inches(5.5), "3. Business Logic & Services", [
        "Matching Engine: Multi-factor weighted compatibility scoring.",
        "Routing Service: Vector dot-product checks & corridor bounding.",
        "Recurring Engine: Weekday pattern resolver & instance scheduler.",
        "Attendance Engine: Rotating HMAC-SHA256 TOTP QR generation.",
        "Geofence Validator: Haversine distance pickup checks."
    ])

    add_card(s6, Inches(9.8), Inches(1.5), Inches(2.7), Inches(5.5), "4. Persistence & External APIs", [
        "Database: MySQL 8.0 relational persistence.",
        "ORM Layer: Prisma 6 Client with type-safe schema & migrations.",
        "ACID Transactions: Atomic seat reservations and rollbacks.",
        "External Routing: OSRM Public Demo Server API (driving distance).",
        "Tile Provider: OpenStreetMap Carto tiles for Leaflet rendering."
    ])

    set_speaker_notes(s6, """Speaker Notes for Slide 6 (System Architecture):
"Slide 6 presents CoRide's high-level 4-tier architecture. 
Tier 1 is the presentation layer, built with React and Tailwind CSS, featuring Leaflet maps and dynamic QR scanning. 
Tier 2 is our Express.js API gateway, enforcing JWT security, input validation, and role-based access. 
Tier 3 houses our core domain engines: multi-factor ride matching, geometric vector validation, recurring ride scheduling, and TOTP QR attendance verification.
Tier 4 contains our MySQL database managed via Prisma ORM for atomic transactions, connected externally to the OSRM road-routing engine and OpenStreetMap. Communication flows strictly down through authenticated HTTP REST calls, ensuring loose coupling and high modularity."
""")

    # ==========================================
    # SLIDE 7: FUNCTIONAL & NON-FUNCTIONAL REQUIREMENTS
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "System Requirements: Functional & Non-Functional", "Requirements", 7)

    add_card(s7, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.5), "Functional Requirements (FR)", [
        "FR1 — User Onboarding & Auth: Email/password registration, bcrypt hashing, JWT issuance, profile management.",
        "FR2 — Organization Domain Verification: College/corporate email linking, domain whitelist validation, 6-digit OTP audit.",
        "FR3 — Vehicle Management: Driver vehicle registration (make, model, plate, seat capacity, vehicle type).",
        "FR4 — Ride Publishing: Single/recurring ride creation with origin, destination, departure time, seats, and price/km.",
        "FR5 — Corridor Search & Matching: Multi-factor passenger ride discovery with time window, route score, and reasons.",
        "FR6 — Road Distance & Fare Quote: Pre-booking authoritative driving distance and fare breakdown via OSRM.",
        "FR7 — Atomic Seat Reservation: Concurrency-safe seat decrementing, booking states (PENDING -> ACCEPTED/REJECTED).",
        "FR8 — Digital Boarding & Attendance: Rotating TOTP dynamic QR generation, passenger scanning, geofence verification."
    ])

    add_card(s7, Inches(6.83), Inches(1.5), Inches(5.7), Inches(5.5), "Non-Functional Requirements (NFR)", [
        "NFR1 — Usability: Mobile-first responsive UI with 48px+ touch targets, dark green high-contrast visual tokens, and instant feedback.",
        "NFR2 — Data Consistency & Concurrency: Zero overbooking guarantee using Prisma ACID database transactions and atomic seat counters.",
        "NFR3 — Security & Privacy: Passwords hashed with bcrypt (salt rounds = 10); JWTs signed with 7-day expiration; TOTP secrets protected.",
        "NFR4 — Routing Accuracy: Driving distance resolved via road graph (OSRM) with automatic empirical winding fallback (Haversine x 1.3).",
        "NFR5 — Performance: API response times under 200ms for database queries; OSRM timeout handled gracefully within 4000ms.",
        "NFR6 — Reliability: Graceful process shutdown handling SIGINT/SIGTERM, persistent audit logging for ride attendance."
    ])

    set_speaker_notes(s7, """Speaker Notes for Slide 7 (Requirements):
"Slide 7 breaks down the functional and non-functional requirements. 
Functionally, the system must support verified onboarding, vehicle registration, recurring ride creation, multi-factor matching, driving-distance fare quotes, atomic seat booking, and dynamic QR attendance auditing.
Non-functionally, the system prioritizes data consistency to ensure zero overbooking during concurrent requests, robust password and token security, sub-200 millisecond response times, and road-routing accuracy. All functional requirements listed on the left are implemented and verified in the codebase."
""")

    # ==========================================
    # SLIDE 8: REFERENCES (IEEE STYLE)
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "References: Academic Papers & Official Documentation", "References", 8)

    add_card(s8, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.5), "Academic Literature (IEEE Style)", [
        "[1] R. S. Beed, S. Sarkar, A. Roy, S. D. Biswas, and S. Biswas, 'A hybrid multi-objective carpool route optimization technique using genetic algorithm and A* algorithm,' Computer Research and Modeling, vol. 13, no. 1, pp. 67–85, 2021.",
        "[2] D. Pelzer, J. Xiao, D. Zehe, and H. Aydt, 'A Partition-Based Match Making Algorithm for Dynamic Ridesharing,' IEEE Trans. Intell. Transp. Syst., vol. 16, no. 5, pp. 2587–2598, Oct. 2015.",
        "[3] X. Xia, H. Liu, J. Li, X. Liu, R. Zhu, and C. Zong, 'Carpooling Algorithm with the Common Departure,' in Proc. IEEE IUCC/DSCI/SmartCNS, Shenyang, China, 2019, pp. 513–520.",
        "[4] S. C.-K. Chau, S. Shen, and Y. Zhou, 'Decentralized Ride-Sharing and Vehicle-Pooling Based on Fair Cost-Sharing Mechanisms,' IEEE Trans. Intell. Transp. Syst., vol. 23, no. 3, pp. 2486–2497, Mar. 2022.",
        "[5] Z. Qin et al., 'Reinforcement Learning for Ridesharing: An Extended Survey,' arXiv:2105.01099 [cs.LG], May 2021."
    ])

    add_card(s8, Inches(6.83), Inches(1.5), Inches(5.7), Inches(5.5), "Technical Frameworks & API Standards", [
        "[6] Prisma Team, 'Prisma ORM Documentation: Database Modeling, Relations, and Transactions,' Prisma Data Inc., 2024. [Online]. Available: https://www.prisma.io/docs",
        "[7] Project OSRM, 'Open Source Routing Machine API Documentation (v5.24.0) — Route & Distance Engine,' 2024. [Online]. Available: https://project-osrm.org",
        "[8] OpenStreetMap Foundation, 'OpenStreetMap Cartography & Nominatim Geocoding API,' 2024. [Online]. Available: https://www.openstreetmap.org",
        "[9] React Core Team, 'React: The Library for Web and Native User Interfaces (v19),' Meta Platforms, Inc., 2024. [Online]. Available: https://react.dev",
        "[10] Express.js Foundation, 'Express: Fast, Unopinionated, Minimalist Web Framework for Node.js,' OpenJS Foundation, 2024. [Online]. Available: https://expressjs.com",
        "[11] Leaflet Team, 'Leaflet: An Open-Source JavaScript Library for Mobile-Friendly Interactive Maps,' 2024. [Online]. Available: https://leafletjs.com"
    ])

    set_speaker_notes(s8, """Speaker Notes for Slide 8 (References):
"Slide 8 presents our verified academic and technical references, formatted strictly according to IEEE standards. 
References 1 through 5 represent the peer-reviewed papers foundational to our matching algorithms, spatial partitioning, hub departure modeling, and cooperative game-theoretic cost sharing. 
References 6 through 11 represent the authoritative technical documentation for Prisma ORM, the Project OSRM routing engine, OpenStreetMap, React 19, Express.js, and Leaflet. Every listed reference directly corresponds to an inspected component in our system architecture."
""")

    # ==========================================
    # SLIDE 9: DETAILED SYSTEM ARCHITECTURE
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Detailed System Architecture & Data Pipelines", "Detailed Architecture", 9)

    add_card(s9, Inches(0.8), Inches(1.5), Inches(3.7), Inches(5.5), "Client-Side Components", [
        "Pages: FindPoolPage, OfferPoolPage, RideDetails, LiveRidePage, ProfilePage, AlertsPage.",
        "Map Components: RouteMap (Leaflet polyline renderer), LocationPickerModal (coordinate picker).",
        "Attendance UI: QRCodeDisplay (rotates dynamic token), QRCodeScanner (camera QR reader).",
        "Services: api.js (Axios with JWT interceptor), rideService, bookingService, routingService."
    ], bg_color=WHITE, border_color=DARK_SLATE, title_color=DARK_SLATE)

    add_card(s9, Inches(4.81), Inches(1.5), Inches(3.7), Inches(5.5), "Express Backend & Middleware", [
        "Routes: /api/auth, /api/users, /api/vehicles, /api/rides, /api/bookings, /api/attendance.",
        "Middleware: authenticateToken (JWT verification), requireRole, requestValidator.",
        "Controllers: rides.controller.js (create, list, getMatches), bookings.controller.js (create, updateStatus, getQuote).",
        "Utility Services: matching.service.js, routing.service.js, recurring.service.js, attendance.utils.js."
    ], bg_color=LIGHT_GREEN, border_color=DARK_GREEN, title_color=DARK_GREEN)

    add_card(s9, Inches(8.83), Inches(1.5), Inches(3.7), Inches(5.5), "Data & External Integration", [
        "Prisma 6 Client: Auto-generated type-safe query builder.",
        "MySQL Tables: organizations, users, email_verification_otps, vehicles, rides, bookings, attendance_logs, notifications.",
        "OSRM Routing Service: HTTP calls to Project OSRM driving API with 4s timeout & abort controller.",
        "Nodemailer Service: SMTP transport for campus OTP email delivery."
    ], bg_color=WHITE, border_color=EMERALD, title_color=DARK_GREEN)

    set_speaker_notes(s9, """Speaker Notes for Slide 9 (Detailed Architecture):
"Slide 9 drills down into the detailed component architecture and internal pipelines of CoRide. 
On the frontend, specialized pages interact with modular services using an Axios client preconfigured with automatic JWT header attachment. The Leaflet RouteMap decodes route geometry and visually renders driver origin, passenger pickup, drop-off, and destination pins.
On the backend, our Express router dispatches through security middleware into dedicated controllers. The controllers invoke our domain services—for instance, the booking controller calls routing.service.js to check vector compatibility and calculate driving distance via OSRM before executing atomic database writes.
Finally, Prisma ORM communicates with MySQL through connection pooling, ensuring transaction isolation across all 8 relational entities."
""")

    # ==========================================
    # SLIDE 10: ALGORITHM & MATHEMATICAL MODELS
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "Core Algorithms: Matching, Geometry & Pricing", "Algorithms", 10)

    add_card(s10, Inches(0.8), Inches(1.5), Inches(5.7), Inches(2.7), "1. Multi-Factor Matching Algorithm", [
        "Score Formula: S_total = 0.40(S_route) + 0.25(S_time) + 0.15(S_org) + 0.10(S_pref) + 0.10(S_rating).",
        "Spatial Deviation: S_route = 100 * (1 - (dist_pick + dist_drop) / MAX_DEV).",
        "Temporal Deviation: S_time = 100 * (1 - |Δt| / MAX_TIME_WINDOW).",
        "Org Bonus: S_org = 100 if passengerOrgId == driverOrgId else 0.",
        "Complexity: O(N log N) where N is scheduled candidate rides in time window."
    ])

    add_card(s10, Inches(6.83), Inches(1.5), Inches(5.7), Inches(2.7), "2. Parametric Vector Compatibility Check", [
        "Driver Vector: V_D = (Dest_lat - Orig_lat, Dest_lon - Orig_lon).",
        "Passenger Vector: V_P = (Drop_lat - Pick_lat, Drop_lon - Pick_lon).",
        "Direction Check: V_D · V_P > 0 (strictly positive dot product).",
        "Forward Ordering: t_pick < t_drop along V_D parametric projection (t ∈ [-0.2, 1.2]).",
        "Cross-Track Corridor: Perpendicular distance from line segment ≤ 10 km."
    ])

    add_card(s10, Inches(0.8), Inches(4.4), Inches(5.7), Inches(2.6), "3. Road Distance Estimation (OSRM)", [
        "Primary: OSRM Driving API HTTP query: router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}.",
        "Extraction: data.routes[0].distance / 1000 => distanceKm.",
        "Fallback: If OSRM fails or times out (>4000ms):",
        "Distance_est = Haversine(pick, drop) * 1.3 (empirical road winding factor)."
    ])

    add_card(s10, Inches(6.83), Inches(4.4), Inches(5.7), Inches(2.6), "4. Fair Cost-Sharing Calculation", [
        "Base Rate: PricePerKm (default ₹5.00/km set by vehicle driver).",
        "Raw Fare: RawFare = distanceKm * PricePerKm.",
        "Minimum Fare: PerSeat = max(₹10.00, RawFare).",
        "Driver Ceiling Cap: PerSeat = min(PerSeat, TotalTripCost).",
        "Total Booking Fare: TotalFare = PerSeat * SeatsBooked."
    ], bg_color=LIGHT_GREEN, border_color=EMERALD)

    set_speaker_notes(s10, """Speaker Notes for Slide 10 (Algorithms):
"Slide 10 details the algorithmic foundations of CoRide. 
First, our multi-factor matching engine calculates a normalized 0-100 score across 5 weighted dimensions: 40% route proximity, 25% departure time alignment, 15% institutional affiliation bonus, 10% travel preferences, and 10% driver convenience rating.
Second, before any booking can occur, routing.service.js performs a parametric vector compatibility check. It computes the dot product between the driver's route vector and the passenger's travel vector. If the dot product is negative or zero, travel is in the opposite direction and is rejected. It then computes parametric projections t_pickup and t_drop to ensure the passenger's pickup occurs strictly before drop-off along the driver's path, within a 10km perpendicular corridor.
Third, distance is resolved via OSRM driving routes with an empirical 1.3 Haversine winding factor fallback.
Fourth, our fare formula enforces a minimum fare of ₹10, bills proportionally to road kilometers, and caps the cost at the driver's stated total trip expenditure."
""")

    # ==========================================
    # SLIDE 11: TECHNOLOGY STACK & DOMAIN MODEL
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, "Technology Stack & Logical Domain Model", "Technology & Model", 11)

    add_card(s11, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.5), "Verified Technology Stack", [
        "Frontend Framework: React 19 with Vite 6 build tooling for rapid HMR.",
        "Styling & Design System: Tailwind CSS 3.4 with custom mobility color tokens.",
        "Mapping Engine: Leaflet 1.9 & React-Leaflet with OpenStreetMap tiles.",
        "Backend Runtime: Node.js (v18+) with Express.js REST API framework.",
        "Database Engine: MySQL 8.0 relational database with connection pooling.",
        "ORM & Migrations: Prisma 6 ORM with declarative schema and type-safety.",
        "Security & Crypto: Bcrypt.js (password salts), JSON Web Tokens (JWT), Node Crypto (TOTP SHA-256).",
        "Routing Service: OSRM (Open Source Routing Machine) driving API."
    ])

    add_card(s11, Inches(6.83), Inches(1.5), Inches(5.7), Inches(5.5), "Logical Domain Entities", [
        "1. Organization: Campus/tech park boundary with domain list and geofence.",
        "2. User: Student/faculty/employee profile with verification status & ratings.",
        "3. EmailVerificationOtp: Hashed 6-digit verification code with 60s cooldown.",
        "4. Vehicle: Transport asset linked to driver with registration & seat capacity.",
        "5. Ride: Offered commute with coordinates, recurrence pattern, and price/km.",
        "6. Booking: Seat reservation with route coordinates, fare quote, and lifecycle status.",
        "7. AttendanceLog: Digital audit record capturing TOTP hash, GPS coords, and geofence validity.",
        "8. Notification: In-app transactional alerts for ride events and match proposals."
    ], bg_color=LIGHT_GREEN, border_color=DARK_GREEN)

    set_speaker_notes(s11, """Speaker Notes for Slide 11 (Tech Stack & Model):
"Slide 11 highlights our verified technology stack and logical domain model. 
We deliberately selected an enterprise-grade stack: React 19 and Vite for a lightweight, mobile-first client, Leaflet for zero-cost OpenStreetMap rendering, Node.js and Express for the REST API, and MySQL 8 with Prisma ORM. Prisma guarantees declarative schema safety and transaction management.
On the right, you see our 8 logical domain models, which map directly to the Prisma schema: Organization, User, EmailVerificationOtp, Vehicle, Ride, Booking, AttendanceLog, and Notification. Each model represents a specific stage in the carpooling lifecycle."
""")

    # ==========================================
    # SLIDE 12: DATA FLOW DIAGRAM (DFD LEVEL 0 & 1)
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    add_header(s12, "Data Flow Diagrams: Context (L0) & Process (L1)", "Data Flow Diagram", 12)

    add_card(s12, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.5), "DFD Level 0: System Context Diagram", [
        "External Entity 1: Passenger / Commuter",
        "  -> Sends: Registration, Ride Search, Booking Request, Boarding QR Scan.",
        "  <- Receives: Auth Token, Match Results, Fare Quote, Confirmation.",
        "External Entity 2: Driver / Vehicle Owner",
        "  -> Sends: Vehicle Specs, Ride Schedule, Accept/Reject Action, Trip Start.",
        "  <- Receives: Booking Requests, Dynamic Boarding Pass, Passenger Roster.",
        "External Entity 3: External Routing Service (OSRM / OSM)",
        "  -> Receives: Waypoint Coordinates (lat, lon).",
        "  <- Returns: True Road Distance (meters), Route Polyline Geometry.",
        "Central System Bubble: CoRide Platform Core."
    ])

    add_card(s12, Inches(6.83), Inches(1.5), Inches(5.7), Inches(5.5), "DFD Level 1: Core Sub-Processes", [
        "P1.0 Authentication & Org Verification: Validates credentials & campus email domains; writes to Users & OTP Data Stores (D1, D2).",
        "P2.0 Vehicle & Ride Publishing: Ingests driver schedules, generates recurring instances; writes to Vehicles & Rides (D3, D4).",
        "P3.0 Route Compatibility & Matching: Filters candidate rides, executes multi-factor scoring against Rides Store (D4).",
        "P4.0 Road Distance & Fare Quoting: Dispatches OSRM queries, calculates fair per-km fare quotes.",
        "P5.0 Atomic Booking & Seat Allocation: Executes transaction, decrements available seats; writes to Bookings Store (D5).",
        "P6.0 Boarding & Attendance Audit: Validates TOTP QR token and geofence accuracy; writes to AttendanceLogs Store (D6)."
    ], bg_color=WHITE, border_color=DARK_GREEN)

    set_speaker_notes(s12, """Speaker Notes for Slide 12 (Data Flow Diagram):
"Slide 12 presents the Data Flow Diagrams. In the Level 0 Context Diagram on the left, three external entities interact with the CoRide core: the Passenger, the Driver, and the External Routing Service.
In the Level 1 DFD on the right, the core bubble is decomposed into 6 discrete sub-processes: Authentication (P1.0), Ride Management (P2.0), Route Matching (P3.0), Road Distance & Fare Calculation (P4.0), Atomic Booking Management (P5.0), and Attendance Auditing (P6.0). 
Notice how data stores D1 through D6 map directly to our relational database tables, ensuring structured state transitions without data leakage."
""")

    # ==========================================
    # SLIDE 13: DETECTION & MATCHING FLOWCHART
    # ==========================================
    s13 = prs.slides.add_slide(blank_layout)
    add_header(s13, "Flowchart: Ride Matching & Route Compatibility", "Matching Flowchart", 13)

    add_card(s13, Inches(0.8), Inches(1.5), Inches(3.7), Inches(5.5), "Phase 1: Input & DB Pruning", [
        "1. Start: Passenger submits pickup, drop, departure time, and seats.",
        "2. Validation: Check coordinate bounds (-90..90, -180..180) and future time.",
        "3. Database Filter: Query Rides where status = 'SCHEDULED', availableSeats >= requested, driverId != passengerId.",
        "4. Time Window Windowing: Filter departureTime within ±3 hours.",
        "Decision Branch: If 0 rides found -> Return 'No rides found matching time/seats'."
    ])

    add_card(s13, Inches(4.81), Inches(1.5), Inches(3.7), Inches(5.5), "Phase 2: Geometric & Route Checks", [
        "5. Distance Thresholds: Haversine(pick, orig) <= 10 km and Haversine(drop, dest) <= 10 km.",
        "6. Vector Dot Product: Check (V_D · V_P) > 0. If negative -> Reject (Opposite travel direction).",
        "7. Parametric Projection: Verify t_pickup < t_drop along driver vector line segment.",
        "8. Corridor Check: Perpendicular distance to line <= 10 km.",
        "Decision Branch: If checks fail -> Ride pruned from candidate pool."
    ], bg_color=LIGHT_GREEN, border_color=EMERALD)

    add_card(s13, Inches(8.83), Inches(1.5), Inches(3.7), Inches(5.5), "Phase 3: Scoring & Selection", [
        "9. Multi-Factor Scoring: Calculate Route (40%), Time (25%), Org (15%), Prefs (10%), Quality (10%).",
        "10. Generate Match Reasons: Explanations (e.g., 'Same Organization', 'Close Pickup').",
        "11. Rank Results: Sort descending by overallScore.",
        "12. Display Matches: User selects ride & views road-distance fare quote via OSRM.",
        "13. Proceed to Booking: Passenger clicks 'Request Ride'."
    ])

    set_speaker_notes(s13, """Speaker Notes for Slide 13 (Matching Flowchart):
"Slide 13 diagrams the exact decision logic executed when a passenger searches for a ride. 
The algorithm proceeds in three phases:
Phase 1 validates inputs and executes fast database-level indexing to prune rides outside the 3-hour departure window or with insufficient seats.
Phase 2 performs geometric filtering. It computes the dot product of the travel vectors to eliminate opposite-direction drivers, verifies parametric forward ordering to ensure pickup happens before drop-off, and discards detours exceeding the 10km route corridor.
Phase 3 calculates the weighted multi-factor score, attaches human-readable match reasons, ranks the candidate rides, and renders them to the user with an exact OSRM driving-route fare quote."
""")

    # ==========================================
    # SLIDE 14: PAIRING SEQUENCE DIAGRAM
    # ==========================================
    s14 = prs.slides.add_slide(blank_layout)
    add_header(s14, "Pairing Sequence: End-to-End Booking Lifecycle", "Sequence Diagram", 14)

    add_card(s14, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.5), "Chronological Message Sequence (UML)", [
        "1. Passenger -> Frontend: Enters search parameters (pickup, drop, time, seats).",
        "2. Frontend -> API Gateway: GET /api/rides/matches with JWT Auth token.",
        "3. API Gateway -> MatchingService: generateMatches(params).",
        "4. MatchingService -> Database (MySQL): Prune scheduled candidate rides.",
        "5. MatchingService -> RoutingService: Validate vector alignment & corridor bounds.",
        "6. MatchingService -> Frontend: Returns ranked matches with scores & reasons.",
        "7. Passenger -> Frontend: Selects preferred ride and clicks 'Book'.",
        "8. Frontend -> API Gateway: POST /api/bookings/quote (fetches OSRM fare).",
        "9. Frontend -> API Gateway: POST /api/bookings (initiates transaction).",
        "10. API Gateway -> Database: Prisma $transaction -> Decrements seats, inserts Booking (PENDING).",
        "11. API Gateway -> NotificationService: Alert driver of incoming booking request."
    ])

    add_card(s14, Inches(6.83), Inches(1.5), Inches(5.7), Inches(5.5), "Confirmation & Alternative Branches", [
        "Happy Path (Driver Accepts):",
        "  12. Driver -> API: PATCH /api/bookings/:id/status (ACCEPTED).",
        "  13. API -> Database: Update booking status to ACCEPTED.",
        "  14. API -> NotificationService: Alert passenger 'Ride Confirmed'.",
        "",
        "Alternative Branch A (Driver Rejects):",
        "  - Driver sets status to REJECTED.",
        "  - Database transaction automatically increments availableSeats back.",
        "  - Passenger alerted 'Booking Rejected'.",
        "",
        "Alternative Branch B (Passenger Cancels):",
        "  - Passenger DELETE /api/bookings/:id.",
        "  - Status set to CANCELLED_PASSENGER; reserved seats refunded to Ride."
    ], bg_color=LIGHT_GREEN, border_color=DARK_GREEN)

    set_speaker_notes(s14, """Speaker Notes for Slide 14 (Pairing Sequence):
"Slide 14 models the pairing sequence diagram. 
The chronological sequence illustrates the exact handshake: the passenger requests matches, the matching service evaluates geometric compatibility, and ranked matches are displayed.
When the passenger confirms the booking, a pre-flight fare quote is generated using OSRM. The booking creation is executed inside a Prisma database transaction. This is critical: if seats are available, the seat count is decremented and the booking status is set to PENDING in a single atomic commit.
As shown in the alternative branches on the right, if the driver subsequently rejects the request or the passenger cancels, the reserved seats are safely restored back to the ride pool, guaranteeing complete state integrity."
""")

    # ==========================================
    # SLIDE 15: ENTITY-RELATIONSHIP DIAGRAM (ERD)
    # ==========================================
    s15 = prs.slides.add_slide(blank_layout)
    add_header(s15, "Entity-Relationship Model: Database Schema", "ER Diagram", 15)

    add_card(s15, Inches(0.8), Inches(1.5), Inches(3.7), Inches(5.5), "Core User & Org Entities", [
        "organizations (1 : N with users)",
        "  - PK: id (UUID)",
        "  - name, orgType, domainList (JSON), campusLatitude, campusLongitude, geofenceRadiusMeters.",
        "",
        "users (1 : N with vehicles, rides, bookings)",
        "  - PK: id (UUID), FK: organizationId",
        "  - name, email, passwordHash, phone, role, isVerified, orgEmail, isOrgVerified, dlNumber, isDlVerified, driverRatingAvg, passengerRatingAvg.",
        "",
        "email_verification_otps (N : 1 with users)",
        "  - PK: id, FK: userId, otpHash, expiresAt, attempts, verifiedAt."
    ])

    add_card(s15, Inches(4.81), Inches(1.5), Inches(3.7), Inches(5.5), "Vehicle & Ride Entities", [
        "vehicles (1 : N with rides)",
        "  - PK: id, FK: userId",
        "  - make, model, year, color, plateNumber (Unique), seatCapacity, vehicleType, isVerified.",
        "",
        "rides (1 : N with bookings, attendance_logs)",
        "  - PK: id, FK: driverId, FK: vehicleId",
        "  - originAddress, originLatitude/Longitude, destinationAddress, destinationLatitude/Longitude, departureTime, totalSeats, availableSeats, pricePerKm, totalTripCost, isRecurring, recurringDays (JSON), recurringParentId, status, activeTotpSecret."
    ], bg_color=LIGHT_GREEN, border_color=EMERALD)

    add_card(s15, Inches(8.83), Inches(1.5), Inches(3.7), Inches(5.5), "Booking, Audit & Alerts", [
        "bookings (N : 1 with rides, users)",
        "  - PK: id, FK: rideId, FK: passengerId (Unique composite: [rideId, passengerId])",
        "  - seatsBooked, fareContributionTotal, distanceKm, pickup/drop coordinates, status, isAttended, attendedAt.",
        "",
        "attendance_logs (N : 1 with bookings)",
        "  - PK: id, FK: bookingId, FK: rideId, FK: passengerId",
        "  - method (DYNAMIC_QR/MANUAL_OTP), status, driverCoords, passengerCoords, distanceToPickupMeters, isGeofenceValid, tokenHash (Unique).",
        "",
        "notifications (N : 1 with users): recipientId, senderId, type, title, message, isRead."
    ])

    set_speaker_notes(s15, """Speaker Notes for Slide 15 (ER Diagram):
"Slide 15 shows the verified Entity-Relationship schema directly mapped from our Prisma schema.
Organizations maintain a one-to-many relationship with Users, storing allowed email domains for institutional verification. Users own multiple Vehicles and can act both as Drivers—offering Rides—and as Passengers—creating Bookings.
The Ride entity stores origin and destination geographic coordinates, seat counters, and recurrence metadata. A unique composite index on Bookings (rideId, passengerId) prevents duplicate active bookings.
Finally, the AttendanceLog table stores an immutable cryptographic audit record of every boarding event, containing the token hash, GPS coordinates of both driver and passenger, and geofence validity status."
""")

    # ==========================================
    # SLIDE 16: FUTURE SCOPE
    # ==========================================
    s16 = prs.slides.add_slide(blank_layout)
    add_header(s16, "Future Scope: Planned Enhancements & Roadmap", "Future Scope", 16)

    add_card(s16, Inches(0.8), Inches(1.5), Inches(5.7), Inches(2.7), "1. Advanced Routing & Optimization", [
        "Enterprise Google Routes API: Transition to live traffic routing with historical congestion predictive modeling.",
        "Multi-Passenger TSP Optimization: Implement Traveling Salesperson waypoint re-ordering for 3+ passenger pickups.",
        "Self-Hosted OSRM Server: Deploy custom OSRM Docker container with high-resolution regional OSM tarmac data."
    ])

    add_card(s16, Inches(6.83), Inches(1.5), Inches(5.7), Inches(2.7), "2. Automated Financial Settlement", [
        "Automated Escrow Payments: Integrate Razorpay/UPI micro-transactions held in escrow until attendance scan.",
        "Dynamic Toll & Fuel Price Sync: Automatically incorporate live city petrol prices and highway FASTag tolls.",
        "Corporate Commute Subsidy: HR/enterprise API integration for employer-sponsored green commute credits."
    ])

    add_card(s16, Inches(0.8), Inches(4.4), Inches(5.7), Inches(2.6), "3. Automated Verification & AI Safety", [
        "Govt Identity OCR: Automated DL and RC book extraction using computer vision APIs with Digilocker verification.",
        "In-Ride SOS & Telemetry: Accelerometer-based incident detection and real-time emergency contact notification.",
        "Smart Route Deviation Alerts: Anomaly detection alerting authorities if vehicle strays from planned corridor."
    ])

    add_card(s16, Inches(6.83), Inches(4.4), Inches(5.7), Inches(2.6), "4. Native Mobile Applications", [
        "React Native Mobile App: Dedicated iOS and Android builds with background GPS location beacons.",
        "Push Notifications: Firebase Cloud Messaging (FCM) for low-latency ride approach alerts.",
        "Offline QR Verification: Cryptographic public-key boarding verification when cellular connectivity drops."
    ], bg_color=LIGHT_GREEN, border_color=DARK_GREEN)

    set_speaker_notes(s16, """Speaker Notes for Slide 16 (Future Scope):
"Slide 16 details our realistic future scope, prioritizing enhancements directly addressing the current technical boundaries.
First, we plan to transition from the public OSRM demo to a dedicated self-hosted routing container with multi-passenger Traveling Salesperson waypoint re-ordering.
Second, we will integrate automated UPI and escrow payments via Razorpay, where passenger contributions are released only upon successful Dynamic QR attendance scan.
Third, we aim to implement automated OCR document scanning for Driving Licenses via Digilocker.
Finally, we plan to wrap the responsive frontend into a native React Native application with background GPS telemetry and Firebase push notifications."
""")

    # ==========================================
    # SLIDE 17: CONCLUSION
    # ==========================================
    s17 = prs.slides.add_slide(blank_layout)
    add_header(s17, "Conclusion: Summary of Contributions & Significance", "Conclusion", 17)

    # Big Summary Card
    add_card(s17, Inches(0.8), Inches(1.5), Inches(11.733), Inches(2.5), "Key Project Contributions", [
        "Addressed the Commuter Crisis: Developed a purpose-built, closed-loop carpooling system for university and corporate campuses.",
        "Eliminated the Straight-Line Distance Error: Integrated road-network routing (OSRM) with empirical winding fallbacks for true driving distances.",
        "Multi-Factor Intelligent Pairing: Engineered a 5-dimension matching algorithm combining route geometry, departure windows, and institutional affinity.",
        "Robust Concurrency & Security: Delivered atomic ACID seat reservation handling and rotating Dynamic TOTP QR boarding verification.",
        "Functional Full-Stack Artifact: Successfully engineered and verified the complete system across React 19, Express.js, Prisma, and MySQL."
    ], bg_color=WHITE, border_color=DARK_GREEN)

    # Closing statement card
    close_card = s17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.3), Inches(11.733), Inches(2.7))
    close_card.fill.solid()
    close_card.fill.fore_color.rgb = LIGHT_GREEN
    close_card.line.color.rgb = EMERALD
    close_card.line.width = Pt(1.5)
    tf_c = close_card.text_frame
    tf_c.word_wrap = True
    tf_c.margin_left = Inches(0.4)
    tf_c.margin_top = Inches(0.25)
    p_c1 = tf_c.paragraphs[0]
    p_c1.text = "Concluding Remarks & Significance:"
    p_c1.font.bold = True
    p_c1.font.size = Pt(15)
    p_c1.font.color.rgb = DARK_GREEN
    p_c1.space_after = Pt(10)

    p_c2 = tf_c.add_paragraph()
    p_c2.text = "CoRide demonstrates that sustainable, cost-effective campus commuting does not require complex commercial fleets, but rather smart digital coordination among existing verified peers. By pairing real road routing with transparent cost sharing and verifiable attendance, CoRide bridges the long-standing gap between theoretical carpooling algorithms and dependable, everyday transportation utility.\n\nThank you. We are now open for questions and evaluation."
    p_c2.font.size = Pt(12)
    p_c2.font.color.rgb = DARK_SLATE

    set_speaker_notes(s17, """Speaker Notes for Slide 17 (Conclusion):
"In conclusion, CoRide successfully solves the real-world challenges of everyday campus and corporate commuting. 
By replacing flawed straight-line calculations with authentic road-network routing via OSRM, enforcing institutional email verification, and automating recurring schedules, CoRide offers a transparent, secure, and economically viable alternative to single-occupancy vehicle travel.

Our database transactions prevent concurrency errors, our multi-factor algorithm ranks the best commute partners, and our dynamic QR attendance ensures drivers and passengers trust each other. CoRide transforms theoretical carpooling research into a practical, working software artifact. 

Thank you very much for your time and guidance. We welcome your questions, feedback, and evaluation."
""")

    # Save presentation
    output_filename = "CoRide_Final_Presentation.pptx"
    prs.save(output_filename)
    print(f"Successfully generated {output_filename} with 17 complete slides and speaker notes.")

if __name__ == "__main__":
    create_deck()
