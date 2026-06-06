/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link, useNavigate } from 'react-router-dom';
import { Gem, Lock, ShieldAlert, LogOut, Heart, ArrowLeft, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  isAdmin: boolean;
  onLogout: () => void;
  whatsappPhone: string;
}

export default function Navbar({ isAdmin, onLogout, whatsappPhone }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-[#0F0E0C]/90 backdrop-blur-md border-b border-[#2C251E] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2.5 bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] rounded-lg shadow-lg group-hover:scale-105 transition-all duration-300">
              <Gem className="h-6 w-6 text-[#0F0E0C]" />
            </div>
            <div>
              <span className="font-serif text-2xl tracking-widest bg-gradient-to-r from-[#F5E6C4] via-[#D4AF37] to-[#AA7C11] bg-clip-text text-transparent hover:opacity-90 transition-opacity">
                SENEFASHION
              </span>
              <p className="font-sans text-[9px] tracking-[0.25em] text-[#C5A880] uppercase">
                Haute Joaillerie & Couture d'Exception
              </p>
            </div>
          </Link>

          {/* Core Navigation Items */}
          <nav className="hidden md:flex items-center space-x-8 font-sans text-sm tracking-wider uppercase">
            <Link to="/" className="text-stone-300 hover:text-[#D4AF37] transition-colors duration-200 py-1">
              Collections
            </Link>
            <a href="#atelier" className="text-stone-300 hover:text-[#D4AF37] transition-colors duration-200 py-1" onClick={(e) => {
              e.preventDefault();
              navigate('/');
              setTimeout(() => {
                document.getElementById('atelier')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}>
              L'Atelier
            </a>
            <a href="#services" className="text-stone-300 hover:text-[#D4AF37] transition-colors duration-200 py-1" onClick={(e) => {
              e.preventDefault();
              navigate('/');
              setTimeout(() => {
                document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}>
              Services Prestige
            </a>
          </nav>

          {/* Secondary Action Triggers */}
          <div className="flex items-center space-x-4">
            
            {/* WhatsApp Direct Action Link */}
            <a
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center space-x-2 text-xs text-[#C5A880] hover:text-[#D4AF37] border border-[#C5A880]/30 hover:border-[#D4AF37]/60 px-3.5 py-1.5 rounded-full transition-all duration-300"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Atelier WhatsApp</span>
            </a>

            {/* Admin Controls */}
            {isAdmin ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/admin"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded bg-gradient-to-r from-[#2C2114] to-[#42321C] border border-[#D4AF37]/40 hover:border-[#D4AF37] text-xs uppercase tracking-wider text-[#F5E6C4] transition-all"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>Direction</span>
                </Link>
                <button
                  onClick={onLogout}
                  className="p-2 text-stone-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-all"
                  title="Déconnexion"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1.5 px-4 py-2 hover:bg-white/5 rounded-lg text-sm text-stone-300 hover:text-[#D4AF37] border border-transparent hover:border-[#D4AF37]/20 transition-all duration-300"
              >
                <Lock className="h-4 w-4" />
                <span className="text-xs uppercase tracking-widest hidden sm:inline">Directeur</span>
              </Link>
            )}
            
          </div>

        </div>
      </div>
    </header>
  );
}
