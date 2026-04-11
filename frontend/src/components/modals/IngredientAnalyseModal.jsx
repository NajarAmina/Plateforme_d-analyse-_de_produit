// src/components/modals/IngredientAnalyseModal.jsx
//
// Affiche la fiche d'analyse complète d'un ingrédient :
// score bio, risques IA, produits qui le contiennent.
//
import React from 'react';

const IngredientAnalyseModal = ({ ingredientName, products, onClose }) => {
    if (!products || products.length === 0) return null;

    // ── Agrégation des scores IA sur tous les produits contenant l'ingrédient ──
    const preds = products[0]?.ai_predictions || {};

    // Calculer la moyenne des scores si plusieurs produits
    const avg = (key) => {
        const vals = products
            .map(p => p.ai_predictions?.[key])
            .filter(v => typeof v === 'number');
        if (!vals.length) return null;
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    };

    const avgCardioPercent = avg('cardio_risk_percent');
    const avgDiabetesPercent = avg('diabetes_risk_percent');
    const avgBioscore = avg('bioscore');

    // Niveau de risque le plus représenté
    const dominantRisk = (key) => {
        const vals = products.map(p => p.ai_predictions?.[key]).filter(Boolean);
        if (!vals.length) return preds[key] || '—';
        const freq = {};
        vals.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
        return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    };

    const cardioRisk = dominantRisk('cardio_risk');
    const diabetesRisk = dominantRisk('diabetes_risk');
    const additiveExp = dominantRisk('additive_exposure');
    const ultraTransVal = products.filter(p => p.ai_predictions?.ultra_transforme).length;
    const ultraTrans = ultraTransVal > products.length / 2;

    const getRiskColor = (risk) => {
        if (!risk) return '#64748b';
        const r = risk.toString().toLowerCase();
        if (r === 'low' || r === 'faible') return '#10b981';
        if (r === 'medium' || r === 'moyen') return '#f59e0b';
        if (r === 'high' || r === 'élevé') return '#ef4444';
        return '#64748b';
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <span style={styles.badge}>🧪 Ingrédient</span>
                        <h2 style={styles.title}>{ingredientName}</h2>
                        <p style={styles.subtitle}>
                            Présent dans {products.length} produit{products.length > 1 ? 's' : ''} analysé{products.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    <button style={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* ── Score Santé / Bio ── */}
                {avgBioscore !== null && (
                    <div style={styles.scoreBand}>
                        <div style={styles.scoreRing}>
                            <span style={styles.scoreValue}>{avgBioscore}</span>
                        </div>
                        <div>
                            <div style={styles.scoreLabel}>Score Santé / Bio (IA)</div>
                            <div style={styles.scoreHint}>Moyenne calculée sur les produits contenant cet ingrédient</div>
                        </div>
                    </div>
                )}

                {/* ── Cartes IA ── */}
                <div style={styles.aiSection}>
                    <h3 style={styles.sectionTitle}>🤖 Analyse IA & Santé</h3>
                    <div style={styles.aiGrid}>

                        {/* Risque Cardio */}
                        <div style={styles.aiCard}>
                            <span style={styles.aiIcon}>🫀</span>
                            <div style={styles.aiContent}>
                                <span style={styles.aiCardTitle}>Risque Cardio</span>
                                <span style={{ ...styles.aiValue, color: getRiskColor(cardioRisk) }}>
                                    {cardioRisk}
                                </span>
                                {avgCardioPercent !== null && (
                                    <RiskBar percent={avgCardioPercent} color={getRiskColor(cardioRisk)} />
                                )}
                            </div>
                        </div>

                        {/* Risque Diabète */}
                        <div style={styles.aiCard}>
                            <span style={styles.aiIcon}>🩸</span>
                            <div style={styles.aiContent}>
                                <span style={styles.aiCardTitle}>Risque Diabète</span>
                                <span style={{ ...styles.aiValue, color: getRiskColor(diabetesRisk) }}>
                                    {diabetesRisk}
                                </span>
                                {avgDiabetesPercent !== null && (
                                    <RiskBar percent={avgDiabetesPercent} color={getRiskColor(diabetesRisk)} />
                                )}
                            </div>
                        </div>

                        {/* Exposition Additifs */}
                        <div style={styles.aiCard}>
                            <span style={styles.aiIcon}>🧪</span>
                            <div style={styles.aiContent}>
                                <span style={styles.aiCardTitle}>Exp. Additifs</span>
                                <span style={{ ...styles.aiValue, color: getRiskColor(additiveExp) }}>
                                    {additiveExp}
                                </span>
                            </div>
                        </div>

                        {/* Ultra-transformé */}
                        <div style={styles.aiCard}>
                            <span style={styles.aiIcon}>🍔</span>
                            <div style={styles.aiContent}>
                                <span style={styles.aiCardTitle}>Ultra-Transformé</span>
                                <span style={{ ...styles.aiValue, color: ultraTrans ? '#ef4444' : '#10b981' }}>
                                    {ultraTrans ? 'Oui' : 'Non'}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Produits contenant cet ingrédient ── */}
                <div style={styles.productsSection}>
                    <h3 style={styles.sectionTitle}>
                        📦 Produits contenant "{ingredientName}"
                    </h3>
                    <div style={styles.productsList}>
                        {products.map((p, idx) => (
                            <div key={p._id || idx} style={styles.productChip}>
                                {p.image && (
                                    <img
                                        src={p.image.startsWith('data:') ? p.image : `http://localhost:5000/${p.image}`}
                                        alt={p.nom}
                                        style={styles.productChipImg}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                                <div>
                                    <div style={styles.productChipName}>{p.nom}</div>
                                    {p.marque && (
                                        <div style={styles.productChipBrand}>{p.marque}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

/* ── Barre de risque ─────────────────────────────────────────────────────── */
const RiskBar = ({ percent, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
        <div style={{
            height: '6px',
            borderRadius: '3px',
            width: `${percent}%`,
            maxWidth: '80px',
            minWidth: '4px',
            backgroundColor: color,
            transition: 'width 0.8s ease',
        }} />
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
            {percent}%
        </span>
    </div>
);

/* ── Styles ──────────────────────────────────────────────────────────────── */
const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
    },
    modal: {
        backgroundColor: '#ffffff',
        borderRadius: '1.5rem',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2rem',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '1rem',
    },
    headerLeft: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
    badge: {
        display: 'inline-block',
        backgroundColor: '#f0fdf4',
        color: '#16a34a',
        fontSize: '0.75rem',
        fontWeight: '700',
        padding: '0.25rem 0.75rem',
        borderRadius: '2rem',
        border: '1px solid #bbf7d0',
        width: 'fit-content',
    },
    title: {
        fontSize: '1.75rem',
        fontWeight: '800',
        color: '#0f172a',
        margin: 0,
        textTransform: 'capitalize',
    },
    subtitle: { fontSize: '0.9rem', color: '#64748b', margin: 0 },
    closeBtn: {
        background: 'none',
        border: '1px solid #e2e8f0',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        cursor: 'pointer',
        fontSize: '1rem',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    /* Score */
    scoreBand: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        backgroundColor: '#f0fdf4',
        borderRadius: '1rem',
        padding: '1rem 1.25rem',
        border: '1px solid #bbf7d0',
    },
    scoreRing: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'conic-gradient(#16a34a 75%, #dcfce7 0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    scoreValue: {
        fontSize: '1.2rem',
        fontWeight: '800',
        color: '#16a34a',
        backgroundColor: '#fff',
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreLabel: { fontSize: '0.9rem', fontWeight: '700', color: '#166534' },
    scoreHint: { fontSize: '0.78rem', color: '#4ade80', marginTop: '0.2rem' },

    /* IA */
    aiSection: {},
    sectionTitle: {
        fontSize: '1rem',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '0.75rem',
    },
    aiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.75rem',
    },
    aiCard: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.6rem',
        padding: '0.75rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.875rem',
        border: '1px solid #e2e8f0',
    },
    aiIcon: {
        fontSize: '1.4rem',
        width: '38px',
        height: '38px',
        backgroundColor: '#fff',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        flexShrink: 0,
    },
    aiContent: { display: 'flex', flexDirection: 'column' },
    aiCardTitle: {
        fontSize: '0.72rem',
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        marginBottom: '0.2rem',
    },
    aiValue: { fontSize: '0.95rem', fontWeight: '800' },

    /* Produits */
    productsSection: {},
    productsList: { display: 'flex', flexWrap: 'wrap', gap: '0.6rem' },
    productChip: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 0.75rem 0.4rem 0.4rem',
        backgroundColor: '#f1f5f9',
        borderRadius: '2rem',
        border: '1px solid #e2e8f0',
    },
    productChipImg: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        objectFit: 'cover',
        backgroundColor: '#fff',
        flexShrink: 0,
    },
    productChipName: { fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' },
    productChipBrand: { fontSize: '0.72rem', color: '#64748b' },
};

export default IngredientAnalyseModal;