// src/components/Home/ScannerSection.jsx
import React, { useState } from 'react';
import ResultatAnalyse from '../Shared/ResultatAnalyse';

const ScannerSection = ({ barcode, setBarcode, handleBarcodeScan, scannedProduct, scanError }) => {
    const [focused, setFocused] = useState(false);

    return (
        <section id="scanner" style={styles.section}>
            {/* Décoration de fond moderne */}
            <div style={styles.bgBlobs}>
                <div style={styles.blob1} />
                <div style={styles.blob2} />
            </div>

            <div style={styles.container}>
                <div style={styles.twoColumns}>

                    {/* COLONNE GAUCHE : L'Analyseur */}
                    <div style={styles.leftColumn}>

                        {/* Header épuré */}
                        <div style={styles.header}>
                            <span style={styles.badge}>DÉCOUVERTE</span>
                            <h2 style={styles.title}>L'Analyseur</h2>
                            <p style={styles.subtitle}>
                                Tapez ou scannez le code-barres d'un produit pour révéler instantanément sa composition détaillée, son origine et son impact santé.
                            </p>
                        </div>

                        {/* Le Scanner Principal */}
                        <div style={styles.scannerInterface}>
                            <div style={{ ...styles.inputBox, boxShadow: focused ? '0 0 0 4px rgba(22, 163, 74, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <span style={styles.iconScan}>📟</span>
                                <input
                                    type="text"
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    placeholder="Tapez le code-barre de votre produit"
                                    style={styles.input}
                                />
                                <button
                                    onClick={handleBarcodeScan}
                                    style={{
                                        ...styles.btnAnalyze,
                                        opacity: barcode.length >= 3 ? 1 : 0.6,
                                        cursor: barcode.length >= 3 ? 'pointer' : 'not-allowed'
                                    }}
                                    disabled={barcode.length < 3}
                                >
                                    Analyser ⚡
                                </button>
                            </div>

                            {/* État : Erreur */}
                            {scanError && (
                                <div style={styles.errorBox}>
                                    <span style={styles.errorIcon}>⚠️</span>
                                    <div>
                                        <h4 style={styles.errorTitle}>Produit Introuvable</h4>
                                        <p style={styles.errorText}>Aucun produit correspondant n'a été trouvé. Vérifiez le code.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* État : Résultat de l'Analyse */}
                        {scannedProduct && (
                            <ResultatAnalyse product={scannedProduct} />
                        )}
                    </div>

                    {/* COLONNE DROITE : Background animé (vidéo ou image) */}
                    <div style={styles.rightColumn}>
                        <div style={styles.animatedBackgroundCard}>
                            <div style={styles.mediaWrapper}>
                                {/* Vidéo de démonstration (personne qui scanne) */}
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    src="/scan-demo.mp4"
                                    style={styles.demoVideo}
                                    poster="/scan-poster.jpg" // Image de fallback si la vidéo ne charge pas
                                />

                                {/* Overlay avec texte explicatif */}
                                <div style={styles.mediaOverlay}>
                                    <div style={styles.scanAnimationIcon}>
                                        <span style={styles.scanIcon}>📱</span>
                                        <div style={styles.scanLine}></div>
                                    </div>
                                    <p style={styles.mediaText}>
                                        Scannez n'importe quel produit avec votre smartphone
                                    </p>
                                </div>
                            </div>

                            {/* Option alternative si vous préférez une image animée GIF */}
                            {/* 
                            <div style={styles.mediaWrapper}>
                                <img 
                                    src="/scan-animation.gif" 
                                    alt="Personne scannant un produit avec son téléphone"
                                    style={styles.demoImage}
                                />
                                <div style={styles.mediaOverlay}>
                                    <p style={styles.mediaText}>
                                        Scannez n'importe quel produit avec votre smartphone
                                    </p>
                                </div>
                            </div>
                            */}
                        </div>
                    </div>

                </div>
            </div>

            {/* Ajout des animations CSS globales */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scanLineMove {
                    0% {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                }
            `}} />
        </section>
    );
};

const styles = {
    section: {
        position: 'relative',
        padding: '6rem 1.5rem',
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center'
    },
    bgBlobs: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none'
    },
    blob1: {
        position: 'absolute',
        top: '-10%', left: '-5%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%'
    },
    blob2: {
        position: 'absolute',
        bottom: '-10%', right: '-5%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%'
    },
    container: {
        position: 'relative',
        zIndex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
    },

    /* Différenciation des 2 colonnes */
    twoColumns: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4rem',
        alignItems: 'flex-start'
    },
    leftColumn: {
        flex: '1 1 500px',
        display: 'flex',
        flexDirection: 'column'
    },
    rightColumn: {
        flex: '1 1 450px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },

    /* Header Gauche */
    header: { textAlign: 'left', marginBottom: '2rem' },
    badge: {
        display: 'inline-block',
        padding: '0.4rem 1.2rem',
        backgroundColor: '#1f2937',
        color: '#fff',
        borderRadius: '2rem',
        fontSize: '0.75rem',
        letterSpacing: '0.1em',
        fontWeight: '700',
        marginBottom: '1rem',
    },
    title: {
        fontSize: '3rem',
        fontWeight: '800',
        color: '#0f172a',
        margin: '0 0 1rem 0',
        letterSpacing: '-1px'
    },
    subtitle: {
        fontSize: '1.05rem',
        color: '#64748b',
        maxWidth: '500px',
        margin: '0',
        lineHeight: 1.6,
    },

    /* Scanner Interface (Gauche) */
    scannerInterface: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    inputBox: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: '0.5rem 0.5rem 0.5rem 1.25rem',
        borderRadius: '100px',
        border: '1px solid #e2e8f0',
        transition: 'all 0.3s ease',
    },
    iconScan: { fontSize: '1.5rem', marginRight: '0.75rem', opacity: 0.7 },
    input: { flex: 1, border: 'none', outline: 'none', fontSize: '1.05rem', color: '#1e293b', letterSpacing: '0.05em' },
    btnAnalyze: {
        backgroundColor: '#16a34a', color: 'white', border: 'none',
        padding: '0.85rem 1.5rem', borderRadius: '100px', fontWeight: '700',
        fontSize: '1rem', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
        transition: 'all 0.2s',
    },

    errorBox: {
        display: 'flex', alignItems: 'center', gap: '1rem',
        backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444',
        padding: '1.25rem', borderRadius: '0.75rem', marginTop: '1rem'
    },
    errorIcon: { fontSize: '1.5rem' },
    errorTitle: { margin: '0 0 0.25rem 0', color: '#991b1b', fontSize: '1rem', fontWeight: '700' },
    errorText: { margin: 0, color: '#b91c1c', fontSize: '0.9rem' },



    /* Colonne Droite - Background animé */
    animatedBackgroundCard: {
        width: '100%',
        maxWidth: '500px',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        backgroundColor: '#000',
    },
    mediaWrapper: {
        position: 'relative',
        width: '100%',
        paddingTop: '75%', // Ratio 4:3 pour une meilleure visualisation
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    demoVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    demoImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    mediaOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))',
        padding: '2rem 1.5rem 1.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
    },
    scanAnimationIcon: {
        position: 'relative',
        width: '60px',
        height: '60px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
    },
    scanIcon: {
        fontSize: '2rem',
        zIndex: 2,
    },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: '2px',
        backgroundColor: '#16a34a',
        animation: 'scanLineMove 2s ease-in-out infinite',
        boxShadow: '0 0 10px #16a34a',
    },
    mediaText: {
        margin: 0,
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '500',
        textAlign: 'center',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    },
};

export default ScannerSection;