import React from 'react';
import ProductCard from './ProductCard';

const ProductsSection = ({
    displayProducts = [],
    searchQuery = '',
    isFavorite = () => false,
    handleAddFavorite = () => { },
    handleOpenComments = () => { },
    getAverageRating = () => 0,
    getProductComments = () => [],
    getScoreColor = () => '#000',
    getRiskColor = () => '#000',
    setSearchQuery = () => { }
}) => {
    const safeSearchQuery = searchQuery ? searchQuery.toString() : '';

    return (
        <section id="products-section" style={styles.section}>
            <div style={styles.container}>
                <h2 style={styles.sectionTitle}>
                    {safeSearchQuery.trim() ? '🔍 Résultats' : '🛒 Produits Populaires'}
                </h2>

                {displayProducts.length === 0 ? (
                    <div style={styles.noResults}>
                        <span style={{ fontSize: '4rem' }}>🔍</span>
                        <h3>Aucun produit trouvé</h3>
                        <button onClick={() => setSearchQuery('')} style={styles.btnGreen}>
                            Voir tous les produits
                        </button>
                    </div>
                ) : (
                    <div style={styles.productsGrid}>
                        {displayProducts.map((produit) => (
                            <ProductCard
                                key={produit.id_produit}
                                produit={produit}
                                onFavorite={() => handleAddFavorite(produit)}
                                onComment={() => handleOpenComments(produit)}
                                isFavorite={isFavorite(produit.id_produit)}
                                averageRating={getAverageRating(produit.id_produit)}
                                commentCount={getProductComments(produit.id_produit).length}
                                getScoreColor={getScoreColor}
                                getRiskColor={getRiskColor}
                                // ✅ NOUVEAU : passer la localisation à ProductCard
                                localisation={produit.localisation}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
    section: { padding: '4rem 1.5rem', backgroundColor: '#fff' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' },
    sectionTitle: { fontSize: '2rem', fontWeight: '700', color: '#1f2937', textAlign: 'center', marginBottom: '2.5rem' },
    productsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' },
    noResults: { textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb', borderRadius: '1rem', border: '2px dashed #e5e7eb' },
    btnGreen: { padding: '0.75rem 1.5rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', marginTop: '1rem' },
};

export default ProductsSection;

/*
  ════════════════════════════════════════════════════════════
  ✅ MODIFICATION À FAIRE DANS ProductCard.jsx
  ════════════════════════════════════════════════════════════

  Dans ProductCard, ajouter la prop `localisation` et afficher
  le lien Google Maps si lat/lng sont disponibles.

  Exemple — ajouter dans le JSX de ProductCard :

  const ProductCard = ({ produit, localisation, ...autresProps }) => {

    const mapsUrl = localisation?.lat && localisation?.lng
      ? `https://www.google.com/maps?q=${localisation.lat},${localisation.lng}`
      : null;

    return (
      <div style={cardStyles.card}>
        ...votre contenu existant...

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              marginTop: '10px',
              color: '#1976D2',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            🗺️ Voir le point de vente
          </a>
        )}
      </div>
    );
  };
*/
