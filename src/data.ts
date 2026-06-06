/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, StockMovement, Sale, Expense, Client, AuditLog, SystemSettings } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    sku: "BG-ORJ-DIAM-001",
    designation: "Alliance Éternité Or Jaune & Diamants",
    category: "Bagues",
    metal_type: "Or Jaune",
    purity: "18k (750/1000)",
    weight: 4.55,
    components_stones: "Diamant Rond Brillant 0.25ct H-SI",
    price_type: "variable",
    labor_cost: 250, // handcraft main d'œuvre
    price_fixed: 0,
    image_url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800",
    visible_en_ligne: true,
    stock_qty: 6,
    description: "Une alliance classique d'un raffinement absolu, façonnée à la main en Or Jaune 18 carats et sertie de diamants étincelants d'un éclat incomparable. Parfaite pour célébrer une promesse éternelle.",
    created_at: "2026-05-10T10:00:00Z"
  },
  {
    sku: "CL-ORB-EMER-002",
    designation: "Collier Divine Émeraude Or Blanc",
    category: "Colliers",
    metal_type: "Or Blanc",
    purity: "18k (750/1000)",
    weight: 12.42,
    components_stones: "Émeraude de Colombie Ovale 0.85ct & Pavage Diamants",
    price_type: "variable",
    labor_cost: 650,
    price_fixed: 0,
    image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800",
    visible_en_ligne: true,
    stock_qty: 3,
    description: "Un splendide collier en Or Blanc 18 carats arborant une émeraude de Colombie d'une couleur verte intense et profonde, magnifiée par un halos de diamants taille brillant.",
    created_at: "2026-05-15T14:30:00Z"
  },
  {
    sku: "BR-ORR-CHIC-003",
    designation: "Bracelet Jonc Moderniste Or Rose",
    category: "Bracelets",
    metal_type: "Or Rose",
    purity: "18k (750/1000)",
    weight: 18.10,
    components_stones: "Sans pierres",
    price_type: "variable",
    labor_cost: 380,
    price_fixed: 0,
    image_url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800",
    visible_en_ligne: true,
    stock_qty: 2,
    description: "Bracelet jonc de luxe, d'une élégance minimaliste et contemporaine en Or Rose 18 carats poli miroir. Un poids généreux de métal noble pour un confort absolu au poignet.",
    created_at: "2026-05-20T09:15:00Z"
  },
  {
    sku: "BO-ARG-PERL-004",
    designation: "Boucles d'oreilles Lune de Perle",
    category: "Boucles d'oreilles",
    metal_type: "Argent",
    purity: "925/1000",
    weight: 5.20,
    components_stones: "Perles de culture d'Eau Douce Blanches 8mm",
    price_type: "fixe",
    labor_cost: 0,
    price_fixed: 149,
    image_url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800",
    visible_en_ligne: true,
    stock_qty: 12,
    description: "Subtiles boucles d'oreilles pendantes en Argent Massif 925, décorées de superbes perles de culture blanches sélectionnées pour leur lustre satiné parfait.",
    created_at: "2026-05-22T16:45:00Z"
  },
  {
    sku: "MT-PL-IMPR-005",
    designation: "Montre Chronographe Impérial Platine",
    category: "Montres",
    metal_type: "Platine",
    purity: "950/1000",
    weight: 85.00,
    components_stones: "Lunette Diamants Noirs Baguettes & Verre Saphir",
    price_type: "fixe",
    labor_cost: 0,
    price_fixed: 12500,
    image_url: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800",
    visible_en_ligne: true,
    stock_qty: 1,
    description: "Chef-d'œuvre de la haute horlogerie : boîtier lourd en Platine 950 avec complications chronographe, cadran squelette squeletté orné de diamants noirs taillés en baguette.",
    created_at: "2026-05-25T11:20:00Z"
  },
  {
    sku: "BO-ORR-DIAM-006",
    designation: "Cascades Fleuries Or Rose & Diamants",
    category: "Boucles d'oreilles",
    metal_type: "Or Rose",
    purity: "18k (750/1000)",
    weight: 8.42,
    components_stones: "Diamants ronds brillants 1.10ct au total",
    price_type: "variable",
    labor_cost: 450,
    price_fixed: 0,
    image_url: "https://images.unsplash.com/photo-1630012411394-47382300f3c5?auto=format&fit=crop&q=80&w=800",
    visible_en_ligne: true,
    stock_qty: 4,
    description: "Pendants d'oreilles somptueux imitant une cascade bucolique de petits diamants étincelants montés sur or rose 18 carats. Une confection d'un classicisme absolu pour seneFashion.",
    created_at: "2026-05-12T10:30:00Z"
  },
  {
    sku: "CO-PL-SAPH-007",
    designation: "Collier Altesse Royal Platine & Saphir de Ceylan",
    category: "Colliers",
    metal_type: "Platine",
    purity: "950/1000",
    weight: 22.15,
    components_stones: "Saphir de Ceylan ovale 3.2ct & Pavage platine",
    price_type: "variable",
    labor_cost: 1100,
    price_fixed: 0,
    image_url: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&q=80&w=800",
    visible_en_ligne: true,
    stock_qty: 2,
    description: "Un splendide saphir de Ceylan bleu royal majestueusement suspendu sur une chaîne fine ciselée de platine 950 massif.",
    created_at: "2026-05-22T14:00:00Z"
  },
  {
    sku: "BG-ORB-DIAM-008",
    designation: "Bague Solitaire Princesse Or Blanc 18k",
    category: "Bagues",
    metal_type: "Or Blanc",
    purity: "18k (750/1000)",
    weight: 5.60,
    components_stones: "Diamant de taille princesse 1.05ct certifié GIA D-VVS1",
    price_type: "variable",
    labor_cost: 500,
    price_fixed: 0,
    image_url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=800",
    visible_en_ligne: true,
    stock_qty: 5,
    description: "Bague de fiançailles haut de gamme par excellence. Serti sur 4 griffes en Or Blanc 18k poli miroir, son diamant affiche une pureté exceptionnelle.",
    created_at: "2026-06-01T09:00:00Z"
  },
  {
    sku: "BR-ORJ-MAST-009",
    designation: "Manchette Impériale Or Jaune Tressé",
    category: "Bracelets",
    metal_type: "Or Jaune",
    purity: "18k (750/1000)",
    weight: 34.50,
    components_stones: "Zircons de pureté extra sur les fermoirs",
    price_type: "variable",
    labor_cost: 1200,
    price_fixed: 0,
    image_url: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=800",
    visible_en_ligne: true,
    stock_qty: 3,
    description: "Pièce textile de métal lourd : manchette sculptée en or jaune 18k finement tressée à la main comme un tissu royal par les maîtres créateurs de seneFashion.",
    created_at: "2026-06-03T17:15:00Z"
  },
  {
    sku: "BO-ORJ-EBENE-010",
    designation: "Créoles Tribales Or Jaune & Ébène",
    category: "Boucles d'oreilles",
    metal_type: "Or Jaune",
    purity: "18k (750/1000)",
    weight: 7.10,
    components_stones: "Ébène précieux de Madagascar inséré",
    price_type: "variable",
    labor_cost: 310,
    price_fixed: 0,
    image_url: "https://images.unsplash.com/photo-1543294001-f7cbfe92237e?auto=format&fit=crop&q=80&w=800",
    visible_en_ligne: true,
    stock_qty: 8,
    description: "Créoles contemporaines au design ethnique chic mariant des cerclages parfaits d'or jaune 18k poli aux détails contrastants d'ébène noir raffiné.",
    created_at: "2026-06-04T10:00:00Z"
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  whatsapp_phone: "33612345678", // standard placeholder number
  gold_rate_18k: 65.50, // in € per gram
  gold_rate_24k: 84.20, // pure gold
  silver_rate_925: 1.15,
  platinum_rate: 42.00
};

