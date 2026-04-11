// src/components/Home/HeroSection.jsx
import React, { useState } from 'react';

const SEARCH_TYPES = [
    { value: 'produit', label: 'Produit', placeholder: 'Tapez le nom du produit ' },
    { value: 'ingredient', label: 'Ingrédient', placeholder: 'Tapez le nom d\'un ingrédient ' },
];

const HeroSection = ({
    searchQuery,
    setSearchQuery,
    handleSearch,
    handleSearchResults,
    handleIngredientAnalysis,
}) => {
    const [searchType, setSearchType] = useState('produit');
    const [isLoading, setIsLoading] = useState(false);
    const [searchError, setSearchError] = useState('');

    const currentType = SEARCH_TYPES.find(t => t.value === searchType);

    const runSearch = async (e) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        setSearchError('');
        setIsLoading(true);

        try {
            if (searchType === 'ingredient') {
                // ── Recherche par ingrédient : appelle l'analyse de l'ingrédient ──
                const res = await fetch(
                    `http://localhost:5000/api/analyses/search/ingredient?q=${encodeURIComponent(query)}`
                );
                const data = await res.json();

                if (!res.ok || !data.results || data.results.length === 0) {
                    setSearchError(data.message || 'Aucun ingrédient trouvé.');
                } else {
                    // Passer les résultats au parent pour affichage modal ingrédient
                    if (typeof handleIngredientAnalysis === 'function') {
                        handleIngredientAnalysis(data.results, query);
                    }
                }
            } else {
                // ── Recherche par nom de produit ──
                const res = await fetch(
                    `http://localhost:5000/api/analyses/search/produit?q=${encodeURIComponent(query)}`
                );
                const data = await res.json();

                if (!res.ok || !data.results || data.results.length === 0) {
                    setSearchError(data.message || 'Aucun produit trouvé.');
                    // Fallback recherche locale
                    handleSearch(e);
                } else {
                    if (typeof handleSearchResults === 'function') {
                        handleSearchResults(data.results);
                    }
                }
            }
        } catch (err) {
            console.error('[HeroSection search error]', err);
            setSearchError('Erreur réseau. Recherche locale en cours…');
            handleSearch(e);
        } finally {
            setIsLoading(false);
            setTimeout(() => {
                document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 150);
        }
    };

    return (
        <section style={styles.hero}>
            <div style={styles.overlay} />

            <div style={styles.heroContent}>
                {/* ── Barre de recherche ── */}
                <div style={styles.searchWrapper}>

                    {/* Sélecteur de type */}
                    <div style={styles.typeSelector}>
                        {SEARCH_TYPES.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => {
                                    setSearchType(type.value);
                                    setSearchError('');
                                }}
                                style={{
                                    ...styles.typeBtn,
                                    ...(searchType === type.value ? styles.typeBtnActive : {})
                                }}
                            >
                                {type.value === 'produit'} {type.label}
                            </button>
                        ))}
                    </div>

                    {/* Champ de saisie */}
                    <form onSubmit={runSearch} style={styles.searchBox}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSearchError('');
                            }}
                            placeholder={currentType.placeholder}
                            style={styles.searchInput}
                            disabled={isLoading}
                        />
                        {searchQuery.trim() && !isLoading && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setSearchError(''); }}
                                style={styles.clearBtn}
                            >
                                ✕
                            </button>
                        )}
                        <button
                            type="submit"
                            style={{ ...styles.searchBtn, opacity: isLoading ? 0.7 : 1 }}
                            disabled={isLoading}
                        >
                            {isLoading ? '…' : 'Rechercher'}
                        </button>
                    </form>

                    {searchError && (
                        <p style={styles.searchError}>{searchError}</p>
                    )}
                </div>

                {/* ── Titre & sous-titre ── */}
                <h1 style={styles.heroTitle}>
                    Analysez vos produits{' '}
                    <span style={styles.highlight}>en un scan</span>
                </h1>
                <p style={styles.heroSubtitle}>
                    Découvrez la composition de vos aliments et faites des choix éclairés
                    pour votre santé et l'environnement.
                </p>

                <div style={styles.heroButtons}>
                    <button
                        style={styles.btnPrimary}
                        onClick={() =>
                            document.getElementById('scanner')?.scrollIntoView({ behavior: 'smooth' })
                        }
                    >
                        Commencer
                    </button>
                </div>
            </div>
        </section>
    );
};

const styles = {
    hero: {
        position: 'relative',
        height: '97vh',
        backgroundImage: "url('/back.jpg')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
    },
    overlay: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    heroContent: {
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
        maxWidth: '820px',
        padding: '0 1.5rem',
        gap: '1.25rem',
    },
    searchWrapper: { width: '100%' },
    typeSelector: {
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '0.6rem',
    },
    typeBtn: {
        padding: '0.4rem 1.1rem',
        borderRadius: '2rem',
        border: '1.5px solid rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(255,255,255,0.15)',
        color: 'white',
        cursor: 'pointer',
        fontSize: '0.88rem',
        fontWeight: '500',
        backdropFilter: 'blur(4px)',
        transition: 'all 0.2s ease',
    },
    typeBtnActive: {
        backgroundColor: '#16a34a',
        border: '1.5px solid #16a34a',
        boxShadow: '0 4px 12px rgba(22,163,74,0.4)',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: 'white',
        borderRadius: '3rem',
        padding: '0.5rem 0.5rem 0.5rem 1.25rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        width: '100%',
    },
    searchIcon: { fontSize: '1.1rem', flexShrink: 0 },
    searchInput: {
        flex: 1,
        border: 'none',
        outline: 'none',
        fontSize: '1rem',
        color: '#1f2937',
        backgroundColor: 'transparent',
        minWidth: 0,
    },
    clearBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#9ca3af',
        fontSize: '1rem',
        padding: '0 0.25rem',
        flexShrink: 0,
    },
    searchBtn: {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#16a34a',
        color: 'white',
        border: 'none',
        borderRadius: '2rem',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.95rem',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: 'opacity 0.2s',
    },
    searchError: {
        marginTop: '0.5rem',
        fontSize: '0.85rem',
        color: 'rgba(255,220,100,0.95)',
        textAlign: 'center',
    },
    heroTitle: {
        fontSize: '2.75rem',
        fontWeight: '800',
        color: 'white',
        lineHeight: 1.2,
        margin: 0,
    },
    highlight: { color: '#4ade80' },
    heroSubtitle: {
        fontSize: '1.1rem',
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 1.7,
        margin: 0,
    },
    heroButtons: { display: 'flex', gap: '1rem' },
    btnPrimary: {
        padding: '0.875rem 2rem',
        borderRadius: '0.5rem',
        border: 'none',
        backgroundColor: '#16a34a',
        color: 'white',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '1rem',
    },
};

export default HeroSection;