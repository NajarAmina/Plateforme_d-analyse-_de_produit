// src/components/HeroSection.jsx
import React from 'react';

const HeroSection = () => (
    <section style={styles.hero}>
        <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>
                Analysez vos produits <span style={styles.highlight}>en un scan</span>
            </h1>
            <p style={styles.heroSubtitle}>
                Découvrez la composition de vos aliments et faites des choix éclairés
                pour votre santé et l'environnement.
            </p>
            <div style={styles.heroButtons}>
                <button
                    style={styles.btnPrimary}
                    onClick={() =>
                        document.getElementById('search').scrollIntoView({ behavior: 'smooth' })
                    }
                >
                    Commencer
                </button>
                
            </div>
        </div>
    </section>
);

const styles = {
    hero: {
        position: 'relative',
        height: '70vh',
        backgroundImage: "url('/back.jpg')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',   // ❌ corrigé : backgrounAttachement → backgroundAttachment
        display: 'flex',                 // ❌ ajouté les quotes
        alignItems: 'center',            // ❌ ajouté les quotes
        justifyContent: 'center',        // ❌ corrigé : jutifyContent → justifyContent
        color: 'white',                  // ❌ ajouté les quotes
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
    },
    heroContent: {},
    heroTitle: {
        fontSize: '2.75rem',
        fontWeight: '800',
        color: '#1f2937',
        lineHeight: 1.2,
        marginBottom: '1rem',
    },
    highlight: { color: '#16a34a' },
    heroSubtitle: {
        fontSize: '1.1rem',
        color: '#000000',
        lineHeight: 1.7,
        marginBottom: '2rem',
    },
    heroButtons: { display: 'flex', gap: '1rem' },
    heroGraphic: { fontSize: '10rem', opacity: 0.75 },
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
    btnSecondary: {
        padding: '0.875rem 2rem',
        borderRadius: '0.5rem',
        border: '1px solid #d1d5db',
        backgroundColor: 'white',
        color: '#374151',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '1rem',
    },
};

export default HeroSection;