/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { 
  Product, StockMovement, Sale, Expense, Client, AuditLog, SystemSettings, CategoryType, MetalType 
} from '../types';
import { calculateProductPrice, calculateTVA } from '../data';
import { 
  TrendingUp, Library, ShoppingCart, RefreshCw, BadgeEuro, Users, 
  Settings, UserPlus, Trash, Plus, Check, AlertTriangle, Printer, FileText, 
  Sparkles, History, HardDrive, Inbox, Package, Scale, Eye, Tag, Menu, X, Gem, Barcode,
  ArrowUpRight, ArrowDownLeft, Database, ShoppingBag
} from 'lucide-react';
import BarcodeSVG from './BarcodeSVG';

/**
 * Génère automatiquement un Code de Référence (SKU Unique) harmonisé
 * basé sur la désignation de l'article, sa catégorie et son métal.
 */
function generateProductSku(designation: string, category: string, metalType: string): string {
  if (!designation) return '';
  
  // 1. Préfixe de la Catégorie
  let catPrefix = 'BJ';
  if (category === 'Bagues') catPrefix = 'BG';
  else if (category === 'Colliers') catPrefix = 'CL';
  else if (category === 'Bracelets') catPrefix = 'BR';
  else if (category === "Boucles d'oreilles") catPrefix = 'BO';
  else if (category === 'Montres') catPrefix = 'MT';

  // 2. Préfixe du Métal précieux
  let metalPrefix = 'GEN';
  if (metalType === 'Or Jaune') metalPrefix = 'ORJ';
  else if (metalType === 'Or Blanc') metalPrefix = 'ORB';
  else if (metalType === 'Or Rose') metalPrefix = 'ORR';
  else if (metalType === 'Argent') metalPrefix = 'ARG';
  else if (metalType === 'Platine') metalPrefix = 'PL';

  // 3. Normalisation et nettoyage de la Désignation commerciale
  const cleanDesignation = designation
    .normalize('NFD')                     // Sépare les accents des lettres de base
    .replace(/[\u0300-\u036f]/g, '')     // Supprime les accents
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')         // Conserve uniquement lettres, chiffres et espaces
    .trim();

  const words = cleanDesignation.split(/\s+/).filter(Boolean);
  
  let slug = '';
  if (words.length > 0) {
    const first = words[0].substring(0, 6);
    const second = words[1] ? words[1].substring(0, 5) : '';
    slug = second ? `${first}-${second}` : first;
  }

  // 4. Suffixe numérique déterministe pour écarter tout risque de collision
  let hashVal = 0;
  for (let i = 0; i < designation.length; i++) {
    hashVal = (hashVal * 31 + designation.charCodeAt(i)) % 900;
  }
  const numericSuffix = (100 + Math.abs(hashVal)).toString().padStart(3, '0');

  return `${catPrefix}-${metalPrefix}-${slug ? slug + '-' : ''}${numericSuffix}`;
}

interface AdminDashboardProps {
  products: Product[];
  movements: StockMovement[];
  sales: Sale[];
  expenses: Expense[];
  clients: Client[];
  logs: AuditLog[];
  settings: SystemSettings;
  setProducts: (p: Product[]) => void;
  setMovements: (m: StockMovement[]) => void;
  setSales: (s: Sale[]) => void;
  setExpenses: (e: Expense[]) => void;
  setClients: (c: Client[]) => void;
  setLogs: (l: AuditLog[]) => void;
  setSettings: (s: SystemSettings) => void;
  addLog: (action: string, details: string, target_sku?: string) => void;
}

type AdminTab = 'analytics' | 'catalog' | 'pos' | 'movements' | 'crm' | 'expenses' | 'inventory_audit' | 'settings';

