-- ============================================================================
-- REHAB BUDGET PRO - Seed Data
-- Minneapolis Metro Area Pricing (2025)
-- ============================================================================

-- ============================================================================
-- COST REFERENCE DATA
-- ============================================================================

INSERT INTO cost_reference (category, item, description, unit, low, mid, high, market, notes) VALUES

-- SOFT COSTS
('soft_costs', 'Architect/Designer', 'Design and planning', 'ls', 500, 1500, 5000, 'minneapolis', 'Hourly or flat fee'),
('soft_costs', 'Permits - Building', 'General building permit', 'ea', 200, 500, 1500, 'minneapolis', 'Varies by scope'),
('soft_costs', 'Permits - Mechanical', 'HVAC/Plumbing/Electrical', 'ea', 75, 150, 300, 'minneapolis', 'Per trade'),
('soft_costs', 'Dumpster - 20yd', 'Demo/construction debris', 'ea', 350, 450, 600, 'minneapolis', '7-day rental'),
('soft_costs', 'Dumpster - 30yd', 'Large demo projects', 'ea', 450, 550, 750, 'minneapolis', '7-day rental'),
('soft_costs', 'Portable Toilet', 'Job site sanitation', 'month', 150, 200, 300, 'minneapolis', 'Monthly rental'),
('soft_costs', 'Storage Container', 'Tool/material storage', 'month', 100, 150, 250, 'minneapolis', 'Monthly rental'),

-- DEMO
('demo', 'Full Gut Demo', 'Complete interior demo', 'sf', 3.00, 5.00, 8.00, 'minneapolis', 'To studs, includes haul'),
('demo', 'Partial Demo', 'Kitchen or bath demo', 'sf', 2.00, 3.50, 5.00, 'minneapolis', 'Selective demo'),
('demo', 'Kitchen Demo', 'Cabinets, counters, flooring', 'ls', 800, 1500, 2500, 'minneapolis', 'Average kitchen'),
('demo', 'Bathroom Demo', 'Full bath gut', 'ea', 500, 1000, 1800, 'minneapolis', 'Tub, vanity, tile'),
('demo', 'Flooring Removal', 'Carpet, tile, hardwood', 'sf', 0.50, 1.00, 2.00, 'minneapolis', 'Plus disposal'),
('demo', 'Haul Away', 'Debris removal', 'load', 200, 350, 500, 'minneapolis', 'Pickup truck load'),
('demo', 'Mold Remediation', 'Professional abatement', 'sf', 10.00, 20.00, 35.00, 'minneapolis', 'Certified contractor'),

-- STRUCTURAL/FRAMING
('structural', 'Framing - Heavy', 'Wall removal, headers', 'lf', 25.00, 40.00, 60.00, 'minneapolis', 'Load bearing'),
('structural', 'Framing - Light', 'New walls, closets', 'lf', 12.00, 18.00, 25.00, 'minneapolis', 'Non-load bearing'),
('structural', 'Subfloor Repair', 'Plywood replacement', 'sf', 3.00, 5.00, 8.00, 'minneapolis', '3/4" plywood'),
('structural', 'Floor Joist Repair', 'Sister or replace', 'lf', 15.00, 25.00, 40.00, 'minneapolis', 'Access dependent'),
('structural', 'Beam Installation', 'LVL or steel beam', 'lf', 50.00, 80.00, 150.00, 'minneapolis', 'Includes engineering'),
('structural', 'Foundation Repair', 'Crack repair, waterproof', 'lf', 75.00, 150.00, 300.00, 'minneapolis', 'Interior drainage'),

-- PLUMBING
('plumbing', 'Rough-In - Full House', 'New supply and drain', 'ls', 4000, 7000, 12000, 'minneapolis', '2 bath home'),
('plumbing', 'Rough-In - Bathroom', 'Single bath rough', 'ea', 1500, 2500, 4000, 'minneapolis', 'New location'),
('plumbing', 'Trim Out - Full House', 'Set fixtures', 'ls', 1500, 2500, 4000, 'minneapolis', '2 bath home'),
('plumbing', 'Water Heater - Tank', '50 gal standard', 'ea', 1200, 1800, 2800, 'minneapolis', 'Installed'),
('plumbing', 'Water Heater - Tankless', 'On-demand unit', 'ea', 2500, 4000, 6000, 'minneapolis', 'Installed'),
('plumbing', 'Water Line Replace', 'Main to house', 'ls', 2000, 4000, 8000, 'minneapolis', 'Copper or PEX'),
('plumbing', 'Sewer Line Replace', 'House to street', 'ls', 3000, 6000, 15000, 'minneapolis', 'Length dependent'),
('plumbing', 'Sump Pump', 'With pit and check valve', 'ea', 400, 700, 1200, 'minneapolis', 'Installed'),

