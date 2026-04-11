// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import Navbar from '../components/Home/Navbar';
import HeroSection from '../components/Home/HeroSection';
import ScannerSection from '../components/Home/ScannerSection';
import ProductsSection from '../components/Home/ProductsSection';
import Footer from '../components/Home/Footer';
import Chatbot from '../components/Home/Chatbot';

import IngredientAnalyseModal from '../components/modals/IngredientAnalyseModal';

import useFavorites from '../hooks/useFavorites';
import useHistory from '../hooks/useHistory';
import useComments from '../hooks/useComments';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isConsommateur = user?.role === 'consommateur';

  // ── Produits ───────────────────────────────────────────────────────────────
  const [allProducts, setAllProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [scanError, setScanError] = useState(false);

  const [ingredientModal, setIngredientModal] = useState(null);

  // ── Hooks consommateur ─────────────────────────────────────────────────────
  const { favorites, isFavorite, addFavorite } = useFavorites(user?.id, user?.role);
  const { addToHistory } = useHistory(isConsommateur ? user?.id : null);
  const { getProductComments, getAverageRating, addComment, editComment, deleteComment } = useComments();

  // ── Redirection admin ──────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.role === 'administrateur') {
      navigate('/dashboard/AdminDashboard', { replace: true });
    }
  }, [user, navigate]);

  // ── Chargement produits ────────────────────────────────────────────────────
  useEffect(() => {
    const cached = localStorage.getItem('cached_produits');
    if (cached) {
      const parsed = JSON.parse(cached);
      setAllProducts(parsed);
      if (!searchQuery.trim()) setDisplayProducts(parsed);
    }

    fetch('http://localhost:5000/api/produits?status=approved')
      .then(res => res.json())
      .then(data => {
        setAllProducts(data);
        localStorage.setItem('cached_produits', JSON.stringify(data));
        setSearchQuery(currentQuery => {
          if (!currentQuery.trim()) setDisplayProducts(data);
          return currentQuery;
        });
      })
      .catch(() => console.log('API indisponible'));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) setDisplayProducts(allProducts);
  }, [searchQuery, allProducts]);

  // ── Recherche ──────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      setDisplayProducts(allProducts);
      return;
    }

    const results = allProducts.filter(
      (p) =>
        p.nom?.toLowerCase().includes(query) ||
        p.name?.toLowerCase().includes(query) ||
        p.titre?.toLowerCase().includes(query) ||
        p.libelle?.toLowerCase().includes(query)
    );

    setDisplayProducts(results);

    if (isConsommateur && results.length > 0) {
      addToHistory(searchQuery.trim());
    }
  };

  // ── Recherche par résultats directs ────────────────────────────────────────
  const handleSearchResults = (results) => {
    setDisplayProducts(results);
  };

  // ── Analyse ingrédient ─────────────────────────────────────────────────────
  const handleIngredientAnalysis = (ingredientName) => {
    const products = allProducts.filter(p =>
      p.ingredients?.some(i =>
        i.nom?.toLowerCase().includes(ingredientName.toLowerCase())
      )
    );
    setIngredientModal({ name: ingredientName, products });
  };

  // ── Recherche par Scan ─────────────────────────────────────────────────────
  const handleBarcodeScan = async () => {
    setScanError(false);
    const query = barcode.trim();
    if (!query) return;

    const found = allProducts.find(
      (p) => p.code_barre === query || p.codeBarres === query || (p.nom && p.nom.toLowerCase() === query.toLowerCase())
    );

    if (found) {
      try {
        const response = await fetch('http://localhost:5000/api/analyses/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nb_ingredients: found.ingredients ? found.ingredients.length : 0,
            ingredients_text: found.description || found.nom || '',
            contains_preservatives: found.ingredients?.some(i => i.nom.toLowerCase().includes('conserv')) ? 1 : 0,
            contains_artificial_colors: found.ingredients?.some(i => i.nom.toLowerCase().includes('coloran')) ? 1 : 0,
            contains_flavouring: found.ingredients?.some(i => i.nom.toLowerCase().includes('arôm')) ? 1 : 0,
            nova_group: found.nova_group || 3,
            nutriscore_num: found.nutriscore || 0,
            nb_e_numbers: found.ingredients?.filter(i => i.nom.match(/E\d{3}/i)).length || 0,
            ingredients_length: found.ingredients ? found.ingredients.length : 0
          })
        });

        const data = await response.json();

        const productWithAI = {
          ...found,
          ai_predictions: data.predictions || {}
        };

        setScannedProduct(productWithAI);

        if (isConsommateur) {
          addToHistory(query);
        }
      } catch (err) {
        console.error("Erreur lors de l'appel à l'IA :", err);
        setScannedProduct(found);
      }
    } else {
      setScannedProduct(null);
      setScanError(true);
    }
  };

  const handleOpenComments = (product) => {
    navigate('/commentaires', { state: { product } });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div>
      <Navbar
        user={user}
        favoritesCount={isConsommateur ? favorites.length : 0}
        onFavoritesClick={() => navigate('/favoris')}
        onHistoryClick={() => navigate('/historique')}
        onProfileClick={() => navigate('/profil')}
        onLogout={handleLogout}
      />

      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        handleSearchResults={handleSearchResults}
        handleIngredientAnalysis={handleIngredientAnalysis}
      />

      <ScannerSection
        barcode={barcode}
        setBarcode={(val) => {
          setBarcode(val);
          setScanError(false);
          if (val === '') setScannedProduct(null);
        }}
        handleBarcodeScan={handleBarcodeScan}
        scannedProduct={scannedProduct}
        scanError={scanError}
      />

      <ProductsSection
        displayProducts={displayProducts}
        user={user}
        handleAddFavorite={addFavorite}
        handleOpenComments={handleOpenComments}
        isFavorite={isFavorite}
        getAverageRating={getAverageRating}
        getProductComments={getProductComments}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {isConsommateur && <Chatbot user={user} addToHistory={addToHistory} />}

      <Footer />

      {ingredientModal && (
        <IngredientAnalyseModal
          ingredientName={ingredientModal.name}
          products={ingredientModal.products}
          onClose={() => setIngredientModal(null)}
        />
      )}
    </div>
  );
};

export default Home;