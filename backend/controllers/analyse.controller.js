const Analyse = require('../models/analyse.model');
const Produit = require('../models/produit.model');
const Ingredient = require('../models/ingredient.model');
const { spawn } = require('child_process');
const path = require('path');

// ─── Utilitaire : appel Python predictor ─────────────────────────────────────

const callPredictor = (payload) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '..', 'predictor.py');
        const pythonBin = process.env.PYTHON_BIN || 'python';

        const py = spawn(pythonBin, [scriptPath]);
        let stdout = '';
        let stderr = '';

        py.stdin.write(JSON.stringify(payload));
        py.stdin.end();

        py.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
        py.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

        py.on('close', (code) => {
            if (code !== 0 && !stdout) {
                return reject(new Error(stderr.slice(0, 300)));
            }
            try {
                const jsonStart = stdout.indexOf('{');
                const clean = jsonStart !== -1 ? stdout.slice(jsonStart) : stdout;
                const result = JSON.parse(clean.trim());
                if (result.error) return reject(new Error(result.error));
                resolve(result);
            } catch (e) {
                reject(new Error('Réponse Python non-JSON : ' + stdout.slice(0, 200)));
            }
        });

        py.on('error', (err) => reject(err));
    });
};

// ─── Utilitaire : construire le payload pour le predictor ────────────────────

const buildPayload = (product) => {
    const ingredients = product.ingredients || [];
    return {
        nb_ingredients: ingredients.length,
        ingredients_text: product.description || product.nom || '',
        contains_preservatives: ingredients.some(i =>
            typeof i === 'object'
                ? (i.nom || '').toLowerCase().includes('conserv')
                : false
        ) ? 1 : 0,
        contains_artificial_colors: ingredients.some(i =>
            typeof i === 'object'
                ? (i.nom || '').toLowerCase().includes('coloran')
                : false
        ) ? 1 : 0,
        contains_flavouring: ingredients.some(i =>
            typeof i === 'object'
                ? (i.nom || '').toLowerCase().includes('arôm')
                : false
        ) ? 1 : 0,
        nova_group: product.nova_group || 3,
        nutriscore_num: product.nutriscore || 0,
        nb_e_numbers: ingredients.filter(i =>
            typeof i === 'object' && (i.nom || '').match(/E\d{3}/i)
        ).length,
        ingredients_length: ingredients.length
    };
};

// ─── CREATE ──────────────────────────────────────────────────────────────────