-- HVAC
('hvac', 'Furnace - Standard', '80% efficiency', 'ea', 2500, 3500, 5000, 'minneapolis', 'Installed'),
('hvac', 'Furnace - High Efficiency', '95%+ efficiency', 'ea', 4000, 5500, 7500, 'minneapolis', 'Installed'),
('hvac', 'AC Condenser', '2-3 ton unit', 'ea', 2500, 4000, 6000, 'minneapolis', 'Installed'),
('hvac', 'Full HVAC System', 'Furnace + AC + ductwork', 'ls', 8000, 12000, 18000, 'minneapolis', 'New construction'),
('hvac', 'Mini Split', 'Single zone', 'ea', 2500, 4000, 6000, 'minneapolis', 'Installed'),
('hvac', 'Ductwork', 'New or replacement', 'opening', 150, 250, 400, 'minneapolis', 'Per register'),
('hvac', 'Thermostat - Smart', 'Nest, Ecobee', 'ea', 200, 300, 400, 'minneapolis', 'Installed'),

-- ELECTRICAL
('electrical', 'Rough-In - Full House', 'Complete rewire', 'ls', 5000, 8000, 15000, 'minneapolis', '1500 sf home'),
('electrical', 'Rough-In - Partial', 'Kitchen or addition', 'ls', 1500, 3000, 5000, 'minneapolis', 'Per area'),
('electrical', 'Trim Out', 'Devices, plates, fixtures', 'ls', 1000, 2000, 3500, 'minneapolis', 'Full house'),
('electrical', 'Panel Upgrade', '100A to 200A', 'ea', 1500, 2500, 4000, 'minneapolis', 'With permit'),
('electrical', 'Panel Replacement', 'Same amperage', 'ea', 1000, 1800, 2800, 'minneapolis', 'Existing wiring'),
('electrical', 'Outlet/Switch', 'Standard installation', 'ea', 75, 125, 200, 'minneapolis', 'New circuit extra'),
('electrical', 'GFCI Outlet', 'Kitchen, bath, exterior', 'ea', 100, 150, 225, 'minneapolis', 'Installed'),
('electrical', 'Smoke/CO Detector', 'Hardwired with battery', 'ea', 75, 125, 175, 'minneapolis', 'Installed'),

-- INSULATION/DRYWALL
('insulation_drywall', 'Wall Insulation', 'Batts R-13 to R-15', 'sf', 0.75, 1.25, 2.00, 'minneapolis', 'Installed'),
('insulation_drywall', 'Ceiling Insulation', 'Blown R-49', 'sf', 1.00, 1.75, 2.50, 'minneapolis', 'Attic blow-in'),
('insulation_drywall', 'Spray Foam', 'Closed cell', 'sf', 1.50, 2.50, 4.00, 'minneapolis', 'Per inch'),
('insulation_drywall', 'Drywall Hang', '1/2" standard', 'sf', 1.00, 1.50, 2.25, 'minneapolis', 'Material + labor'),
('insulation_drywall', 'Drywall Finish', 'Tape, mud, sand', 'sf', 0.75, 1.25, 2.00, 'minneapolis', 'Level 4 finish'),
('insulation_drywall', 'Drywall Complete', 'Hang + finish', 'sf', 2.00, 3.00, 4.50, 'minneapolis', 'Turnkey'),
('insulation_drywall', 'Texture - Orange Peel', 'Spray texture', 'sf', 0.35, 0.50, 0.75, 'minneapolis', 'Standard pattern'),
('insulation_drywall', 'Texture - Knockdown', 'Hand texture', 'sf', 0.50, 0.75, 1.25, 'minneapolis', 'Premium finish'),

