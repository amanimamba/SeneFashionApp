/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Product, StockMovement, Sale, Expense, Client, AuditLog, SystemSettings } from './types';
import { 
  INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_CLIENTS, INITIAL_EXPENSES, INITIAL_MOVEMENTS, INITIAL_SALES, INITIAL_LOGS 
} from './data';
import Navbar from './components/Navbar';
import Vitrine from './components/Vitrine';
import ProductDetails from './components/ProductDetails';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import { Gem } from 'lucide-react';

export default function App() {
  // State variables synchronized with standard client localStorage
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  
  // Authentication states
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load state from standard APIs on startup
  useEffect(() => {
    async function loadDataFromApi() {
      try {
        const prodRes = await fetch('/api/products');
        const prods = await prodRes.json();
        setProducts(prods);

        const mvRes = await fetch('/api/movements');
        const mvs = await mvRes.json();
        setMovements(mvs);

        const saleRes = await fetch('/api/sales');
        const sles = await saleRes.json();
        setSales(sles);

        const expRes = await fetch('/api/expenses');
        const exps = await expRes.json();
        setExpenses(exps);

        const clientRes = await fetch('/api/clients');
        const clis = await clientRes.json();
        setClients(clis);

        const logsRes = await fetch('/api/logs');
        const lgs = await logsRes.json();
        setLogs(lgs);

        const settingsRes = await fetch('/api/settings');
        const sets = await settingsRes.json();
        setSettings(sets);

        const storedAuth = localStorage.getItem('bijoux_auth_status');
        if (storedAuth === 'true') {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error('Error fetching state from intercepted REST APIs', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadDataFromApi();
  }, []);

  // Save changes via mock REST representations & update state
  const updateAndStoreProducts = async (newProds: Product[]) => {
    setProducts(newProds);
    const prev = JSON.parse(localStorage.getItem('bijoux_products') || '[]');
    if (newProds.length > prev.length) {
      // Creation
      const added = newProds[newProds.length - 1];
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(added)
      });
    } else if (newProds.length < prev.length) {
      // Deletion
      const removedSKU = prev.find((p: any) => !newProds.some(np => np.sku === p.sku))?.sku;
      if (removedSKU) {
        await fetch(`/api/products/${encodeURIComponent(removedSKU)}`, { method: 'DELETE' });
      }
    } else {
      localStorage.setItem('bijoux_products', JSON.stringify(newProds));
    }
  };

  const updateAndStoreMovements = async (newMv: StockMovement[]) => {
    setMovements(newMv);
    const prev = JSON.parse(localStorage.getItem('bijoux_movements') || '[]');
    if (newMv.length > prev.length) {
      const added = newMv[0]; // added at index 0 typically
      await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(added)
      });
    } else {
      localStorage.setItem('bijoux_movements', JSON.stringify(newMv));
    }
  };

  const updateAndStoreSales = async (newSales: Sale[]) => {
    setSales(newSales);
    const prev = JSON.parse(localStorage.getItem('bijoux_sales') || '[]');
    if (newSales.length > prev.length) {
      const added = newSales[0];
      await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(added)
      });
    } else {
      localStorage.setItem('bijoux_sales', JSON.stringify(newSales));
    }
  };

  const updateAndStoreExpenses = async (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    const prev = JSON.parse(localStorage.getItem('bijoux_expenses') || '[]');
    if (newExpenses.length > prev.length) {
      const added = newExpenses[0];
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(added)
      });
    } else if (newExpenses.length < prev.length) {
      const deletedItem = prev.find((e: any) => !newExpenses.some((ne: any) => ne.id === e.id));
      if (deletedItem) {
        await fetch(`/api/expenses/${encodeURIComponent(deletedItem.id)}`, { method: 'DELETE' });
      }
    } else {
      localStorage.setItem('bijoux_expenses', JSON.stringify(newExpenses));
    }
  };

  const updateAndStoreClients = async (newClients: Client[]) => {
    setClients(newClients);
    const prev = JSON.parse(localStorage.getItem('bijoux_clients') || '[]');
    if (newClients.length > prev.length) {
      const added = newClients[newClients.length - 1];
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(added)
      });
    } else {
      localStorage.setItem('bijoux_clients', JSON.stringify(newClients));
    }
  };

  const updateAndStoreLogs = async (newLogs: AuditLog[]) => {
    setLogs(newLogs);
    const prev = JSON.parse(localStorage.getItem('bijoux_logs') || '[]');
    if (newLogs.length > prev.length) {
      const added = newLogs[0];
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(added)
      });
    } else {
      localStorage.setItem('bijoux_logs', JSON.stringify(newLogs));
    }
  };

  const updateAndStoreSettings = async (newSettings: SystemSettings) => {
    setSettings(newSettings);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
  };

  const handleLogin = (name: string) => {
    setIsAdmin(true);
    localStorage.setItem('bijoux_auth_status', 'true');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.setItem('bijoux_auth_status', 'false');
    addLog('Déconnexion Administrateur', 'L\'administrateur s\'est déconnecté manuellement.');
  };

  // Log audit helper
  const addLog = (action: string, details: string, target_sku?: string) => {
    const freshLog: AuditLog = {
      id: `L-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      user_name: isAdmin ? 'Direction' : 'Public',
      action,
      target_sku,
      details
    };
    const updated = [freshLog, ...logs];
    updateAndStoreLogs(updated);
  };

  if (!isLoaded) {
    return (
      <div className="bg-[#0E0B08] text-white min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin p-2 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] text-stone-900">
          <Gem className="h-8 w-8 text-[#0F0E0C]" />
        </div>
        <span className="font-serif tracking-widest text-[#D4AF37] text-sm uppercase">Chargement de l'Atelier d'Or...</span>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-[#FAF9F5]">
        
        {/* Luxury top navigation menu bar */}
        <Navbar 
          isAdmin={isAdmin} 
          onLogout={handleLogout} 
          whatsappPhone={settings.whatsapp_phone} 
        />

        {/* Core application Router routes */}
        <main className="flex-grow">
          <Routes>
            {/* PUBLIC vitrine customer route */}
            <Route 
              path="/" 
              element={<Vitrine products={products} settings={settings} />} 
            />

            {/* PUBLIC catalog detail dynamic route */}
            <Route 
              path="/product/:sku" 
              element={<ProductDetails products={products} settings={settings} />} 
            />

            {/* ADMIN Login authentication screen */}
            <Route 
              path="/login" 
              element={<Login onLoginSuccess={handleLogin} addLog={addLog} />} 
            />

            {/* ADMIN secure controlling route */}
            <Route 
              path="/admin" 
              element={
                isAdmin ? (
                  <AdminDashboard 
                    products={products}
                    movements={movements}
                    sales={sales}
                    expenses={expenses}
                    clients={clients}
                    logs={logs}
                    settings={settings}
                    setProducts={updateAndStoreProducts}
                    setMovements={updateAndStoreMovements}
                    setSales={updateAndStoreSales}
                    setExpenses={updateAndStoreExpenses}
                    setClients={updateAndStoreClients}
                    setLogs={updateAndStoreLogs}
                    setSettings={updateAndStoreSettings}
                    addLog={addLog}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            {/* Default Catchall Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

      </div>
    </HashRouter>
  );
}
