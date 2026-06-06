# 💍 Documentation des API REST — seneFashion Haute Joaillerie & Couture

Ce fichier rassemble l'ensemble des spécifications techniques de toutes les routes API REST de la bijouterie. Tous ces appels sont gérés côté client de manière robuste via l'intercepteur réseau standard configuré dans `src/api/mockFetch.ts` surchargeant `window.fetch`. Les données sont stockées au format JSON dans `localStorage` pour assurer une persistance locale fiable.

---

## 📦 1. Catalogue de Bijoux (`/api/products`)

### `GET /api/products`
Retourne la liste complète de toutes les créations de joaillerie (or, argent, pierreries, etc.) disponibles.
- **Réponse Typique :** `200 OK`
```json
[
  {
    "sku": "CH-18K-001",
    "designation": "Solitaire Diamant Sublime",
    "category": "Bagues",
    "metal_type": "Or Jaune",
    "purity": "18k (750/1000)",
    "weight": 4.85,
    "components_stones": "Diamant GIA 1.2 carats",
    "price_type": "variable",
    "price_fixed_markup": 1200,
    "stock_qty": 3,
    "visible_en_ligne": true,
    "image_url": "https://images.unsplash.com/photo-1605100804763-247f67b3557e",
    "description": "Or jaune poli miroir serti d'un diamant pur certifié."
  }
]
```

### `POST /api/products`
Ajoute une nouvelle pièce de haute bijouterie au catalogue.
- **Payload requis :** Un objet `Product` complet.
- **Réponse Typique :** `201 Created`
```json
{
  "success": true,
  "message": "Nouveau bijou ajouté avec succès au catalogue d'Atelier",
  "data": { ... }
}
```

### `PUT /api/products/:sku`
Met à jour les détails d'un bijou existant.
- **Payload requis :** Un objet `Product` partiel ou complet.
- **Réponse Typique :** `200 OK`
```json
{
  "success": true,
  "message": "Fiche bijou SKU CH-18K-001 mise à jour avec succès",
  "data": { ... }
}
```

### `DELETE /api/products/:sku`
Archive ou supprime définitivement un produit précieux par sa référence (SKU).
- **Réponse Typique :** `200 OK`
```json
{
  "success": true,
  "message": "Bijou SKU CH-18K-001 retiré de la base de données"
}
```

---

## 👥 2. Fiches CRM Fidélité (`/api/clients`)

### `GET /api/clients`
Retourne l'intégralité du carnet d'adresses des acheteurs privilégiés de la Maison.
- **Réponse Typique :** `200 OK`
```json
[
  {
    "id": "CL-01",
    "name": "Jean Dupont",
    "phone": "06 12 34 56 78",
    "email": "jean.dupont@test.com",
    "ring_size": "56",
    "metal_preference": "Or Jaune",
    "birthday": "1988-04-12",
    "notes_style": "Préfère les solitaires épurés en taille brillant"
  }
]
```

### `POST /api/clients`
Crée une nouvelle fiche client avec préférences physiques (taille de bague, métal préféré).
- **Payload requis :** Un nouvel objet `Client`.
- **Réponse Typique :** `201 Created`
```json
{
  "success": true,
  "message": "Fiche client privilégié créée avec succès",
  "data": { ... }
}
```

### `PUT /api/clients/:id`
Modifie les détails de contact ou notes comportementales de l'acheteur de prestige.
- **Payload requis :** Un objet `Client` partiel ou complet.
- **Réponse Typique :** `200 OK`
```json
{
  "success": true,
  "message": "Préférences et contact client mis à jour",
  "data": { ... }
}
```

### `DELETE /api/clients/:id`
Supprime définitivement un client historique de l'Atelier.
- **Réponse Typique :** `200 OK`
```json
{
  "success": true,
  "message": "Fiche client supprimée définitivement"
}
```

---

## 💸 3. Charges d'Atelier & Dépenses (`/api/expenses`)