-- INTERIOR PAINT
('interior_paint', 'Paint - Walls', 'Two coats, standard', 'sf', 1.50, 2.50, 4.00, 'minneapolis', 'Prep, prime, paint'),
('interior_paint', 'Paint - Ceilings', 'Flat white', 'sf', 1.25, 2.00, 3.00, 'minneapolis', 'Standard height'),
('interior_paint', 'Paint - Trim', 'Doors, base, casing', 'lf', 2.00, 3.50, 5.00, 'minneapolis', 'Semi-gloss'),
('interior_paint', 'Paint - Cabinets', 'Full prep and finish', 'lf', 35.00, 55.00, 85.00, 'minneapolis', 'Per linear foot face'),
('interior_paint', 'Paint - Full Interior', '1500 sf home', 'ls', 3000, 5000, 8000, 'minneapolis', 'Walls, ceil, trim'),
('interior_paint', 'Wallpaper Removal', 'Strip and prep', 'sf', 1.00, 2.00, 3.50, 'minneapolis', 'Multiple layers'),

-- FLOORING
('flooring', 'LVP/LVT', 'Luxury vinyl plank', 'sf', 4.00, 6.50, 10.00, 'minneapolis', 'Material + install'),
('flooring', 'Hardwood - New', '3/4" solid oak', 'sf', 8.00, 12.00, 18.00, 'minneapolis', 'Install + finish'),
('flooring', 'Hardwood - Refinish', 'Sand and 3 coats', 'sf', 3.00, 4.50, 7.00, 'minneapolis', 'Existing floors'),
('flooring', 'Carpet', 'Mid-grade with pad', 'sf', 3.00, 5.00, 8.00, 'minneapolis', 'Installed'),
('flooring', 'Tile - Ceramic', 'Floor tile standard', 'sf', 8.00, 12.00, 18.00, 'minneapolis', 'Installed'),
('flooring', 'Tile - Porcelain', 'Floor tile premium', 'sf', 10.00, 15.00, 25.00, 'minneapolis', 'Installed'),
('flooring', 'Transitions', 'T-mold, reducer', 'ea', 25.00, 45.00, 75.00, 'minneapolis', 'Installed'),

-- TILE
('tile', 'Bathroom Floor', 'Ceramic/porcelain', 'sf', 10.00, 15.00, 22.00, 'minneapolis', 'Prep + install'),
('tile', 'Shower Surround', '3-wall tub surround', 'ls', 800, 1500, 3000, 'minneapolis', 'Standard tub'),
('tile', 'Shower - Full Tile', 'Floor to ceiling', 'ls', 2000, 4000, 8000, 'minneapolis', 'Walk-in shower'),
('tile', 'Backsplash', 'Kitchen standard', 'sf', 15.00, 25.00, 40.00, 'minneapolis', 'Subway to mosaic'),
('tile', 'Tile Underlayment', 'Cement board', 'sf', 2.00, 3.00, 4.50, 'minneapolis', 'Walls or floor'),

