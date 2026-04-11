const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth.middleware');
const analyseController = require('../controllers/analyse.controller');

// ─── Routes de recherche (publiques) ─────────────────────────────────────────
// Doivent être déclarées AVANT /:id pour éviter les conflits de routage

// Recherche par nom de produit  → GET /api/analyses/search/produit?q=lait
router.get('/search/produit', analyseController.searchByProductName);

// Recherche par nom d'ingrédient → GET /api/analyses/search/ingredient?q=sucre
router.get('/search/ingredient', analyseController.searchByIngredientName);

// Recherche par code-barres → GET /api/analyses/search/barcode?q=3017620422003
router.get('/search/barcode', analyseController.searchByBarcode);

// ─── Prédiction IA (pipeline Python) ─────────────────────────────────────────
// POST /api/analyses/predict  — utilisé par ScannerSection et AiAnalysisTab
router.post('/predict', analyseController.predictProduct);

// ─── CRUD standard ───────────────────────────────────────────────────────────

router.post('/', protect, analyseController.createAnalyse);

router.get('/', analyseController.getAllAnalyses);

router.get('/:id', analyseController.getAnalyseById);

router.put('/:id', protect, analyseController.updateAnalyse);

router.delete('/:id', protect, analyseController.deleteAnalyse);

module.exports = router;