export default function AdminDashboard({
  products, movements, sales, expenses, clients, logs, settings,
  setProducts, setMovements, setSales, setExpenses, setClients, setLogs, setSettings, addLog
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const navigate = useNavigate();

  // --- RESPONSIVE SIDEBAR & HIGHCHARTS REGISTRATION ---
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [chartYear, setChartYear] = useState<number>(2026);
  const [chartMonth, setChartMonth] = useState<number | 'all'>('all');

  // --- HIGHCHARTS DATA AGGREGATION ---
  const chartData = useMemo(() => {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    if (chartMonth === 'all') {
      const incomeData = Array(12).fill(0);
      const expenseData = Array(12).fill(0);

      sales.forEach(sale => {
        const d = new Date(sale.date);
        if (d.getFullYear() === chartYear) {
          const m = d.getMonth();
          incomeData[m] += sale.total_paid;
        }
      });

      expenses.forEach(exp => {
        const d = new Date(exp.date);
        if (d.getFullYear() === chartYear) {
          const m = d.getMonth();
          expenseData[m] += exp.amount;
        }
      });

      movements.forEach(mv => {
        if (mv.type === 'entree_fournisseur' || mv.type === 'entree_fabrication') {
          const d = new Date(mv.date);
          if (d.getFullYear() === chartYear) {
            const m = d.getMonth();
            expenseData[m] += mv.cost_value;
          }
        }
      });

      const profitData = incomeData.map((inc, i) => inc - expenseData[i]);

      return {
        categories: monthNames,
        income: incomeData,
        expense: expenseData,
        profit: profitData
      };
    } else {
      const daysInMonth = new Date(chartYear, chartMonth + 1, 0).getDate();
      const categories = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
      const incomeData = Array(daysInMonth).fill(0);
      const expenseData = Array(daysInMonth).fill(0);

      sales.forEach(sale => {
        const d = new Date(sale.date);
        if (d.getFullYear() === chartYear && d.getMonth() === chartMonth) {
          const day = d.getDate();
          incomeData[day - 1] += sale.total_paid;
        }
      });

      expenses.forEach(exp => {
        const d = new Date(exp.date);
        if (d.getFullYear() === chartYear && d.getMonth() === chartMonth) {
          const day = d.getDate();
          expenseData[day - 1] += exp.amount;
        }
      });

      movements.forEach(mv => {
        if (mv.type === 'entree_fournisseur' || mv.type === 'entree_fabrication') {
          const d = new Date(mv.date);
          if (d.getFullYear() === chartYear && d.getMonth() === chartMonth) {
            const day = d.getDate();
            expenseData[day - 1] += mv.cost_value;
          }
        }
      });

      const profitData = incomeData.map((inc, i) => inc - expenseData[i]);

      return {
        categories,
        income: incomeData,
        expense: expenseData,
        profit: profitData
      };
    }
  }, [sales, expenses, movements, chartYear, chartMonth]);

  const highchartsOptions = useMemo(() => {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const subTitleText = chartMonth === 'all' 
      ? `Consolidation administrative - Année ${chartYear}`
      : `Analyse journalière - ${monthNames[chartMonth]} ${chartYear}`;

    return {
      chart: {
        type: 'column',
        backgroundColor: '#FCFBF9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EBE7DF',
        style: {
          fontFamily: 'Inter, sans-serif'
        }
      },
      title: {
        text: 'Rapport d\'Évolution de Rentabilité (Gains vs Pertes)',
        style: {
          color: '#1C1917',
          fontFamily: 'Playfair Display, serif',
          fontWeight: 'semibold',
          fontSize: '18px'
        }
      },
      subtitle: {
        text: subTitleText,
        style: {
          color: '#8C7A63',
          fontSize: '12px'
        }
      },
      xAxis: {
        categories: chartData.categories,
        crosshair: true,
        labels: {
          style: {
            color: '#57534e',
            fontSize: '10px'
          }
        }
      },
      yAxis: {
        title: {
          text: 'Montant (€)',
          style: {
            color: '#AA7C11'
          }
        },
        labels: {
          format: '{value} €',
          style: {
            color: '#78716c'
          }
        },
        gridLineColor: '#F2ECE4'
      },
      tooltip: {
        shared: true,
        headerFormat: '<span style="font-size:11px;font-weight:bold;color:#78716c">{point.key}</span><br/>',
        pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y:,.2f} €</b><br/>',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1,
        borderColor: '#AA7C11',
        shadow: true
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 4
        }
      },
      colors: ['#059669', '#DC2626', '#AA7C11'],
      series: [
        {
          name: 'Chiffre d\'Affaires perçu',
          data: chartData.income,
          zIndex: 1
        },
        {
          name: 'Total Charges & Coûts Métal',
          data: chartData.expense,
          zIndex: 1
        },
        {
          name: 'Équilibre Net (Bénéfice/Perte)',
          type: 'spline',
          data: chartData.profit,
          zIndex: 2,
          marker: {
            lineWidth: 2,
            lineColor: '#AA7C11',
            fillColor: 'white'
          }
        }
      ],
      credits: {
        enabled: false
      }
    };
  }, [chartData, chartYear, chartMonth]);

  // --- LOCAL FORM STATES ---
  
  // Custom Modal States for CRUD
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productEditingSku, setProductEditingSku] = useState<string | null>(null);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientEditingId, setClientEditingId] = useState<string | null>(null);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseEditingId, setExpenseEditingId] = useState<string | null>(null);

  // Custom Barcode Modal State
  const [barcodeModalSku, setBarcodeModalSku] = useState<string | null>(null);

  // Custom Delete Confirm Popup State
  const [customConfirm, setCustomConfirm] = useState<{
    id: string;
    type: 'product' | 'client' | 'expense';
    title: string;
    message: string;
  } | null>(null);
  
  // Catalog adding
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    sku: '',
    designation: '',
    category: 'Bagues',
    metal_type: 'Or Jaune',
    purity: '18k (750/1000)',
    weight: 5.0,
    components_stones: 'Sans pierres',
    price_type: 'variable',
    labor_cost: 200,
    price_fixed: 0,
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
    visible_en_ligne: true,
    stock_qty: 1,
    description: '',
  });

  // Génération automatique du code SKU en direct lors de la création d'un bijou d'exception
  useEffect(() => {
    if (productEditingSku === null) {
      if (newProduct.designation && newProduct.designation.trim() !== '') {
        const generated = generateProductSku(
          newProduct.designation,
          newProduct.category || 'Bagues',
          newProduct.metal_type || 'Or Jaune'
        );
        if (newProduct.sku !== generated) {
          setNewProduct(prev => ({ ...prev, sku: generated }));
        }
      } else {
        if (newProduct.sku !== '') {
          setNewProduct(prev => ({ ...prev, sku: '' }));
        }
      }
    }
  }, [newProduct.designation, newProduct.category, newProduct.metal_type, productEditingSku]);

  // Stock movement adding
  const [qtyToChange, setQtyToChange] = useState<number>(1);
  const [targetProductSku, setTargetProductSku] = useState<string>('');
  const [movementType, setMovementType] = useState<StockMovement['type']>('entree_fournisseur');
  const [movementPartner, setMovementPartner] = useState<string>('Fournisseur de Métaux SAS');
  const [movementCost, setMovementCost] = useState<number>(0);
  const [movementNotes, setMovementNotes] = useState<string>('');

  // Fabrication state (Casting/Fonte raw gold logic)
  const [fabricateWeight, setFabricateWeight] = useState<number>(10);
  
  // Fast sale in POS
  const [posCart, setPosCart] = useState<{ product: Product; qty: number; discount: number }[]>([]);
  const [posSelectedSku, setPosSelectedSku] = useState('');
  const [posClientName, setPosClientName] = useState('');
  const [posClientId, setPosClientId] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'Espèces' | 'Carte' | 'Mobile Money' | 'Virement'>('Carte');
  const [posIsReservation, setPosIsReservation] = useState(false);
  const [posDownPaymentAmount, setPosDownPaymentAmount] = useState<number>(200);

  // Active receipt viewer
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);

  // Dépenses adding
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    label: '',
    category: 'Loyer',
    amount: 100,
    type: 'fixe',
    date: new Date().toISOString().split('T')[0]
  });

  // CRM client adding
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    phone: '',
    email: '',
    ring_size: '54',
    metal_preference: 'Or Jaune',
    birthday: '',
    notes_style: ''
  });

  // Settings modification
  const [tempSettings, setTempSettings] = useState<SystemSettings>({ ...settings });

  // Stock Audit Scans list (simulation of physical count vs theoretical)
  const [auditQuantities, setAuditQuantities] = useState<Record<string, number>>({});

  // Simplified Entry & Exit Form States
  const [entrySku, setEntrySku] = useState<string>('');
  const [entryType, setEntryType] = useState<'entree_fournisseur' | 'entree_fabrication'>('entree_fournisseur');
  const [entryQty, setEntryQty] = useState<number>(1);
  const [entryCost, setEntryCost] = useState<number>(0);
  const [entryPartner, setEntryPartner] = useState<string>('');
  const [entryNotes, setEntryNotes] = useState<string>('');

  const [exitSku, setExitSku] = useState<string>('');
  const [exitType, setExitType] = useState<'sortie_vente' | 'sortie_fonte_recyclage' | 'sortie_perte_vol' | 'sortie_confiance'>('sortie_fonte_recyclage');
  const [exitQty, setExitQty] = useState<number>(1);
  const [exitPartner, setExitPartner] = useState<string>('');
  const [exitNotes, setExitNotes] = useState<string>('');

  const handleSubmitSimpleEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entrySku) { 
      alert("Veuillez sélectionner un bijou de destination."); 
      return; 
    }
    const prod = products.find(p => p.sku === entrySku);
    if (!prod) return;

    const mvid = `MV-${Date.now().toString().slice(-6)}`;
    const newMv: StockMovement = {
      id: mvid,
      sku: entrySku,
      type: entryType,
      qty: entryQty,
      date: new Date().toISOString(),
      partner_name: entryPartner || (entryType === 'entree_fournisseur' ? 'Fournisseur Externe' : 'Atelier Interne'),
      cost_value: entryCost,
      notes: entryNotes || 'Entrée insérée via formulaire simplifié.'
    };

    const updatedProducts = products.map(p => {
      if (p.sku === entrySku) {
        return { ...p, stock_qty: p.stock_qty + entryQty };
      }
      return p;
    });

    setProducts(updatedProducts);
    setMovements([newMv, ...movements]);
    addLog('Entrée Simple Stock', `Ajout de ${entryQty} pces de "${prod.designation}" (${entryType === 'entree_fabrication' ? 'Atelier' : 'Fournisseur'}).`, entrySku);

    // reset fields
    setEntryQty(1);
    setEntryCost(0);
    setEntryPartner('');
    setEntryNotes('');
  };

  const handleSubmitSimpleExit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitSku) { 
      alert("Veuillez sélectionner un bijou de destination."); 
      return; 
    }
    const prod = products.find(p => p.sku === exitSku);
    if (!prod) return;

    if (prod.stock_qty < exitQty) {
      alert(`Stock insuffisant. Quantité disponible en atelier: ${prod.stock_qty}. Quantité demandée: ${exitQty}`);
      return;
    }

    const mvid = `MV-${Date.now().toString().slice(-6)}`;
    const newMv: StockMovement = {
      id: mvid,
      sku: exitSku,
      type: exitType,
      qty: exitQty,
      date: new Date().toISOString(),
      partner_name: exitPartner || 'Non spécifié',
      cost_value: 0,
      notes: exitNotes || 'Sortie insérée via formulaire simplifié.'
    };

    const updatedProducts = products.map(p => {
      if (p.sku === exitSku) {
        return { ...p, stock_qty: Math.max(0, p.stock_qty - exitQty) };
      }
      return p;
    });

    setProducts(updatedProducts);
    setMovements([newMv, ...movements]);
    addLog('Sortie Simple Stock', `Retrait de ${exitQty} pces de "${prod.designation}" (${exitType.replace('_', ' ')}).`, exitSku);

    // reset fields
    setExitQty(1);
    setExitPartner('');
    setExitNotes('');
  };

  const exportStockEntries = () => {
    // Filter for entries
    const entries = movements.filter(m => 
      m.type === 'entree_fournisseur' || 
      m.type === 'entree_fabrication' || 
      m.type === 'retour_confiance'
    );

    // Header row
    const headers = [
      "ID Opération",
      "SKU Produit",
      "Désignation Bijou",
      "Catégorie",
      "Métal",
      "Type d'Entrée",
      "Quantité (Pièces)",
      "Coût Unitaire (€)",
      "Coût Total Estimé (€)",
      "Fournisseur / Partenaire",
      "Date de Saisie",
      "Notes & Justification"
    ];

    // Data rows
    const rows = entries.map(m => {
      const p = products.find(prod => prod.sku === m.sku);
      const entryLabel = m.type === 'entree_fournisseur' ? "Achat Fournisseur" :
                         m.type === 'entree_fabrication' ? "Fabrication Interne Atelier" : 
                         m.type === 'retour_confiance' ? "Retour Prêt de Confiance" : m.type;
      
      const unitCost = m.cost_value || 0;
      const totalCost = unitCost * m.qty;

      return [
        m.id || "",
        m.sku,
        p?.designation || "Inconnu",
        p?.category || "Inconnu",
        p?.metal_type || "Inconnu",
        entryLabel,
        m.qty.toString(),
        unitCost.toFixed(2),
        totalCost.toFixed(2),
        m.partner_name || "",
        new Date(m.date).toLocaleString('fr-FR'),
        (m.notes || "").replace(/[\n\r]+/g, " ").replace(/"/g, '""')
      ];
    });

    // Generate CSV string with UTF-8 BOM
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(e => e.map(val => `"${val}"`).join(";"))].join("\n");
    
    // Trigger browser download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `seneFashion_Stock_Entrees_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addLog(
      "Export Excel Stock Entrées",
      `Exportation réussie de ${entries.length} mouvements d'entrées physiques de stocks.`
    );
  };

  const exportStockExits = () => {
    // Filter for exits
    const exits = movements.filter(m => 
      m.type === 'sortie_fonte_recyclage' || 
      m.type === 'sortie_perte_vol' || 
      m.type === 'sortie_confiance' ||
      m.type === 'sortie_vente'
    );

    // Header row
    const headers = [
      "ID Opération",
      "SKU Produit",
      "Désignation Bijou",
      "Catégorie",
      "Métal",
      "Motif de Sortie",
      "Quantité Sortie",
      "Coût Unitaire Estimé (€)",
      "Impact Financier (€)",
      "Bénéficiaire / Tiers",
      "Date de Saisie",
      "Notes & Justification"
    ];

    // Data rows
    const rows = exits.map(m => {
      const p = products.find(prod => prod.sku === m.sku);
      const exitLabel = m.type === 'sortie_fonte_recyclage' ? "Fonte / Recyclage d'Or" :
                        m.type === 'sortie_perte_vol' ? "Perte, Vol ou Casse" : 
                        m.type === 'sortie_confiance' ? "Prêt de Confiance" : 
                        m.type === 'sortie_vente' ? "Vente Facturée (Caisse POS)" : m.type;
      
      const unitCost = m.cost_value || (p ? calculateProductPrice(p, settings) : 0);
      const totalCost = unitCost * m.qty;

      return [
        m.id || "",
        m.sku,
        p?.designation || "Inconnu",
        p?.category || "Inconnu",
        p?.metal_type || "Inconnu",
        exitLabel,
        m.qty.toString(),
        unitCost.toFixed(2),
        totalCost.toFixed(2),
        m.partner_name || "",
        new Date(m.date).toLocaleString('fr-FR'),
        (m.notes || "").replace(/[\n\r]+/g, " ").replace(/"/g, '""')
      ];
    });

    // Generate CSV string with UTF-8 BOM
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(e => e.map(val => `"${val}"`).join(";"))].join("\n");
    
    // Trigger browser download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `seneFashion_Stock_Sorties_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addLog(
      "Export Excel Stock Sorties",
      `Exportation réussie de ${exits.length} mouvements de sorties physiques de stocks.`
    );
  };

  // Initialize Audit with theoretical stock quantities
  const loadAuditQuantities = () => {
    const fresh: Record<string, number> = {};
    products.forEach(p => {
      fresh[p.sku] = p.stock_qty;
    });
    setAuditQuantities(fresh);
    addLog('Audit de Stock', 'Initialisation d\'un inventaire théorique vs réel.');
  };

  // --- ANALYTICS CALCULATIONS ---
  const stats = useMemo(() => {
    // Sales computation
    let totalSalesVal = 0;
    let totalRevenue = 0;
    sales.forEach(s => {
      totalRevenue += s.total_paid;
      // Calculate true sales value
      totalSalesVal += s.total_raw - s.discount_total;
    });

    // Expenses computation
    let totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Cost of Goods Sold estimation from finished products
    // We compute simulated raw cost value of sold metals + labor based on movement trails
    let estimatedCOGS = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const prod = products.find(p => p.sku === item.sku);
        if (prod) {
          // Calculate buying profile or simple cost as 60% of calculated retail
          const prodPrice = calculateProductPrice(prod, settings);
          estimatedCOGS += (prodPrice * 0.55) * item.qty;
        }
      });
    });

    const netProfit = totalRevenue - (estimatedCOGS + totalExpenses);

    // Total display case inventory assets calculation
    let totalStockValueInWindow = 0;
    let totalStockValueInSafe = 0;

    products.forEach(p => {
      const priceVal = calculateProductPrice(p, settings);
      const inventoryAssetPrice = priceVal * p.stock_qty;
      // High end jewels of value >= 1000 are allocated to safety vault, others stay in front panel display windows
      if (priceVal >= 1000) {
        totalStockValueInSafe += inventoryAssetPrice;
      } else {
        totalStockValueInWindow += inventoryAssetPrice;
      }
    });

    // Ranking bestseller items
    const skuSaleCounts: Record<string, number> = {};
    sales.forEach(s => {
      s.items.forEach(i => {
        skuSaleCounts[i.sku] = (skuSaleCounts[i.sku] || 0) + i.qty;
      });
    });

    const topProducts = Object.entries(skuSaleCounts)
      .map(([sku, qty]) => {
        const prod = products.find(p => p.sku === sku);
        return {
          sku,
          qty,
          designation: prod ? prod.designation : sku,
          metal: prod ? prod.metal_type : 'Inconnu'
        };
      })
      .sort((a,b) => b.qty - a.qty)
      .slice(0, 3);

    // Real cumulative stock metrics
    let totalEntered = 0;
    let totalExited = 0;
    let totalSold = 0;
    let totalStockCost = 0;

    movements.forEach(mv => {
      if (mv.type === 'entree_fournisseur' || mv.type === 'entree_fabrication') {
        totalEntered += mv.qty;
        totalStockCost += (mv.cost_value * mv.qty);
      } else if (mv.type === 'sortie_vente') {
        totalSold += mv.qty;
      } else if (['sortie_fonte_recyclage', 'sortie_perte_vol', 'sortie_confiance'].includes(mv.type)) {
        totalExited += mv.qty;
      } else if (mv.type === 'retour_confiance') {
        totalExited = Math.max(0, totalExited - mv.qty);
      }
    });

    const totalRemaining = products.reduce((sum, p) => sum + p.stock_qty, 0);
    // Bilan de l'activité (Gain ou Perte)
    const globalNetBalance = totalRevenue - (totalStockCost + totalExpenses);

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      cogs: estimatedCOGS,
      netProfit,
      displayCaseVal: totalStockValueInWindow,
      safeVal: totalStockValueInSafe,
      totalVal: totalStockValueInWindow + totalStockValueInSafe,
      topProducts,
      totalEntered,
      totalExited,
      totalSold,
      totalRemaining,
      totalStockCost,
      globalNetBalance
    };
  }, [sales, expenses, products, settings, movements]);

  // Alert system for low stocks
  const lowStockThreshold = 2;
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock_qty <= lowStockThreshold);
  }, [products]);

  // --- ACTIONS ---

  // Update metal settings
  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(tempSettings);
    addLog('Mise à jour Paramètres', 'Modification des cours des métaux au gramme et/ou numéro WhatsApp.');
    alert('Paramètres de carats et cours mis à jour avec succès.');
  };

  // Products CRUD Helper triggers
  const openProductCreate = () => {
    setProductEditingSku(null);
    setNewProduct({
      sku: '',
      designation: '',
      category: 'Bagues',
      metal_type: 'Or Jaune',
      purity: '18k (750/1000)',
      weight: 5.0,
      components_stones: 'Sans pierres',
      price_type: 'variable',
      labor_cost: 200,
      price_fixed: 0,
      image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
      visible_en_ligne: true,
      stock_qty: 1,
      description: '',
    });
    setProductModalOpen(true);
  };

  const openProductEdit = (product: Product) => {
    setProductEditingSku(product.sku);
    setNewProduct({ ...product });
    setProductModalOpen(true);
  };

  // Add / Update product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.sku || !newProduct.designation) {
      alert('Veuillez renseigner un SKU unique et une désignation.');
      return;
    }

    const uppercaseSku = newProduct.sku.toUpperCase();

    if (productEditingSku === null) {
      // Create mode
      if (products.some(p => p.sku === uppercaseSku)) {
        alert('Erreur: Ce code SKU existe déjà dans la base.');
        return;
      }

      const prodToAdd: Product = {
        sku: uppercaseSku,
        designation: newProduct.designation,
        category: (newProduct.category || 'Bagues') as CategoryType,
        metal_type: (newProduct.metal_type || 'Or Jaune') as MetalType,
        purity: newProduct.purity || "18k (750/1000)",
        weight: Number(newProduct.weight || 0),
        components_stones: newProduct.components_stones || 'Sans pierres',
        price_type: (newProduct.price_type || 'variable') as 'fixe' | 'variable',
        labor_cost: Number(newProduct.labor_cost || 0),
        price_fixed: Number(newProduct.price_fixed || 0),
        image_url: newProduct.image_url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
        visible_en_ligne: !!newProduct.visible_en_ligne,
        stock_qty: Number(newProduct.stock_qty || 0),
        description: newProduct.description || '',
        created_at: new Date().toISOString()
      };

      setProducts([...products, prodToAdd]);
      addLog('Création Produit', `Ajout du bijou "${prodToAdd.designation}" au catalogue.`, prodToAdd.sku);
    } else {
      // Update mode
      const updatedList = products.map(p => {
        if (p.sku === productEditingSku) {
          return {
            ...p,
            designation: newProduct.designation || p.designation,
            category: (newProduct.category as CategoryType) || p.category,
            metal_type: (newProduct.metal_type as MetalType) || p.metal_type,
            purity: newProduct.purity || p.purity,
            weight: Number(newProduct.weight !== undefined ? newProduct.weight : p.weight),
            components_stones: newProduct.components_stones || p.components_stones,
            price_type: (newProduct.price_type as 'fixe' | 'variable') || p.price_type,
            labor_cost: Number(newProduct.labor_cost !== undefined ? newProduct.labor_cost : p.labor_cost),
            price_fixed: Number(newProduct.price_fixed !== undefined ? newProduct.price_fixed : p.price_fixed),
            image_url: newProduct.image_url || p.image_url,
            visible_en_ligne: newProduct.visible_en_ligne !== undefined ? !!newProduct.visible_en_ligne : p.visible_en_ligne,
            stock_qty: Number(newProduct.stock_qty !== undefined ? newProduct.stock_qty : p.stock_qty),
            description: newProduct.description || p.description,
          };
        }
        return p;
      });

      setProducts(updatedList);
      addLog('Modif Produit', `Édition des détails du bijou "${newProduct.designation}".`, productEditingSku);
    }

    setProductModalOpen(false);
    setProductEditingSku(null);
  };

  // Deleting a product from Catalogue
  const handleDeleteProduct = (sku: string) => {
    const removed = products.find(p => p.sku === sku);
    if (!removed) return;
    setCustomConfirm({
      id: sku,
      type: 'product',
      title: 'Supprimer un Article',
      message: `Voulez-vous supprimer définitivement l'article "${removed.designation}" (Réf: ${sku}) ? Cette action est irréversible.`
    });
  };

  // Add stock supply / foundry convertion movements
  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProductSku) {
      alert('Sélectionnez un bijou de destination.');
      return;
    }
    const targetProd = products.find(p => p.sku === targetProductSku);
    if (!targetProd) return;

    // Check availability for outgoings
    const isOutgoing = ['sortie_vente', 'sortie_fonte_recyclage', 'sortie_perte_vol', 'sortie_confiance'].includes(movementType);
    if (isOutgoing && targetProd.stock_qty < qtyToChange) {
      alert(`Stock insuffisant. Quantité disponible: ${targetProd.stock_qty}. Quantité demandée: ${qtyToChange}`);
      return;
    }

    const mvid = `MV-${Date.now().toString().slice(-6)}`;
    const newMv: StockMovement = {
      id: mvid,
      sku: targetProductSku,
      type: movementType,
      qty: qtyToChange,
      date: new Date().toISOString(),
      partner_name: movementPartner || 'Non spécifié',
      cost_value: Number(movementCost || 0),
      notes: movementNotes || 'Mouvement saisi manuellement par la direction.'
    };

    // Calculate updated stock
    const updatedProducts = products.map(p => {
      if (p.sku === targetProductSku) {
        const factor = isOutgoing ? -qtyToChange : qtyToChange;
        return { ...p, stock_qty: Math.max(0, p.stock_qty + factor) };
      }
      return p;
    });

    setProducts(updatedProducts);
    setMovements([newMv, ...movements]);
    addLog('Mouvement de Stock', `Type: ${movementType} (${qtyToChange} pces) pour "${targetProd.designation}".`, targetProductSku);
    
    // Clean fields
    setQtyToChange(1);
    setMovementNotes('');
    alert('Mouvement de stock enregistré avec succès.');
  };

  // Fabrication: Convert brute metal alloy to finished product
  const handleCastingFabricate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProductSku) {
      alert('Sélectionnez le bijou fini que votre atelier à fabriqué.');
      return;
    }
    const target = products.find(p => p.sku === targetProductSku);
    if (!target) return;

    // Creation of special casting movement
    const mvid = `MV-FAB-${Date.now().toString().slice(-6)}`;
    const newMv: StockMovement = {
      id: mvid,
      sku: target.sku,
      type: 'entree_fabrication',
      qty: 1,
      date: new Date().toISOString(),
      partner_name: 'Atelier de Fonte Interne',
      cost_value: target.weight * settings.gold_rate_24k + target.labor_cost,
      notes: `Conversion de fonte artisanale. Consommation théorique de ${fabricateWeight}g d'or brut 24 carats.`
    };

    const updatedProducts = products.map(p => {
      if (p.sku === target.sku) {
        return { ...p, stock_qty: p.stock_qty + 1 };
      }
      return p;
    });

    setProducts(updatedProducts);
    setMovements([newMv, ...movements]);
    addLog('Fabrication Fonderie', `Fonte & Alliage de ${fabricateWeight}g d'Or brut pour fabriquer 1 pièce de "${target.designation}".`, target.sku);
    alert(`Fonte effectuée! 1 unité de ${target.designation} a été ajoutée à vos tiroirs.`);
  };

  // Safe release: return loaned trust item (Prêt Confiance) back to catalog stock
  const handleReturnTrustLoan = (mvId: string) => {
    const parentMv = movements.find(m => m.id === mvId);
    if (!parentMv) return;

    const targetProd = products.find(p => p.sku === parentMv.sku);
    if (!targetProd) return;

    // Creation of reciprocal entry
    const replyId = `MV-RET-${Date.now().toString().slice(-6)}`;
    const returnMv: StockMovement = {
      id: replyId,
      sku: parentMv.sku,
      type: 'retour_confiance',
      qty: parentMv.qty,
      date: new Date().toISOString(),
      partner_name: parentMv.partner_name,
      cost_value: 0,
      notes: `Retour officiel de prêt suite au mouvement ${parentMv.id}.`
    };

    const updatedProducts = products.map(p => {
      if (p.sku === parentMv.sku) {
        return { ...p, stock_qty: p.stock_qty + parentMv.qty };
      }
      return p;
    });

    setProducts(updatedProducts);
    // Overwrite old movement's note or add returning log
    const updatedMovements = movements.map(m => {
      if (m.id === mvId) {
        return { ...m, notes: `${m.notes} (Retourné le ${new Date().toLocaleDateString('fr-FR')})` };
      }
      return m;
    });

    setMovements([returnMv, ...updatedMovements]);
    addLog('Remboursement Prêt', `Le bijou loué de confiance par "${parentMv.partner_name}" est réintégré.`, parentMv.sku);
    alert('Le retour de pièces de confiance a été validé et injecté en stock.');
  };

  // --- FASTER sale POS handlers ---
  const handleAddPosCart = () => {
    if (!posSelectedSku) return;
    const prod = products.find(p => p.sku === posSelectedSku);
    if (!prod) return;

    if (prod.stock_qty <= 0) {
      alert('Avertissement: Ce bijou est actuellement épuisé. Commande sur mesure requise.');
    }

    // Check if state cartridge already contains this item
    const existingIndex = posCart.findIndex(item => item.product.sku === posSelectedSku);
    if (existingIndex > -1) {
      const updated = [...posCart];
      updated[existingIndex].qty += 1;
      setPosCart(updated);
    } else {
      setPosCart([...posCart, { product: prod, qty: 1, discount: 0 }]);
    }
  };

  const handleRemovePosCart = (sku: string) => {
    setPosCart(posCart.filter(item => item.product.sku !== sku));
  };

  const handleUpdateCartDiscount = (sku: string, disc: number) => {
    setPosCart(posCart.map(item => {
      if (item.product.sku === sku) {
        return { ...item, discount: disc };
      }
      return item;
    }));
  };

  const handleProcessSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) {
      alert('La caisse est vide. Veuillez y insérer au moins une création.');
      return;
    }

    // Calculate values
    let calculatedRawTotal = 0;
    let totalDiscount = 0;

    posCart.forEach(item => {
      const price = calculateProductPrice(item.product, settings);
      calculatedRawTotal += price * item.qty;
      totalDiscount += item.discount;
    });

    const netValueToPay = calculatedRawTotal - totalDiscount;
    const paidSum = posIsReservation ? posDownPaymentAmount : netValueToPay;
    const balanceDue = posIsReservation ? Math.max(0, netValueToPay - paidSum) : 0;

    // Creation of custom invoice entry
    const vid = `V-FAC-${Date.now().toString().slice(-6)}`;
    const registeredSale: Sale = {
      id: vid,
      date: new Date().toISOString(),
      items: posCart.map(item => ({
        sku: item.product.sku,
        designation: item.product.designation,
        qty: item.qty,
        unit_price: calculateProductPrice(item.product, settings),
        discount: item.discount
      })),
      client_id: posClientId || undefined,
      client_name: posClientName || 'Client de Passage',
      total_raw: calculatedRawTotal,
      discount_total: totalDiscount,
      total_paid: paidSum,
      payment_method: posPaymentMethod,
      is_reservation: posIsReservation,
      status: posIsReservation ? 'Réservé' : 'Complété',
      balance_due: balanceDue
    };

    // Substract stock for sold quantities
    const updatedProducts = products.map(p => {
      const cartItem = posCart.find(item => item.product.sku === p.sku);
      if (cartItem) {
        return { ...p, stock_qty: Math.max(0, p.stock_qty - cartItem.qty) };
      }
      return p;
    });

    // Create a physical movement logging the sale
    const freshMovements: StockMovement[] = posCart.map(item => ({
      id: `MV-VTE-${Date.now().toString().slice(-6)}-${item.product.sku.slice(-3)}`,
      sku: item.product.sku,
      type: 'sortie_vente',
      qty: item.qty,
      date: new Date().toISOString(),
      partner_name: posClientName || 'Client Passant',
      cost_value: calculateProductPrice(item.product, settings) * 0.55, // internal estimated cogs cost
      notes: `Vendu via caisse POS. Facture: ${vid}. Mode: ${posPaymentMethod}.`
    }));

    setProducts(updatedProducts);
    setSales([registeredSale, ...sales]);
    setMovements([...freshMovements, ...movements]);
    addLog('Vente Validée', `Facture ${vid} créée pour ${posClientName || 'Client anonyme'}. Total encaissé: ${paidSum}€.`, posCart[0]?.product.sku);

    // If client specified CRM history, link or write notes
    if (posClientId) {
      setClients(clients.map(c => {
        if (c.id === posClientId) {
          return {
            ...c,
            notes_style: `${c.notes_style || ''} | Achat du ${new Date().toLocaleDateString('fr-FR')} (${posCart.map(i => i.product.designation).join(', ')})`
          };
        }
        return c;
      }));
    }

    // Load receipt pop
    setSelectedReceiptSale(registeredSale);
    
    // Clear cart
    setPosCart([]);
    setPosClientName('');
    setPosClientId('');
    setPosIsReservation(false);
    alert('La transaction a été validée avec succès. Reçu de caisse généré.');
  };

  // Expenses CRUD Helpers
  const openExpenseCreate = () => {
    setExpenseEditingId(null);
    setNewExpense({
      label: '',
      category: 'Loyer',
      amount: 100,
      type: 'fixe',
      date: new Date().toISOString().split('T')[0]
    });
    setExpenseModalOpen(true);
  };

  const openExpenseEdit = (expense: Expense) => {
    setExpenseEditingId(expense.id);
    setNewExpense({ ...expense });
    setExpenseModalOpen(true);
  };

  // Add / Update Expenses
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.label || !newExpense.amount) {
      alert('Veuillez spécifier le libellé et le montant.');
      return;
    }

    if (expenseEditingId === null) {
      // Create mode
      const id = `EXP-${Date.now().toString().slice(-6)}`;
      const added: Expense = {
        id,
        label: newExpense.label,
        category: (newExpense.category || 'Loyer') as Expense['category'],
        amount: Number(newExpense.amount || 0),
        date: newExpense.date || new Date().toISOString().split('T')[0],
        type: (newExpense.type || 'fixe') as 'fixe' | 'variable'
      };

      setExpenses([added, ...expenses]);
      addLog('Enregistrement Charge', `Achat/Dépense: "${added.label}" d'un montant de ${added.amount}€.`);
    } else {
      // Update mode
      const updated = expenses.map(item => {
        if (item.id === expenseEditingId) {
          return {
            ...item,
            label: newExpense.label || item.label,
            category: (newExpense.category as Expense['category']) || item.category,
            amount: Number(newExpense.amount !== undefined ? newExpense.amount : item.amount),
            date: newExpense.date || item.date,
            type: (newExpense.type as 'fixe' | 'variable') || item.type,
          };
        }
        return item;
      });

      setExpenses(updated);
      addLog('Modif Charge', `Charge "${newExpense.label}" mise à jour.`);
    }

    setExpenseModalOpen(false);
    setExpenseEditingId(null);
  };

  const handleDeleteExpense = (id: string) => {
    const removed = expenses.find(e => e.id === id);
    if (!removed) return;
    setCustomConfirm({
      id,
      type: 'expense',
      title: 'Supprimer une Charge',
      message: `Voulez-vous supprimer définitivement la charge "${removed.label}" d'un montant de ${removed.amount} € ?`
    });
  };

  // CRM Client CRUD Helpers
  const openClientCreate = () => {
    setClientEditingId(null);
    setNewClient({
      name: '',
      phone: '',
      email: '',
      ring_size: '54',
      metal_preference: 'Or Jaune',
      birthday: '',
      notes_style: ''
    });
    setClientModalOpen(true);
  };

  const openClientEdit = (client: Client) => {
    setClientEditingId(client.id);
    setNewClient({ ...client });
    setClientModalOpen(true);
  };

  // Add / Update CRM Client
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.phone) {
      alert('Veuillez au moins spécifier un nom et numéro.');
      return;
    }

    if (clientEditingId === null) {
      // Create mode
      const id = `CL-${(clients.length + 1).toString().padStart(2, '0')}`;
      const added: Client = {
        id,
        name: newClient.name,
        phone: newClient.phone,
        email: newClient.email || '',
        ring_size: newClient.ring_size || '',
        metal_preference: newClient.metal_preference || 'Or Jaune',
        birthday: newClient.birthday || '',
        notes_style: newClient.notes_style || ''
      };

      setClients([...clients, added]);
      addLog('Nouveau Client CRM', `Fiche créée pour "${added.name}".`);
    } else {
      // Update mode
      const updated = clients.map(c => {
        if (c.id === clientEditingId) {
          return {
            ...c,
            name: newClient.name || c.name,
            phone: newClient.phone || c.phone,
            email: newClient.email || c.email,
            ring_size: newClient.ring_size || c.ring_size,
            metal_preference: newClient.metal_preference || c.metal_preference,
            birthday: newClient.birthday || c.birthday,
            notes_style: newClient.notes_style || c.notes_style,
          };
        }
        return c;
      });

      setClients(updated);
      addLog('Modif Client CRM', `Fiche client "${newClient.name}" mise à jour.`);
    }

    setClientModalOpen(false);
    setClientEditingId(null);
  };

  const handleDeleteClient = (id: string) => {
    const removed = clients.find(c => c.id === id);
    if (!removed) return;
    setCustomConfirm({
      id,
      type: 'client',
      title: 'Supprimer un Client',
      message: `Voulez-vous supprimer définitivement la fiche client de "${removed.name}" ?`
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col md:flex-row relative">
      
      {/* Mobile Sidebar backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-[#000000]/60 z-30 md:hidden transition-opacity duration-350"
        />
      )}
      
      {/* 1. LEFT SIDEBAR PANEL (Collapsible Sidebar on mobile drawers) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#14120F] text-stone-300 flex flex-col justify-between border-r border-[#2C251E] transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static transition-transform duration-300 ease-in-out`}>
        {/* Branding details */}
        <div>
          <div className="p-6 border-b border-[#2C251E] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-[#AA7C11]/20 rounded text-[#D4AF37]">
                <Gem className="h-5 w-5" />
              </div>
              <div>
                <span className="font-serif text-base tracking-widest text-[#FAF9F5] block font-bold leading-none">SENEFASHION</span>
                <span className="text-[8px] tracking-widest text-[#AA7C11] font-mono uppercase font-semibold">Direction Ateliers</span>
              </div>
            </div>
            
            {/* Close button for mobile screen only */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 text-stone-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Luxury stacked vertical navigation tabs for sidebar */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded-lg flex items-center space-x-3 transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-[#AA7C11]/15 text-[#D4AF37] border-l-4 border-[#AA7C11]'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-100'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Reporting & Rentabilité</span>
            </button>

            <button
              onClick={() => { setActiveTab('catalog'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded-lg flex items-center space-x-3 transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-[#AA7C11]/15 text-[#D4AF37] border-l-4 border-[#AA7C11]'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-100'
              }`}
            >
              <Library className="h-4 w-4" />
              <span>Catalogue & Créations</span>
            </button>

            <button
              onClick={() => { setActiveTab('pos'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded-lg flex items-center space-x-3 transition-colors ${
                activeTab === 'pos'
                  ? 'bg-[#AA7C11]/15 text-[#D4AF37] border-l-4 border-[#AA7C11]'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-100'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Caisse / Facturation</span>
            </button>

            <button
              onClick={() => { setActiveTab('movements'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded-lg flex items-center space-x-3 transition-colors ${
                activeTab === 'movements'
                  ? 'bg-[#AA7C11]/15 text-[#D4AF37] border-l-4 border-[#AA7C11]'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-100'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Flux Stocks & Fonte</span>
            </button>

            <button
              onClick={() => { setActiveTab('crm'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded-lg flex items-center space-x-3 transition-colors ${
                activeTab === 'crm'
                  ? 'bg-[#AA7C11]/15 text-[#D4AF37] border-l-4 border-[#AA7C11]'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-100'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>CRM Fidélité</span>
            </button>

            <button
              onClick={() => { setActiveTab('expenses'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded-lg flex items-center space-x-3 transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-[#AA7C11]/15 text-[#D4AF37] border-l-4 border-[#AA7C11]'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-100'
              }`}
            >
              <BadgeEuro className="h-4 w-4" />
              <span>Charges & Dépenses</span>
            </button>

            <button
              onClick={() => { setActiveTab('inventory_audit'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded-lg flex items-center space-x-3 transition-colors ${
                activeTab === 'inventory_audit'
                  ? 'bg-[#AA7C11]/15 text-[#D4AF37] border-l-4 border-[#AA7C11]'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-100'
              }`}
            >
              <HardDrive className="h-4 w-4" />
              <span>Audit & Traçabilité</span>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
              className={`w-full text-left px-4 py-3 text-xs tracking-wider uppercase font-semibold rounded-lg flex items-center space-x-3 transition-colors ${
                activeTab === 'settings'
                  ? 'bg-[#AA7C11]/15 text-[#D4AF37] border-l-4 border-[#AA7C11]'
                  : 'hover:bg-stone-800 text-stone-400 hover:text-stone-100'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Paramètres Ateliers</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer with manual logout and returning to vitrine */}
        <div className="p-4 border-t border-[#2C251E] space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 border border-[#2C251E] hover:border-[#D4AF37] text-xs text-stone-400 hover:text-[#FAF9F5] rounded uppercase tracking-wider transition-colors font-sans flex items-center justify-center space-x-2"
          >
            <span>Retourner au Site</span>
          </button>
          <div className="text-[10px] text-center font-mono text-stone-600 block pb-1">
            Mode Administrateur Connecté
          </div>
        </div>
      </aside>

      {/* Overlay backdrop for mobile sidebars */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="bg-black/60 fixed inset-0 z-30 md:hidden"
        />
      )}

      {/* 2. MAIN CONTENT AREA SPLIT */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Mobile top header bar toggle */}
        <header className="bg-[#14120F] text-white p-4 flex md:hidden items-center justify-between z-30 sticky top-0 shadow-md">
          <div className="flex items-center space-x-2">
            <Gem className="h-5 w-5 text-[#D4AF37]" />
            <span className="font-serif text-sm tracking-widest font-black text-[#FAF9F5]">SENEFASHION - DIRECTION</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-[#D4AF37] hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Desktop premium top control bar */}
        <div className="hidden md:block bg-[#14120F] text-[#FAF9F5] py-6 px-8 border-b border-[#2C251E] shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[9px] tracking-[0.3em] text-[#D4AF37] uppercase font-bold font-sans">
                Pilotage Officiel de la Bijouterie
              </span>
              <h1 className="font-serif text-2xl font-light text-[#FAF9F5] mt-1">
                Direction d'Atelier Place Vendôme
              </h1>
            </div>
            
            <div className="flex items-center space-x-4 font-sans">
              <span className="text-xs font-mono text-stone-400 font-light bg-[#231E18]/55 border border-[#2C251E] px-3 py-1.5 rounded-md">
                📅 {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Central screen content padded container */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-grow pb-24">

        {/* --- INVOICE RECEIPT MODAL VIEWER OVERLAY --- */}
        {selectedReceiptSale && (
          <div className="bg-black/60 inset-0 fixed z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full border-4 border-[#AA7C11] relative font-sans text-stone-800">
              
              <div className="text-center pb-4 border-b-2 border-dashed border-stone-200">
                <span className="font-serif text-xl tracking-widest text-[#0F0E0C] block font-bold">SENEFASHION</span>
                <span className="text-[8px] tracking-[0.2em] text-[#C5A880] uppercase block">Haute Joaillerie & Couture d'Exception</span>
                <p className="text-[10px] text-stone-400 font-light mt-1">22 Place Vendôme, 75001 Paris</p>
                <h4 className="font-mono text-xs font-bold text-stone-600 mt-2 uppercase bg-stone-100 py-1 inline-block px-3 rounded">
                  {selectedReceiptSale.is_reservation ? 'Acompte & Réservation' : 'Facture de Vente'}
                </h4>
              </div>

              <div className="py-4 space-y-2 border-b-2 border-dashed border-stone-200 text-xs">
                <p><span className="font-semibold text-stone-400">Réf : </span> <span className="font-mono text-stone-800 font-bold">{selectedReceiptSale.id}</span></p>
                <p><span className="font-semibold text-stone-400">Date : </span> {new Date(selectedReceiptSale.date).toLocaleString('fr-FR')}</p>
                <p><span className="font-semibold text-stone-400">Client : </span> <span className="font-bold text-stone-800">{selectedReceiptSale.client_name}</span></p>
                <p><span className="font-semibold text-stone-400">Mode : </span> {selectedReceiptSale.payment_method}</p>
              </div>

              <div className="py-4 border-b-2 border-dashed border-stone-200">
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block mb-3 text-center">Articles d'exception</span>
                <div className="space-y-3">
                  {selectedReceiptSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-light">
                      <div>
                        <p className="font-serif font-semibold text-stone-850">{item.designation}</p>
                        <p className="font-mono text-[10px] text-stone-400">1x {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <span>{item.unit_price.toLocaleString('fr-FR')} €</span>
                        {item.discount > 0 && (
                          <span className="text-rose-500 block text-[9px] font-semibold">- {item.discount} € remise</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="py-4 space-y-2 text-sm text-right font-serif">
                <div className="flex justify-between text-xs text-stone-500 font-sans">
                  <span>Sous-total brut:</span>
                  <span>{selectedReceiptSale.total_raw.toLocaleString('fr-FR')} €</span>
                </div>
                {selectedReceiptSale.discount_total > 0 && (
                  <div className="flex justify-between text-xs text-rose-500 font-sans">
                    <span>Remise accordée:</span>
                    <span>-{selectedReceiptSale.discount_total.toLocaleString('fr-FR')} €</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-1 text-stone-900 border-t border-stone-100">
                  <span>Net à payer:</span>
                  <span>{(selectedReceiptSale.total_raw - selectedReceiptSale.discount_total).toLocaleString('fr-FR')} €</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-emerald-600 font-sans">
                  <span>Somme encaissée:</span>
                  <span>{selectedReceiptSale.total_paid.toLocaleString('fr-FR')} €</span>
                </div>
                {selectedReceiptSale.is_reservation && (
                  <div className="flex justify-between text-xs font-bold text-amber-600 bg-amber-50 p-2 rounded font-sans leading-none mt-2">
                    <span>Reste dû:</span>
                    <span>{selectedReceiptSale.balance_due.toLocaleString('fr-FR')} €</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-4 border-t-2 border-dashed border-[#AA7C11]/50 text-[10px] text-stone-400">
                <p>Merci pour votre confiance de prestige.</p>
                <p className="font-semibold text-stone-500 mt-1">seneFashion — Place Vendôme</p>
                
                <div className="mt-6 flex justify-center space-x-2">
                  <button
                    onClick={() => { window.print(); }}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] py-1 px-3 rounded uppercase tracking-wider flex items-center space-x-1"
                  >
                    <Printer className="h-3 w-3" />
                    <span>Imprimer ticket</span>
                  </button>
                  <button
                    onClick={() => setSelectedReceiptSale(null)}
                    className="bg-[#0F0E0C] hover:bg-[#AA7C11] text-[#FAF9F5] hover:text-[#0F0E0C] text-[10px] py-1 px-3 rounded uppercase tracking-wider"
                  >
                    Fermer reçu
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB 1: REPORTING & ANALYTICS --- */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in">

            {/* BILAN DE L'ACTIVITÉ & SUIVI DE L'AVANCE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Card Bilan Financier (Gain ou Perte) */}
              <div className="lg:col-span-6 bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm relative overflow-hidden">
                <span className="absolute top-2 right-2 flex space-x-1 py-1">
                  <span className="px-2 py-0.5 bg-amber-50 text-[#AA7C11] font-mono text-[8px] uppercase tracking-widest font-bold border border-amber-200 rounded">
                    Bilan Officiel
                  </span>
                </span>
                
                <h3 className="font-serif text-base text-stone-850 font-semibold mb-4 flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-[#AA7C11]" />
                  <span>Bilan d'Activité (Gain ou Perte)</span>
                </h3>

                <p className="text-xs text-stone-500 font-light mb-6 leading-relaxed">
                  Ce bilan détermine si votre activité de joaillerie dégage un gain (bénéfice) ou une perte par rapport au coût réel de fabrication/d'achat du stock brut injecté et de vos dépenses courantes.
                </p>

                <div className="p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 mb-6 bg-[#FAF9F5] border-stone-200">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">État Global de l'Activité</span>
                  {stats.globalNetBalance >= 0 ? (
                    <div className="space-y-1">
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-sans font-bold uppercase tracking-wider">
                        ▲ En Excédent (GAIN)
                      </span>
                      <h4 className="font-serif text-3xl font-black text-emerald-600">
                        +{stats.globalNetBalance.toLocaleString('fr-FR')} €
                      </h4>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-[11px] font-sans font-bold uppercase tracking-wider">
                        ▼ En Déficit (PERTE)
                      </span>
                      <h4 className="font-serif text-3xl font-black text-rose-600">
                        {stats.globalNetBalance.toLocaleString('fr-FR')} €
                      </h4>
                    </div>
                  )}
                </div>

                {/* Accounting breakdown ledger */}
                <div className="space-y-3 font-sans text-xs text-[#2C251E]">
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-stone-100">
                    <span className="font-medium">Chiffre d'Affaires Encaissé (Ventes)</span>
                    <span className="font-mono text-emerald-600 font-bold">+{stats.revenue.toLocaleString('fr-FR')} €</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-stone-100" title="Coût réel total de tous les produits enregistrés par fournisseurs ou atelier de fonte">
                    <span>Achat Métaux & Coût Fabrication Stock (-)</span>
                    <span className="font-mono text-rose-600 font-medium">-{stats.totalStockCost.toLocaleString('fr-FR')} €</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-dashed border-stone-100">
                    <span>Charges de fonctionnement (Dépenses Générales) (-)</span>
                    <span className="font-mono text-rose-600 font-medium">-{stats.expenses.toLocaleString('fr-FR')} €</span>
                  </div>

                  <div className="flex justify-between items-center py-2.5 font-bold pt-4 text-stone-900 border-t border-stone-200">
                    <span className="uppercase">Solde Comptable Net</span>
                    <span className={`font-mono text-sm ${stats.globalNetBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {stats.globalNetBalance.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                </div>

              </div>
              
              {/* Card Suivi de l'Avancée Physique du Stock */}
              <div className="lg:col-span-6 bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm">
                <h3 className="font-serif text-base text-stone-850 font-semibold mb-4 flex items-center space-x-2">
                  <Database className="h-5 w-5 text-[#AA7C11]" />
                  <span>Avancement & Suivi Physique (Quantités)</span>
                </h3>

                <p className="text-xs text-stone-500 font-light mb-6 leading-relaxed">
                  Indicateurs cumulatifs de flux physiques pour piloter précisément vos pièces d'orfèvrerie : de leur création en atelier à leur vente finale Place Vendôme.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  
                  <div className="p-4 bg-[#FAF9F5] border border-stone-100 rounded-xl relative overflow-hidden group">
                    <span className="absolute -bottom-2 -right-2 text-stone-100 group-hover:scale-110 transition-transform duration-300">
                      <ArrowUpRight className="h-16 w-16 text-emerald-500/10" />
                    </span>
                    <span className="block text-[8px] uppercase tracking-widest text-[#AA7C11] font-bold">📥 Pcs Entrées</span>
                    <div className="flex items-baseline space-x-1.5 mt-2">
                      <span className="font-serif text-3xl font-bold text-stone-800">{stats.totalEntered}</span>
                      <span className="text-[10px] text-stone-400">unités</span>
                    </div>
                    <span className="text-[9px] text-stone-400 block mt-2 font-light">
                      Fournisseurs & Fabrication
                    </span>
                  </div>

                  <div className="p-4 bg-[#FAF9F5] border border-stone-100 rounded-xl relative overflow-hidden group">
                    <span className="absolute -bottom-2 -right-2 text-stone-100 group-hover:scale-110 transition-transform duration-300">
                      <ArrowDownLeft className="h-16 w-16 text-rose-500/10" />
                    </span>
                    <span className="block text-[8px] uppercase tracking-widest text-[#2C251E] font-bold">📤 Pcs Sorties</span>
                    <div className="flex items-baseline space-x-1.5 mt-2">
                      <span className="font-serif text-3xl font-bold text-stone-800">{stats.totalExited}</span>
                      <span className="text-[10px] text-stone-400">unités</span>
                    </div>
                    <span className="text-[9px] text-stone-400 block mt-2 font-light">
                      Pertes, Fonts & Prêts
                    </span>
                  </div>

                  <div className="p-4 bg-[#FAF9F5] border border-stone-100 rounded-xl relative overflow-hidden group">
                    <span className="absolute -bottom-2 -right-2 text-stone-100 group-hover:scale-110 transition-transform duration-300">
                      <ShoppingBag className="h-16 w-16 text-emerald-500/10" />
                    </span>
                    <span className="block text-[8px] uppercase tracking-widest text-emerald-600 font-bold">💰 Pcs Vendues</span>
                    <div className="flex items-baseline space-x-1.5 mt-2">
                      <span className="font-serif text-3xl font-bold text-stone-800">{stats.totalSold}</span>
                      <span className="text-[10px] text-stone-400">unités</span>
                    </div>
                    <span className="text-[9px] text-stone-400 block mt-2 font-light">
                      Commandes POS réglées
                    </span>
                  </div>

                  <div className="p-4 bg-stone-900 text-[#FAF9F5] rounded-xl relative overflow-hidden group border border-[#2C251E]">
                    <span className="absolute -bottom-2 -right-2 text-stone-800 group-hover:scale-110 transition-transform duration-300">
                      <Sparkles className="h-16 w-16 text-white/5" />
                    </span>
                    <span className="block text-[8px] uppercase tracking-widest text-[#D4AF37] font-bold">📦 Stock Restant</span>
                    <div className="flex items-baseline space-x-1.5 mt-2">
                      <span className="font-serif text-3xl font-bold text-[#D4AF37]">{stats.totalRemaining}</span>
                      <span className="text-[10px] text-stone-400">unités</span>
                    </div>
                    <span className="text-[9px] text-stone-300 block mt-2 font-light">
                      En vitrine et coffre-fort
                    </span>
                  </div>

                </div>

              </div>

            </div>
            
            {/* Real-time key counters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#AA7C11] font-bold">Encaissements Totaux</span>
                  <h3 className="font-serif text-3xl font-medium text-stone-800 mt-1">
                    {stats.revenue.toLocaleString('fr-FR')} €
                  </h3>
                </div>
                <p className="text-[10px] text-emerald-500 font-medium mt-4">
                  Chiffre d'affaires perçu en temps réel
                </p>
              </div>

              <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Dépenses Générales</span>
                  <h3 className="font-serif text-3xl font-medium text-stone-800 mt-1">
                    -{stats.expenses.toLocaleString('fr-FR')} €
                  </h3>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (stats.expenses / (stats.revenue || 1))*100)}%` }}></div>
                </div>
              </div>

              <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Bénéfice Net Estimé</span>
                  <h3 className={`font-serif text-3xl font-bold mt-1 ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stats.netProfit.toLocaleString('fr-FR')} €
                  </h3>
                </div>
                <p className="text-[10px] text-stone-400 mt-4 italic">
                  Recettes - Coût Métal estimé - Charges fixes
                </p>
              </div>

              <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Valeur Financière du Stock</span>
                  <h3 className="font-serif text-3xl font-medium text-stone-800 mt-1">
                    {stats.totalVal.toLocaleString('fr-FR')} €
                  </h3>
                </div>
                <p className="text-[9px] text-stone-400 mt-4 leading-none">
                  Vitrine : <strong className="font-mono text-stone-600">{stats.displayCaseVal.toLocaleString('fr-FR')}€</strong> | Coffre : <strong className="font-mono text-stone-600">{stats.safeVal.toLocaleString('fr-FR')}€</strong>
                </p>
              </div>

            </div>

            {/* HIGHCHARTS FINANCIAL GRAPH block */}
            <div className="bg-stone-50 border-2 border-[#EBE7DF] rounded-xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#2C251E] flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-[#AA7C11]" />
                    <span>Pilotage de Rentabilité Mensuelle & Annuelle</span>
                  </h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    Modélisation en continu du Chiffre d'Affaire face aux charges et acquisitions matières
                  </p>
                </div>

                {/* Filter selects matching French luxury styling */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#AA7C11] font-sans">Année</label>
                    <select 
                      value={chartYear}
                      onChange={(e) => setChartYear(Number(e.target.value))}
                      className="bg-white border border-[#EBE7DF] rounded text-xs px-2 py-1.5 text-stone-800 font-mono focus:border-[#AA7C11] focus:outline-hidden"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#AA7C11] font-sans">Période</label>
                    <select 
                      value={chartMonth}
                      onChange={(e) => setChartMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      className="bg-white border border-[#EBE7DF] rounded text-xs px-2.5 py-1.5 text-stone-800 font-sans focus:border-[#AA7C11] focus:outline-hidden"
                    >
                      <option value="all">Toute l'année (Mois)</option>
                      <option value={0}>Janvier</option>
                      <option value={1}>Février</option>
                      <option value={2}>Mars</option>
                      <option value={3}>Avril</option>
                      <option value={4}>Mai</option>
                      <option value={5}>Juin</option>
                      <option value={6}>Juillet</option>
                      <option value={7}>Août</option>
                      <option value={8}>Septembre</option>
                      <option value={9}>Octobre</option>
                      <option value={10}>Novembre</option>
                      <option value={11}>Décembre</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Highcharts React element container */}
              <div className="bg-white rounded-lg p-2 border border-stone-100">
                <HighchartsReact highcharts={Highcharts} options={highchartsOptions} />
              </div>

              {/* Dynamic message explaining profits or losses */}
              <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#EBE7DF] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                <div>
                  <span className="font-bold text-stone-700 block uppercase tracking-wider text-[10px] font-sans">
                    Analyse & Audit de Rentabilité de seneFashion
                  </span>
                  <div className="mt-1 font-light text-stone-500 max-w-2xl leading-relaxed">
                    Ce graphique compare vos revenus issus des transactions directes aux charges fixes de restructuration ou de fonctionnement de l'Atelier. Un bénéfice net positif en or ou argent reflète la croissance des commissions de prestige.
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-widest text-[#AA7C11] block font-mono">FINANCES CONSOLIDÉES</span>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="font-bold text-stone-800">Résultat de la Sélection :</span>
                    {chartData.profit.reduce((a, b) => a + b, 0) >= 0 ? (
                      <span className="px-2.5 py-1 bg-emerald-150 border border-emerald-400 text-emerald-800 font-black font-sans rounded uppercase text-[10px] tracking-wider">
                        ✓ BÉNÉFICE CONVOLU (Gain)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-100 border border-rose-300 text-rose-800 font-bold font-sans rounded uppercase text-[10px] tracking-wider animate-pulse">
                        ⚠ EXCÉDENT NÉGATIF (Perte)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Down-payments, alerts and bestsellers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LOW STOCK ALERTS */}
              <div className="lg:col-span-5 bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 text-amber-600 font-bold mb-4">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-serif text-base text-stone-800">Alertes de Stock Bas (&le; 2 pces)</h3>
                </div>

                {lowStockProducts.length > 0 ? (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                    {lowStockProducts.map(p => (
                      <div key={p.sku} className="p-3 bg-amber-50/50 border border-amber-200/50 rounded flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-stone-800">{p.designation}</p>
                          <p className="font-mono text-[10px] text-stone-400">Réf: {p.sku} • {p.metal_type}</p>
                        </div>
                        <span className={`px-2 py-1 font-mono font-bold rounded ${p.stock_qty === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.stock_qty} restants
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Check className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs text-stone-400">Tous vos modèles d'exceptions ont des niveaux de stock convenables.</p>
                  </div>
                )}
              </div>

              {/* OUTSTANDING RESERVATIONS (Acomptes / Réservations) */}
              <div className="lg:col-span-7 bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm">
                <h3 className="font-serif text-base text-stone-800 font-semibold mb-4 flex items-center space-x-2">
                  <span>Acomptes Client de Haute Bijouterie</span>
                  <span className="bg-stone-100 text-stone-605 text-[10px] px-2 py-0.5 rounded-full font-sans font-normal">
                    {sales.filter(s => s.is_reservation).length} dossiers activement réservés
                  </span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-400 font-semibold uppercase text-[9px]">
                        <th className="pb-2">Réf & Client</th>
                        <th className="pb-2 text-right">Montant Brut</th>
                        <th className="pb-2 text-right">Acompte Payé</th>
                        <th className="pb-2 text-right text-amber-600">Dû Solde</th>
                        <th className="pb-2 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {sales.filter(s => s.is_reservation).map(sale => (
                        <tr key={sale.id} className="hover:bg-stone-50/60">
                          <td className="py-2.5">
                            <span className="font-mono font-bold text-stone-800">{sale.id}</span>
                            <span className="block text-[10px] text-stone-400">{sale.client_name}</span>
                          </td>
                          <td className="py-2.5 text-right font-mono">{(sale.total_raw - sale.discount_total).toLocaleString('fr-FR')} €</td>
                          <td className="py-2.5 text-right font-mono text-emerald-600">{sale.total_paid.toLocaleString('fr-FR')} €</td>
                          <td className="py-2.5 text-right font-mono text-amber-600 font-bold">{sale.balance_due.toLocaleString('fr-FR')} €</td>
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => {
                                // Claim final checkout
                                if (confirm(`Confirmer le règlement final de l'acompte pour le client ${sale.client_name} ? Somme due: ${sale.balance_due}€`)) {
                                  const updatedSales = sales.map(s => {
                                    if (s.id === sale.id) {
                                      return { ...s, total_paid: s.total_raw - s.discount_total, balance_due: 0, is_reservation: false, status: 'Solde Payé' as const };
                                    }
                                    return s;
                                  });
                                  setSales(updatedSales);
                                  addLog('Paiement Solde', `Paiement du solde restant pour la réservation ${sale.id} par ${sale.client_name}.`);
                                  alert('La réservation a été entièrement réglée et convertie en vente définitive.');
                                }
                              }}
                              className="px-2 py-0.5 bg-amber-100 hover:bg-[#AA7C11] text-[#AA7C11] hover:text-white rounded text-[10px] font-bold"
                              title="Cliquer pour encaisser le solde restant"
                            >
                              Encaisser solde
                            </button>
                          </td>
                        </tr>
                      ))}
                      {sales.filter(s => s.is_reservation).length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-stone-400 text-xs italic">
                            Aucune réservation ou dépôt d'acompte actif en cours.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Bestselling creation items ranking */}
            <div className="bg-[#191512] text-[#FAF9F5] rounded-xl p-8 border border-[#3A3127]">
              <h3 className="font-serif text-lg text-[#D4AF37] mb-6">Palmarès des Créations les plus Convoitées</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.topProducts.map((p, idx) => (
                  <div key={p.sku} className="bg-[#2C2114]/50 border border-[#D4AF37]/20 rounded-lg p-5 relative overflow-hidden flex items-center justify-between">
                    <span className="absolute -top-3 -right-2 font-serif text-7xl font-bold text-[#D4AF37]/5 select-none">{idx+1}</span>
                    <div className="relative z-10 space-y-1">
                      <span className="text-[8px] uppercase tracking-widest text-[#C5A880] font-bold">{p.metal}</span>
                      <h4 className="font-serif text-sm font-semibold text-white line-clamp-1 truncate">{p.designation}</h4>
                      <p className="font-mono text-[10px] text-stone-400">Réf: {p.sku}</p>
                    </div>
                    <div className="text-right pl-3 relative z-10">
                      <span className="block text-[8px] uppercase text-[#D4AF37] font-bold tracking-widest font-mono">Quantité</span>
                      <span className="font-mono text-2xl font-bold text-white">{p.qty}</span>
                    </div>
                  </div>
                ))}
                
                {stats.topProducts.length === 0 && (
                  <div className="col-span-3 text-center py-6 text-stone-500 text-xs italic">
                    Aucune statistique de vente n'est disponible pour le moment. Enregistrez des ventes au POS d'abord.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* --- TAB 2: CATALOGUE MANAGEMENT --- */}
        {activeTab === 'catalog' && (
          <div className="space-y-8 animate-fade-in text-xs">
            
            {/* Fine Jewelry Luxury Header & Trigger */}
            <div className="bg-[#14120F] text-white border border-[#2C251E] rounded-xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-serif text-lg text-[#D4AF37] font-bold tracking-wide">Maison Joaillière — Référentiel Catalogue</h3>
                <p className="text-stone-400 text-xs mt-1 font-light">
                  Enregistrez, modifiez ou déclassez les créations d'exception de votre atelier. Les tarifs s'adaptent dynamiquement aux cours actuels de l'Or et de l'Argent.
                </p>
              </div>
              <button
                onClick={openProductCreate}
                className="bg-[#D4AF37] hover:bg-white text-stone-950 px-5 py-3 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Nouveau Modèle</span>
              </button>
            </div>

            {/* Catalog tables */}
            <div className="bg-white border border-[#EBE7DF] rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-[#FAF9F5]">
                <h3 className="font-serif text-base text-[#2C251E] font-bold">Référentiel Complet de l'Atelier</h3>
                <span className="text-[10px] text-stone-400 font-mono">(Variation automatique basée sur les métaux précieux)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100 text-stone-450 uppercase text-[9px] tracking-wider font-semibold">
                      <th className="p-4">Bijou / SKU</th>
                      <th className="p-4 mr-2">Catégorie</th>
                      <th className="p-4">Métal & Titrage</th>
                      <th className="p-4 text-right">Poids Net</th>
                      <th className="p-4 text-center">Formule de Prix</th>
                      <th className="p-4 text-right text-[#AA7C11]">Prix Estimé</th>
                      <th className="p-4 text-center">Vitrine</th>
                      <th className="p-4 text-center">Stock</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products.map((p) => {
                      const estimated = calculateProductPrice(p, settings);
                      return (
                        <tr key={p.sku} className="hover:bg-stone-50/50">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <img src={p.image_url} alt={p.designation} className="w-9 h-9 object-cover rounded border border-stone-200" referrerPolicy="no-referrer" />
                              <div>
                                <span className="font-serif font-bold text-stone-800 text-sm block leading-tight">{p.designation}</span>
                                <span className="font-mono text-[9px] text-[#AA7C11]">SKU: {p.sku}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-sans font-medium text-stone-500">{p.category}</td>
                          <td className="p-4">
                            <span className="text-xs font-semibold text-stone-700 block">{p.metal_type}</span>
                            <span className="text-[10px] text-stone-400">{p.purity}</span>
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-stone-800">{p.weight.toFixed(2)} g</td>
                          <td className="p-4 text-center">
                            {p.price_type === 'variable' ? (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-150 rounded text-[9px]">
                                Métal + {p.labor_cost}€ Façon
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[9px]">
                                Fixe Unique
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right font-serif font-bold text-[#AA7C11] text-sm">
                            {estimated.toLocaleString('fr-FR')} €
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${p.visible_en_ligne ? 'bg-emerald-500' : 'bg-stone-300'}`} title={p.visible_en_ligne ? 'Affiché en ligne' : 'Masqué en ligne'} />
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold ${p.stock_qty <= 0 ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-800'}`}>
                              {p.stock_qty} pcs
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {/* Edit triggers modal editing */}
                              <button
                                onClick={() => openProductEdit(p)}
                                className="text-stone-400 hover:text-stone-850 p-1 rounded hover:bg-stone-100 transition-colors"
                                title="Modifier la création"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                              </button>

                              <button
                                onClick={() => setBarcodeModalSku(p.sku)}
                                className="text-stone-400 hover:text-amber-600 p-1 rounded hover:bg-amber-50 transition-colors"
                                title="Générer & imprimer le code-barre"
                              >
                                <Barcode className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteProduct(p.sku)}
                                className="text-stone-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                title="Retirer définitivement"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB 3: CAISSE / POS --- */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Cash register product selector (Left Panel) */}
            <div className="lg:col-span-7 bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm space-y-6">
              
              <div className="flex items-center space-x-2 border-b border-[#FAF9F5] pb-3">
                <ShoppingCart className="h-5 w-5 text-[#AA7C11]" />
                <h3 className="font-serif text-base text-[#2C251E] font-medium">Sélection des Parures vendues</h3>
              </div>

              <div className="flex gap-3">
                <select
                  value={posSelectedSku}
                  onChange={(e) => setPosSelectedSku(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-2.5 py-2 text-xs focus:outline-none focus:border-[#AA7C11]"
                >
                  <option value="">-- Sélectionner un bijou du catalogue --</option>
                  {products.map(p => (
                    <option key={p.sku} value={p.sku}>
                      {p.designation} ({p.sku}) - {calculateProductPrice(p, settings)}€ [Stock: {p.stock_qty}]
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddPosCart}
                  disabled={!posSelectedSku}
                  className="bg-[#2C251E] hover:bg-[#AA7C11] text-[#FAF9F5] hover:text-[#0F0E0C] text-xs uppercase tracking-wider px-6 py-2.5 rounded font-bold disabled:opacity-40"
                >
                  Ajouter à la Caisse
                </button>
              </div>

              {/* POS Cart display */}
              <div className="border-t border-stone-100 pt-5">
                <h4 className="text-xs font-semibold uppercase text-stone-400 tracking-wider mb-4">Panier de Caisse Actuel</h4>
                <div className="space-y-4">
                  {posCart.map((item, index) => {
                    const price = calculateProductPrice(item.product, settings);
                    const subtotal = price * item.qty;

                    return (
                      <div key={item.product.sku} className="p-4 bg-[#FAF9F5] border border-stone-200/60 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <img src={item.product.image_url} alt={item.product.designation} className="w-10 h-10 object-cover rounded border" referrerPolicy="no-referrer" />
                          <div>
                            <span className="font-serif font-bold text-stone-850 block">{item.product.designation}</span>
                            <span className="font-mono text-[9px] text-[#AA7C11]">SKU: {item.product.sku} • Cours: {price}€/pce</span>
                          </div>
                        </div>

                        {/* Quantity and Discount control */}
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-stone-400 font-bold">Qté :</span>
                            <input
                              type="number"
                              min="1"
                              max={item.product.stock_qty}
                              value={item.qty}
                              onChange={(e) => {
                                const q = Math.max(1, Number(e.target.value));
                                const updated = [...posCart];
                                updated[index].qty = q;
                                setPosCart(updated);
                              }}
                              className="w-12 bg-white border border-stone-300 rounded text-center py-0.5 text-xs font-mono"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-rose-500 font-bold">Remise (€) :</span>
                            <input
                              type="number"
                              min="0"
                              value={item.discount}
                              onChange={(e) => handleUpdateCartDiscount(item.product.sku, Math.max(0, Number(e.target.value)))}
                              className="w-16 bg-white border border-stone-300 rounded text-center py-0.5 text-xs font-mono text-rose-600 focus:outline-[#AA7C11]"
                            />
                          </div>

                          <div className="text-right pl-2">
                            <span className="block text-[8px] uppercase text-stone-400 font-serif">Sous-total net</span>
                            <span className="font-mono font-bold text-stone-900">{(subtotal - item.discount).toLocaleString('fr-FR')} €</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePosCart(item.product.sku)}
                            className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {posCart.length === 0 && (
                    <div className="text-center py-12 bg-[#FAF9F5] border border-dashed border-stone-200 rounded-xl">
                      <Inbox className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                      <p className="text-xs text-stone-400 font-light">Aucun bijou d'exception sélectionné.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Invoice checkout & client (Right Panel) */}
            <div className="lg:col-span-5 bg-[#14120F] text-white rounded-xl p-8 border border-[#2C251E] space-y-6">
              <h3 className="font-serif text-lg text-[#D4AF37] border-b border-stone-800 pb-3 flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Règlement & Édition Facture</span>
              </h3>

              <form onSubmit={handleProcessSale} className="space-y-6">
                
                {/* CRM Account linkage */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] uppercase tracking-wider text-[#C5A880] font-bold">Associer une fiche client (CRM)</span>
                  <select
                    value={posClientId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setPosClientId(cid);
                      const selected = clients.find(c => c.id === cid);
                      if (selected) {
                        setPosClientName(selected.name);
                      }
                    }}
                    className="w-full bg-[#0F0E0C] border border-[#2C2114] rounded px-3 py-2 text-xs text-stone-200 focus:outline-[#D4AF37]"
                  >
                    <option value="">-- Client de Passage (Anonyme) --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone} - Taille: {c.ring_size || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Manual name input if passage */}
                {!posClientId && (
                  <div className="space-y-1.5 animate-fade-in">
                    <span className="block text-[9px] uppercase tracking-wider text-[#C5A880] font-bold">Nom du client de passage</span>
                    <input
                      type="text"
                      placeholder="Ex: Mme de Pompadour"
                      value={posClientName}
                      onChange={(e) => setPosClientName(e.target.value)}
                      className="w-full bg-[#0F0E0C] border border-[#2C2114] rounded px-3 py-2 text-xs text-stone-200 focus:outline-[#D4AF37]"
                    />
                  </div>
                )}

                {/* Payment Methods */}
                <div className="space-y-1.5">
                  <span className="block text-[9px] uppercase tracking-wider text-[#C5A880] font-bold">Mode d'encaissement</span>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    {['Espèces', 'Carte', 'Mobile Money', 'Virement'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPosPaymentMethod(mode as any)}
                        className={`py-2 rounded font-semibold transition-all ${
                          posPaymentMethod === mode 
                            ? 'bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] text-stone-900 shadow-md' 
                            : 'bg-[#0F0E0C] text-stone-400 border border-stone-800 hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Down-payment (Acomptes & réservations) toggle */}
                <div className="bg-stone-900/60 p-4 rounded-xl border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#F5E6C4]">Faire une réservation / Acompte</span>
                      <span className="text-[9px] text-stone-400 leading-none mt-1">Le client paie un dépôt initial déduit de la facture</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={posIsReservation}
                      onChange={(e) => setPosIsReservation(e.target.checked)}
                      className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37] border-stone-800 bg-[#0F0E0C] rounded"
                    />
                  </div>

                  {posIsReservation && (
                    <div className="space-y-2 pt-2 border-t border-stone-800 animate-slide-down">
                      <span className="block text-[9px] uppercase text-[#D4AF37] font-semibold">Validation de l'acompte initial (€)</span>
                      <input
                        type="number"
                        min="1"
                        value={posDownPaymentAmount}
                        onChange={(e) => setPosDownPaymentAmount(Number(e.target.value))}
                        className="w-full bg-[#0F0E0C] border border-stone-700 rounded px-3 py-1.5 text-xs text-stone-200 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Real-time calculated checkout values */}
                <div className="pt-4 border-t border-stone-800 space-y-2">
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>Brut Total :</span>
                    <span className="font-mono">
                      {posCart.reduce((acc, item) => acc + (calculateProductPrice(item.product, settings) * item.qty), 0).toLocaleString('fr-FR')} BIF
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-rose-500">
                    <span>Remises accordées :</span>
                    <span className="font-mono">
                      -{posCart.reduce((acc, item) => acc + item.discount, 0).toLocaleString('fr-FR')} BIF
                    </span>
                  </div>
                  
                  {settings.apply_tva_on_sale && (
                    <div className="flex justify-between text-xs text-amber-600">
                      <span>TVA ({settings.tva_percentage}%) :</span>
                      <span className="font-mono">
                        {calculateTVA(posCart.reduce((acc, item) => {
                          const base = calculateProductPrice(item.product, settings) * item.qty;
                          return acc + base - item.discount;
                        }, 0), settings).toLocaleString('fr-FR')} BIF
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-baseline pt-2 border-t border-stone-800">
                    <span className="text-sm font-semibold text-[#D4AF37]">Net Final à encaisser :</span>
                    <span className="font-serif text-2xl font-bold font-mono text-[#D4AF37]">
                      {(() => {
                        const netTotal = posCart.reduce((acc, item) => {
                          const base = calculateProductPrice(item.product, settings) * item.qty;
                          return acc + base - item.discount;
                        }, 0);
                        const tva = calculateTVA(netTotal, settings);
                        return (netTotal + tva).toLocaleString('fr-FR');
                      })()} BIF
                    </span>
                  </div>

                  {posIsReservation && (
                    <div className="flex justify-between text-xs text-amber-500 font-bold bg-[#2C2114]/40 p-2.5 rounded border border-[#D4AF37]/25 mt-2">
                      <span>Reste à payer (Solde futur) :</span>
                      <span>
                    {Math.max(0, posCart.reduce((acc, item) => {
                          const base = calculateProductPrice(item.product, settings) * item.qty;
                          const netTotalBeforeTVA = base - item.discount;
                          const tva = calculateTVA(netTotalBeforeTVA, settings);
                          return acc + base - item.discount + tva;
                        }, 0) - posDownPaymentAmount).toLocaleString('fr-FR')} BIF
                      </span>
                    </div>
                  )}

                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#AA7C11] text-[#0F0E0C] font-bold text-xs uppercase tracking-widest py-3 rounded transition-all duration-300 shadow-lg cursor-pointer"
                >
                  Valider la Facture & Encaisser
                </button>

              </form>
            </div>

          </div>
        )}

        {/* --- TAB 4: STOCKS INPUTS & CASTINGS --- */}
        {activeTab === 'movements' && (
          <div className="space-y-8 animate-fade-in w-full text-xs">
            
            {/* Four Live Progressive Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-[#EBE7DF] rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block">Total Entrées</span>
                  <span className="font-serif text-base font-bold text-stone-800">{stats.totalEntered} pce(s)</span>
                </div>
              </div>
              
              <div className="bg-white border border-[#EBE7DF] rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
                <div className="p-2 bg-rose-50 rounded-lg text-rose-700">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block">Total Sorties</span>
                  <span className="font-serif text-base font-bold text-stone-800">{stats.totalExited} pce(s)</span>
                </div>
              </div>

              <div className="bg-white border border-[#EBE7DF] rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
                <div className="p-2 bg-amber-50 rounded-lg text-[#AA7C11]">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block">Total Ventes</span>
                  <span className="font-serif text-base font-bold text-stone-800">{stats.totalSold} pce(s)</span>
                </div>
              </div>

              <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm flex items-center space-x-3.5 text-white">
                <div className="p-2 bg-stone-850 rounded-lg text-[#D4AF37]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block">Stock Restant</span>
                  <span className="font-serif text-base font-bold text-[#D4AF37]">{stats.totalRemaining} pce(s)</span>
                </div>
              </div>
            </div>

            {/* EXCEL EXPORTS CONTROL BOX */}
            <div className="bg-white border border-[#EBE7DF] rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-left">
                <h4 className="font-serif text-sm font-bold text-stone-850 flex items-center space-x-1.5">
                  <FileText className="h-4 w-4 text-[#AA7C11]" />
                  <span>Exportation Professionnelle Excel</span>
                </h4>
                <p className="text-[11px] text-stone-500 font-light">
                  Téléchargez les données des flux d'entrées et de sorties d'inventaire d'exception de seneFashion de manière cloisonnée au format Excel CSV.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <button
                  onClick={exportStockEntries}
                  className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-2 px-4 rounded font-bold tracking-wide uppercase text-[10px] cursor-pointer transition-colors"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Liste Entrées (.CSV Excel)</span>
                </button>
                
                <button
                  onClick={exportStockExits}
                  className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 py-2 px-4 rounded font-bold tracking-wide uppercase text-[10px] cursor-pointer transition-colors"
                >
                  <ArrowDownLeft className="h-3.5 w-3.5 text-rose-600" />
                  <span>Liste Sorties (.CSV Excel)</span>
                </button>
              </div>
            </div>

            {/* Layout Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Direct Entry Form, Exit Form, and Casting */}
              <div className="lg:col-span-6 space-y-8">
                
                {/* A. SIMPLE STOCK INPUT FORM (ENTRÉE DE STOCK) */}
                <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <span className="absolute top-2 right-2 flex space-x-1 py-1">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-mono text-[8px] uppercase tracking-widest font-black border border-emerald-200 rounded">
                      + ENTRÉE STOCK (CRÉATION / ENVOI)
                    </span>
                  </span>

                  <h3 className="font-serif text-base text-stone-850 font-semibold mb-4 flex items-center space-x-2">
                    <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                    <span>📥 Enregistrer une Entrée en Stock</span>
                  </h3>

                  <p className="text-xs text-stone-500 font-light mb-4 leading-relaxed">
                    Saisissez l'ajout de bijoux d'exception disponibles suite à un arrivage fournisseur ou à une fabrication en atelier.
                  </p>

                  <form onSubmit={handleSubmitSimpleEntry} className="space-y-4 text-xs text-stone-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Bijou d'exception</label>
                        <select
                          required
                          value={entrySku}
                          onChange={(e) => setEntrySku(e.target.value)}
                          className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                        >
                          <option value="">-- Choisir le bijou --</option>
                          {products.map(p => (
                            <option key={p.sku} value={p.sku}>{p.designation} (Réf : {p.sku})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Mode d'Entrée</label>
                        <select
                          value={entryType}
                          onChange={(e) => setEntryType(e.target.value as any)}
                          className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                        >
                          <option value="entree_fournisseur">Fournisseur (Achat Or Fini)</option>
                          <option value="entree_fabrication">Atelier (Fabrication Directe)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Quantité à Ajouter</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={entryQty}
                          onChange={(e) => setEntryQty(Math.max(1, Number(e.target.value)))}
                          className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Coût d'Acquisition Unitaire (€)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Ex: 350 €"
                          value={entryCost}
                          onChange={(e) => setEntryCost(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Nom du Tiers (Fournisseur / Atelier)</label>
                      <input
                        type="text"
                        placeholder="Ex: Comptoir d'Affinage Français, Maître Artisan"
                        value={entryPartner}
                        onChange={(e) => setEntryPartner(e.target.value)}
                        className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Note explicative de l'entrée</label>
                      <textarea
                        placeholder="Précisez les métaux utilisés, le code de lot..."
                        value={entryNotes}
                        onChange={(e) => setEntryNotes(e.target.value)}
                        className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 tracking-wider rounded uppercase text-[10px]"
                      >
                        Enregistrer l'Entrée Stock
                      </button>
                    </div>
                  </form>
                </div>

                {/* B. SIMPLE STOCK OUTLET FORM (SORTIE DE STOCK) */}
                <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <span className="absolute top-2 right-2 flex space-x-1 py-1">
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-800 font-mono text-[8px] uppercase tracking-widest font-black border border-rose-200 rounded">
                      - SORTIE STOCK (RETRAIT / PERTE)
                    </span>
                  </span>

                  <h3 className="font-serif text-base text-stone-850 font-semibold mb-4 flex items-center space-x-2">
                    <ArrowDownLeft className="h-5 w-5 text-rose-600" />
                    <span>📤 Enregistrer une Sortie de Stock</span>
                  </h3>

                  <p className="text-xs text-stone-500 font-light mb-4 leading-relaxed">
                    Retirez des bijoux de l'inventaire en specifiant le motif exact (Melting, Perte, Vol, Vente manuelle ou Prêt de confiance).
                  </p>

                  <form onSubmit={handleSubmitSimpleExit} className="space-y-4 text-xs text-stone-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Bijou ciblé</label>
                        <select
                          required
                          value={exitSku}
                          onChange={(e) => setExitSku(e.target.value)}
                          className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                        >
                          <option value="">-- Choisir le bijou --</option>
                          {products.map(p => (
                            <option key={p.sku} value={p.sku}>{p.designation} (Stock : {p.stock_qty})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Type de Sortie / Motif</label>
                        <select
                          value={exitType}
                          onChange={(e) => setExitType(e.target.value as any)}
                          className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                        >
                          <option value="sortie_fonte_recyclage">Fonte / Recyclage d'Or</option>
                          <option value="sortie_perte_vol">Perte, Vol ou Casse</option>
                          <option value="sortie_confiance">Prêt de Confiance (Exposition)</option>
                          <option value="sortie_vente">Vente en Direct Manuelle</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Quantité à Retirer</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={exitQty}
                          onChange={(e) => setExitQty(Math.max(1, Number(e.target.value)))}
                          className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Bénéficiaire / Client</label>
                        <input
                          type="text"
                          placeholder="Ex: Partenaire Galerie, Client Privé, etc."
                          value={exitPartner}
                          onChange={(e) => setExitPartner(e.target.value)}
                          className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Justification et Remarques</label>
                      <textarea
                        placeholder="Expliciter les motifs du retrait de la marchandise..."
                        value={exitNotes}
                        onChange={(e) => setExitNotes(e.target.value)}
                        className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-stone-900 hover:bg-[#AA7C11] text-white hover:text-stone-950 font-bold py-2 px-5 tracking-wider rounded uppercase text-[10px]"
                      >
                        Enregistrer la Sortie Stock
                      </button>
                    </div>
                  </form>
                </div>

              {/* FACTORY CASTING & FONTE DES MÉTAUX */}
              <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm overflow-hidden relative">
                <span className="absolute top-2 right-2 flex space-x-1.5 translate-x-1 py-1">
                  <span className="px-2 py-0.5 bg-amber-50 text-[#AA7C11] font-mono text-[8px] uppercase tracking-widest font-bold border border-amber-200">
                    Atelier Fonderie
                  </span>
                </span>
                
                <h3 className="font-serif text-base text-stone-800 font-semibold mb-4 flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-[#AA7C11]" />
                  <span>Cisèlement & Fonte Interne (Or Brut)</span>
                </h3>

                <p className="text-xs text-stone-500 font-light mb-4 leading-relaxed bg-[#FAF9F5] p-3 border-l-4 border-[#AA7C11]">
                  Convertissez de l'or brut 24 carats de vos réserves en bijoux entièrement finis. Le système calculera automatiquement la valeur d'acquisition basée sur le poids net de l'alliage 18 carat produit.
                </p>

                <form onSubmit={handleCastingFabricate} className="space-y-4 text-xs text-stone-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Consommation d'Or Brut (g)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={fabricateWeight}
                        onChange={(e) => setFabricateWeight(Number(e.target.value))}
                        className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-1">Création Joallerie Fini Produite</label>
                      <select
                        required
                        value={targetProductSku}
                        onChange={(e) => setTargetProductSku(e.target.value)}
                        className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#AA7C11]"
                      >
                        <option value="">-- Sélectionner --</option>
                        {products.map(p => (
                          <option key={p.sku} value={p.sku}>{p.designation} ({p.weight.toFixed(2)}g)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#AA7C11] text-[#0F0E0C] py-2.5 px-4 rounded font-bold uppercase tracking-wider text-center"
                  >
                    Activer la Fonte & Injecter du Stock
                  </button>
                </form>
              </div>

            </div>

            {/* Right Column: Live Trust Loans Tracker & Flow logs list */}
            <div className="lg:col-span-6 space-y-8">
              
              {/* Trust Loans Outstandings (PRÊT DE CONFIANCE) */}
              <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm">
                <h3 className="font-serif text-base text-stone-800 font-semibold mb-4">
                  Suivi des Sorties Spéciales de Confiance (Prêts)
                </h3>
                
                <p className="text-xs text-stone-500 font-light mb-4">
                  Registre d'emprunt pour défilés, partenaires, ou clients fidèles privilégiés. Les retours réinjectent directement la marchandise au stock disponible.
                </p>

                <div className="space-y-3">
                  {movements.filter(m => m.type === 'sortie_confiance').map(mv => {
                    const linked = products.find(p => p.sku === mv.sku);
                    const isReturned = movements.some(m => m.type === 'retour_confiance' && m.sku === mv.sku && m.partner_name === mv.partner_name && m.qty === mv.qty);

                    return (
                      <div key={mv.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        isReturned ? 'bg-stone-50 border-stone-200 opacity-60' : 'bg-[#FAF9F5] border-amber-200'
                      }`}>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-sans font-bold text-stone-800 text-xs">{mv.partner_name}</span>
                            <span className={`px-2 py-0.5 text-[8px] uppercase font-bold rounded ${
                              isReturned ? 'bg-stone-200 text-stone-600' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {isReturned ? 'Retourné' : 'En Prêt Actif'}
                            </span>
                          </div>
                          
                          <p className="text-xs text-stone-600 font-medium mt-1">
                            {linked?.designation || mv.sku} (x{mv.qty} pc)
                          </p>
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5 whitespace-pre-line leading-normal">
                            Date Prêt: {new Date(mv.date).toLocaleDateString('fr-FR')} | Remarque: {mv.notes}
                          </p>
                        </div>

                        {!isReturned && (
                          <button
                            onClick={() => handleReturnTrustLoan(mv.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 px-3 rounded uppercase cursor-pointer"
                          >
                            Valider Retour
                          </button>
                        )}

                      </div>
                    );
                  })}

                  {movements.filter(m => m.type === 'sortie_confiance').length === 0 && (
                    <p className="text-center py-8 text-stone-400 text-xs italic">
                      Aucun prêt de confiance (confidential loan portfolio) n'est actif dans le registre.
                    </p>
                  )}
                </div>

              </div>

              {/* General list of stock adjustments */}
              <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm font-sans">
                <h3 className="font-serif text-base text-stone-850 font-semibold mb-4">
                  Historique Récent des Mouvements
                </h3>

                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2.5">
                  {movements.slice(0, 10).map((mv, idx) => {
                    const item = products.find(p => p.sku === mv.sku);
                    return (
                      <div key={idx} className="p-3 bg-stone-50 border border-stone-100 rounded text-xs leading-relaxed flex justify-between items-center">
                        <div>
                          <span className="font-mono text-[9px] text-[#AA7C11] block uppercase">{mv.type.replace('_', ' ')}</span>
                          <p className="font-semibold text-stone-800">{item?.designation || mv.sku} ({mv.qty} pce)</p>
                          <span className="text-[10px] text-stone-400 block font-mono">{new Date(mv.date).toLocaleString('fr-FR')} | {mv.partner_name}</span>
                        </div>
                        <span className="text-[10px] text-stone-500 max-w-xs text-right truncate italic font-light">
                          {mv.notes}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>
        )}

        {/* --- TAB 5: CRM Fidélité --- */}
        {activeTab === 'crm' && (
          <div className="space-y-8 animate-fade-in text-xs text-stone-700 font-sans">
            
            {/* Top Action Header */}
            <div className="bg-[#14120F] text-white border border-[#2C251E] rounded-xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-serif text-lg text-[#D4AF37] font-bold tracking-wide">Fiches Privilèges & CRM Clientèle</h3>
                <p className="text-stone-400 text-xs mt-1 font-light">
                  Consignez les tailles de bagues, métaux favoris et notes comportementales de vos plus grands clients d'exception.
                </p>
              </div>
              <button
                onClick={openClientCreate}
                className="bg-[#D4AF37] hover:bg-white text-stone-950 px-5 py-3 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Nouveau Client</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {/* Client tables list spanning whole width */}
              <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-base text-[#2C251E] mb-4">Portefeuille Clients de Prestige & Historique d'achats</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-stone-700">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-stone-450 uppercase text-[9px] tracking-wider font-semibold">
                          <th className="p-3">Identité & Contact</th>
                          <th className="p-3 text-center">Bague (Taille)</th>
                          <th className="p-3 text-center">Métal fétiche</th>
                          <th className="p-3 text-center">Anniversaire</th>
                          <th className="p-3">Préférences de Style / Historique</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {clients.map(c => {
                          const hasBdayToday = c.birthday && new Date(c.birthday).getMonth() === new Date().getMonth() && new Date(c.birthday).getDate() === new Date().getDate();

                          return (
                            <tr key={c.id} className={`hover:bg-stone-50/60 ${hasBdayToday ? 'bg-amber-50/40 border-l-4 border-amber-400' : ''}`}>
                              <td className="p-3">
                                <span className="font-serif font-bold text-stone-900 block">{c.name}</span>
                                <span className="text-[10px] text-stone-400 font-mono block">{c.phone} | {c.email}</span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-stone-800">{c.ring_size || "N/A"}</td>
                              <td className="p-3 text-center font-semibold text-stone-500">{c.metal_preference}</td>
                              <td className="p-3 text-center font-mono">
                                {c.birthday ? new Date(c.birthday).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : "N/D"}
                                {hasBdayToday && (
                                  <span className="block text-[8px] bg-[#D4AF37] text-stone-900 px-1 py-0.5 rounded font-bold uppercase mt-1">Bougies !</span>
                                )}
                              </td>
                              <td className="p-3 font-light leading-relaxed max-w-sm">
                                {c.notes_style || "Aucun détail saisi pour le moment."}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() => openClientEdit(c)}
                                    className="text-stone-400 hover:text-stone-850 p-1 rounded hover:bg-stone-150 transition-colors"
                                    title="Modifier la fiche client"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClient(c.id)}
                                    className="text-stone-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                    title="Supprimer la fiche"
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-[#FAF9F5] border border-[#EBE7DF] p-4 rounded-xl mt-6 text-xs font-light flex items-center justify-between">
                  <div>
                    <strong>Module CRM & Relations Publiques :</strong> Le logiciel vérifie automatiquement les dates de naissance de vos clients privilégiés afin de générer des propositions exclusives et optimiser l'accueil l'Atelier.
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#AA7C11] uppercase tracking-wider ml-4">MÉTIER OR</span>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* --- TAB 6: DÉPENSES --- */}
        {activeTab === 'expenses' && (
          <div className="space-y-8 animate-fade-in text-xs text-stone-700 font-sans">
            
            {/* Elegant Header with Saisir Charge Trigger */}
            <div className="bg-[#14120F] text-white border border-[#2C251E] rounded-xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-serif text-lg text-[#D4AF37] font-bold tracking-wide">Grand Livre des Dépenses & Charges</h3>
                <p className="text-stone-400 text-xs mt-1 font-light">
                  Imputez, catégorisez et suivez les dépenses d'exploitation (loyers, façonniers, énergie, taxes d'affinage).
                </p>
              </div>
              <button
                onClick={openExpenseCreate}
                className="bg-[#D4AF37] hover:bg-white text-stone-950 px-5 py-3 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Saisir une Charge</span>
              </button>
            </div>

            {/* Wide Full Registry of expenses */}
            <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm overflow-hidden space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <h3 className="font-serif text-base text-[#2C251E] font-bold">
                  Registre des Dépenses de Fonctionnement Déductibles
                </h3>
                <span className="text-[10px] font-mono text-stone-400 uppercase">Grand Livre Comptable</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-stone-700">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-450 uppercase text-[9px] font-semibold tracking-wider">
                      <th className="p-3">Affectation Date</th>
                      <th className="p-3">Désignation de Charge</th>
                      <th className="p-3 text-center font-sans">Typologie</th>
                      <th className="p-3 text-center">Catégorie</th>
                      <th className="p-3 text-right">Montant Hors Taxes</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {expenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-stone-50/60 font-medium">
                        <td className="p-3 font-mono">{new Date(exp.date).toLocaleDateString('fr-FR')}</td>
                        <td className="p-3 font-bold text-stone-900">{exp.label}</td>
                        <td className="p-3 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase ${
                            exp.type === 'fixe' ? 'bg-[#FAF9F5] text-stone-650' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {exp.type}
                          </span>
                        </td>
                        <td className="p-3 text-center font-semibold text-stone-500">{exp.category}</td>
                        <td className="p-3 text-right font-mono font-bold text-stone-900">{exp.amount.toLocaleString('fr-FR')} €</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => openExpenseEdit(exp)}
                              className="text-stone-400 hover:text-stone-850 p-1 rounded hover:bg-stone-150 transition-colors"
                              title="Modifier la dépense"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded"
                              title="Supprimer la charge"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB 7: STOCK AUDIT & TRACEABILITY --- */}
        {activeTab === 'inventory_audit' && (
          <div className="space-y-8 animate-fade-in text-xs text-stone-700 font-sans">
            
            {/* AUDIT THEORETICAL VS REAL */}
            <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-serif text-base text-stone-850 font-bold">Audit & Rapprochement (Théorique vs Physique)</h3>
                  <p className="text-xs text-stone-500 font-light mt-1">Saisissez les quantités physiquement relevées en vitrine pour détecter d'éventuels écarts.</p>
                </div>
                
                <button
                  onClick={loadAuditQuantities}
                  className="bg-[#2C251E] hover:bg-[#AA7C11] text-[#FAF9F5] hover:text-[#0F0E0C] text-xs uppercase tracking-wider px-5 py-2 rounded font-bold transition-all"
                >
                  Démarrer / Réinitialiser avec le théorique
                </button>
              </div>

              {Object.keys(auditQuantities).length > 0 ? (
                <div className="overflow-x-auto border border-stone-100 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-400 font-semibold uppercase text-[9px]">
                        <th className="p-3">Bijou modèle</th>
                        <th className="p-3 text-center">Théorique (Logiciel)</th>
                        <th className="p-3 text-center">Physique constaté</th>
                        <th className="p-3 text-center">Écart (Matures)</th>
                        <th className="p-3 text-center">Action de régularisation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                      {products.map(p => {
                        const theoretical = p.stock_qty;
                        const physical = auditQuantities[p.sku] ?? p.stock_qty;
                        const delta = physical - theoretical;

                        return (
                          <tr key={p.sku} className={`hover:bg-stone-50/60 ${delta !== 0 ? 'bg-rose-50/40' : ''}`}>
                            <td className="p-3 font-semibold">
                              {p.designation} <span className="font-mono text-[9px] text-[#AA7C11] block">Réf : {p.sku}</span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold">{theoretical} pces</td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={physical}
                                onChange={(e) => {
                                  setAuditQuantities({
                                    ...auditQuantities,
                                    [p.sku]: Math.max(0, Number(e.target.value))
                                  });
                                }}
                                className="w-16 bg-[#FAF9F5] border border-stone-300 rounded text-center py-0.5 text-xs font-mono font-bold"
                              />
                            </td>
                            <td className="p-3 text-center">
                              {delta === 0 ? (
                                <span className="text-emerald-600 font-bold font-mono">OK</span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded font-mono font-bold ${delta < 0 ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {delta > 0 ? `+${delta}` : delta}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {delta !== 0 ? (
                                <button
                                  onClick={() => {
                                    const updated = products.map(prod => {
                                      if (prod.sku === p.sku) {
                                        return { ...prod, stock_qty: physical };
                                      }
                                      return prod;
                                    });
                                    setProducts(updated);
                                    
                                    // Make inventory correction log
                                    const mvid = `MV-INV-${Date.now().toString().slice(-6)}`;
                                    const correctionMv: StockMovement = {
                                      id: mvid,
                                      sku: p.sku,
                                      type: delta < 0 ? 'sortie_perte_vol' : 'entree_fournisseur',
                                      qty: Math.abs(delta),
                                      date: new Date().toISOString(),
                                      partner_name: 'Ajustement Inventaire direction',
                                      cost_value: 0,
                                      notes: `Régularisation d'audit inventaire. Écart de ${delta} corrigé.`
                                    };
                                    setMovements([correctionMv, ...movements]);

                                    setAuditQuantities({ ...auditQuantities, [p.sku]: physical });
                                    addLog('Régularisation Stock', `Ajustement d'inventaire: ${theoretical} -> ${physical} pour ${p.designation}.`, p.sku);
                                    alert('Quantité théorique de caisse mise à jour et alignée.');
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-stone-900 text-white rounded text-[10px] font-bold"
                                >
                                  Forcer l'alignement
                                </button>
                              ) : (
                                <span className="text-stone-400 font-normal italic">Aucune action requise</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-[#FAF9F5] border border-dashed border-stone-200 rounded-xl">
                  <p className="text-xs text-stone-400 font-light">Veuillez démarrer l'audit pour charger les lignes.</p>
                </div>
              )}
            </div>

            {/* SECURITY AUDIT TRAIL LOGS (Traçabilité) */}
            <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <h3 className="font-serif text-base text-stone-850 font-bold">Ledger de Sécurité & Traçabilité (Logs Audités)</h3>
                <span className="text-[9px] bg-red-100 text-red-700 px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
                  Intégrité Active
                </span>
              </div>

              <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
                <table className="w-full text-left font-mono text-[11px] text-stone-500">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-250 text-stone-400 uppercase text-[9px]">
                      <th className="p-3">Horodatage (UTC)</th>
                      <th className="p-3">Utilisateur</th>
                      <th className="p-3">Nature Action</th>
                      <th className="p-3">Détails de Traçabilité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-amber-50/10">
                        <td className="p-3 text-stone-400 font-semibold">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                        <td className="p-3 text-stone-800 font-bold">{log.user_name}</td>
                        <td className="p-3 text-[#AA7C11] font-bold">{log.action}</td>
                        <td className="p-3 text-stone-605 leading-normal">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB 8: SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white border border-[#EBE7DF] rounded-xl p-8 shadow-sm space-y-8 animate-fade-in text-xs text-stone-700 font-sans">
            <div>
              <h3 className="font-serif text-base text-[#2C251E] font-medium border-b border-stone-100 pb-2">
                Configurations Système Générales de l'Atelier
              </h3>
              <p className="text-stone-400 text-[11px] font-light mt-1">
                Gérez le numéro de téléphone lié au bouton "Acheter sur WhatsApp" et ajustez les cours au gramme des métaux nobles. Les prix d'exceptions variables s'alignent instantanément.
              </p>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              
              <div className="space-y-2">
                <span className="block text-[10px] uppercase tracking-wider text-[#AA7C11] font-bold">Numéro WhatsApp Récepteur</span>
                <input
                  type="text"
                  required
                  placeholder="Ex: 33612345678"
                  value={tempSettings.whatsapp_phone}
                  onChange={(e) => setTempSettings({ ...tempSettings, whatsapp_phone: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-4 py-2 font-mono"
                />
                <p className="text-[9px] text-stone-400 italic leading-none">Indiquez l'indicatif pays complet sans le symbole + ou les espaces (ex: 33612345678 pour la France)</p>
              </div>

                            <div className="space-y-4">
                <span className="block text-[10px] uppercase font-bold text-stone-400">Informations Entreprise & Taxations</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-stone-500">NIF (Numéro d'Identification Fiscale)</span>
                    <input
                      type="text"
                      value={tempSettings.nif}
                      onChange={(e) => setTempSettings({ ...tempSettings, nif: e.target.value })}
                      className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                     <span className="block text-[9px] font-bold text-stone-500">TVA (%)</span>
                     <input
                      type="number"
                      value={tempSettings.tva_percentage}
                      onChange={(e) => setTempSettings({ ...tempSettings, tva_percentage: Number(e.target.value) })}
                      className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 font-mono"
                     />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-stone-500">Email Contact</span>
                    <input
                      type="email"
                      value={tempSettings.company_email}
                      onChange={(e) => setTempSettings({ ...tempSettings, company_email: e.target.value })}
                      className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                     <span className="block text-[9px] font-bold text-stone-500">Téléphone Entreprise</span>
                     <input
                      type="text"
                      value={tempSettings.company_phone}
                      onChange={(e) => setTempSettings({ ...tempSettings, company_phone: e.target.value })}
                      className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 font-mono"
                     />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tempSettings.apply_tva_on_sale}
                    onChange={(e) => setTempSettings({ ...tempSettings, apply_tva_on_sale: e.target.checked })}
                    className="h-4 w-4 text-[#AA7C11]"
                  />
                  <span className="text-[10px] text-stone-700 font-bold">Appliquer la TVA automatiquement sur les factures de vente</span>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-6 space-y-4">
                <span className="block text-[10px] uppercase font-bold text-stone-400">Cours actuels des métaux précieux d'exceptions (€/gramme)</span>
                
                <div className="grid grid-cols-2 gap-4">
                  
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-stone-500">Or 18 carats (750/1000)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tempSettings.gold_rate_18k}
                      onChange={(e) => setTempSettings({ ...tempSettings, gold_rate_18k: Number(e.target.value) })}
                      className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-stone-500">Or pur 24 carats (Affinage)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tempSettings.gold_rate_24k}
                      onChange={(e) => setTempSettings({ ...tempSettings, gold_rate_24k: Number(e.target.value) })}
                      className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-stone-500">Argent Massif 925/1000</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tempSettings.silver_rate_925}
                      onChange={(e) => setTempSettings({ ...tempSettings, silver_rate_925: Number(e.target.value) })}
                      className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-stone-500">Platine Pur 950/1000</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tempSettings.platinum_rate}
                      onChange={(e) => setTempSettings({ ...tempSettings, platinum_rate: Number(e.target.value) })}
                      className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-1.5 font-mono"
                    />
                  </div>

                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-[#2C251E] hover:bg-[#AA7C11] text-[#FAF9F5] hover:text-[#0F0E0C] text-xs uppercase tracking-widest px-6 py-2.5 rounded font-bold transition-all"
                >
                  Enregistrer les nouveaux cours
                </button>
              </div>

            </form>
          </div>
        )}

        </main>
      </div>

      {/* --- PREMIUM CRUD MODALS --- */}

      {/* 1. PRODUCT (CATALOGUE) CREATION / UPDATE MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-[#EBE7DF] rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden my-8">
            {/* Header */}
            <div className="bg-[#14120F] text-white px-6 py-4 flex items-center justify-between border-b border-[#2C251E]">
              <div className="flex items-center space-x-2">
                <Gem className="h-5 w-5 text-[#D4AF37]" />
                <h3 className="font-serif text-lg tracking-wider font-light">
                  {productEditingSku ? 'Modifier le Modèle Joaillier' : 'Déclarer un Nouveau Bijou'}
                </h3>
              </div>
              <button
                onClick={() => setProductModalOpen(false)}
                className="text-stone-400 hover:text-white transition-colors"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Box */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs text-stone-750">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SKU (Barcode ID) */}
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Code de Référence (SKU Unique)</span>
                  <input
                    type="text"
                    required
                    readOnly
                    placeholder="Saisissez une Désignation..."
                    value={newProduct.sku}
                    className="w-full bg-[#14120F]/5 border border-stone-250 rounded px-3 py-2 uppercase font-mono text-stone-650 cursor-not-allowed select-all font-semibold focus:outline-none"
                  />
                  {!productEditingSku ? (
                    <p className="text-[9px] text-[#AA7C11] flex items-center space-x-1">
                      <Sparkles className="h-3 w-3 text-[#AA7C11] animate-pulse" />
                      <span>Généré automatiquement (Or Norme d'exception)</span>
                    </p>
                  ) : (
                    <p className="text-[9px] text-stone-400">Code de référence d'Exception (non modifiable).</p>
                  )}
                </div>

                {/* Designation */}
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Désignation Commerciale</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Solitaire Saphir Profond"
                    value={newProduct.designation}
                    onChange={(e) => setNewProduct({ ...newProduct, designation: e.target.value })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 font-serif font-bold text-stone-900 focus:outline-none focus:border-[#AA7C11]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Selection */}
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Catégorie</span>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as CategoryType })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 font-medium focus:outline-none focus:border-[#AA7C11]"
                  >
                    <option value="Bagues">Bagues</option>
                    <option value="Colliers">Colliers</option>
                    <option value="Bracelets">Bracelets</option>
                    <option value="Boucles d'oreilles">Boucles d'oreilles</option>
                    <option value="Montres">Montres</option>
                  </select>
                </div>

                {/* Metal Selection */}
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Alliage Métal principal</span>
                  <select
                    value={newProduct.metal_type}
                    onChange={(e) => setNewProduct({ ...newProduct, metal_type: e.target.value as MetalType })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-2.5 py-2 font-medium focus:outline-none focus:border-[#AA7C11]"
                  >
                    <option value="Or Jaune">Or Jaune</option>
                    <option value="Or Blanc">Or Blanc</option>
                    <option value="Or Rose">Or Rose</option>
                    <option value="Argent">Argent</option>
                    <option value="Platine">Platine</option>
                  </select>
                </div>

                {/* Titrage */}
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Titrage & Titre</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 18k (750/1000)"
                    value={newProduct.purity}
                    onChange={(e) => setNewProduct({ ...newProduct, purity: e.target.value })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 focus:outline-none focus:border-[#AA7C11]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weight */}
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Poids Total Alliage Métal (g)</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.weight}
                    onChange={(e) => setNewProduct({ ...newProduct, weight: Number(e.target.value) })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 font-mono font-semibold focus:outline-none focus:border-[#AA7C11]"
                  />
                </div>

                {/* Gemstones */}
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Pierres précieuses & Serti</span>
                  <input
                    type="text"
                    placeholder="Ex: 1x Brilliant GIA 0.70ct"
                    value={newProduct.components_stones}
                    onChange={(e) => setNewProduct({ ...newProduct, components_stones: e.target.value })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 focus:outline-none focus:border-[#AA7C11]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pricing Type */}
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Mécanisme de Prix</span>
                  <select
                    value={newProduct.price_type}
                    onChange={(e) => setNewProduct({ ...newProduct, price_type: e.target.value as 'variable' | 'fixe' })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-2.5 py-2 font-semibold focus:outline-none focus:border-[#AA7C11]"
                  >
                    <option value="variable">Formule Fluctuante (Cours Bourse + Façon)</option>
                    <option value="fixe">Montant Fixe Indépendant</option>
                  </select>
                </div>

                {/* Value mapping (depends on type) */}
                {newProduct.price_type === 'variable' ? (
                  <div className="space-y-1 border-l-2 border-[#AA7C11] pl-3 bg-amber-50/20 py-1 rounded">
                    <span className="block text-[10px] uppercase font-bold text-[#AA7C11]">Coût de Façon Artisanale (€)</span>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 250"
                      value={newProduct.labor_cost}
                      onChange={(e) => setNewProduct({ ...newProduct, labor_cost: Number(e.target.value) })}
                      className="w-full bg-[#FAF9F5] border border-[#AA7C11] rounded px-3 py-1.5 font-mono focus:outline-none animate-fade-in"
                    />
                    <p className="text-[9px] text-stone-500 italic mt-0.5 leading-none">
                      Calculé selon : (Poids × Cours du jour) + Façon d'atelier × Coefficient de marge.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 border-l-2 border-stone-600 pl-3 bg-stone-50 py-1 rounded">
                    <span className="block text-[10px] uppercase font-bold text-stone-700">Prix de Vente Fixe Brut (€)</span>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 1450"
                      value={newProduct.price_fixed}
                      onChange={(e) => setNewProduct({ ...newProduct, price_fixed: Number(e.target.value) })}
                      className="w-full bg-[#FAF9F5] border border-stone-400 rounded px-3 py-1.5 font-mono focus:outline-none animate-fade-in"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Initial Stock */}
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Stock Réel Disponible (pcs)</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProduct.stock_qty}
                    onChange={(e) => setNewProduct({ ...newProduct, stock_qty: Number(e.target.value) })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 font-mono"
                  />
                </div>

                {/* Visible status */}
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Visibilité En Ligne</span>
                  <select
                    value={newProduct.visible_en_ligne ? 'true' : 'false'}
                    onChange={(e) => setNewProduct({ ...newProduct, visible_en_ligne: e.target.value === 'true' })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-2.5 py-2"
                  >
                    <option value="true">Affiché sur la Vitrine</option>
                    <option value="false">Masqué / En Réserve</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload area (Supports File upload & URL) */}
              <div className="border border-dashed border-stone-250 p-4 rounded-lg bg-stone-50/50 space-y-3">
                <span className="block text-[10px] uppercase font-bold text-stone-400">Visuel Haute Définition</span>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* File selector input */}
                  <div className="md:col-span-6 space-y-1">
                    <span className="block text-[9px] font-bold text-stone-550">Option 1 : Téléverser un fichier local (Input File)</span>
                    <label className="flex items-center justify-center border border-stone-300 hover:border-[#AA7C11] rounded cursor-pointer py-1.5 px-3 bg-white hover:bg-stone-50 active:bg-stone-100 transition-colors">
                      <Plus className="h-4 w-4 text-[#AA7C11] mr-2" />
                      <span className="text-[11px] text-stone-600 font-medium">Sélectionner une photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setNewProduct({ ...newProduct, image_url: reader.result });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* URL Text Input */}
                  <div className="md:col-span-6 space-y-1 col-span-1">
                    <span className="block text-[9px] font-bold text-stone-550">Option 2 : Saisir URL Internet</span>
                    <input
                      type="text"
                      placeholder="Ex: https://image.unsplash.com/..."
                      value={newProduct.image_url}
                      onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-[10px] font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Preview indicator */}
                {newProduct.image_url && (
                  <div className="flex items-center space-x-3.5 bg-white p-2 border border-stone-200 rounded">
                    <img
                      src={newProduct.image_url}
                      alt="Prévisualisation"
                      className="w-14 h-14 object-cover rounded border border-stone-250 bg-stone-50 animate-fade-in"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="text-[10px] font-semibold text-stone-500 block leading-none">Aperçu immédiat</span>
                      <span className="text-[8px] font-mono text-stone-400 mt-1 block truncate max-w-xs md:max-w-md">
                        {newProduct.image_url.startsWith('data:') ? 'Fichier téléversé (Base64)' : newProduct.image_url}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Creator commentary description */}
              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-stone-400">Récits / Commentaires du Créateur</span>
                <textarea
                  rows={2}
                  placeholder="Écrivez le conte poétique entourant cette joaillerie Place Vendôme..."
                  value={newProduct.description || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#AA7C11]"
                />
              </div>

              {/* Submission buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-stone-100 uppercase tracking-widest font-sans font-bold text-[10px]">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2C251E] hover:bg-[#AA7C11] text-white hover:text-stone-900 rounded transition-colors"
                >
                  {productEditingSku ? 'Valider les modifications' : 'Enregistrer au catalogue'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. CUSTOM CLIENT CRM FORM MODAL */}
      {clientModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-[#EBE7DF] rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-[#14120F] text-white px-6 py-4 flex items-center justify-between border-b border-[#2C251E]">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-4.5 w-4.5 text-[#D4AF37]" />
                <h3 className="font-serif text-base tracking-wider font-light">
                  {clientEditingId ? 'Éditer la Fiche Client Privilégié' : 'Créer une Fiche Client Privilégié'}
                </h3>
              </div>
              <button onClick={() => setClientModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4 text-xs text-stone-700">
              {/* Client ID info */}
              {clientEditingId && (
                <div className="bg-stone-50 py-1.5 px-3 border border-stone-200 rounded font-mono text-[10px] text-stone-500 animate-fade-in">
                  ID CLIENT CRM : <span className="font-bold text-stone-900">{clientEditingId}</span>
                </div>
              )}

              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-stone-400">Nom Complet d'Exception</span>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vicomtesse de Noailles"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 text-stone-900 font-bold focus:outline-none focus:border-[#AA7C11]"
                />
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-stone-400">Numéro de Téléphone</span>
                <input
                  type="text"
                  required
                  placeholder="Ex: +33 6 44 55 66"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 font-mono focus:outline-none focus:border-[#AA7C11]"
                />
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-stone-400">Adresse Courriel</span>
                <input
                  type="email"
                  placeholder="Ex: v.noailles@email.com"
                  value={newClient.email || ''}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 focus:outline-none focus:border-[#AA7C11]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Taille de Bague</span>
                  <input
                    type="text"
                    placeholder="Ex: 54"
                    value={newClient.ring_size || ''}
                    onChange={(e) => setNewClient({ ...newClient, ring_size: e.target.value })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 text-center font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Métal Préféré</span>
                  <select
                    value={newClient.metal_preference || 'Or Jaune'}
                    onChange={(e) => setNewClient({ ...newClient, metal_preference: e.target.value })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-2.5 py-2 font-semibold"
                  >
                    <option value="Or Jaune">Or Jaune</option>
                    <option value="Or Blanc">Or Blanc</option>
                    <option value="Or Rose">Or Rose</option>
                    <option value="Argent">Argent</option>
                    <option value="Platine">Platine</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-stone-400">Date d'Anniversaire</span>
                <input
                  type="date"
                  value={newClient.birthday || ''}
                  onChange={(e) => setNewClient({ ...newClient, birthday: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 text-stone-600 font-medium"
                />
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-stone-400">Notes & Préférences Esthétiques</span>
                <textarea
                  rows={2}
                  placeholder="Prélèvements passés, solitaires épurés, diamants taille brillant..."
                  value={newClient.notes_style || ''}
                  onChange={(e) => setNewClient({ ...newClient, notes_style: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-stone-100 font-sans uppercase font-semibold text-[10px]">
                <button
                  type="button"
                  onClick={() => setClientModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-[#AA7C11] hover:text-stone-950 text-white rounded font-bold"
                >
                  {clientEditingId ? 'Mettre à jour' : 'Enregistrer la fiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EXPENSES OPERATIONS FORM MODAL */}
      {expenseModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-[#EBE7DF] rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-[#14120F] text-white px-6 py-4 flex items-center justify-between border-b border-[#2C251E]">
              <div className="flex items-center space-x-2">
                <BadgeEuro className="h-4.5 w-4.5 text-[#D4AF37]" />
                <h3 className="font-serif text-base tracking-wider font-light">
                  {expenseEditingId ? 'Contrôler la Charge' : 'Saisir une Charge d\'Exploitation'}
                </h3>
              </div>
              <button onClick={() => setExpenseModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs text-stone-750">
              
              <div className="space-y-1">
                <span className="block text-[10px] uppercase font-bold text-stone-400">Libellé descriptif de la Charge</span>
                <input
                  type="text"
                  required
                  placeholder="Ex: Coffret écrins velours précieux"
                  value={newExpense.label}
                  onChange={(e) => setNewExpense({ ...newExpense, label: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 font-bold focus:outline-none focus:border-[#AA7C11]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Montant de la dépense (€)</span>
                  <input
                    type="number"
                    required
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Périodicité</span>
                  <select
                    value={newExpense.type || 'fixe'}
                    onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value as any })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-2 py-2 font-semibold"
                  >
                    <option value="fixe">Charge Mensuelle Fixe</option>
                    <option value="variable">Charge Variable Coût</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Catégorisation Budget</span>
                  <select
                    value={newExpense.category || 'Loyer'}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-2 py-2"
                  >
                    <option value="Loyer">Loyer boutique</option>
                    <option value="Électricité">Électricité / Chauffage</option>
                    <option value="Salaires">Salaires & Façonnage</option>
                    <option value="Emballage">Emballage Écrins Luxe</option>
                    <option value="Sécurité">Sécurité Télésurveillance</option>
                    <option value="Taxes">Taxes d'affinage</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] uppercase font-bold text-stone-400">Date d'Affectation</span>
                  <input
                    type="date"
                    required
                    value={newExpense.date || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full bg-[#FAF9F5] border border-stone-300 rounded px-3 py-2 text-stone-600 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-stone-100 font-sans uppercase font-semibold text-[10px]">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-[#AA7C11] hover:text-stone-950 text-white rounded font-bold"
                >
                  {expenseEditingId ? 'Enregistrer modifs' : 'Imputer la Dépense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CUSTOM CONFIRMATION POPUP OVERLAY */}
      {customConfirm && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#EBE7DF] rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <h4 className="font-serif text-base font-bold text-stone-900">{customConfirm.title}</h4>
            </div>
            <p className="text-stone-600 text-xs leading-relaxed font-light">
              {customConfirm.message}
            </p>
            <div className="flex justify-end space-x-3 pt-3 text-xs font-semibold font-sans uppercase tracking-wider">
              <button
                onClick={() => setCustomConfirm(null)}
                className="px-4 py-2 bg-stone-100/80 hover:bg-stone-200 text-stone-700 rounded transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (customConfirm.type === 'product') {
                    const sku = customConfirm.id;
                    const removed = products.find(p => p.sku === sku);
                    setProducts(products.filter(p => p.sku !== sku));
                    addLog('Suppression Produit', `Le produit "${removed?.designation || sku}" a été retiré définitivement.`, sku);
                  } else if (customConfirm.type === 'client') {
                    const id = customConfirm.id;
                    const removed = clients.find(c => c.id === id);
                    setClients(clients.filter(c => c.id !== id));
                    addLog('Suppression Client CRM', `Fiche client de "${removed?.name || id}" retirée.`);
                  } else if (customConfirm.type === 'expense') {
                    const id = customConfirm.id;
                    const removed = expenses.find(e => e.id === id);
                    setExpenses(expenses.filter(e => e.id !== id));
                    addLog('Annulation Charge', `Retrait de la charge: "${removed?.label || id}"`);
                  }
                  setCustomConfirm(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. BARCODE MODAL */}
      {barcodeModalSku && (() => {
        const barcodeProduct = products.find(p => p.sku === barcodeModalSku);
        if (!barcodeProduct) return null;
        const estimatedPrice = calculateProductPrice(barcodeProduct, settings);
        
        return (
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-[#EBE7DF] rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-[#FAF9F5] border-b border-stone-200/60 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[#AA7C11]">
                  <Barcode className="h-5 w-5 animate-pulse" />
                  <h4 className="font-serif text-base font-bold text-stone-900">Code-Barres Unique</h4>
                </div>
                <button
                  onClick={() => setBarcodeModalSku(null)}
                  className="text-stone-400 hover:text-stone-600 transition-colors p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Contents */}
              <div className="p-6 space-y-6">
                {/* Visual Card Representation */}
                <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-6 text-center space-y-4" id="printable-barcode-label">
                  <div>
                    <h5 className="font-serif font-bold text-stone-800 text-lg leading-tight uppercase">
                      {barcodeProduct.designation}
                    </h5>
                    <p className="text-[10px] text-stone-500 font-medium tracking-wider uppercase mt-1">
                      {barcodeProduct.category} • {barcodeProduct.metal_type} • {barcodeProduct.weight.toFixed(2)}g
                    </p>
                  </div>

                  {/* Generated SKU and Barcode */}
                  <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-xs flex flex-col items-center justify-center">
                    <BarcodeSVG 
                      value={barcodeProduct.sku} 
                      height={75} 
                      narrowWidth={1.8}
                      className="border-0 p-0"
                    />
                  </div>

                  <div className="text-center font-serif text-base font-bold text-[#AA7C11]">
                    {estimatedPrice.toLocaleString('fr-FR')} € <span className="text-xs text-stone-400 font-sans font-light">Estimé</span>
                  </div>
                </div>

                {/* Explanation note */}
                <div className="bg-amber-50/50 border border-amber-200/40 p-4 rounded-lg flex items-start space-x-3 text-left">
                  <Sparkles className="h-5 w-5 text-[#AA7C11] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-stone-800">
                      Génération Automatique Exclusive
                    </p>
                    <p className="text-[11px] text-stone-600 leading-relaxed font-light">
                      Cette référence SKU unique est générée automatiquement à partir de la désignation, de la catégorie et du métal du bijou d'exception. Prête à être scannée lors de l'encaissement (POS).
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#FAF9F5] border-t border-stone-200/60 px-6 py-4 flex justify-end space-x-3 text-xs font-semibold font-sans uppercase tracking-wider">
                <button
                  onClick={() => setBarcodeModalSku(null)}
                  className="px-4 py-2 bg-stone-100/80 hover:bg-stone-200 text-stone-700 rounded transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    const printContent = document.getElementById('printable-barcode-label')?.innerHTML;
                    if (printContent) {
                      const printWindow = window.open('', '', 'height=500,width=500');
                      if (printWindow) {
                        printWindow.document.write('<html><head><title>Impression Étiquette SKU</title>');
                        printWindow.document.write('<style>');
                        printWindow.document.write('body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: white; text-align: center; }');
                        printWindow.document.write('.container { border: 1px solid #ccc; padding: 24px; border-radius: 8px; max-width: 320px; }');
                        printWindow.document.write('h5 { margin: 0 0 4px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; }');
                        printWindow.document.write('p { margin: 0 0 16px 0; font-size: 10px; color: #666; font-weight: bold; text-transform: uppercase; }');
                        printWindow.document.write('.price { font-size: 16px; font-weight: bold; color: #aa7c11; margin-top: 12px; }');
                        printWindow.document.write('</style></head><body>');
                        printWindow.document.write('<div class="container">' + printContent + '</div>');
                        printWindow.document.write('</body></html>');
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => {
                          printWindow.print();
                          printWindow.close();
                        }, 250);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-750 hover:to-amber-800 text-white rounded transition-all duration-300 shadow-sm flex items-center space-x-1.5"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer l\'étiquette</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