-- KITCHEN
('kitchen', 'Cabinets - Stock', 'Big box basic', 'lf', 100, 175, 250, 'minneapolis', 'Per linear foot'),
('kitchen', 'Cabinets - Semi-Custom', 'Mid-grade wood', 'lf', 250, 400, 600, 'minneapolis', 'Per linear foot'),
('kitchen', 'Cabinets - Custom', 'Full custom build', 'lf', 500, 800, 1200, 'minneapolis', 'Per linear foot'),
('kitchen', 'Countertops - Laminate', 'Post-form standard', 'lf', 25, 40, 60, 'minneapolis', 'Installed'),
('kitchen', 'Countertops - Quartz', 'Mid-grade installed', 'sf', 55, 85, 125, 'minneapolis', 'Fabricated + install'),
('kitchen', 'Countertops - Granite', 'Level 1-2 slab', 'sf', 45, 70, 100, 'minneapolis', 'Fabricated + install'),
('kitchen', 'Countertops - Butcher Block', 'Hardwood solid', 'sf', 40, 65, 100, 'minneapolis', 'Installed'),
('kitchen', 'Appliance Package', 'Range, fridge, DW, micro', 'ls', 2000, 3500, 6000, 'minneapolis', 'Mid-grade set'),
('kitchen', 'Range - Gas', 'Freestanding 30"', 'ea', 500, 900, 2000, 'minneapolis', 'Standard brands'),
('kitchen', 'Range - Electric', 'Freestanding 30"', 'ea', 400, 700, 1500, 'minneapolis', 'Standard brands'),
('kitchen', 'Refrigerator', 'French door 25cf', 'ea', 800, 1500, 3000, 'minneapolis', 'Standard brands'),
('kitchen', 'Dishwasher', 'Built-in standard', 'ea', 350, 600, 1200, 'minneapolis', 'Installed'),
('kitchen', 'Microwave - OTR', 'Over the range', 'ea', 200, 400, 800, 'minneapolis', 'Installed'),
('kitchen', 'Garbage Disposal', '1/2 HP standard', 'ea', 150, 250, 400, 'minneapolis', 'Installed'),
('kitchen', 'Kitchen Sink', 'Stainless undermount', 'ea', 200, 400, 800, 'minneapolis', 'Installed'),
('kitchen', 'Kitchen Faucet', 'Pull-down standard', 'ea', 150, 300, 600, 'minneapolis', 'Installed'),
('kitchen', 'Range Hood', 'Under cabinet 30"', 'ea', 100, 250, 600, 'minneapolis', 'Installed'),

-- BATHROOMS
('bathrooms', 'Full Bath Remodel', 'Tub, vanity, toilet, tile', 'ls', 8000, 15000, 30000, 'minneapolis', 'Complete gut reno'),
('bathrooms', 'Half Bath Remodel', 'Vanity, toilet, flooring', 'ls', 3000, 6000, 12000, 'minneapolis', 'Complete reno'),
('bathrooms', 'Vanity - 24"', 'With top and faucet', 'ea', 250, 450, 800, 'minneapolis', 'Installed'),
('bathrooms', 'Vanity - 36"', 'With top and faucet', 'ea', 350, 600, 1200, 'minneapolis', 'Installed'),
('bathrooms', 'Vanity - 48"', 'With top and faucet', 'ea', 450, 800, 1500, 'minneapolis', 'Installed'),
('bathrooms', 'Vanity - 60" Double', 'With top and faucets', 'ea', 600, 1200, 2500, 'minneapolis', 'Installed'),
('bathrooms', 'Toilet', 'Standard elongated', 'ea', 200, 350, 600, 'minneapolis', 'Installed'),
('bathrooms', 'Tub - Standard', 'Alcove 60"', 'ea', 300, 500, 900, 'minneapolis', 'Tub only'),
('bathrooms', 'Tub - Soaking', 'Freestanding', 'ea', 800, 1500, 4000, 'minneapolis', 'Tub only'),
('bathrooms', 'Shower Base', 'Acrylic or tile-ready', 'ea', 300, 600, 1200, 'minneapolis', 'Installed'),
('bathrooms', 'Shower Door - Framed', 'Sliding or pivot', 'ea', 300, 500, 900, 'minneapolis', 'Installed'),
('bathrooms', 'Shower Door - Frameless', 'Glass panel', 'ea', 800, 1500, 3000, 'minneapolis', 'Installed'),
('bathrooms', 'Tub/Shower Valve', 'Pressure balance', 'ea', 200, 350, 600, 'minneapolis', 'Installed'),
('bathrooms', 'Bath Accessories', 'Towel bars, TP holder', 'set', 75, 150, 300, 'minneapolis', 'Installed'),
('bathrooms', 'Bath Fan', 'Exhaust with light', 'ea', 150, 250, 450, 'minneapolis', 'Installed'),
('bathrooms', 'Medicine Cabinet', 'Recessed mirrored', 'ea', 100, 250, 500, 'minneapolis', 'Installed'),