export const INITIAL_CLIENTS: Client[] = [
  {
    id: "CL-01",
    name: "Alexandre Laurent",
    phone: "+33 6 88 77 66 55",
    email: "a.laurent@email.com",
    ring_size: "54",
    metal_preference: "Or Rose",
    birthday: "1988-11-12",
    notes_style: "Préfère les alliances épurées, style contemporain et bijoux en or rose massif."
  },
  {
    id: "CL-02",
    name: "Sophie Bertrand",
    phone: "+33 7 12 34 56 78",
    email: "sophie.bertrand@outlook.fr",
    ring_size: "52",
    metal_preference: "Or Blanc",
    birthday: "1994-04-20",
    notes_style: "Adore les pierres de couleur vibrantes, particulièrement les émeraudes et saphirs."
  },
  {
    id: "CL-03",
    name: "Marc Dumont",
    phone: "+33 6 45 98 12 34",
    email: "marc.dumont@corporate.com",
    ring_size: "58",
    metal_preference: "Platine",
    birthday: "1975-08-03",
    notes_style: "Collectionneur de montres de luxe et boutons de manchette de haute joaillerie."
  },
  {
    id: "CL-04",
    name: "Isabelle Adjani",
    phone: "+33 6 11 22 33 44",
    email: "isabelle@cinema.fr",
    ring_size: "53",
    metal_preference: "Or Blanc",
    birthday: "1980-06-27",
    notes_style: "Recherche de parures d'apparat pour tapis rouge et soirées de gala. Préfère les diamants blancs."
  },
  {
    id: "CL-05",
    name: "François Pinault",
    phone: "+33 6 99 88 77 66",
    email: "f.pinault@kering.com",
    ring_size: "57",
    metal_preference: "Platine",
    birthday: "1966-10-14",
    notes_style: "Commandes régulières de pièces d'art contemporain et montres squelettes d'exception en platine."
  },
  {
    id: "CL-06",
    name: "Amina Diop",
    phone: "+221 77 569 82 41",
    email: "amina.diop@sene-invest.sn",
    ring_size: "54",
    metal_preference: "Or Jaune",
    birthday: "1989-02-28",
    notes_style: "Inspirée par la haute couture textile ouest-africaine. Adore l'or jaune massif 18k à 24k très éclatant."
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "EXP-01",
    label: "Loyer de la boutique Place Vendôme",
    category: "Loyer",
    amount: 4500,
    date: "2026-05-01",
    type: "fixe"
  },
  {
    id: "EXP-02",
    label: "Sécurité & Télésurveillance Pro",
    category: "Sécurité",
    amount: 850,
    date: "2026-05-02",
    type: "fixe"
  },
  {
    id: "EXP-03",
    label: "Écrins en velours et sacs prestige logo seneFashion",
    category: "Emballage",
    amount: 620,
    date: "2026-05-03",
    type: "variable"
  },
  {
    id: "EXP-04",
    label: "Électricité pro pour les creusets de l'Atelier",
    category: "Électricité",
    amount: 340,
    date: "2026-05-04",
    type: "variable"
  },
  {
    id: "EXP-05",
    label: "Honoraires Maître Serrurier Blindage",
    category: "Sécurité",
    amount: 1450,
    date: "2026-05-20",
    type: "variable"
  },
  {
    id: "EXP-06",
    label: "Assurance Multirisque Vol & Protection Stocks",
    category: "Autre",
    amount: 1800,
    date: "2026-05-02",
    type: "fixe"
  },
  {
    id: "EXP-07",
    label: "Création Packaging seneFashion Dorure à Chaud",
    category: "Emballage",
    amount: 950,
    date: "2026-06-02",
    type: "variable"
  },
  {
    id: "EXP-08",
    label: "Sponsoring Défilé Haute Couture Dakar",
    category: "Autre",
    amount: 4500,
    date: "2026-05-25",
    type: "variable"
  }
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: "MV-01",
    sku: "BG-ORJ-DIAM-001",
    type: "entree_fournisseur",
    qty: 5,
    date: "2026-05-10T10:05:00Z",
    partner_name: "Atelier d'Anvers Bijoux",
    cost_value: 410, // cogs / fabrication cost per piece
    notes: "Récipiendaire initial de 5 pièces de bagues Or Jaune serties."
  },
  {
    id: "MV-02",
    sku: "CL-ORB-EMER-002",
    type: "entree_fabrication",
    qty: 3,
    date: "2026-05-15T15:00:00Z",
    partner_name: "Artisan Joaillier Interne",
    cost_value: 1200,
    notes: "Fabrication spéciale à l'atelier à partir de 37.26g d'or brut."
  },
  {
    id: "MV-03",
    sku: "BG-ORJ-DIAM-001",
    type: "sortie_confiance",
    qty: 1,
    date: "2026-05-28T11:00:00Z",
    partner_name: "Hélène de Maigret (Influenceuse)",
    cost_value: 0,
    notes: "Sortie de confiance de 1 bague pour la montée des marches du festival."
  },
  {
    id: "MV-04",
    sku: "BG-ORJ-DIAM-001",
    type: "retour_confiance",
    qty: 1,
    date: "2026-06-01T15:30:00Z",
    partner_name: "Hélène de Maigret (Influenceuse)",
    cost_value: 0,
    notes: "Retour de la bague prêtée en parfait état physique."
  },
  {
    id: "MV-05",
    sku: "BO-ORR-DIAM-006",
    type: "entree_fournisseur",
    qty: 6,
    date: "2026-05-12T11:15:00Z",
    partner_name: "Atelier Genevois d'Orfèvrerie",
    cost_value: 300,
    notes: "Arrivage de 6 paires de boucles d'oreilles fleuries or rose."
  },
  {
    id: "MV-06",
    sku: "CO-PL-SAPH-007",
    type: "entree_fabrication",
    qty: 3,
    date: "2026-05-22T14:45:00Z",
    partner_name: "Maître Orfevre SeneFashion",
    cost_value: 1500,
    notes: "Forgeage spécial du saphir de Ceylan royal insolite en platine."
  },
  {
    id: "MV-07",
    sku: "BR-ORR-CHIC-003",
    type: "sortie_vente",
    qty: 1,
    date: "2026-05-18T16:20:00Z",
    partner_name: "Amina Diop",
    cost_value: 1565.55,
    notes: "Vente directe de la manchette or rose à la cliente."
  },
  {
    id: "MV-08",
    sku: "BG-ORJ-DIAM-001",
    type: "sortie_vente",
    qty: 1,
    date: "2026-06-03T10:15:00Z",
    partner_name: "Isabelle Adjani",
    cost_value: 548.00,
    notes: "Achat direct d'alliance éternité or jaune suite à un défilé."
  },
  {
    id: "MV-09",
    sku: "MT-PL-IMPR-005",
    type: "sortie_vente",
    qty: 1,
    date: "2026-06-05T12:00:00Z",
    partner_name: "Marc Dumont",
    cost_value: 12500.00,
    notes: "Vente de la montre Imperial Platine avec acompte de prestige."
  },
  {
    id: "MV-10",
    sku: "BO-ARG-PERL-004",
    type: "sortie_fonte_recyclage",
    qty: 2,
    date: "2026-06-04T15:30:00Z",
    partner_name: "Fonderie Affinage Parisienne",
    cost_value: 149.00,
    notes: "Fonte suite à un micro-défaut de sertissage sur l'argent massif."
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: "V-001",
    date: "2026-05-29T16:20:00Z",
    items: [
      {
        sku: "BG-ORJ-DIAM-001",
        designation: "Alliance Éternité Or Jaune & Diamants",
        qty: 1,
        unit_price: 548, // based on calculated price in standard gold rates
        discount: 50 // 50€ discount
      }
    ],
    client_id: "CL-01",
    client_name: "Alexandre Laurent",
    total_raw: 548,
    discount_total: 50,
    total_paid: 498,
    payment_method: "Carte",
    is_reservation: false,
    status: "Complété",
    balance_due: 0
  },
  {
    id: "V-002",
    date: "2026-06-02T10:15:00Z",
    items: [
      {
        sku: "CL-ORB-EMER-002",
        designation: "Collier Divine Émeraude Or Blanc",
        qty: 1,
        unit_price: 1463.50,
        discount: 0
      }
    ],
    client_id: "CL-02",
    client_name: "Sophie Bertrand",
    total_raw: 1463.50,
    discount_total: 0,
    total_paid: 500, // Partial down payment (acompte)
    payment_method: "Virement",
    is_reservation: true,
    status: "Réservé",
    balance_due: 963.50
  },
  {
    id: "V-003",
    date: "2026-05-18T16:20:00Z",
    items: [
      {
        sku: "BR-ORR-CHIC-003",
        designation: "Bracelet Jonc Moderniste Or Rose",
        qty: 1,
        unit_price: 1800.00,
        discount: 0
      }
    ],
    client_id: "CL-06",
    client_name: "Amina Diop",
    total_raw: 1800.00,
    discount_total: 0,
    total_paid: 1800,
    payment_method: "Virement",
    is_reservation: false,
    status: "Complété",
    balance_due: 0
  },
  {
    id: "V-004",
    date: "2026-06-03T10:15:00Z",
    items: [
      {
        sku: "BG-ORJ-DIAM-001",
        designation: "Alliance Éternité Or Jaune & Diamants",
        qty: 1,
        unit_price: 548,
        discount: 0
      }
    ],
    client_id: "CL-04",
    client_name: "Isabelle Adjani",
    total_raw: 548.00,
    discount_total: 0,
    total_paid: 548,
    payment_method: "Carte",
    is_reservation: false,
    status: "Complété",
    balance_due: 0
  },
  {
    id: "V-005",
    date: "2026-06-05T12:00:00Z",
    items: [
      {
        sku: "MT-PL-IMPR-005",
        designation: "Montre Chronographe Impérial Platine",
        qty: 1,
        unit_price: 12500,
        discount: 0
      }
    ],
    client_id: "CL-03",
    client_name: "Marc Dumont",
    total_raw: 12500.00,
    discount_total: 0,
    total_paid: 12500,
    payment_method: "Virement",
    is_reservation: false,
    status: "Complété",
    balance_due: 0
  }
];

