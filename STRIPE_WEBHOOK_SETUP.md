# Configuration des Webhooks Stripe

## 4. Flux de paiement complet

1. **Création de commande** → Crée la session Stripe Checkout
2. **Paiement réussi** → Webhook `checkout.session.completed`
3. **Mise à jour automatique** :
   - Statut de la commande → `PAID`
   - Statut de paiement → `PAID`
   - Création de la facture
   - Liaison du customer Stripe
   - Sauvegarde des adresses

## 5. Endpoints disponibles

- `POST /api/stripe/webhooks` - Réception des webhooks Stripe
- Fonctions serveur pour récupérer commandes et factures

## 6. Test des webhooks en local

Utiliser Stripe CLI :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```