-- DOORS/WINDOWS
('doors_windows', 'Entry Door - Steel', 'Prehung with frame', 'ea', 400, 800, 1500, 'minneapolis', 'Installed'),
('doors_windows', 'Entry Door - Fiberglass', 'Prehung with frame', 'ea', 800, 1500, 3000, 'minneapolis', 'Installed'),
('doors_windows', 'Interior Door - Hollow', 'Prehung 6-panel', 'ea', 150, 225, 350, 'minneapolis', 'Installed'),
('doors_windows', 'Interior Door - Solid', 'Prehung solid core', 'ea', 250, 400, 650, 'minneapolis', 'Installed'),
('doors_windows', 'Sliding Patio Door', '6ft vinyl or aluminum', 'ea', 800, 1500, 3000, 'minneapolis', 'Installed'),
('doors_windows', 'Window - Vinyl DH', 'Double hung standard', 'ea', 350, 550, 850, 'minneapolis', 'Installed'),
('doors_windows', 'Window - Casement', 'Crank out style', 'ea', 450, 700, 1100, 'minneapolis', 'Installed'),
('doors_windows', 'Window - Picture', 'Fixed large format', 'ea', 400, 700, 1200, 'minneapolis', 'Installed'),
('doors_windows', 'Storm Door', 'Full view aluminum', 'ea', 200, 400, 700, 'minneapolis', 'Installed'),
('doors_windows', 'Blinds', 'Faux wood 2"', 'ea', 50, 100, 200, 'minneapolis', 'Installed'),

-- INTERIOR TRIM
('interior_trim', 'Baseboard', '3-1/4" MDF or pine', 'lf', 3.00, 5.00, 8.00, 'minneapolis', 'Installed + painted'),
('interior_trim', 'Door Casing', '2-1/4" standard', 'opening', 75, 125, 200, 'minneapolis', 'Both sides'),
('interior_trim', 'Window Casing', '2-1/4" standard', 'opening', 60, 100, 175, 'minneapolis', 'Interior only'),
('interior_trim', 'Crown Moulding', '3-1/2" MDF or pine', 'lf', 5.00, 8.00, 14.00, 'minneapolis', 'Installed + painted'),
('interior_trim', 'Shoe Moulding', '3/4" quarter round', 'lf', 1.50, 2.50, 4.00, 'minneapolis', 'Installed + painted'),
('interior_trim', 'Closet Shelf/Rod', 'Wire or wood system', 'lf', 8.00, 15.00, 30.00, 'minneapolis', 'Installed'),

-- EXTERIOR
('exterior', 'Roofing - 3-Tab', 'Asphalt shingles', 'sq', 250, 350, 450, 'minneapolis', 'Tear off + install'),
('exterior', 'Roofing - Architectural', 'Dimensional shingles', 'sq', 325, 425, 550, 'minneapolis', 'Tear off + install'),
('exterior', 'Roofing - Full Replace', '1500 sf roof', 'ls', 6000, 9000, 14000, 'minneapolis', 'Architectural'),
('exterior', 'Gutters - Aluminum', '5" seamless', 'lf', 6.00, 10.00, 15.00, 'minneapolis', 'Installed'),
('exterior', 'Downspouts', '2x3 or 3x4', 'lf', 5.00, 8.00, 12.00, 'minneapolis', 'Installed'),
('exterior', 'Siding - Vinyl', 'Standard grade', 'sf', 4.00, 6.00, 9.00, 'minneapolis', 'Installed'),
('exterior', 'Siding - Hardie', 'Fiber cement lap', 'sf', 8.00, 12.00, 16.00, 'minneapolis', 'Installed + painted'),
('exterior', 'Siding - LP SmartSide', 'Engineered wood', 'sf', 6.00, 9.00, 13.00, 'minneapolis', 'Installed + painted'),
('exterior', 'Soffit/Fascia', 'Aluminum or vinyl', 'lf', 8.00, 14.00, 22.00, 'minneapolis', 'Installed'),
('exterior', 'Exterior Paint', 'Full house prep + paint', 'sf', 1.50, 2.50, 4.00, 'minneapolis', '2 coats'),
('exterior', 'Deck - Pressure Treated', 'New construction', 'sf', 25.00, 35.00, 50.00, 'minneapolis', 'Standard rails'),
('exterior', 'Deck - Composite', 'Trex or similar', 'sf', 40.00, 55.00, 80.00, 'minneapolis', 'With rails'),
('exterior', 'Garage Door', 'Steel insulated 16x7', 'ea', 800, 1200, 2000, 'minneapolis', 'Installed'),
('exterior', 'Garage Door Opener', 'Belt drive 1/2 HP', 'ea', 300, 450, 700, 'minneapolis', 'Installed'),

