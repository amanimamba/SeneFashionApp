/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ============================================================================
 *               DOCUMENTATION OFFICIELLE DES ENDPOINTS API (MOCK)
 * ============================================================================
 * 
 * Ce fichier intercepte toutes les requêtes faites vers '/api/*' pour simuler
 * un serveur de base de données distant. Les données sont persistées localement
 * de manière isolée dans le localStorage du navigateur client.
 * 
 * ----------------------------------------------------------------------------
 * 1. BIJOUX ET CATALOGUE (/api/products)
 * ----------------------------------------------------------------------------
 * - GET /api/products :
 *   Retourne la liste complète de tous les bijoux enregistrés.
 *   Response (200 OK) : Array<Product>
 * 
 * - POST /api/products :
 *   Ajoute un nouveau bijou d'exception au catalogue.
 *   Body : Product (L'identifiant SKU doit être unique)
 *   Response (201 Created) : { success: true, data: Product }
 * 
 * - PUT /api/products/:sku :
 *   Modifie un bijou existant identifié par son SKU.
 *   Body : Partial<Product>
 *   Response (200 OK) : { success: true, data: Product }
 * 
 * - DELETE /api/products/:sku :
 *   Supprime ou archive un bijou du catalogue.
 *   Response (200 OK) : { success: true, sku: string }
 * 
 * ----------------------------------------------------------------------------
 * 2. MOUVEMENTS DE STOCK (/api/movements)
 * ----------------------------------------------------------------------------
 * - GET /api/movements :
 *   Obtient l'historique de tous les mouvements physiques (entrées/sorties).
 *   Response (200 OK) : Array<StockMovement>
 * 
 * - POST /api/movements :
 *   Enregistre un mouvement manuel ou automatique de stock.
 *   Body : StockMovement
 *   Response (201 Created) : { success: true, data: StockMovement }
 * 
 * ----------------------------------------------------------------------------
 * 3. VENTES ET POS TRANSACTIONNEL (/api/sales)
 * ----------------------------------------------------------------------------
 * - GET /api/sales :
 *   Liste toutes les ventes effectuées, acomptes et réservations.
 *   Response (200 OK) : Array<Sale>
 * 
 * - POST /api/sales :
 *   Valide une nouvelle commande depuis la caisse tactile.
 *   Body : Sale
 *   Response (201 Created) : { success: true, data: Sale }
 * 
 * - PUT /api/sales/:id :
 *   Modifie une commande existante (ex: règlement de l'acompte).
 *   Body : Partial<Sale>
 *   Response (200 OK) : { success: true, data: Sale }
 * 
 * ----------------------------------------------------------------------------
 * 4. COMPTABILITÉ & CHARGES (/api/expenses)
 * ----------------------------------------------------------------------------
 * - GET /api/expenses :
 *   Obtient la liste de toutes les dépenses déclarées.
 *   Response (200 OK) : Array<Expense>
 * 
 * - POST /api/expenses :
 *   Ajoute une nouvelle charge fixe ou variable.
 *   Body : Expense
 *   Response (201 Created) : { success: true, data: Expense }
 * 
 * - DELETE /api/expenses/:id :
 *   Supprime une charge comptabilisée.
 *   Response (200 OK) : { success: true, id: string }
 * 
 * ----------------------------------------------------------------------------
 * 5. CRM ET SUIVI CLIENTS (/api/clients)
 * ----------------------------------------------------------------------------
 * - GET /api/clients :
 *   Retourne le portefeuille de clients fidèles et leurs tailles.
 *   Response (200 OK) : Array<Client>
 * 
 * - POST /api/clients :
 *   Enregistre une nouvelle fiche client fidélité.
 *   Body : Client
 *   Response (201 Created) : { success: true, data: Client }
 * 
 * ----------------------------------------------------------------------------
 * 6. CONFIGURATION GLOBALE & COURS DES MÉTAUX (/api/settings)
 * ----------------------------------------------------------------------------
 * - GET /api/settings :
 *   Récupère les paramètres monétaires (cours de l'or/g, marge, tél WhatsApp).
 *   Response (200 OK) : SystemSettings
 * 
 * - PUT /api/settings :
 *   Applique la mise à jour des paramétrages directeurs.
 *   Body : SystemSettings
 *   Response (200 OK) : { success: true, data: SystemSettings }
 * 
 * ----------------------------------------------------------------------------
 * 7. AUDIT DE SÉCURITÉ ET LOGS (/api/logs)
 * ----------------------------------------------------------------------------
 * - GET /api/logs :
 *   Accède au registre inaltérable d'audit de l'établissement.
 *   Response (200 OK) : Array<AuditLog>
 * 
 * - POST /api/logs :
 *   Enregistre une nouvelle traçabilité d'action.
 *   Body : AuditLog
 *   Response (201 Created) : { success: true, data: AuditLog }
 * ============================================================================
 */

import { Product, StockMovement, Sale, Expense, Client, AuditLog, SystemSettings } from '../types';
import { 
  INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_CLIENTS, INITIAL_EXPENSES, INITIAL_MOVEMENTS, INITIAL_SALES, INITIAL_LOGS 
} from '../data';

// Helper to check and initialize localStorage
const getLocalStorageItem = (key: string, defaultValue: any) => {
  const value = localStorage.getItem(key);
  if (!value) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    return defaultValue;
  }
};

// Detect old or limited data and force re-seed for seneFashion brand refresh
const storedProdsStr = localStorage.getItem('bijoux_products');
try {
  if (!storedProdsStr || JSON.parse(storedProdsStr).length <= 5) {
    // Clear old keys to allow brand-new comprehensive seeds to populate fully
    localStorage.removeItem('bijoux_products');
    localStorage.removeItem('bijoux_movements');
    localStorage.removeItem('bijoux_sales');
    localStorage.removeItem('bijoux_expenses');
    localStorage.removeItem('bijoux_clients');
    localStorage.removeItem('bijoux_logs');
    localStorage.removeItem('bijoux_settings');
  }
} catch (e) {
  console.warn("Clean-up check failed, resetting databases.", e);
}

// Initialize localStorage databases if not present
getLocalStorageItem('bijoux_products', INITIAL_PRODUCTS);
getLocalStorageItem('bijoux_movements', INITIAL_MOVEMENTS);
getLocalStorageItem('bijoux_sales', INITIAL_SALES);
getLocalStorageItem('bijoux_expenses', INITIAL_EXPENSES);
getLocalStorageItem('bijoux_clients', INITIAL_CLIENTS);
getLocalStorageItem('bijoux_logs', INITIAL_LOGS);
getLocalStorageItem('bijoux_settings', INITIAL_SETTINGS);

// Backing up native fetch
const originalFetch = window.fetch;

// Custom Mock Fetch interceptor
const customFetch = async function (this: any, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : (input instanceof Request) ? input.url : input.toString();
  
  // Only intercept requests destined for '/api/'
  if (urlStr.includes('/api/')) {
    // Simulate natural networking delay (150ms - 300ms) for ultimate realism
    await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 150));

    const url = new URL(urlStr, window.location.origin);
    const path = url.pathname;
    const method = init?.method?.toUpperCase() || 'GET';
    const bodyStr = init?.body ? init.body.toString() : '';
    
    // Log API transactions to console for auditability and verification
    console.log(`%c[MOCK API] ${method} ${path}`, 'background: #AA7C11; color: #000; padding: 2px 5px; font-weight: bold;', bodyStr ? JSON.parse(bodyStr) : '');

    try {
      // 1. PRODUCTS API (/api/products)
      if (path === '/api/products') {
        const storedProducts: Product[] = JSON.parse(localStorage.getItem('bijoux_products') || '[]');
        if (method === 'GET') {
          return new Response(JSON.stringify(storedProducts), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (method === 'POST') {
          const payload = JSON.parse(bodyStr) as Product;
          const updated = [...storedProducts, payload];
          localStorage.setItem('bijoux_products', JSON.stringify(updated));
          return new Response(JSON.stringify({ success: true, data: payload }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // 1.1 SINGLE PRODUCT API (/api/products/:sku)
      if (path.startsWith('/api/products/')) {
        const sku = decodeURIComponent(path.split('/').pop() || '');
        const storedProducts: Product[] = JSON.parse(localStorage.getItem('bijoux_products') || '[]');
        
        if (method === 'DELETE') {
          const updated = storedProducts.filter(p => p.sku !== sku);
          localStorage.setItem('bijoux_products', JSON.stringify(updated));
          return new Response(JSON.stringify({ success: true, sku }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (method === 'PUT') {
          const payload = JSON.parse(bodyStr) as Partial<Product>;
          const updated = storedProducts.map(p => p.sku === sku ? { ...p, ...payload } : p);
          localStorage.setItem('bijoux_products', JSON.stringify(updated));
          const updatedItem = updated.find(p => p.sku === sku);
          return new Response(JSON.stringify({ success: true, data: updatedItem }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // 2. STOCK MOVEMENTS API (/api/movements)
      if (path === '/api/movements') {
        const storedMovements: StockMovement[] = JSON.parse(localStorage.getItem('bijoux_movements') || '[]');
        if (method === 'GET') {
          return new Response(JSON.stringify(storedMovements), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (method === 'POST') {
          const payload = JSON.parse(bodyStr) as StockMovement;
          const updated = [payload, ...storedMovements];
          localStorage.setItem('bijoux_movements', JSON.stringify(updated));
          return new Response(JSON.stringify({ success: true, data: payload }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // 3. SALES API (/api/sales)
      if (path === '/api/sales') {
        const storedSales: Sale[] = JSON.parse(localStorage.getItem('bijoux_sales') || '[]');
        if (method === 'GET') {
          return new Response(JSON.stringify(storedSales), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (method === 'POST') {
          const payload = JSON.parse(bodyStr) as Sale;
          const updated = [payload, ...storedSales];
          localStorage.setItem('bijoux_sales', JSON.stringify(updated));
          return new Response(JSON.stringify({ success: true, data: payload }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // 3.1 UPDATE SALE BY ID /api/sales/:id
      if (path.startsWith('/api/sales/')) {
        const id = decodeURIComponent(path.split('/').pop() || '');
        const storedSales: Sale[] = JSON.parse(localStorage.getItem('bijoux_sales') || '[]');
        
        if (method === 'PUT') {
          const payload = JSON.parse(bodyStr) as Partial<Sale>;
          const updated = storedSales.map(s => s.id === id ? { ...s, ...payload } : s);
          localStorage.setItem('bijoux_sales', JSON.stringify(updated));
          const updatedItem = updated.find(s => s.id === id);
          return new Response(JSON.stringify({ success: true, data: updatedItem }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // 4. EXPENSES API (/api/expenses)
      if (path === '/api/expenses') {
        const storedExpenses: Expense[] = JSON.parse(localStorage.getItem('bijoux_expenses') || '[]');
        if (method === 'GET') {
          return new Response(JSON.stringify(storedExpenses), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (method === 'POST') {
          const payload = JSON.parse(bodyStr) as Expense;
          const updated = [payload, ...storedExpenses];
          localStorage.setItem('bijoux_expenses', JSON.stringify(updated));
          return new Response(JSON.stringify({ success: true, data: payload }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // 4.1 EXPENSE REMOVAL /api/expenses/:id
      if (path.startsWith('/api/expenses/')) {
        const id = decodeURIComponent(path.split('/').pop() || '');
        const storedExpenses: Expense[] = JSON.parse(localStorage.getItem('bijoux_expenses') || '[]');
        if (method === 'DELETE') {
          const updated = storedExpenses.filter(e => e.id !== id);
          localStorage.setItem('bijoux_expenses', JSON.stringify(updated));
          return new Response(JSON.stringify({ success: true, id }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // 5. CRM CLIENTS API (/api/clients)
      if (path === '/api/clients') {
        const storedClients: Client[] = JSON.parse(localStorage.getItem('bijoux_clients') || '[]');
        if (method === 'GET') {
          return new Response(JSON.stringify(storedClients), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (method === 'POST') {
          const payload = JSON.parse(bodyStr) as Client;
          const updated = [...storedClients, payload];
          localStorage.setItem('bijoux_clients', JSON.stringify(updated));
          return new Response(JSON.stringify({ success: true, data: payload }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // 6. SYSTEM SETTINGS API (/api/settings)
      if (path === '/api/settings') {
        const storedSettings = JSON.parse(localStorage.getItem('bijoux_settings') || '{}');
        if (method === 'GET') {
          return new Response(JSON.stringify(storedSettings), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (method === 'PUT') {
          const payload = JSON.parse(bodyStr) as SystemSettings;
          localStorage.setItem('bijoux_settings', JSON.stringify(payload));
          return new Response(JSON.stringify({ success: true, data: payload }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // 7. AUDIT LOGS API (/api/logs)
      if (path === '/api/logs') {
        const storedLogs: AuditLog[] = JSON.parse(localStorage.getItem('bijoux_logs') || '[]');
        if (method === 'GET') {
          return new Response(JSON.stringify(storedLogs), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (method === 'POST') {
          const payload = JSON.parse(bodyStr) as AuditLog;
          const updated = [payload, ...storedLogs];
          localStorage.setItem('bijoux_logs', JSON.stringify(updated));
          return new Response(JSON.stringify({ success: true, data: payload }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // Unsupported Mock Endpoint - trigger fallback 404
      return new Response(JSON.stringify({ error: `Not Found: ${method} ${path}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Fallback to native fetch for standard assets/routes/outside calls
  return originalFetch.apply(this, [input, init]);
};

// Safe injection inside restricted iframe environments
try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (e) {
  try {
    (window as any).fetch = customFetch;
  } catch (err) {
    console.warn('Failed to intercept fetch API globally, mock networking might fall back', err);
  }
}

