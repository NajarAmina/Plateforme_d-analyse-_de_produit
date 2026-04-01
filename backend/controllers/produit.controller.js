const Produit = require('../models/produit.model');
const Ingredient = require('../models/ingredient.model');

const normalizeCodeBarre = (payload) => {
    const code = String(payload?.code_barre || payload?.codeBarres || '').trim();
    return code;
};

const normalizeIngredientNames = (names) => {
    if (!names) return [];
    if (Array.isArray(names)) {
        return names
            .map((x) => String(x || '').trim())
            .filter(Boolean);
    }
    // permet "sucre, lait, cacao"
    return String(names)
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
};

const resolveIngredientIds = async (ingredientNames) => {
    const names = normalizeIngredientNames(ingredientNames);
    if (names.length === 0) return [];

    const docs = [];
    for (const nom of names) {
        let ing = await Ingredient.findOne({ nom });
        if (!ing) {
            ing = await Ingredient.create({ nom });
        }
        docs.push(ing);
    }
    return docs.map((d) => d._id);
};

// ─── Ajouter produit (par agent directement) ─────────────────────────────────
exports.createProduit = async (req, res) => {
    try {
        // ✅ Bug 3 corrigé : toujours utiliser ingredientIds résolus (pas de fallback)
        const ingredientIds = await resolveIngredientIds(req.body.ingredients);
        const codeBarre = normalizeCodeBarre(req.body);

        const produit = new Produit({
            ...req.body,
            code_barre: codeBarre || undefined,
            codeBarres: codeBarre || undefined,
            ingredients: ingredientIds
        });

        const savedProduit = await produit.save();

        // Retourner avec populate pour cohérence frontend
        const populated = await Produit.findById(savedProduit._id)
            .populate('ingredients')
            .populate('pointsDeVente')
            .populate('createdBy');

        res.status(201).json(populated);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Fournisseur: soumettre un produit en attente ────────────────────────────
exports.createPendingProduit = async (req, res) => {
    try {
        const ingredientIds = await resolveIngredientIds(req.body.ingredients);
        const codeBarre = normalizeCodeBarre(req.body);

        const produit = new Produit({
            nom: req.body.nom,
            description: req.body.description,
            image: req.body.image,
            code_barre: codeBarre || undefined,
            codeBarres: codeBarre || undefined,
            origine: req.body.origine,
            ingredients: ingredientIds,
            pointsDeVente: Array.isArray(req.body.pointsDeVente) ? req.body.pointsDeVente : [],
            createdBy: req.body.createdBy,
            status: 'pending'
        });

        const savedProduit = await produit.save();

        const populated = await Produit.findById(savedProduit._id)
            .populate('ingredients')
            .populate('pointsDeVente')
            .populate('createdBy');

        res.status(201).json(populated);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Récupérer tous les produits ─────────────────────────────────────────────
exports.getAllProduits = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.createdBy) filter.createdBy = req.query.createdBy;

        const produits = await Produit.find(filter)
            .populate('ingredients', 'nom description estBio')
            .populate('pointsDeVente', 'nom adresse')
            .populate('createdBy', 'nom email')
            .populate('validatedBy', 'nom email');

        res.status(200).json(produits);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Récupérer les produits en attente ───────────────────────────────────────
exports.getPendingProduits = async (req, res) => {
    try {
        const produits = await Produit.find({ status: 'pending' })
            .populate('ingredients', 'nom description estBio')
            .populate('pointsDeVente', 'nom adresse')
            .populate('createdBy', 'nom email')
            .sort({ createdAt: -1 });

        res.status(200).json(produits);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Récupérer produit par ID ─────────────────────────────────────────────────
exports.getProduitById = async (req, res) => {
    try {
        const produit = await Produit.findById(req.params.id)
            .populate('ingredients', 'nom description estBio')
            .populate('pointsDeVente', 'nom adresse')
            .populate('createdBy', 'nom email')
            .populate('validatedBy', 'nom email');

        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        res.status(200).json(produit);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Modifier produit ─────────────────────────────────────────────────────────
exports.updateProduit = async (req, res) => {
    try {
        const ingredientIds = await resolveIngredientIds(req.body.ingredients);
        const codeBarre = normalizeCodeBarre(req.body);

        const updatePayload = {
            ...req.body,
            ...(codeBarre ? { code_barre: codeBarre, codeBarres: codeBarre } : {}),
            ...(ingredientIds.length ? { ingredients: ingredientIds } : {})
        };

        const produit = await Produit.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { new: true }
        );

        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        // ✅ Bug 1 corrigé : populate après update
        const populated = await Produit.findById(produit._id)
            .populate('ingredients', 'nom description estBio')
            .populate('pointsDeVente', 'nom adresse')
            .populate('createdBy', 'nom email')
            .populate('validatedBy', 'nom email');

        res.status(200).json(populated);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Approuver un produit (agent/admin) ──────────────────────────────────────
exports.approveProduit = async (req, res) => {
    try {
        const produit = await Produit.findById(req.params.id);
        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        produit.status = 'approved';
        produit.validatedBy = req.body.validatedBy || null;
        produit.validatedAt = new Date();
        await produit.save();

        const populated = await Produit.findById(produit._id)
            .populate('ingredients', 'nom description estBio')
            .populate('pointsDeVente', 'nom adresse')
            .populate('createdBy', 'nom email')
            .populate('validatedBy', 'nom email');

        res.status(200).json(populated);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Rejeter un produit (soft reject - garde en base) ────────────────────────
exports.rejectProduit = async (req, res) => {
    try {
        const produit = await Produit.findById(req.params.id);
        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        produit.status = 'rejected';
        produit.validatedBy = req.body.validatedBy || null;
        produit.validatedAt = new Date();
        await produit.save();

        res.status(200).json({ message: 'Produit rejeté', produit });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Supprimer produit (suppression physique) ────────────────────────────────
exports.deleteProduit = async (req, res) => {
    try {
        // ✅ Bug 2 corrigé : suppression physique au lieu de soft reject
        const produit = await Produit.findByIdAndDelete(req.params.id);

        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        res.status(200).json({ message: 'Produit supprimé' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
