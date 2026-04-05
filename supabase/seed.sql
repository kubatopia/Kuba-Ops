-- ============================================================
-- Seed Data — Venture CRM
-- Run AFTER schema.sql
-- Dates are relative to ~early April 2026
-- ============================================================

-- Clients with explicit IDs so tasks/meetings can reference them
INSERT INTO clients (id, name, company, summary, status, priority, next_call_date, last_touch_date, blocker, category, notes) VALUES

('11111111-0000-0000-0000-000000000001',
 'Alex Chen', 'Deducto',
 'B2B SaaS for automated expense deduction for niche verticals. Concept validated but scope is too broad — needs to narrow to one vertical to gain real traction.',
 'active research', 'high',
 '2026-04-07', '2026-03-28',
 NULL,
 'B2B SaaS',
 'Verticals explored: gig economy workers, freelance creatives, small landlords. Currently leaning toward landlords. Need to pressure-test ICP before next call.'),

('22222222-0000-0000-0000-000000000002',
 'Marie Osberg', 'Osage Oenology',
 'Artisan concrete wine vessel manufacturer for craft winemakers. Researching aggregate sourcing and differentiated vessel design for the natural wine segment.',
 'prep for next call', 'medium',
 '2026-04-04', '2026-04-01',
 NULL,
 'Food & Beverage',
 'Targeting natural and biodynamic winery buyers. Competitors are mostly Italian importers. Opportunity in US-made, locally sourced vessels.'),

('33333333-0000-0000-0000-000000000003',
 'David Park', 'Juniper Search Management',
 'Financial co-pilot platform for major life decisions, starting with pre-marriage financial planning. Hook-first GTM strategy.',
 'active research', 'high',
 '2026-04-09', '2026-03-15',
 'No validated hook yet. Demand unclear without strong opening statistic or insight.',
 'Professional Services',
 'Inspired by the divorce financial advisor market — going upstream. Angle: "most couples never discuss finances before marriage." Need the key stat that makes this urgent.'),

('44444444-0000-0000-0000-000000000004',
 'Elena Vasquez', 'Escape Velocity Enterprises',
 'Premium wine brand with aerospace and exploration aesthetic. Targets adventure-oriented luxury consumers. Strong brand concept, needs distribution path.',
 'follow-up needed', 'medium',
 '2026-04-14', '2026-04-01',
 NULL,
 'Food & Beverage',
 'Brand identity is locked and strong. Distribution is the main unlock — direct DTC vs wholesale vs on-premise. ABC licensing and three-tier compliance need to be mapped.'),

('55555555-0000-0000-0000-000000000005',
 'Kenji Ono', 'Ikai Group',
 'Search fund targeting acquisition of undervalued charter jet operators. Working with principals to identify, evaluate, and structure acquisitions.',
 'waiting on client', 'high',
 '2026-04-05', '2026-03-10',
 'Client has not provided proof of finances. Blocking outreach to three interested targets.',
 'Aerospace',
 'Three acquisition targets identified. One operator in Scottsdale has expressed preliminary interest. Waiting on Kenji to produce financials before advancing conversations.'),

('66666666-0000-0000-0000-000000000006',
 'Omar Nemat', 'Nemat Trading Co.',
 'Import/export consulting for specialty Middle Eastern goods into US retail. Building category knowledge and vendor relationships. Early stage.',
 'active research', 'low',
 '2026-04-21', '2026-03-05',
 NULL,
 'E-commerce',
 'Initial focus on specialty foods and textiles. No clear lead product yet. Need to map the import regulatory landscape before going further.'),

('77777777-0000-0000-0000-000000000007',
 'Priya Sharma', 'Dharma Automations',
 'Workflow automation consultancy helping mid-market ops teams reduce manual processes. Tooling-agnostic. Currently piloting with a logistics client.',
 'prototyping', 'medium',
 '2026-04-08', '2026-03-31',
 NULL,
 'B2B SaaS',
 'Pilot client is a 3PL logistics firm. Automating invoice reconciliation and carrier updates. Good signals — client wants to expand scope if pilot succeeds.');

-- ============================================================
-- TASKS
-- ============================================================
INSERT INTO tasks (client_id, title, description, due_date, status, priority, task_type, next_step) VALUES

-- Deducto
('11111111-0000-0000-0000-000000000001',
 'Scope down to one vertical',
 'Research landlord, gig worker, and freelance creative verticals. Rank by TAM, competition density, and willingness to pay. Pick one.',
 '2026-04-05', 'in progress', 'high', 'research',
 'Build a 1-page comparison matrix of the three verticals'),

('11111111-0000-0000-0000-000000000001',
 'Prep call deck for April 7',
 'Summarize vertical selection rationale, 2–3 ICP profiles, and proposed next sprint.',
 '2026-04-06', 'not started', 'high', 'prep',
 'Use vertical research output as foundation'),

-- Osage Oenology
('22222222-0000-0000-0000-000000000002',
 'Compile vendor shortlist for aggregate sourcing',
 'Find 5–8 US-based aggregate suppliers appropriate for concrete vessel production. Evaluate on price, location, and minimum order.',
 '2026-04-03', 'in progress', 'medium', 'sourcing',
 'Check quarries in Ozarks region first — proximity to client is an advantage'),

('22222222-0000-0000-0000-000000000002',
 'Create vessel design mockups',
 '2–3 rough mockups showing vessel shape differentiation vs Italian imports. Share with client before call.',
 '2026-04-03', 'not started', 'medium', 'design',
 'Reference Nomblot and Sonoma Cast Stone as visual comparators'),

