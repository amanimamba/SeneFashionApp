/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product, SystemSettings } from '../types';
import { calculateProductPrice } from '../data';
import { ArrowLeft, MessageSquare, ShieldCheck, Scale, Sparkles, Gem, ShoppingBag, Clock } from 'lucide-react';

interface ProductDetailsProps {
  products: Product[];
  settings: SystemSettings;
}

export default function ProductDetails({ products, settings }: ProductDetailsProps) {
  const { sku } = useParams<{ sku: string }>();
  const navigate = useNavigate();

  // Find target jewelry by SKU
  const product = useMemo(() => {
    return products.find(p => p.sku === sku);
  }, [products, sku]);

  // Suggestions of similar items
  const suggestions = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.sku !== product.sku && p.category === product.category && p.visible_en_ligne)
      .slice(0, 3);
  }, [products, product]);

  if (!product) {
    return (
      <div className="bg-[#FAF9F5] min-h-screen py-24 flex items-center justify-center text-center px-4">
        <div className="max-w-md bg-white p-8 rounded-xl border border-[#EBE7DF] shadow-md">
          <h2 className="font-serif text-2xl text-stone-800 mb-2 font-medium">Création Introuvable</h2>
          <p className="text-xs text-stone-500 font-light mb-6">
            Le bijou d'exception référencé ou demandé n'est pas répertorié au catalogue ou a été archivé temporairement par le maître joaillier.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-stone-900 text-[#FAF9F5] text-xs uppercase tracking-widest px-6 py-3 rounded hover:bg-[#AA7C11] hover:text-stone-900 transition-all font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retourner aux Collections</span>
          </Link>
        </div>
      </div>
    );
  }

  const finalPrice = calculateProductPrice(product, settings);
  const isAvailable = product.stock_qty > 0;

  // Let's generate the pre-filled custom WhatsApp message URL
  // "Bonjour, je suis intéressé(e) par le produit suivant : [Nom du Bijou] (Réf: [Code SKU/ID]). Est-il toujours disponible en magasin ?"
  const messageText = `Bonjour, je suis très intéressé(e) par votre bijou d'artisanat : ${product.designation} (Réf: ${product.sku}). Poids approximatif : ${product.weight.toFixed(2)}g en ${product.metal_type} (${product.purity}). Est-il disponible actuellement pour un essayage, ou devrais-je le commander sur mesure ? L'image du modèle concerné : ${product.image_url}`;
  
  const encodedMessage = encodeURIComponent(messageText);
  const whatsappUrl = `https://wa.me/${settings.whatsapp_phone}?text=${encodedMessage}`;

  return (
    <div className="bg-[#FAF9F5] text-stone-900 min-h-screen pb-20">
      
      {/* Top Breadcrumb Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-2 text-xs text-stone-500 hover:text-[#AA7C11] tracking-wider uppercase font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Collections</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Dual Layout for Prestige Photo vs Descriptive parameters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white rounded-2xl border border-[#EBE7DF] overflow-hidden shadow-sm">
          
          {/* LEFT: Complete zoom preview photo container */}
          <div className="lg:col-span-6 bg-stone-50 flex items-center justify-center p-6 border-b lg:border-b-0 lg:border-r border-[#EBE7DF]">
            <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-inner group">
              <img
                src={product.image_url}
                alt={product.designation}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                referrerPolicy="no-referrer"
              />
              <span className={`absolute top-4 right-4 px-3 py-1 text-[9px] uppercase tracking-wider font-semibold rounded-full z-10 shadow ${
                isAvailable 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-amber-100 text-[#AA7C11] border border-amber-200'
              }`}>
                {isAvailable ? 'Disponible immediatement' : 'Sur Commande Atelier'}
              </span>
            </div>
          </div>

          {/* RIGHT: High specificity fields */}
          <div className="lg:col-span-6 p-8 lg:p-12 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold text-[#AA7C11] uppercase tracking-[0.3em] font-sans">
                {product.category} d'Exception
              </span>
              
              <h1 className="font-serif text-2xl sm:text-4xl text-[#2C251E] leading-tight font-medium mt-2">
                {product.designation}
              </h1>

              <div className="flex items-center space-x-3 mt-3">
                <span className="font-mono text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                  SKU Unique: {product.sku}
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-xs text-stone-500">
                  Métal d'alliage certifié d'État
                </span>
              </div>

              {/* Price bracket layout */}
              <div className="mt-8 pb-6 border-b border-stone-100">
                <p className="text-[10px] uppercase text-stone-400 font-bold tracking-widest mb-1.5">Prix Estimé en Magasin (TTC)</p>
                <div className="flex items-baseline space-x-3 text-stone-900">
                  <span className="font-serif text-3xl sm:text-4xl font-bold text-[#AA7C11]">
                    {finalPrice.toLocaleString('fr-FR')} €
                  </span>
                  {product.price_type === 'variable' && (
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 italic">
                      *(basé sur le cours du jour)
                    </span>
                  )}
                </div>
              </div>

              {/* Full Specificity Details Card */}
              <div className="py-6 space-y-4 border-b border-stone-100">
                <h3 className="font-serif text-sm font-semibold text-stone-800">Spécifications de Haute Joaillerie</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-[#FAF9F5] border border-stone-100 rounded-lg">
                    <Scale className="h-4 w-4 text-[#AA7C11] flex-shrink-0" />
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-stone-400">Poids Métal</span>
                      <span className="text-xs font-mono font-bold text-stone-800">{product.weight.toFixed(2)} g</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-[#FAF9F5] border border-stone-100 rounded-lg">
                    <Sparkles className="h-4 w-4 text-[#AA7C11] flex-shrink-0" />
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-stone-400">Métal & Titrage</span>
                      <span className="text-xs font-bold text-stone-800 truncate line-clamp-1">{product.metal_type} {product.purity}</span>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center space-x-3 p-3 bg-[#FAF9F5] border border-stone-100 rounded-lg">
                    <Gem className="h-4 w-4 text-[#AA7C11] flex-shrink-0" />
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-stone-400">Composants & Pierres</span>
                      <span className="text-xs font-bold text-stone-800">{product.components_stones}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Action Trigger (Acheter via WhatsApp) */}
              <div className="py-8 space-y-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-3 w-full bg-[#128C7E] hover:bg-[#075E54] active:bg-[#043e37] text-white py-4 px-6 rounded-xl font-sans font-bold text-sm uppercase tracking-wider transition-all shadow-lg text-center"
                >
                  <MessageSquare className="h-5 w-5 fill-current" />
                  <span>Acheter via WhatsApp</span>
                </a>

                <p className="text-[10px] text-stone-400 font-light text-center leading-relaxed">
                  En cliquant, vous serez directement mis en relation par un message pré-rempli avec l'Atelier d'Or de notre boutique de la Place Vendôme pour planifier l'achat, l'ajustement de taille ou l'envoi blindé.
                </p>
              </div>

            </div>

            {/* Quality check flags */}
            <div className="pt-4 border-t border-stone-100 grid grid-cols-2 gap-4 text-[10px] text-stone-500">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Certificat d'Authenticité d'État</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-[#AA7C11]" />
                <span>Garantie à vie de l'Atelier</span>
              </div>
            </div>

          </div>

        </div>

        {/* Detailed Description Block */}
        <div className="bg-white rounded-xl border border-[#EBE7DF] p-8 lg:p-12 mt-12 space-y-6">
          <h2 className="font-serif text-xl sm:text-2xl text-[#2C251E] font-medium border-b border-stone-100 pb-4">
            Notes du Créateur Joaillier
          </h2>
          <p className="text-sm font-light text-stone-600 leading-relaxed font-sans mt-4 max-w-4xl">
            {product.description || "Cette pièce maîtresse a été imaginée pour symboliser le summum du cachet parisien. En combinant la malléabilité d'alliages sélectionnés et le serti grain traditionnel, nos joailliers obtiennent une réflexion lumineuse magistrale sous chaque spectre solaire."}
          </p>
          <div className="bg-[#FAF9F5] border-l-4 border-[#AA7C11] p-4 text-xs italic text-[#2C251E] font-sans">
            "Le polissage miroir d'un bijou en métal doré, particulièrement l'or rose et le platine lourds, requiert plus de 15 étapes manuelles distinctes avec du fil de soie de coton." — Maître Artisan de seneFashion
          </div>
        </div>

        {/* RELATED SUGGESTIONS (Suggérés) */}
        {suggestions.length > 0 && (
          <div className="mt-16 space-y-6">
            <h3 className="font-serif text-xl text-stone-800 font-medium">Autres Pièces de la Collection</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {suggestions.map((s) => {
                const sPrice = calculateProductPrice(s, settings);
                return (
                  <Link
                    key={s.sku}
                    to={`/product/${s.sku}`}
                    className="bg-white border border-[#EBE7DF] rounded-xl overflow-hidden hover:shadow-md transition-all group flex flex-col"
                  >
                    <div className="aspect-square bg-stone-50 overflow-hidden relative">
                      <img
                        src={s.image_url}
                        alt={s.designation}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-[#AA7C11] font-bold block mb-1">
                          {s.metal_type} • {s.purity}
                        </span>
                        <h4 className="font-serif text-sm font-semibold text-stone-800 line-clamp-1 truncate group-hover:text-[#AA7C11]">
                          {s.designation}
                        </h4>
                      </div>
                      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-stone-400">
                          {s.weight.toFixed(2)} g
                        </span>
                        <span className="font-serif text-sm font-bold text-[#AA7C11]">
                          {sPrice.toLocaleString('fr-FR')} €
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
