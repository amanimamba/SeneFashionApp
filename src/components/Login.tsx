/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, UserCheck, Eye, EyeOff } from 'lucide-react';
import { AuditLog } from '../types';

interface LoginProps {
  onLoginSuccess: (name: string) => void;
  addLog: (action: string, details: string) => void;
}

export default function Login({ onLoginSuccess, addLog }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Standard static administrative credentials
    // Using email for login
    if (username.trim().toLowerCase() === 'admin@senefashion.bi' && password === 'admin123') {
      setErrorMessage('');
      onLoginSuccess('Directeur Principal');
      addLog('Connexion réussie', 'L\'administrateur s\'est connecté sur le portail de gestion.');
      // Redirect to admin panel
      navigate('/admin');
    } else {
      setErrorMessage('Identifiants de Direction invalides. Veuillez réessayer.');
      addLog('Échec de connexion', `Tentative infructueuse avec l'identifiant renseigné: "${username}".`);
    }
  };

  return (
    <div className="bg-[#0E0B08] min-h-screen flex items-center justify-center px-4 py-16 text-[#EBE7DF]">
      
      <div className="w-full max-w-md bg-[#191512] border border-[#3A3127] rounded-2xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
        
        {/* Subtle Ambient Lighting Overlay */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl"></div>

        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-full border border-[#D4AF37]/45 bg-[#2C2114] flex items-center justify-center mx-auto text-[#D4AF37]">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="font-serif text-2xl tracking-widest text-[#FAF9F5] pt-2">
            CONTRÔLE DIRECTION
          </h1>
          <p className="text-[10px] tracking-widest text-[#C5A880] font-sans uppercase">
            Espace d'administration sécurisé
          </p>
        </div>

        {/* Credentials hints for test purposes */}
        <div className="bg-[#2C2114]/50 border border-[#D4AF37]/25 rounded-lg p-4 text-xs space-y-1 text-[#F5E6C4] relative z-10">
          <div className="flex items-center space-x-1 font-semibold text-[#D4AF37] uppercase tracking-wider mb-1.5 text-[10px]">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Accès de Test Prédéfini:</span>
          </div>
          <p className="font-sans">Email Administrateur : <span className="font-mono text-white select-all bg-black/30 px-1.5 py-0.5 rounded">admin@senefashion.bi</span></p>
          <p className="font-sans">Mot de passe d'administration : <span className="font-mono text-white select-all bg-black/30 px-1.5 py-0.5 rounded">admin123</span></p>
        </div>

        {/* Form handling */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold">
              Email Gérant
            </label>
            <input
              type="email"
              required
              placeholder="Ex: admin@senefashion.bi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0F0E0C] border border-[#3A3127] focus:border-[#D4AF37] focus:outline-none rounded px-4 py-2.5 text-sm text-stone-100 placeholder-stone-600 transition-all font-sans"
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="block text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold">
              Mot de passe sécurisé
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Ex: admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0F0E0C] border border-[#3A3127] focus:border-[#D4AF37] focus:outline-none rounded pl-4 pr-10 py-2.5 text-sm text-stone-100 placeholder-stone-600 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-[#D4AF37]"
                title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="text-xs text-rose-450 bg-rose-950/20 border border-rose-900/40 p-3 rounded text-center">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#AA7C11] text-[#0F0E0C] font-bold text-xs uppercase tracking-widest py-3.5 rounded transition-all duration-300 shadow-lg cursor-pointer"
          >
            Se connecter à la Caisse
          </button>

        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-stone-500 hover:text-[#D4AF37] font-sans transition-colors"
          >
            Retourner au site vitrine public
          </button>
        </div>

      </div>

    </div>
  );
}