-- LANDSCAPING
('landscaping', 'Concrete - Driveway', '4" reinforced', 'sf', 8.00, 12.00, 18.00, 'minneapolis', 'Remove + pour'),
('landscaping', 'Concrete - Sidewalk', '4" standard', 'sf', 7.00, 10.00, 15.00, 'minneapolis', 'Remove + pour'),
('landscaping', 'Concrete - Patio', '4" broom finish', 'sf', 8.00, 12.00, 18.00, 'minneapolis', 'New pour'),
('landscaping', 'Pavers - Patio', 'Interlocking concrete', 'sf', 12.00, 18.00, 28.00, 'minneapolis', 'With base prep'),
('landscaping', 'Gravel/Rock', 'Decorative landscape', 'ton', 75, 125, 200, 'minneapolis', 'Delivered + spread'),
('landscaping', 'Sod', 'Kentucky bluegrass', 'sf', 0.75, 1.25, 2.00, 'minneapolis', 'Installed'),
('landscaping', 'Fence - Wood', '6ft privacy cedar', 'lf', 25.00, 40.00, 60.00, 'minneapolis', 'Posts + panels'),
('landscaping', 'Fence - Vinyl', '6ft privacy', 'lf', 30.00, 50.00, 75.00, 'minneapolis', 'Installed'),
('landscaping', 'Fence - Chain Link', '4ft galvanized', 'lf', 12.00, 18.00, 28.00, 'minneapolis', 'Installed'),
('landscaping', 'Retaining Wall', 'Block or timber', 'sf', 20.00, 35.00, 55.00, 'minneapolis', 'Face square feet'),
('landscaping', 'Tree Removal', 'Medium tree with stump', 'ea', 400, 800, 1500, 'minneapolis', 'Size dependent'),
('landscaping', 'Basic Landscaping', 'Cleanup, mulch, plants', 'ls', 500, 1500, 3500, 'minneapolis', 'Curb appeal'),

-- FINISHING TOUCHES
('finishing', 'Light Fixture - Basic', 'Flush mount or semi', 'ea', 50, 100, 200, 'minneapolis', 'Installed'),
('finishing', 'Light Fixture - Pendant', 'Kitchen island style', 'ea', 100, 200, 400, 'minneapolis', 'Installed'),
('finishing', 'Light Fixture - Chandelier', 'Dining or entry', 'ea', 150, 350, 800, 'minneapolis', 'Installed'),
('finishing', 'Ceiling Fan', 'Standard 52"', 'ea', 150, 275, 450, 'minneapolis', 'Installed'),
('finishing', 'Recessed Light', '4" or 6" LED', 'ea', 75, 125, 200, 'minneapolis', 'Installed'),
('finishing', 'Under Cabinet Lights', 'LED strip', 'lf', 15.00, 25.00, 40.00, 'minneapolis', 'Installed'),
('finishing', 'Mirror - Vanity', 'Framed standard', 'ea', 50, 125, 300, 'minneapolis', 'Installed'),
('finishing', 'Mirror - Large', 'Gym or feature wall', 'sf', 8.00, 15.00, 25.00, 'minneapolis', 'Installed'),
('finishing', 'Door Hardware', 'Lever set interior', 'ea', 25, 50, 100, 'minneapolis', 'Installed'),
('finishing', 'Cabinet Hardware', 'Pulls or knobs', 'ea', 5, 12, 25, 'minneapolis', 'Installed'),
('finishing', 'House Numbers', 'Modern mounted', 'set', 30, 75, 200, 'minneapolis', 'Installed'),
('finishing', 'Mailbox', 'Post mount standard', 'ea', 75, 150, 350, 'minneapolis', 'Installed'),
('finishing', 'Final Clean', 'Construction cleanup', 'sf', 0.15, 0.25, 0.40, 'minneapolis', 'Detail clean'),
('finishing', 'Final Clean', 'Full house turnover', 'ls', 300, 500, 800, 'minneapolis', '1500 sf home'),

-- CONTINGENCY
('contingency', 'Contingency', 'Budget buffer', 'ls', 0, 0, 0, 'minneapolis', 'Typically 10% of budget');
