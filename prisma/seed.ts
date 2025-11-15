import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const supremeAdminEmail = process.env.SUPREME_ADMIN_EMAIL || 'admin@columbia.edu';
  
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Create Supreme Admin
  const supremeAdmin = await prisma.user.upsert({
    where: { email: supremeAdminEmail },
    update: {},
    create: {
      email: supremeAdminEmail,
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isSupremeAdmin: true,
    },
  });

  console.log(`✅ Supreme Admin created: ${supremeAdmin.email}`);

  // Create sample users
  const sampleUsers = [
    { email: 'probie@columbia.edu', role: 'PROBIE' },
    { email: 'driver@columbia.edu', role: 'DRIVER' },
  ];

  for (const userData of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash: hashedPassword,
        role: userData.role,
        isSupremeAdmin: false,
      },
    });
    console.log(`✅ User created: ${user.email} (${user.role})`);
  }

  // LEFT CABINET INVENTORY
  const leftCabinetItems = [
    { name: 'Sheets', cabinet: 'Left', shelf: '0', unit: 'Unit', quantity: 8.00, minimalBalance: 2.00, itemNumber: null, vendor: null },
    { name: 'Pillows', cabinet: 'Left', shelf: '0', unit: 'Unit', quantity: 0.00, minimalBalance: 2.00, itemNumber: '#939590', vendor: 'McKesson' },
    { name: 'XS Gloves', cabinet: 'Left', shelf: '1', unit: 'Box', quantity: 9.00, minimalBalance: 2.00, itemNumber: '#765873', vendor: null, notes: '2 are open' },
    { name: 'S Gloves', cabinet: 'Left', shelf: '1', unit: 'Box', quantity: 0.00, minimalBalance: 7.00, itemNumber: '#765874', vendor: 'McKesson', notes: '2 little bags of small gloves' },
    { name: 'M Gloves', cabinet: 'Left', shelf: '1', unit: 'Box', quantity: 1.00, minimalBalance: 7.00, itemNumber: '#765875', vendor: 'McKesson', notes: 'and 2 little bag of mediums' },
    { name: 'L Gloves', cabinet: 'Left', shelf: '1', unit: 'Box', quantity: 2.00, minimalBalance: 5.00, itemNumber: '#765876', vendor: 'McKesson', notes: 'and 2 small bag of large' },
    { name: 'XL Gloves', cabinet: 'Left', shelf: '1', unit: 'Box', quantity: 4.00, minimalBalance: 3.00, itemNumber: '#767197', vendor: 'McKesson' },
    { name: 'O2 tubing', cabinet: 'Left', shelf: '2', unit: 'Unit', quantity: 14.00, minimalBalance: 5.00, notes: 'one opened' },
    { name: 'O2 Regulators', cabinet: 'Left', shelf: '2', unit: 'Unit', quantity: 11.00, minimalBalance: 2.00 },
    { name: 'O2 Wrenches', cabinet: 'Left', shelf: '2', unit: 'Unit', quantity: 14.00, minimalBalance: 2.00, itemNumber: '#471847', vendor: 'McKesson', notes: 'two circle wrenches' },
    { name: 'French Suction catheters, various sizes', cabinet: 'Left', shelf: '2', unit: 'Unit', quantity: 14.00, minimalBalance: 4.00 },
    { name: 'Peds NC', cabinet: 'Left', shelf: '2', unit: 'Unit', quantity: 8.00, minimalBalance: 3.00, itemNumber: '#1018188', vendor: null },
    { name: 'Peds Nebulizer', cabinet: 'Left', shelf: '2', unit: 'Unit', quantity: 9.00, minimalBalance: 2.00, itemNumber: '#911728', vendor: null },
    { name: 'Peds NRB', cabinet: 'Left', shelf: '2', unit: 'in', quantity: 11.00, minimalBalance: 3.00, itemNumber: '#1053284', vendor: null },
    { name: 'Adult NRBs', cabinet: 'Left', shelf: '2', unit: 'Unit', quantity: 70.00, minimalBalance: 7.00, itemNumber: '#1018130', vendor: null },
    { name: 'Adult NC', cabinet: 'Left', shelf: '2', unit: 'Unit', quantity: 7.00, minimalBalance: 7.00, itemNumber: '#911722', vendor: 'McKesson' },
    { name: 'Adult Nebulizers', cabinet: 'Left', shelf: '2', unit: 'Unit', quantity: 10.00, minimalBalance: 5.00, itemNumber: '#911726', vendor: null },
    { name: 'Storage pouches', cabinet: 'Left', shelf: '3', unit: 'Unit', quantity: 26.00, minimalBalance: 1.00 },
    { name: 'Size 26 fr NPAs', cabinet: 'Left', shelf: '3', unit: 'Unit', quantity: 2.00, minimalBalance: 3.00 },
    { name: 'Size 28 fr NPAs', cabinet: 'Left', shelf: '3', unit: 'Unit', quantity: 2.00, minimalBalance: 3.00 },
    { name: 'Size 30 fr NPAs', cabinet: 'Left', shelf: '3', unit: 'Unit', quantity: 1.00, minimalBalance: 3.00 },
    { name: 'Size 32 fr NPAs', cabinet: 'Left', shelf: '3', unit: 'Unit', quantity: 1.00, minimalBalance: 3.00 },
    { name: 'Size 34 fr NPAs', cabinet: 'Left', shelf: '3', unit: 'Unit', quantity: 3.00, minimalBalance: 3.00 },
    { name: 'Size 36 fr NPAs', cabinet: 'Left', shelf: '3', unit: 'Unit', quantity: 3.00, minimalBalance: 3.00 },
    { name: 'NPA kits', cabinet: 'Left', shelf: '3', unit: 'Kit', quantity: 4.00, minimalBalance: 1.00 },
    { name: 'OPAs', cabinet: 'Left', shelf: '3', unit: 'Kit', quantity: 6.00, minimalBalance: 1.00, itemNumber: '#796088', vendor: null },
    { name: 'McKesson Lubricating Jelly', cabinet: 'Left', shelf: '3', unit: 'Box', quantity: 1.00, minimalBalance: 1.00, itemNumber: '#32747', vendor: 'McKesson', notes: 'opened but quite full' },
    { name: 'Peds BVMs', cabinet: 'Left', shelf: '3', unit: 'Unit', quantity: 2.00, minimalBalance: 1.00, itemNumber: '#544776', vendor: 'McKesson', notes: 'neonate, infant, toddler mask?' },
    { name: 'Adult BVMs', cabinet: 'Left', shelf: '3', unit: 'Unit', quantity: 12.00, minimalBalance: 2.00, notes: 'CPR Masks - #1160117' },
    { name: 'Waterproof Blankets', cabinet: 'Left', shelf: '4', unit: 'Unit', quantity: 2.00, minimalBalance: 2.00, itemNumber: '#202004', vendor: 'McKesson' },
    { name: 'V-vac suction units', cabinet: 'Left', shelf: '4', unit: 'Unit', quantity: 2.00, minimalBalance: 1.00 },
    { name: 'O2 Humidifier setups', cabinet: 'Left', shelf: '4', unit: 'Unit', quantity: 1.00, minimalBalance: 1.00 },
    { name: 'Bedpans', cabinet: 'Left', shelf: '4', unit: 'Unit', quantity: 1.00, minimalBalance: 1.00 },
    { name: 'Male Urinal', cabinet: 'Left', shelf: '4', unit: 'Unit', quantity: 3.00, minimalBalance: 1.00, itemNumber: '#1177279', vendor: 'McKesson' },
    { name: 'Suction basins', cabinet: 'Left', shelf: '4', unit: 'Unit', quantity: 9.00, minimalBalance: 1.00 },
    { name: 'Suction lids', cabinet: 'Left', shelf: '4', unit: 'Unit', quantity: 2.00, minimalBalance: 1.00 },
    { name: 'Peak Flow Meters', cabinet: 'Left', shelf: '4', unit: 'Unit', quantity: 2.00, minimalBalance: 1.00 },
    { name: 'Yankauer Suction catheters', cabinet: 'Left', shelf: '4', unit: 'Unit', quantity: 3.00, minimalBalance: 2.00 },
    { name: 'Backboard Straps', cabinet: 'Left', shelf: '4', unit: 'Unit', quantity: 8.00, minimalBalance: 1.00, notes: 'Mismatched', itemNumber: '#1112873', vendor: null },
    { name: 'Disposable Ponchos', cabinet: 'Left', shelf: '4', unit: 'Box', quantity: 5.00, minimalBalance: 1.00, notes: 'Units not box?' },
    { name: 'Zip ties', cabinet: 'Left', shelf: '4', unit: 'Pack', quantity: 3.00, minimalBalance: 1.00, notes: '2 small open, 1 big' },
    { name: 'Seals', cabinet: 'Left', shelf: '4', unit: 'Pack', quantity: 0.00, minimalBalance: 1.00, itemNumber: '#200533', vendor: 'McKesson' },
    { name: 'Reflective Triangles', cabinet: 'Left', shelf: '4', unit: 'Unit', quantity: 3.00, minimalBalance: 1.00 },
  ];

  // MIDDLE CABINET INVENTORY
  const middleCabinetItems = [
    { name: 'CaviWipes', cabinet: 'Middle', shelf: '0', unit: 'Unit', quantity: 11.00, minimalBalance: 6.00 },
    { name: 'Hot Packs (boxes)', cabinet: 'Middle', shelf: '0', unit: 'Unit', quantity: 2.00, minimalBalance: 1.00, itemNumber: '#526611', vendor: 'McKesson' },
    { name: 'Cold Packs (boxes)', cabinet: 'Middle', shelf: '0', unit: 'Unit', quantity: 0.00, minimalBalance: 1.00, itemNumber: '#521483', vendor: 'McKesson' },
    { name: 'Emesis Bags', cabinet: 'Middle', shelf: '0', unit: 'Sleeves', quantity: 0.00, minimalBalance: 6.00, itemNumber: '#831668', vendor: 'McKesson' },
    { name: 'Surgical Masks', cabinet: 'Middle', shelf: '1', unit: 'Box', quantity: 6.00, minimalBalance: 2.00 },
    { name: 'PEEP Valves', cabinet: 'Middle', shelf: '1', unit: 'Unit', quantity: 7.00, minimalBalance: 3.00 },
    { name: 'Hot Packs', cabinet: 'Middle', shelf: '1', unit: 'Unit', quantity: 4.00, minimalBalance: 15.00, notes: '3 5x7s, 3 6 x 9s' },
    { name: 'Cold Packs', cabinet: 'Middle', shelf: '1', unit: 'Unit', quantity: 2.00, minimalBalance: 15.00, notes: '3 6x9s' },
    { name: 'Tongue Depressors', cabinet: 'Middle', shelf: '2', unit: 'Box', quantity: 2.00, minimalBalance: 0.50 },
    { name: 'Glucometers', cabinet: 'Middle', shelf: '2', unit: 'Unit', quantity: 18.00, minimalBalance: 2.00, notes: '1 not included bc its dead (labelled dead)', itemNumber: '#960302', vendor: 'McKesson' },
    { name: 'Alcohol Pads', cabinet: 'Middle', shelf: '2', unit: 'Box', quantity: 3.00, minimalBalance: 1.00, itemNumber: '#191089', vendor: 'McKesson' },
    { name: 'Lancets (100/box)', cabinet: 'Middle', shelf: '2', unit: 'Box', quantity: 1.00, minimalBalance: 1.00, itemNumber: '#1217990', vendor: 'McKesson' },
    { name: 'Glucometer pouch', cabinet: 'Middle', shelf: '2', unit: 'Unit', quantity: 10.00, minimalBalance: 1.00, notes: '4 without glucometers', itemNumber: 'N/A', vendor: null },
    { name: 'BGL Test Strips', cabinet: 'Middle', shelf: '2', unit: 'Vials', quantity: 0.00, minimalBalance: 2.00, itemNumber: '#960297', vendor: 'McKesson' },
    { name: 'BGL Test Solution Level 1', cabinet: 'Middle', shelf: '2', unit: 'Unit', quantity: 4.00, minimalBalance: 2.00, notes: 'expires 05-31-2027', itemNumber: '#960304', vendor: 'McKesson' },
    { name: 'BGL Test Solution Level 3', cabinet: 'Middle', shelf: '2', unit: 'Unit', quantity: 0.00, minimalBalance: 2.00, notes: 'expires 02-28-2025', itemNumber: '#960303', vendor: 'McKesson' },
    { name: 'Narcan', cabinet: 'Middle', shelf: '2', unit: 'Unit', quantity: 0.00, minimalBalance: 3.00, notes: '1 exp end of April-2025', itemNumber: '#1010184', vendor: 'McKesson' },
    { name: 'Aspirin', cabinet: 'Middle', shelf: '2', unit: 'Unit', quantity: 9.00, minimalBalance: 2.00, itemNumber: '#555693', vendor: 'McKesson' },
    { name: 'Oral Glucose', cabinet: 'Middle', shelf: '2', unit: 'Unit', quantity: 9.00, minimalBalance: 2.00, itemNumber: '#580125', vendor: 'McKesson' },
    { name: 'Stethoscopes', cabinet: 'Middle', shelf: '3', unit: 'Unit', quantity: 1.00, minimalBalance: 1.00, notes: 'One missing diaphragm', itemNumber: '#363729', vendor: 'McKesson' },
    { name: 'Digital Thermometers', cabinet: 'Middle', shelf: '3', unit: 'Unit', quantity: 6.00, minimalBalance: 1.00, notes: 'Including the large one, it would be 7' },
    { name: 'Thermometer Probe Covers', cabinet: 'Middle', shelf: '3', unit: 'Box', quantity: 1.75, minimalBalance: 0.50, notes: 'one opened', itemNumber: '#953916', vendor: null },
    { name: 'Fingertip Pulse Ox', cabinet: 'Middle', shelf: '2', unit: 'Unit', quantity: 2.00, minimalBalance: 2.00, itemNumber: '#699689', vendor: 'McKesson' },
    { name: 'Adult BP Cuff', cabinet: 'Middle', shelf: '3', unit: 'Unit', quantity: 4.00, minimalBalance: 2.00, notes: '3 thigh, 1 arm', itemNumber: '#803197', vendor: 'McKesson' },
    { name: 'Peds BP Cuff', cabinet: 'Middle', shelf: '3', unit: 'Unit', quantity: 4.00, minimalBalance: 1.00, notes: '1 damaged (unusable' },
    { name: 'Multisize BP kit', cabinet: 'Middle', shelf: '3', unit: 'Kit', quantity: 3.00, minimalBalance: 1.00 },
    { name: '36in SAM Splint', cabinet: 'Middle', shelf: '4', unit: 'Unit', quantity: 2.00, minimalBalance: 6.00, itemNumber: '#683775', vendor: null },
    { name: 'Infant C-spine collars', cabinet: 'Middle', shelf: '4', unit: 'Unit', quantity: 6.00, minimalBalance: 6.00 },
    { name: 'Peds C-spine collars', cabinet: 'Middle', shelf: '4', unit: 'Unit', quantity: 9.00, minimalBalance: 4.00, itemNumber: '#1107056', vendor: null },
    { name: 'Adult C-spine collars', cabinet: 'Middle', shelf: '4', unit: 'Unit', quantity: 0.00, minimalBalance: 8.00, itemNumber: '#1107053', vendor: 'McKesson' },
    { name: 'Trauma Shears', cabinet: 'Middle', shelf: '4', unit: 'Unit', quantity: 11.00, minimalBalance: 3.00, itemNumber: '#487463', vendor: 'McKesson' },
    { name: 'Pen Lights', cabinet: 'Middle', shelf: '4', unit: 'Unit', quantity: 0.00, minimalBalance: 5.00, itemNumber: '#193987', vendor: 'McKesson' },
    { name: 'Forceps', cabinet: 'Middle', shelf: '4', unit: 'Unit', quantity: 0.00, minimalBalance: 1.00, notes: '4 forceps are not in a bag' },
    { name: 'Ring Cutter', cabinet: 'Middle', shelf: '4', unit: 'Unit', quantity: 1.00, minimalBalance: 1.00, notes: '1 Ring cutter is not in a bag' },
    { name: 'Razor', cabinet: 'Middle', shelf: '4', unit: 'Unit', quantity: 3.00, minimalBalance: 2.00, itemNumber: '#474704', vendor: 'McKesson' },
  ];

  // RIGHT SHELF INVENTORY
  const rightShelfItems = [
    { name: 'MCI tags', cabinet: 'Right', shelf: '0', unit: 'Pack', quantity: 1.00, minimalBalance: 1.00 },
    { name: 'OB Kit', cabinet: 'Right', shelf: '0', unit: 'Unit', quantity: 2.00, minimalBalance: 1.00, notes: 'expires 11-30-2025' },
    { name: 'Bulb Syringe', cabinet: 'Right', shelf: '0', unit: 'Unit', quantity: 2.00, minimalBalance: 1.00, itemNumber: '#348520', vendor: 'McKesson' },
    { name: 'Adult AED Pads', cabinet: 'Right', shelf: '0', unit: 'Unit', quantity: 2.00, minimalBalance: 1.00 },
    { name: 'D Batteries', cabinet: 'Right', shelf: '0', unit: 'Unit', quantity: 17.00, minimalBalance: 2.00 },
    { name: 'AA Batteries', cabinet: 'Right', shelf: '0', unit: 'Unit', quantity: 7.00, minimalBalance: 1.00, notes: 'expire 04/2032' },
    { name: 'AAA Batteries', cabinet: 'Right', shelf: '0', unit: 'Unit', quantity: 0.00, minimalBalance: 1.00, itemNumber: '#651492', vendor: 'McKesson' },
    { name: 'Flashlight with batteries', cabinet: 'Right', shelf: '0', unit: 'Unit', quantity: 0.00, minimalBalance: 1.00 },
    { name: 'HEPA Filters', cabinet: 'Right', shelf: '0', unit: 'Unit', quantity: 11.00, minimalBalance: 3.00 },
    { name: 'Hemostatic Dressing', cabinet: 'Right', shelf: '1', unit: 'Unit', quantity: 0.00, minimalBalance: 1.00, notes: 'Expire 12/30/2025', itemNumber: '#1206925', vendor: 'McKesson' },
    { name: '3×9-in OC Dressing', cabinet: 'Right', shelf: '1', unit: 'Unit', quantity: 0.00, minimalBalance: 4.00, notes: 'Expires 04/2025', itemNumber: null, vendor: null },
    { name: '3×18in OC Dressing', cabinet: 'Right', shelf: '1', unit: 'Unit', quantity: 2.00, minimalBalance: 4.00, notes: 'Expires 5/31/2025', itemNumber: '#32727', vendor: 'McKesson' },
    { name: 'Menstrual Pad', cabinet: 'Right', shelf: '1', unit: 'Unit', quantity: 11.00, minimalBalance: 2.00 },
    { name: 'Facial Tissues', cabinet: 'Right', shelf: '1', unit: 'Box', quantity: 3.00, minimalBalance: 2.00, itemNumber: '#1040596', vendor: 'McKesson' },
    { name: '1 Inch Tape (12/box)', cabinet: 'Right', shelf: '1', unit: 'Box', quantity: 2.00, minimalBalance: 1.00, notes: '3 (transparent), 7 (paper), 1 box Kendall', itemNumber: '#1040596', vendor: 'McKesson' },
    { name: '2 inch Tape', cabinet: 'Right', shelf: '1', unit: 'Box', quantity: 3.00, minimalBalance: 0.25, notes: '4 cloth, 10 transparent' },
    { name: '2×4in Adhesive Bandaids', cabinet: 'Right', shelf: '1', unit: 'Box', quantity: 6.00, minimalBalance: 1.00, itemNumber: '#511333', vendor: 'McKesson' },
    { name: '1×3 in Adhesive bandaids (ordinary size)', cabinet: 'Right', shelf: '1', unit: 'Box', quantity: 2.00, minimalBalance: 3.00, itemNumber: '#466872', vendor: 'McKesson' },
    { name: 'Tourniquets', cabinet: 'Right', shelf: '1', unit: 'Unit', quantity: 1.00, minimalBalance: 1.00 },
    { name: '1 in circular adhesive bandaids', cabinet: 'Right', shelf: '1', unit: 'Box', quantity: 1.00, minimalBalance: 1.00 },
    { name: '2 in Roller Gauze (12/pack)', cabinet: 'Right', shelf: '2', unit: 'Pack', quantity: 3.00, minimalBalance: 2.00, notes: '1.5 packs of 3 in roller gauze', itemNumber: '#999367', vendor: null },
    { name: '4 in Roller gauze (12/pack)', cabinet: 'Right', shelf: '2', unit: 'Pack', quantity: 3.00, minimalBalance: 1.00, itemNumber: '#999366', vendor: 'McKesson' },
    { name: '4×4 Gauze pad (50/box)', cabinet: 'Right', shelf: '2', unit: 'Box', quantity: 3.00, minimalBalance: 2.00, itemNumber: '#762703', vendor: 'McKesson' },
    { name: '5×9 Abd Gauze Pads', cabinet: 'Right', shelf: '2', unit: 'Box', quantity: 3.25, minimalBalance: 1.00, itemNumber: '#446057', vendor: 'McKesson' },
    { name: '10×30 Dressing', cabinet: 'Right', shelf: '2', unit: 'Unit', quantity: 6.00, minimalBalance: 1.00 },
    { name: 'Burn sheet', cabinet: 'Right', shelf: '3', unit: 'Unit', quantity: 4.00, minimalBalance: 2.00 },
    { name: 'Sterile Water, 500mL', cabinet: 'Right', shelf: '3', unit: 'Unit', quantity: 0.00, minimalBalance: 4.00, itemNumber: '#560283', vendor: 'McKesson' },
    { name: 'Sterile Water, 250mL', cabinet: 'Right', shelf: '3', unit: 'Unit', quantity: 23.00, minimalBalance: 10.00, notes: 'Expires 12/12/2025' },
    { name: 'Sterline Water, 100mL', cabinet: 'Right', shelf: '3', unit: 'Unit', quantity: 3.00, minimalBalance: 10.00, notes: 'Expires 08-26-2026' },
    { name: 'Saline, 100mL', cabinet: 'Right', shelf: '3', unit: 'Unit', quantity: 0.00, minimalBalance: 10.00, notes: 'expire 06/2027', itemNumber: '#560284', vendor: 'McKesson' },
    { name: 'Saline, 250mL', cabinet: 'Right', shelf: '3', unit: 'Unit', quantity: 0.00, minimalBalance: 5.00, notes: 'Expires 12-04-2026', itemNumber: '#520118', vendor: 'McKesson' },
    { name: 'Ace bandages 10/box', cabinet: 'Right', shelf: '3', unit: 'Unit', quantity: 21.00, minimalBalance: 10.00, itemNumber: '#454620', vendor: 'McKesson' },
    { name: 'Triangle Bandages', cabinet: 'Right', shelf: '3', unit: 'Unit', quantity: 73.00, minimalBalance: 12.00, itemNumber: '#540284', vendor: null },
    { name: 'Biobags', cabinet: 'Right', shelf: '3', unit: 'Rolls', quantity: 1.00, minimalBalance: 1.00, itemNumber: '#185449', vendor: 'McKesson' },
    { name: 'Biobags (Boxes)', cabinet: 'Right', shelf: '3', unit: 'Box', quantity: 2.00, minimalBalance: 1.00 },
    { name: 'Large Sharps Containers', cabinet: 'Right', shelf: '3', unit: 'Unit', quantity: 2.00, minimalBalance: 1.00 },
    { name: 'Medium Sharps Containers', cabinet: 'Right', shelf: '3', unit: 'Unit', quantity: 0.00, minimalBalance: 1.00 },
    { name: 'Sharps Shuttles', cabinet: 'Right', shelf: '3', unit: 'Unit', quantity: 10.00, minimalBalance: 3.00, itemNumber: '#942611', vendor: 'McKesson' },
  ];

  // FLOOR INVENTORY
  const floorItems = [
    { name: 'Oxygen Tanks - Full', cabinet: 'Floor', shelf: 'N/A', unit: 'Unit', quantity: 4.00, minimalBalance: 8.00, notes: 'In crate, one on floor in extra O2 bag' },
    { name: 'Oxygen Tanks - Empty *one marked training', cabinet: 'Floor', shelf: 'N/A', unit: 'Unit', quantity: 2.00, minimalBalance: 0, notes: '7 open in crate; 2 empty, one is 1200 but leaks, one 1800, one 700' },
    { name: 'Long Board', cabinet: 'Floor', shelf: 'N/A', unit: 'Unit', quantity: 5.00, minimalBalance: 1.00 },
    { name: 'Scoop Stretcher', cabinet: 'Floor', shelf: 'N/A', unit: 'Unit', quantity: 2.00, minimalBalance: 1.00, notes: 'fourth is broken at the bottom' },
    { name: 'Short Board', cabinet: 'Floor', shelf: 'N/A', unit: 'Unit', quantity: 4.00, minimalBalance: 1.00 },
    { name: 'Stairchair', cabinet: 'Floor', shelf: 'N/A', unit: 'Unit', quantity: 3.00, minimalBalance: 1.00 },
    { name: 'Traction Splint', cabinet: 'Floor', shelf: 'N/A', unit: 'Unit', quantity: 1.00, minimalBalance: 1.00 },
    { name: 'Small Splints', cabinet: 'Floor', shelf: 'N/A', unit: 'Unit', quantity: 4.00, minimalBalance: 1.00, notes: '15 in', itemNumber: '#379697', vendor: null },
    { name: 'Medium Splints', cabinet: 'Floor', shelf: 'N/A', unit: 'Unit', quantity: 3.00, minimalBalance: 1.00, notes: '36 in (some 42 in)', itemNumber: '#379698', vendor: null },
    { name: 'Long Splints', cabinet: 'Floor', shelf: 'N/A', unit: 'Unit', quantity: 1.00, minimalBalance: 1.00, notes: '54 in' },
  ];

  // ARMORY INVENTORY
  const armoryItems = [
    { name: 'Albuterol Solution', cabinet: 'Armory', shelf: 'N/A', unit: 'Packs', quantity: 4.00, minimalBalance: 3.00, itemNumber: '#570560, #570841', vendor: null },
    { name: 'Epinephrine', cabinet: 'Armory', shelf: 'N/A', unit: 'Vials', quantity: 4.00, minimalBalance: 3.00, notes: 'expires 08-2027', itemNumber: '#852322', vendor: null },
    { name: 'Epi Kits', cabinet: 'Armory', shelf: 'N/A', unit: 'Packs', quantity: 1.00, minimalBalance: 3.00, itemNumber: '#1196786', vendor: null },
    { name: 'Naloxone', cabinet: 'Armory', shelf: 'N/A', unit: 'Unit', quantity: 10.00, minimalBalance: 2.00, notes: 'STANDBY BAG', itemNumber: '#806072', vendor: null },
  ];

  // Combine all items
  const allItems = [
    ...leftCabinetItems,
    ...middleCabinetItems,
    ...rightShelfItems,
    ...floorItems,
    ...armoryItems,
  ];

  for (const item of allItems) {
    await prisma.inventoryItem.create({
      data: item,
    });
  }

  console.log(`✅ Created ${allItems.length} inventory items`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


