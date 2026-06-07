/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MetalType = 'Or Jaune' | 'Or Blanc' | 'Or Rose' | 'Argent' | 'Platine';

export type CategoryType = 'Bagues' | 'Colliers' | 'Bracelets' | 'Boucles d\'oreilles' | 'Montres';

export interface Product {
  sku: string;
  designation: string;
  category: CategoryType;
  metal_type: MetalType;
  purity: string; // e.g. "18k (750/1000)", "925/1000", "24k"
  weight: number; // in grams
  components_stones: string; // e.g. "Diamant 0.15ct HSI", "Sans pierres"
  price_type: 'fixe' | 'variable'; // fixed price or computed based on metal rate * weight + labor_cost
  labor_cost: number; // main d'œuvre if variable
  price_fixed: number; // raw price if fixed
  image_url: string;
  visible_en_ligne: boolean;
  stock_qty: number;
  description: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  sku: string;
  type: 'entree_fournisseur' | 'entree_fabrication' | 'sortie_vente' | 'sortie_fonte_recyclage' | 'sortie_perte_vol' | 'sortie_confiance' | 'retour_confiance';
  qty: number;
  date: string;
  partner_name: string; // Fournisseur name or customer name for trust loan
  cost_value: number; // cost of fabrication or buying value
  notes: string;
}

export interface SaleItem {
  sku: string;
  designation: string;
  qty: number;
  unit_price: number;
  discount: number; // total discount applied for this item
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  client_id?: string;
  client_name?: string;
  total_raw: number;
  discount_total: number;
  total_paid: number;
  payment_method: 'Espèces' | 'Carte' | 'Mobile Money' | 'Virement';
  is_reservation: boolean;
  status: 'Complété' | 'Réservé' | 'Solde Payé';
  balance_due: number;
}

export interface Expense {
  id: string;
  label: string;
  category: 'Loyer' | 'Électricité' | 'Salaires' | 'Emballage' | 'Sécurité' | 'Taxes' | 'Autre';
  amount: number;
  date: string;
  type: 'fixe' | 'variable';
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  ring_size?: string;
  metal_preference?: string;
  birthday?: string;
  notes_style?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_name: string;
  action: string;
  target_sku?: string;
  details: string;
}

export interface SystemSettings {
  whatsapp_phone: string;
  gold_rate_18k: number;   // rate per gram
  gold_rate_24k: number;   // rate per gram
  silver_rate_925: number; // rate per gram
  platinum_rate: number;   // rate per gram
  // New billing/tax fields for BIF operations
  tva_percentage: number;
  nif: string;           // Tax ID
  company_phone: string;
  company_email: string;
  apply_tva_on_sale: boolean;
}