-- Juniper Search Management
('33333333-0000-0000-0000-000000000003',
 'Identify hook statistic',
 'Find the one compelling stat that makes pre-marriage financial planning feel urgent and underserved. Check Pew, CFPB, academic studies.',
 '2026-04-06', 'not started', 'high', 'research',
 'Start with "financial incompatibility" divorce statistics, then work backward'),

('33333333-0000-0000-0000-000000000003',
 'Outline landing page hypothesis',
 'One-page wireframe + headline options based on hook stat. Test which angle resonates.',
 '2026-04-10', 'not started', 'medium', 'product',
 'Wait for hook research before starting'),

-- Escape Velocity Enterprises
('44444444-0000-0000-0000-000000000004',
 'Map distributor landscape',
 'Identify 10 distributors in target markets (CA, TX, CO). Note specialty vs general, premium tier alignment, and contact info.',
 '2026-04-10', 'not started', 'medium', 'research',
 'Start with Wine & Spirits Wholesalers of America directory'),

('44444444-0000-0000-0000-000000000004',
 'ABC licensing and three-tier compliance overview',
 'Summarize California ABC licensing requirements and three-tier compliance considerations for a new label.',
 '2026-04-12', 'not started', 'medium', 'compliance',
 'Check CA ABC website + consult one industry contact'),

-- Ikai Group
('55555555-0000-0000-0000-000000000005',
 'Follow up on proof of finances',
 'Send formal follow-up email to Kenji requesting financial documentation. Set deadline.',
 '2026-04-03', 'not started', 'high', 'outreach',
 'Be direct: no financials = no outreach to targets'),

('55555555-0000-0000-0000-000000000005',
 'Identify 3 additional acquisition targets',
 'Screen NAICS 481212 charter operators under $5M revenue. Focus on Gulf Coast and Southwest markets.',
 '2026-04-08', 'waiting', 'medium', 'research',
 'Blocked until finances are confirmed — do not advance without'),

-- Nemat Trading Co.
('66666666-0000-0000-0000-000000000006',
 'Map US import regulatory landscape for food/textiles',
 'CBP entry requirements, FDA food facility registration, and tariff classification for top product categories.',
 '2026-04-18', 'not started', 'low', 'compliance',
 'Start with HTS code lookup for specialty dates and dried fruit'),

-- Dharma Automations
('77777777-0000-0000-0000-000000000007',
 'Document pilot automation workflows',
 'Write up the invoice reconciliation and carrier update automations for the logistics pilot. Include before/after time savings.',
 '2026-04-07', 'in progress', 'medium', 'product',
 'Interview the ops manager for the "before" baseline numbers'),

('77777777-0000-0000-0000-000000000007',
 'Prepare pilot expansion proposal',
 'Scope two additional automation opportunities within the logistics client. Estimate ROI.',
 '2026-04-10', 'not started', 'medium', 'deck',
 'Build on workflow documentation from above');

-- ============================================================
-- MEETINGS
-- ============================================================
INSERT INTO meetings (client_id, meeting_date, summary, decisions, follow_ups, next_meeting_date) VALUES

('11111111-0000-0000-0000-000000000001',
 '2026-03-28',
 'Reviewed three potential verticals for Deducto. Alex leaning toward landlords due to repeat expense patterns and underserved tooling market. Discussed MVP scope.',
 'Agreed to narrow focus to landlords for initial ICP definition. Will revisit gig workers in 6 weeks if landlord angle stalls.',
 'Finley to produce vertical comparison matrix. Alex to gather 5 landlord interview candidates.',
 '2026-04-07'),

('22222222-0000-0000-0000-000000000002',
 '2026-04-01',
 'Discussed concrete vessel design differentiation and aggregate sourcing strategy. Marie has a relationship with a quarry in Missouri.',
 'Focus mockups on two vessel sizes (225L and 500L). Prioritize Missouri quarry as primary sourcing lead.',
 'Finley to compile vendor list and share mockups before next call.',
 '2026-04-04'),

('33333333-0000-0000-0000-000000000003',
 '2026-03-15',
 'Initial scoping call for Juniper. David presented the financial co-pilot concept. Strong vision but GTM is unclear.',
 'Agreed to find a compelling hook before any product work. Stats-first approach.',
 'Finley to research key hook statistics. David to survey 10 recently married friends about financial prep.',
 '2026-04-09'),

('44444444-0000-0000-0000-000000000004',
 '2026-04-01',
 'Brand identity review for Escape Velocity. Visual identity locked. Discussed DTC vs wholesale options.',
 'Pursue wholesale as primary channel given margin and volume goals. DTC as secondary for brand building.',
 'Finley to research distributor landscape and summarize ABC compliance requirements.',
 '2026-04-14'),

('55555555-0000-0000-0000-000000000005',
 '2026-03-10',
 'Reviewed three charter operator acquisition targets with Kenji. One in Scottsdale (Desert Air) expressed interest. Need financials to advance.',
 'Do not approach any targets without proof of finances in hand. Kenji to prioritize this.',
 'Finley to follow up on financials. Hold on target outreach until received.',
 '2026-04-05'),

('77777777-0000-0000-0000-000000000007',
 '2026-03-31',
 'Pilot update call with Priya. Invoice reconciliation automation saving ~4 hours/week for the ops team. Client is happy.',
 'Proceed to scoping two additional automation areas. Carrier update workflow and PO matching are top candidates.',
 'Finley to document current workflows and prepare expansion proposal.',
 '2026-04-08');