export const INITIAL_LOGS: AuditLog[] = [
  {
    id: "L-01",
    timestamp: "2026-06-06T08:00:00Z",
    user_name: "Gérant Principal",
    action: "Ouverture Caisse",
    details: "Démarrage de la journée de caisse, solde théorique de coffre OK."
  },
  {
    id: "L-02",
    timestamp: "2026-06-06T08:30:00Z",
    user_name: "Gérant Principal",
    action: "Mise à jour Cours Métaux",
    details: "Mise à jour du cours de l'Or 18k à 65.50 €/g."
  },
  {
    id: "L-03",
    timestamp: "2026-06-06T10:12:00Z",
    user_name: "Gérant Principal",
    action: "Changement de marque appliqué",
    details: " seneFashion est désormais configurée avec succès pour l'ensemble de la boutique de prestige."
  }
];

// Helper to calculate cost in real-time
export function calculateProductPrice(product: Product, settings: SystemSettings): number {
  if (product.price_type === 'fixe') {
    return product.price_fixed;
  }
  let rate = 0;
  switch (product.metal_type) {
    case 'Or Jaune':
    case 'Or Blanc':
    case 'Or Rose':
      rate = settings.gold_rate_18k;
      break;
    case 'Argent':
      rate = settings.silver_rate_925;
      break;
    case 'Platine':
      rate = settings.platinum_rate;
      break;
  }
  // Formula: weight * rate + labor_cost
  const sum = (product.weight * rate) + product.labor_cost;
  return Math.round(sum * 100) / 100;
}
