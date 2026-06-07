/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product, SystemSettings, CategoryType, MetalType } from '../types';
import { calculateProductPrice } from '../data';
import { Filter, Search, Award, Sparkles, MapPin, Phone, HelpCircle, BadgePercent } from 'lucide-react';

interface VitrineProps {
  products: Product[];
  settings: SystemSettings;
}

export default function Vitrine({ products, settings }: VitrineProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'Tout'>('Tout');
  const [selectedMetal, setSelectedMetal] = useState<MetalType | 'Tout'>('Tout');
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'custom'>('all');

  // Filter logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'Tout' || p.category === selectedCategory;
      const matchMetal = selectedMetal === 'Tout' || p.metal_type === selectedMetal;
      const matchSearch = p.designation.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.components_stones.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isAvailable = p.stock_qty > 0;
      const matchAvailability = availabilityFilter === 'all' ||
                                (availabilityFilter === 'available' && isAvailable) ||
                                (availabilityFilter === 'custom' && !isAvailable);

      return matchCategory && matchMetal && matchSearch && matchAvailability;
    });
  }, [products, selectedCategory, selectedMetal, searchQuery, availabilityFilter]);

  const categories: (CategoryType | 'Tout')[] = ['Tout', 'Bagues', 'Colliers', 'Bracelets', 'Boucles d\'oreilles', 'Montres'];
  const metals: (MetalType | 'Tout')[] = ['Tout', 'Or Jaune', 'Or Blanc', 'Or Rose', 'Argent', 'Platine'];

  return (
    <div className="bg-[#FAF9F5] text-stone-900 min-h-screen">
      
      {/* Elegance Hero Section */}
      <div className="relative h-[65vh] bg-[#0E0B08] flex items-center justify-center overflow-hidden">
        {/* Ambient Darkened Background image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Jewelry Banner" 
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F5] via-transparent to-black/70"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
          <p className="font-sans text-[#D4AF37] tracking-[0.4em] uppercase text-xs sm:text-sm animate-fade-in">
            Créations Intemporelles & Or Fini d'Exception
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl text-[#FAF9F5] font-light leading-none tracking-wide">
            Sublimez l'Éternel en <span className="text-[#D4AF37]">Or</span> & Pierres Précieuses
          </h1>
          <p className="font-sans text-stone-300 text-sm sm:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Chaque pièce de notre atelier d'artisanat d'art Place Vendôme raconte une histoire sacrée d'or lourd, d'émeraudes intenses et de diamants purs certifiés.
          </p>
          <div className="pt-4">
            <a 
              href="#collections-grid" 
              className="inline-block bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#AA7C11] text-[#0F0E0C] font-semibold text-xs uppercase tracking-widest px-8 py-4 rounded-md transition-all duration-300 shadow-xl"
            >
              Découvrir la Vitrine
            </a>
          </div>
        </div>
      </div>

      {/* Brand Values Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-8 bg-white border border-[#EBE7DF] rounded-xl hover:shadow-md transition-all">
            <Award className="h-8 w-8 text-[#AA7C11] mx-auto mb-4" />
            <h3 className="font-serif text-lg text-[#2C251E] mb-2">Métaux d'Origine Éthique</h3>
            <p className="text-xs text-stone-500 font-light leading-relaxed">
              Nous n'utilisons que de l'Or 750/1000 certifié et du Platine pur recyclés dans le respect des normes environnementales internationales les plus strictes.
            </p>
          </div>
          <div className="p-8 bg-white border border-[#EBE7DF] rounded-xl hover:shadow-md transition-all">
            <Sparkles className="h-8 w-8 text-[#AA7C11] mx-auto mb-4" />
            <h3 className="font-serif text-lg text-[#2C251E] mb-2">Main d'œuvre Artisanale</h3>
            <p className="text-xs text-stone-500 font-light leading-relaxed">
              De la fonte brute à la ciselure finale, nos maîtres artisans joailliers façonnent chaque modèle sur mesure avec une précision chirurgique.
            </p>
          </div>
          <div className="p-8 bg-white border border-[#EBE7DF] rounded-xl hover:shadow-md transition-all">
            <Phone className="h-8 w-8 text-[#AA7C11] mx-auto mb-4" />
            <h3 className="font-serif text-lg text-[#2C251E] mb-2">Commande & Contact direct</h3>
            <p className="text-xs text-stone-500 font-light leading-relaxed">
              Notre relation client se fait d'humain à humain via un rendez-vous personnalisé par WhatsApp. Pas d'attente automatisée, un conseil de connaisseur.
            </p>
          </div>
        </div>
      </div>

      {/* Main Catalog Showcase Area */}
      <div id="collections-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-20">
        
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-[#EBE7DF] pb-6 mb-10 gap-4">
          <div>
            <span className="font-sans text-[10px] uppercase tracking-widest text-[#AA7C11] font-bold">Catalogue d'Excellence</span>
            <h2 className="font-serif text-2xl sm:text-4xl text-[#2C251E] font-medium">Nos Pièces d'Exception</h2>
          </div>
          <p className="text-xs text-stone-500 max-w-md font-light">
            Découvrez nos créations actuellement exposées en vitrine. Les prix de nos bijoux fabriqués en métaux d'or fluctuent élégamment selon l'exactitude de leur poids au gramme.
          </p>
        </div>

        {/* Filter Toolbar Panel */}
        <div className="bg-white border border-[#EBE7DF] rounded-xl p-6 mb-8 space-y-6 shadow-sm">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Search inputs */}
            <div className="lg:col-span-4 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-stone-400" />
              </span>
              <input
                type="text"
                placeholder="Rechercher un modèle, pierre (ex: Diamant)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF9F5] border border-stone-300 rounded focus:outline-none focus:border-[#AA7C11] transition-all text-stone-800"
              />
            </div>

            {/* Availability filter */}
            <div className="lg:col-span-8 flex flex-wrap items-center gap-3">
              <span className="text-xs tracking-wider text-stone-400 uppercase font-medium mr-1.5">Statut :</span>
              <button
                onClick={() => setAvailabilityFilter('all')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-sans tracking-wider uppercase transition-all ${
                  availabilityFilter === 'all' 
                    ? 'bg-[#2C251E] text-[#FAF9F5]' 
                    : 'bg-[#FAF9F5] text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                Tout voir
              </button>
              <button
                onClick={() => setAvailabilityFilter('available')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-sans tracking-wider uppercase transition-all ${
                  availabilityFilter === 'available' 
                    ? 'bg-[#2C251E] text-[#FAF9F5]' 
                    : 'bg-[#FAF9F5] text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                Disponible en vitrine
              </button>
              <button
                onClick={() => setAvailabilityFilter('custom')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-sans tracking-wider uppercase transition-all ${
                  availabilityFilter === 'custom' 
                    ? 'bg-[#2C251E] text-[#FAF9F5]' 
                    : 'bg-[#FAF9F5] text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                Commander sur mesure
              </button>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-5 space-y-4">
            
            {/* Categories filter list */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs tracking-wider text-stone-400 uppercase font-medium mr-1.5">Catégorie :</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs rounded transition-all transition-colors duration-150 ${
                    selectedCategory === cat 
                      ? 'bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] text-stone-900 font-semibold' 
                      : 'bg-stone-100 hover:bg-[#EBE7DF] text-stone-700'
                  }`}
                >
                  {cat === 'Tout' ? 'Toutes catégories' : cat}
                </button>
              ))}
            </div>

            {/* Metals filter list */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs tracking-wider text-stone-400 uppercase font-medium mr-1.5">Type de métal :</span>
              {metals.map((met) => (
                <button
                  key={met}
                  onClick={() => setSelectedMetal(met)}
                  className={`px-3.5 py-1.5 text-xs rounded transition-all transition-colors duration-150 ${
                    selectedMetal === met 
                      ? 'bg-gradient-to-r from-[#AA7C11] to-[#D4AF37] text-stone-900 font-semibold' 
                      : 'bg-stone-100 hover:bg-[#EBE7DF] text-stone-700'
                  }`}
                >
                  {met === 'Tout' ? 'Tous métaux' : met}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Dynamic products status count */}
        <p className="text-stone-500 text-xs mb-6 italic tracking-wider">
          {filteredProducts.filter(p => p.visible_en_ligne).length} bijou(x) d'exception d'artisanat d'or correspond(ent) à vos préférences.
        </p>

        {/* Catalog Showcase Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.filter(p => p.visible_en_ligne).map((product) => {
            const isAvailable = product.stock_qty > 0;
            const finalPrice = calculateProductPrice(product, settings);

            return (
              <div 
                key={product.sku}
                className="bg-white border-2 border-[#EBE7DF] rounded-xl overflow-hidden group hover:border-[#AA7C11] hover:shadow-2xl transition-all duration-300 flex flex-col h-full relative"
              >
                {/* Alibaba styled trust indicators & fast action tabs */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
                  <span className="bg-[#AA7C11]/90 backdrop-blur-xs text-white text-[8px] uppercase tracking-widest font-black font-sans px-2 py-0.5 rounded-sm shadow-sm">
                    Prestige France
                  </span>
                  {product.weight > 15 && (
                    <span className="bg-[#191512]/90 backdrop-blur-xs text-[#D4AF37] text-[8px] uppercase tracking-widest font-bold font-sans px-2 py-0.5 rounded-sm shadow-sm">
                      Gros Volume
                    </span>
                  )}
                </div>

                {/* Product image with sleek hover transformation effect */}
                <div className="relative aspect-square overflow-hidden bg-stone-50 border-b border-stone-100">
                  <img 
                    src={product.image_url} 
                    alt={product.designation} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Stock status badge for Alibaba inspired UI */}
                  <span className={`absolute top-3 right-3 px-2.5 py-1 text-[9px] uppercase tracking-wider font-extrabold rounded-md shadow-md z-10 ${
                    isAvailable 
                      ? 'bg-emerald-600 text-white border border-emerald-500' 
                      : 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                  }`}>
                    {isAvailable ? '✔ En Stock d\'Atelier' : '✘ SUR-MESURE UNIQUEMENT'}
                  </span>
                  
                  {/* Category overlay */}
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 text-[9px] uppercase tracking-wider text-[#0F0E0C] font-black bg-[#FAF9F5]/90 backdrop-blur-xs rounded-sm shadow border border-stone-200 z-10">
                    {product.category}
                  </span>
                </div>

                {/* Card description text details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Metal metrics & standard stars rating (Alibaba benchmark) */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5 text-[10px] uppercase tracking-widest text-[#AA7C11] font-extrabold font-mono">
                        <span>{product.metal_type}</span>
                      </div>
                      
                      {/* Gold rating stars */}
                      <div className="flex items-center space-x-0.5 text-[#D4AF37] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                        <span className="text-[10px] font-sans font-bold text-stone-800 mr-0.5">5.0</span>
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </div>
                    </div>

                    <h3 className="font-serif text-base text-[#2C251E] group-hover:text-[#AA7C11] transition-colors leading-snug mb-1 font-bold">
                      {product.designation}
                    </h3>

                    <p className="font-mono text-[10px] text-stone-400 mb-2 truncate" title={product.sku}>
                      Référence usine : {product.sku}
                    </p>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed font-light mb-4">
                      {product.description || "Aucune description supplémentaire fournie pour ce chef d'œuvre d'orfèvrerie."}
                    </p>
                  </div>

                  <div>
                    {/* Alibaba dense inventory grid panel */}
                    <div className="bg-[#FAF9F5] border border-stone-200 rounded-lg p-3 mb-4 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-stone-400 font-light font-sans">Quantité dispo immédiate :</span>
                        {isAvailable ? (
                          <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {product.stock_qty} pièces
                          </span>
                        ) : (
                          <span className="font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase">
                            Stock Épuisé
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-dashed border-stone-200">
                        <span className="text-stone-500 font-light font-sans">Poids & Ornement :</span>
                        <span className="font-sans font-medium text-stone-850">
                          {product.weight.toFixed(2)}g • {product.components_stones.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Trust badges snippet */}
                    <div className="flex justify-between text-[9px] text-[#8C7A63] font-sans font-medium uppercase tracking-wider pb-4">
                      <span>✓ Certificat GIA</span>
                      <span>✓ Envoi Sécurisé</span>
                      <span>✓ Fait Main</span>
                    </div>

                    {/* Pricing & details button action */}
                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                      <div>
                        <span className="block text-[8px] text-stone-400 uppercase tracking-widest font-bold">
                          Prix de Vente
                        </span>
                        <div className="flex items-baseline space-x-1">
                          <span className="font-serif text-lg font-black text-stone-900">
                            {finalPrice.toLocaleString('fr-FR')} BIF
                          </span>
                          <span className="text-[10px] text-stone-400 font-sans font-normal">/ pce</span>
                        </div>
                      </div>
                      
                      <Link 
                        to={`/product/${product.sku}`}
                        className={`text-xs uppercase tracking-wider px-4 py-2.5 rounded-md font-bold font-sans transition-all duration-200 ${
                          isAvailable 
                            ? 'bg-[#2C251E] hover:bg-[#AA7C11] text-[#FAF9F5] hover:text-[#0F0E0C]' 
                            : 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                        }`}
                      >
                        {isAvailable ? 'Commander' : 'Demander Devis'}
                      </Link>
                    </div>

                  </div>
                </div>

              </div>
            );
          })}

          {filteredProducts.filter(p => p.visible_en_ligne).length === 0 && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-16 bg-white border border-[#EBE7DF] rounded-xl">
              <HelpCircle className="h-10 w-10 text-stone-300 mx-auto mb-3" />
              <p className="font-serif text-lg text-stone-800 mb-1">Aucun bijou de collection ne correspond à vos filtres</p>
              <p className="text-xs text-stone-400 max-w-md mx-auto">Veuillez ajuster vos critères de recherche, de catégorie ou votre choix de métaux précieux pour voir d'autres créations.</p>
            </div>
          )}

        </div>

      </div>

      {/* Embedded Artisan Workshop Section (L'Atelier) */}
      <div id="atelier" className="bg-[#0E0B08] text-white py-20 scroll-mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <span className="font-sans text-[10px] tracking-[0.4em] text-[#D4AF37] uppercase font-bold">Un savoir-faire centenaire</span>
              <h2 className="font-serif text-3xl sm:text-5xl font-light tracking-wide text-[#FAF9F5]">
                La Fonte Sacrée & le Serti d'Exception
              </h2>
              <div className="w-16 h-0.5 bg-[#D4AF37]"></div>
              <p className="text-xs text-stone-400 leading-relaxed font-light">
                À l'intérieur de notre propre atelier de fonderie parisienne, nous réalisons l'intégralité du cycle de création d'un bijou de joaillerie. De la réception d'or pur brut d'affinage 24k jusqu'au façonnage délicat de l'alliage 18 carat.
              </p>
              <p className="text-xs text-stone-400 leading-relaxed font-light">
                Chaque diamant et pierre précieuse fait l'objet d'une sélection rigoureuse sous loupe de grossissement 10x par notre gemmologue maison pour garantir une pureté absolue et une fluorescence maîtrisée.
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-4 text-center sm:text-left">
                <div>
                  <h4 className="font-serif text-xl text-[#F5E6C4]">18 Carats</h4>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold mt-1">Garantie Pureté Minimale</p>
                </div>
                <div>
                  <h4 className="font-serif text-xl text-[#F5E6C4]">0.01 Gramme</h4>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold mt-1">Précision d'Ajustement</p>
                </div>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl group border border-[#2C251E]">
              <img 
                src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&q=80&w=1200" 
                alt="Maître Artisan Joaillier" 
                className="w-full h-[450px] object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 text-center">
                <span className="font-sans text-[10px] text-[#D4AF37] uppercase tracking-widest font-bold">Main d'œuvre Vendôme</span>
                <p className="text-xs text-stone-300 font-light mt-1">Sertissage traditionnel d'un pavage de diamants sous microscope de haute précision.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Services Section */}
      <div id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="font-sans text-[10px] tracking-widest uppercase text-[#AA7C11] font-bold">Options Exclusives</span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#2C251E] font-medium">Services Prestige sur Rendez-vous</h2>
          <p className="text-stone-500 text-xs font-light">
            Notre maison de bijouterie accompagne les collectionneurs et les amoureux de belles pièces à travers des prestations artisanales sur-mesure d'exception.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white border border-[#EBE7DF] rounded-xl p-8 flex space-x-6 hover:shadow-lg transition-all">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-[#FAF9F5] rounded-lg border border-[#EBE7DF] flex items-center justify-center text-[#AA7C11]">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#2C251E] mb-2">Restructuration & Réparations</h3>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                Transformation complète de vos anciens bijoux de famille en or brut pour façonner des pièces contemporaines issues de votre propre imaginaire.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#EBE7DF] rounded-xl p-8 flex space-x-6 hover:shadow-lg transition-all">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-[#FAF9F5] rounded-lg border border-[#EBE7DF] flex items-center justify-center text-[#AA7C11]">
                <BadgePercent className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h3 className="font-serif text-lg text-[#2C251E] mb-2">Expertise Gemmologique de Vos Pierres</h3>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                Rapport d'expertise et de pureté officiel avec pesée au carat et estimation matérielle précise de vos gemmes d'héritage.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Luxury Footer Address */}
      <footer className="bg-[#14120F] text-[#EBE7DF] border-t border-[#2C251E] py-16 text-center">
        <p className="font-serif text-xl text-[#FAF9F5] mb-2">seneFashion — Haute Joaillerie & Couture d'Exception</p>
        <p className="text-xs text-[#C5A880] tracking-widest uppercase font-sans mb-8">Bureau d'Administration & Atelier Principal</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-xs font-light text-stone-400 mb-8">
          <div className="flex items-center space-x-1.5">
            <MapPin className="h-4 w-4 text-[#AA7C11]" />
            <span>22 Place Vendôme, 75001 Paris, France</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Phone className="h-4 w-4 text-[#AA7C11]" />
            <span>+33 (0)1 45 67 89 00</span>
          </div>
        </div>

        <p className="text-[10px] text-stone-600 font-sans tracking-wide">
          © {new Date().getFullYear()} seneFashion. Tous droits réservés. L'accès administrateur et directeur est strictement réservé au personnel authentifié.
        </p>
      </footer>

    </div>
  );
}