### `GET /api/expenses`
Retourne la liste des frais opérationnels imputés (Loyer Place Vendôme, assurances, électricité des creusets).
- **Réponse Typique :** `200 OK`
```json
[
  {
    "id": "E-001",
    "date": "2026-06-01",
    "label": "Loyer Mensuel Joaillerie",
    "amount": 4200,
    "type": "fixe",
    "category": "Loyer"
  }
]
```

### `POST /api/expenses`
Saisit et impute une nouvelle dépense à l'exercice comptable courant.
- **Payload requis :** Un objet `Expense` complet.
- **Réponse Typique :** `201 Created`
```json
{
  "success": true,
  "message": "Dépense enregistrée au Grand Livre Comptable",
  "data": { ... }
}
```

### `PUT /api/expenses/:id`
Met à jour une dépense existante de fonctionnement de l'atelier.
- **Payload requis :** Un objet `Expense` complet ou partiel.
- **Réponse Typique :** `200 OK`
```json
{
  "success": true,
  "message": "Dépense modifiée avec succès dans les écritures"
}
```

### `DELETE /api/expenses/:id`
Extirpe ou annule l'écriture comptable d'une charge passée.
- **Réponse Typique :** `200 OK`
```json
{
  "success": true,
  "message": "Écriture de frais retirée avec succès"
}
```

---

## 📈 4. Flux de Stocks & Fonte (`/api/movements`)

### `GET /api/movements`
Retourne l'historique complet de tous les mouvements physiques (entrées matières, livraisons fournisseurs, fontes d'or, etc.).
- **Réponse Typique :** `200 OK`

### `POST /api/movements`
Déclare un nouveau mouvement d'inventaire ou une coulée d'or brut.

---

## 🛒 5. Registre des Ventes & Facturation (`/api/sales`)

### `GET /api/sales`
Liste tous les bordereaux de vente et encaissements enregistrés par la direction.

### `POST /api/sales`
Enregistre un paiement et décrémente automatiquement les unités en stock.

---

## ⚙️ 6. Paramètres d'Atelier & Cours des Métaux (`/api/settings`)

### `GET /api/settings`
Lit la table de conversion administrative, y compris le cours de l'Or et de l'Argent au gramme.

### `PUT /api/settings`
Met à jour instantanément les cours de bourse des métaux précieux pour actualiser les tarifs.

---

## 📜 7. Audit Tracker & Logs de Traçabilité (`/api/logs`)

### `GET /api/logs`
Consulte l'historique complet des actions effectuées sur l'application administrative de l'Atelier.

---

## 📊 8. Exportation des Stocks (Format CSV Excel professionnel)

Le système de mouvements propose deux flux d'export de données au format Excel CSV séparé par des points-virgules `;` pour une ouverture immédiate sous Microsoft Excel (avec prise en charge native des accents via le BOM d'encodage `\uFEFF`).

### 📥 Exporter les Entrées de Stock
- **Sujet :** Récolte tous les mouvements au statut entrée (`entree_fournisseur`, `entree_fabrication`, `retour_confiance`).
- **Fichier de sortie :** `seneFashion_Stock_Entrees_[date_du_jour].csv`
- **Colonnes exportées :** ID Opération, SKU, Désignation, Catégorie, Métal, Type d'Entrée, Quantité, Coût Unitaire, Coût Total Estimé, Fournisseur/Partenaire, Date de Saisie, Notes & Justification.

### 📤 Exporter les Sorties de Stock
- **Sujet :** Récolte tous les mouvements au statut sortie (`sortie_fonte_recyclage`, `sortie_perte_vol`, `sortie_confiance`, `sortie_vente`).
- **Fichier de sortie :** `seneFashion_Stock_Sorties_[date_du_jour].csv`
- **Colonnes exportées :** ID Opération, SKU, Désignation, Catégorie, Métal, Motif de Sortie, Quantité Sortie, Coût Unitaire Estimé, Impact Financier, Bénéficiaire/Tiers, Date de Saisie, Notes & Justification.