exports.createAnalyse = async (req, res) => {
    try {
        const analyse = new Analyse({
            id_analyse: req.body.id_analyse,
            produit: req.body.produit
        });
        const savedAnalyse = await analyse.save();
        res.status(201).json(savedAnalyse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── GET ALL ─────────────────────────────────────────────────────────────────

exports.getAllAnalyses = async (req, res) => {
    try {
        const analyses = await Analyse.find().populate('produit');
        res.status(200).json(analyses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── GET BY ID ───────────────────────────────────────────────────────────────

exports.getAnalyseById = async (req, res) => {
    try {
        const analyse = await Analyse.findById(req.params.id).populate('produit');
        if (!analyse) return res.status(404).json({ message: 'Analyse non trouvée' });
        res.status(200).json(analyse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────

exports.updateAnalyse = async (req, res) => {
    try {
        const analyse = await Analyse.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!analyse) return res.status(404).json({ message: 'Analyse non trouvée' });
        res.status(200).json(analyse);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────

exports.deleteAnalyse = async (req, res) => {
    try {
        const analyse = await Analyse.findByIdAndDelete(req.params.id);
        if (!analyse) return res.status(404).json({ message: 'Analyse non trouvée' });
        res.status(200).json({ message: 'Analyse supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── PREDICT (pipeline Python ML) ────────────────────────────────────────────
// POST /api/analyses/predict  ← utilisé par ScannerSection / AiAnalysisTab

exports.predictIngredients = async (req, res) => {
    try {
        const result = await callPredictor(req.body);
        return res.status(200).json(result);
    } catch (err) {
        console.error('[predictIngredients error]', err.message);
        return res.status(500).json({ message: err.message });
    }
};

// Alias pour compatibilité
exports.predictProduct = exports.predictIngredients;

// ─── SEARCH BY PRODUCT NAME ──────────────────────────────────────────────────
// GET /api/analyses/search/produit?q=nom_du_produit

exports.searchByProductName = async (req, res) => {
    try {
        const query = (req.query.q || '').trim();
        if (!query) {
            return res.status(400).json({ message: 'Paramètre q (nom du produit) requis' });
        }

        const products = await Produit.find({
            status: 'approved',
            nom: { $regex: query, $options: 'i' }
        }).populate('ingredients');

        if (!products.length) {
            return res.status(404).json({ message: 'Aucun produit trouvé', results: [] });
        }

        const enriched = await Promise.all(
            products.map(async (product) => {
                try {
                    const payload = buildPayload(product.toObject());
                    const aiResult = await callPredictor(payload);
                    return {
                        ...product.toObject(),
                        ai_predictions: aiResult.predictions || {}
                    };
                } catch {
                    return { ...product.toObject(), ai_predictions: {} };
                }
            })
        );

        return res.status(200).json({ results: enriched, total: enriched.length });
    } catch (error) {
        console.error('[searchByProductName error]', error.message);
        res.status(500).json({ message: error.message });
    }
};

// ─── SEARCH BY INGREDIENT NAME ───────────────────────────────────────────────
// GET /api/analyses/search/ingredient?q=nom_ingredient

exports.searchByIngredientName = async (req, res) => {
    try {
        const query = (req.query.q || '').trim();
        if (!query) {
            return res.status(400).json({ message: 'Paramètre q (nom ingrédient) requis' });
        }

        // 1. Trouver les ingrédients dont le nom correspond
        const ingredients = await Ingredient.find({
            nom: { $regex: query, $options: 'i' }
        });

        if (!ingredients.length) {
            return res.status(404).json({
                message: 'Aucun ingrédient trouvé',
                results: []
            });
        }

        const ingredientIds = ingredients.map((i) => i._id);

        // 2. Trouver les produits dont le tableau ingredients contient
        //    au moins un des ObjectId trouvés ci-dessus
        //    $elemMatch + $in sur un tableau de références ObjectId
        const products = await Produit.find({
            status: 'approved',
            ingredients: { $elemMatch: { $in: ingredientIds } }
        }).populate('ingredients');

        if (!products.length) {
            return res.status(404).json({
                message: 'Aucun produit contenant cet ingrédient',
                results: []
            });
        }

        // 3. Enrichir chaque produit avec les prédictions IA
        const enriched = await Promise.all(
            products.map(async (product) => {
                try {
                    const payload = buildPayload(product.toObject());
                    const aiResult = await callPredictor(payload);
                    return {
                        ...product.toObject(),
                        ai_predictions: aiResult.predictions || {}
                    };
                } catch {
                    return { ...product.toObject(), ai_predictions: {} };
                }
            })
        );

        return res.status(200).json({ results: enriched, total: enriched.length });
    } catch (error) {
        console.error('[searchByIngredientName error]', error.message);
        res.status(500).json({ message: error.message });
    }
};

// ─── SEARCH BY BARCODE ───────────────────────────────────────────────────────
// GET /api/analyses/search/barcode?q=code_barre

exports.searchByBarcode = async (req, res) => {
    try {
        const query = (req.query.q || '').trim();
        if (!query) {
            return res.status(400).json({ message: 'Paramètre q (code-barres) requis' });
        }

        const product = await Produit.findOne({
            $or: [{ code_barre: query }, { codeBarres: query }]
        }).populate('ingredients');

        if (!product) {
            return res.status(404).json({ message: 'Produit non trouvé', results: [] });
        }

        try {
            const payload = buildPayload(product.toObject());
            const aiResult = await callPredictor(payload);
            const enriched = {
                ...product.toObject(),
                ai_predictions: aiResult.predictions || {}
            };
            return res.status(200).json({ results: [enriched], total: 1 });
        } catch {
            return res.status(200).json({
                results: [{ ...product.toObject(), ai_predictions: {} }],
                total: 1
            });
        }
    } catch (error) {
        console.error('[searchByBarcode error]', error.message);
        res.status(500).json({ message: error.message });
    }
};