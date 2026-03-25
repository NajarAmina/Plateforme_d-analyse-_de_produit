import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  
  // États existants
  const [searchQuery, setSearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: 'Bonjour ! Je suis votre assistant BioScan. Comment puis-je vous aider ?' }
  ]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false); // 🔴 NOUVEL ÉTAT POUR LA MODAL FAVORIS
  const [showHistory, setShowHistory] = useState(false); // 🔴 NOUVEL ÉTAT POUR LA MODAL HISTORIQUE
  const [profileForm, setProfileForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    adresse: ''
  });
  const [displayProducts, setDisplayProducts] = useState([]);
  
  // 🔴 ÉTATS POUR LES COMMENTAIRES
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  
  const fileInputRef = useRef(null);

  // 🔴 DONNÉES PRODUITS
  const produitsExemples = [
    {
      id_produit: '1',
      nom: 'Lait Bio Premium',
      description: 'Lait entier biologique provenant de vaches nourries à l\'herbe',
      image: '🥛',
      code_barre: '3012345678901',
      origine: 'France',
      scoreBio: 95,
      risque: 'Faible'
    },
    {
      id_produit: '2',
      nom: 'Pommes Bio',
      description: 'Pommes Golden cultivées sans pesticides',
      image: '🍎',
      code_barre: '3012345678902',
      origine: 'France',
      scoreBio: 98,
      risque: 'Faible'
    },
    {
      id_produit: '3',
      nom: 'Pain Complet Bio',
      description: 'Pain au blé complet issu de l\'agriculture biologique',
      image: '🍞',
      code_barre: '3012345678903',
      origine: 'Belgique',
      scoreBio: 92,
      risque: 'Faible'
    },
    {
      id_produit: '4',
      nom: 'Jus d\'Orange Bio',
      description: 'Jus d\'orange pressé à froid, 100% pur jus',
      image: '🧃',
      code_barre: '3012345678904',
      origine: 'Espagne',
      scoreBio: 90,
      risque: 'Faible'
    }
  ];

  // 🔴 INITIALISATION
  useEffect(() => {
    setDisplayProducts(produitsExemples);
    if (user?.id) {
      const savedFavorites = localStorage.getItem(`favorites_${user.id}`);
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
      const savedHistory = localStorage.getItem(`history_${user.id}`);
      if (savedHistory) setSearchHistory(JSON.parse(savedHistory));
      const savedChat = localStorage.getItem(`chat_${user.id}`);
      if (savedChat) setChatHistory(JSON.parse(savedChat));
      // 🔴 Charger les commentaires
      const savedComments = localStorage.getItem('allComments');
      if (savedComments) setComments(JSON.parse(savedComments));
      setProfileForm({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        adresse: user.adresse || ''
      });
    } else {
      // Visiteurs peuvent aussi voir les commentaires
      const savedComments = localStorage.getItem('allComments');
      if (savedComments) setComments(JSON.parse(savedComments));
    }
  }, [user]);

  // 🔴 RECHERCHE PAR NOM
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setDisplayProducts(produitsExemples);
    } else {
      const filtered = produitsExemples.filter(produit =>
        produit.nom.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setDisplayProducts(filtered);
    }
  }, [searchQuery]);

  // 🔴 SAUVEGARDE AUTOMATIQUE
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favorites));
      localStorage.setItem(`history_${user.id}`, JSON.stringify(searchHistory));
      localStorage.setItem(`chat_${user.id}`, JSON.stringify(chatHistory));
    }
    // Sauvegarder tous les commentaires
    localStorage.setItem('allComments', JSON.stringify(comments));
  }, [favorites, searchHistory, chatHistory, comments, user]);

  // 🔴 REDIRECTION ADMIN
  useEffect(() => {
    if (user?.role === 'administrateur') {
      navigate('/dashboard/AdminDashboard', { replace: true });
    }
  }, [user, navigate]);

  // 🔴 FONCTIONS POUR LES COMMENTAIRES
  const getProductComments = (productId) => {
    return comments.filter(c => c.id_produit === productId);
  };

  const getAverageRating = (productId) => {
    const productComments = getProductComments(productId);
    if (productComments.length === 0) return 0;
    const sum = productComments.reduce((acc, c) => acc + c.note, 0);
    return (sum / productComments.length).toFixed(1);
  };

  const handleAddComment = (productId, productName) => {
    if (!user) {
      alert('Veuillez vous connecter pour ajouter un commentaire');
      navigate('/register');
      return;
    }
    if (!newComment.trim()) {
      alert('Veuillez écrire un commentaire');
      return;
    }
    const comment = {
      id: Date.now().toString(),
      id_produit: productId,
      nom_produit: productName,
      id_utilisateur: user.id,
      nom_utilisateur: `${user.prenom} ${user.nom}`,
      texte: newComment,
      note: newRating,
      date: new Date().toISOString(),
      dateModification: null
    };
    setComments([...comments, comment]);
    setNewComment('');
    setNewRating(5);
    alert('Commentaire ajouté avec succès !');
  };

  const handleEditComment = (commentId) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    if (comment.id_utilisateur !== user.id) {
      alert('Vous ne pouvez modifier que vos propres commentaires');
      return;
    }
    setEditingCommentId(commentId);
    setEditCommentText(comment.texte);
  };

  const handleSaveEdit = (commentId) => {
    if (!editCommentText.trim()) {
      alert('Le commentaire ne peut pas être vide');
      return;
    }
    const updatedComments = comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          texte: editCommentText,
          dateModification: new Date().toISOString()
        };
      }
      return c;
    });
    setComments(updatedComments);
    setEditingCommentId(null);
    setEditCommentText('');
    alert('Commentaire modifié avec succès !');
  };

  const handleDeleteComment = (commentId) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    if (comment.id_utilisateur !== user.id && user.role !== 'administrateur') {
      alert('Vous ne pouvez supprimer que vos propres commentaires');
      return;
    }
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      const updatedComments = comments.filter(c => c.id !== commentId);
      setComments(updatedComments);
      alert('Commentaire supprimé avec succès !');
    }
  };

  const openCommentsModal = (product) => {
    setSelectedProduct(product);
    setShowCommentsModal(true);
  };

  // 🔴 FONCTIONS POUR LES FAVORIS
  const removeFavorite = (productId) => {
    const updatedFavorites = favorites.filter(f => f.id_produit !== productId);
    setFavorites(updatedFavorites);
    if (user?.id) {
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(updatedFavorites));
    }
    alert('Produit retiré des favoris !');
  };

  const clearAllFavorites = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tous vos favoris ?')) {
      setFavorites([]);
      if (user?.id) {
        localStorage.removeItem(`favorites_${user.id}`);
      }
      alert('Tous les favoris ont été supprimés !');
    }
  };

  // 🔴 FONCTIONS POUR L'HISTORIQUE
  const removeHistoryItem = (historyId) => {
    const updatedHistory = searchHistory.filter((h) => h.id !== historyId);
    setSearchHistory(updatedHistory);
    if (user?.id) {
      localStorage.setItem(`history_${user.id}`, JSON.stringify(updatedHistory));
    }
  };

  const clearAllHistory = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tout votre historique ?')) {
      setSearchHistory([]);
      if (user?.id) {
        localStorage.removeItem(`history_${user.id}`);
      }
    }
  };

  const handleViewProduct = (product) => {
    // Ajouter la "consultation" à l'historique pour que la liste s'affiche quand on clique "Historique"
    if (product?.nom) {
      const newSearch = {
        id: Date.now(),
        query: product.nom,
        date: new Date().toISOString()
      };

      setSearchHistory((prev) => {
        const updatedHistory = [newSearch, ...prev].slice(0, 10);
        if (user?.id) {
          localStorage.setItem(`history_${user.id}`, JSON.stringify(updatedHistory));
        }
        return updatedHistory;
      });
    }

    setSearchQuery(product.nom);
    setTimeout(() => {
      document.getElementById('products-section')?.scrollIntoView({
        behavior: 'smooth'
      });
    }, 100);
  };

  // Handlers existants
  const handleLogout = () => {
    logout();
    if (user?.id) {
      localStorage.removeItem(`favorites_${user.id}`);
      localStorage.removeItem(`history_${user.id}`);
    }
    navigate('/');
  };

  const handleLoginClick = () => navigate('/login');
  const handleRegisterClick = () => navigate('/register');

  const handleProfileClick = () => {
    if (user) {
      setShowProfile(!showProfile);
    } else {
      navigate('/register');
    }
  };

  // 🔴 MODIFIÉ - OUVRE LA MODAL FAVORIS
  const handleFavoritesClick = () => {
    if (user) {
      setShowFavorites(true);
    } else {
      alert('Veuillez vous inscrire pour accéder aux favoris');
      navigate('/register');
    }
  };

  const handleHistoryClick = () => {
    if (user) {
      setShowHistory(true);
    } else {
      alert('Veuillez vous inscrire pour accéder à l\'historique');
      navigate('/register');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const newSearch = {
        id: Date.now(),
        query: searchQuery,
        date: new Date().toISOString()
      };
      const updatedHistory = [newSearch, ...searchHistory];
      setSearchHistory(updatedHistory);
      if (user?.id) {
        localStorage.setItem(`history_${user.id}`, JSON.stringify(updatedHistory));
      }
      setTimeout(() => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleBarcodeScan = () => {
    if (barcode.trim()) {
      const newSearch = {
        id: Date.now(),
        query: `Code-barre: ${barcode}`,
        date: new Date().toISOString()
      };
      const updatedHistory = [newSearch, ...searchHistory];
      setSearchHistory(updatedHistory);
      if (user?.id) {
        localStorage.setItem(`history_${user.id}`, JSON.stringify(updatedHistory));
      }
      alert(`Code-barre scanné: ${barcode}`);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`Image uploadée: ${file.name}`);
    }
  };

  const addToFavorites = (product) => {
    if (!user) {
      alert('Veuillez vous inscrire pour ajouter aux favoris');
      navigate('/register');
      return;
    }
    if (!favorites.find(f => f.id_produit === product.id_produit)) {
      const updatedFavorites = [...favorites, product];
      setFavorites(updatedFavorites);
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(updatedFavorites));
      alert(`${product.nom} ajouté aux favoris !`);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      alert('Veuillez vous inscrire pour utiliser le chatbot');
      navigate('/register');
      return;
    }
    if (chatMessage.trim()) {
      const newHistory = [...chatHistory, { sender: 'user', text: chatMessage }];
      setChatHistory(newHistory);
      localStorage.setItem(`chat_${user.id}`, JSON.stringify(newHistory));
      setTimeout(() => {
        const botResponse = [...newHistory, {
          sender: 'bot',
          text: 'Merci pour votre message. Je suis votre assistant BioScan.'
        }];
        setChatHistory(botResponse);
        localStorage.setItem(`chat_${user.id}`, JSON.stringify(botResponse));
      }, 1000);
      setChatMessage('');
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    updateUser(profileForm);
    alert('Profil mis à jour avec succès !');
    setShowProfile(false);
  };

  // Helpers UI
  const getRiskColor = (risque) => {
    const colors = {
      'faible': '#22c55e',
      'moyen': '#f97316',
      'élevé': '#ef4444'
    };
    return colors[risque?.toLowerCase()] || '#6b7280';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#f97316';
    return '#ef4444';
  };

  // Rendu des étoiles
  const renderStars = (rating, interactive = false, onRate = null) => {
    return (
      <div style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => interactive && onRate && onRate(star)}
            style={{
              ...styles.star,
              color: star <= rating ? '#fbbf24' : '#d1d5db',
              cursor: interactive ? 'pointer' : 'default',
              fontSize: '1.25rem'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      {/* 🔴 MODAL FAVORIS - NOUVEAU */}
      {showFavorites && user && (
        <div style={styles.modalOverlay} onClick={() => setShowFavorites(false)}>
          <div style={styles.favoritesModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>❤️ Mes Favoris</h2>
              <button onClick={() => setShowFavorites(false)} style={styles.closeBtn}>✕</button>
            </div>
            
            {favorites.length === 0 ? (
              <div style={styles.noFavorites}>
                <span style={styles.noFavoritesIcon}>🤍</span>
                <h3 style={styles.noFavoritesTitle}>Aucun favori</h3>
                <p style={styles.noFavoritesText}>
                  Ajoutez des produits à vos favoris pour les retrouver facilement !
                </p>
                <button
                  onClick={() => setShowFavorites(false)}
                  style={styles.btnBrowseProducts}
                >
                  🛒 Parcourir les produits
                </button>
              </div>
            ) : (
              <>
                <div style={styles.favoritesHeader}>
                  <span style={styles.favoritesCount}>{favorites.length} produit(s)</span>
                  <button onClick={clearAllFavorites} style={styles.btnClearAll}>
                    🗑️ Tout supprimer
                  </button>
                </div>
                
                <div style={styles.favoritesList}>
                  {favorites.map((product) => (
                    <div key={product.id_produit} style={styles.favoriteCard}>
                      <div style={styles.favoriteHeader}>
                        <span style={styles.favoriteEmoji}>{product.image}</span>
                        <div style={styles.favoriteInfo}>
                          <h3 style={styles.favoriteName}>{product.nom}</h3>
                          <p style={styles.favoriteOrigin}>📍 {product.origine}</p>
                        </div>
                        <button
                          onClick={() => removeFavorite(product.id_produit)}
                          style={styles.btnRemoveFavorite}
                          title="Retirer des favoris"
                        >
                          🗑️
                        </button>
                      </div>
                      
                      <div style={styles.favoriteStats}>
                        <div style={styles.favoriteStat}>
                          <span style={styles.favoriteStatLabel}>Score Bio</span>
                          <span style={{
                            ...styles.favoriteStatValue,
                            backgroundColor: getScoreColor(product.scoreBio)
                          }}>
                            {product.scoreBio}
                          </span>
                        </div>
                        <div style={styles.favoriteStat}>
                          <span style={styles.favoriteStatLabel}>Risque</span>
                          <span style={{
                            ...styles.favoriteStatValue,
                            color: getRiskColor(product.risque)
                          }}>
                            {product.risque}
                          </span>
                        </div>
                        <div style={styles.favoriteStat}>
                          <span style={styles.favoriteStatLabel}>Note</span>
                          <div style={styles.favoriteRating}>
                            <span style={styles.favoriteRatingScore}>
                              {getAverageRating(product.id_produit)}
                            </span>
                            {renderStars(Math.round(getAverageRating(product.id_produit)))}
                          </div>
                        </div>
                      </div>
                      
                      <div style={styles.favoriteActions}>
                        <button
                          onClick={() => {
                            setShowFavorites(false);
                            openCommentsModal(product);
                          }}
                          style={styles.btnFavoriteComments}
                        >
                          💬 Voir les avis
                        </button>
                        <button
                          onClick={() => {
                            setShowFavorites(false);
                            handleViewProduct(product);
                          }}
                          style={styles.btnFavoriteView}
                        >
                          👁️ Voir le produit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 🔴 MODAL HISTORIQUE - NOUVEAU */}
      {showHistory && user && (
        <div style={styles.modalOverlay} onClick={() => setShowHistory(false)}>
          <div style={styles.historyModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📋 Mon Historique</h2>
              <button onClick={() => setShowHistory(false)} style={styles.closeBtn}>✕</button>
            </div>

            {searchHistory.length === 0 ? (
              <div style={styles.noHistory}>
                <span style={styles.noHistoryIcon}>🕘</span>
                <h3 style={styles.noHistoryTitle}>Aucun historique</h3>
                <p style={styles.noHistoryText}>
                  Faites une recherche ou consultez un produit pour voir l’historique ici.
                </p>
                <button
                  onClick={() => {
                    setShowHistory(false);
                    setTimeout(() => {
                      document.getElementById('search')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  style={styles.btnBrowseProducts}
                >
                  🔍 Rechercher un produit
                </button>
              </div>
            ) : (
              <>
                <div style={styles.historyHeader}>
                  <span style={styles.historyCount}>{searchHistory.length} recherche(s)</span>
                  <button onClick={clearAllHistory} style={styles.btnClearAll}>
                    🗑️ Tout supprimer
                  </button>
                </div>

                <div style={styles.historyItems}>
                  {searchHistory.map((h) => (
                    <div key={h.id} style={styles.historyItem}>
                      <div style={styles.historyItemMain}>
                        <div style={styles.historyItemQuery}>{h.query}</div>
                        <div style={styles.historyItemDate}>
                          {h.date ? new Date(h.date).toLocaleString('fr-FR') : ''}
                        </div>
                      </div>
                      <div style={styles.historyItemActions}>
                        <button
                          onClick={() => {
                            setShowHistory(false);
                            setSearchQuery(h.query);
                            setTimeout(() => {
                              document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          style={styles.btnHistoryUse}
                          title="Relancer la recherche"
                        >
                          🔍
                        </button>
                        <button
                          onClick={() => removeHistoryItem(h.id)}
                          style={styles.btnHistoryDelete}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL PROFIL */}
      {showProfile && user && (
        <div style={styles.modalOverlay} onClick={() => setShowProfile(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>👤 Mon Profil</h2>
              <button onClick={() => setShowProfile(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleProfileUpdate} style={styles.profileForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Prénom</label>
                <input
                  type="text"
                  value={profileForm.prenom}
                  onChange={(e) => setProfileForm({...profileForm, prenom: e.target.value})}
                  style={styles.formInput}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nom</label>
                <input
                  type="text"
                  value={profileForm.nom}
                  onChange={(e) => setProfileForm({...profileForm, nom: e.target.value})}
                  style={styles.formInput}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  style={styles.formInput}
                  required
                />
              </div>
              {user.role === 'consommateur' && (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Adresse</label>
                  <input
                    type="text"
                    value={profileForm.adresse}
                    onChange={(e) => setProfileForm({...profileForm, adresse: e.target.value})}
                    style={styles.formInput}
                    placeholder="Votre adresse"
                  />
                </div>
              )}
              <div style={styles.profileInfo}>
                <p><strong>Rôle:</strong> {user.role}</p>
                <p><strong>Membre depuis:</strong> {new Date().toLocaleDateString()}</p>
              </div>
              <button type="submit" style={styles.btnSave}>
                💾 Enregistrer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🔴 MODAL COMMENTAIRES */}
      {showCommentsModal && selectedProduct && (
        <div style={styles.modalOverlay} onClick={() => setShowCommentsModal(false)}>
          <div style={styles.commentsModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                💬 Commentaires - {selectedProduct.nom}
              </h2>
              <button onClick={() => setShowCommentsModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            {/* Note moyenne */}
            <div style={styles.averageRating}>
              <span style={styles.averageScore}>{getAverageRating(selectedProduct.id_produit)}</span>
              {renderStars(Math.round(getAverageRating(selectedProduct.id_produit)))}
              <span style={styles.totalComments}>
                ({getProductComments(selectedProduct.id_produit).length} avis)
              </span>
            </div>
            {/* Formulaire d'ajout */}
            {user && user.role === 'consommateur' && (
              <div style={styles.addCommentForm}>
                <h3 style={styles.formTitle}>Ajouter un commentaire</h3>
                <div style={styles.ratingSelector}>
                  <label>Votre note : </label>
                  {renderStars(newRating, true, setNewRating)}
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Partagez votre expérience sur ce produit..."
                  style={styles.commentTextarea}
                  rows="3"
                />
                <button
                  onClick={() => handleAddComment(selectedProduct.id_produit, selectedProduct.nom)}
                  style={styles.btnSubmitComment}
                >
                  Publier mon avis
                </button>
              </div>
            )}
            {/* Liste des commentaires */}
            <div style={styles.commentsList}>
              <h3 style={styles.formTitle}>
                {getProductComments(selectedProduct.id_produit).length} commentaire(s)
              </h3>
              {getProductComments(selectedProduct.id_produit).length === 0 ? (
                <p style={styles.noComment}>Soyez le premier à donner votre avis !</p>
              ) : (
                getProductComments(selectedProduct.id_produit)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((comment) => (
                    <div key={comment.id} style={styles.commentCard}>
                      <div style={styles.commentHeader}>
                        <div style={styles.commentAuthor}>
                          <span style={styles.authorName}>{comment.nom_utilisateur}</span>
                          {renderStars(comment.note)}
                        </div>
                        <div style={styles.commentDate}>
                          {new Date(comment.date).toLocaleDateString('fr-FR')}
                          {comment.dateModification && (
                            <span style={styles.editedBadge}> (modifié)</span>
                          )}
                        </div>
                      </div>
                      <p style={styles.commentText}>
                        {editingCommentId === comment.id ? (
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            style={styles.editTextarea}
                            rows="2"
                          />
                        ) : (
                          comment.texte
                        )}
                      </p>
                      {editingCommentId === comment.id ? (
                        <div style={styles.commentActions}>
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            style={styles.btnSaveEdit}
                          >
                            ✓ Enregistrer
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            style={styles.btnCancelEdit}
                          >
                            ✕ Annuler
                          </button>
                        </div>
                      ) : (
                        user && (comment.id_utilisateur === user.id || user.role === 'administrateur') && (
                          <div style={styles.commentActions}>
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              style={styles.btnEdit}
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              style={styles.btnDelete}
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.navContainer}>
          <div style={styles.logo} onClick={() => navigate('/')}>
            <span style={styles.logoIcon}>🌿</span>
            <span style={styles.logoText}>BioScan</span>
          </div>
          <div style={styles.navLinks}>
            <button style={styles.navLink} onClick={handleFavoritesClick}>
              ❤️ Favoris {favorites.length > 0 && `(${favorites.length})`}
            </button>
            <button style={styles.navLink} onClick={handleHistoryClick}>
              📋 Historique
            </button>
          </div>
          <div style={styles.navActions}>
            {user ? (
              <>
                <button style={styles.btnProfile} onClick={handleProfileClick}>
                  👤 Mon Profil
                </button>
                <button style={styles.btnLogout} onClick={handleLogout}>
                  🚪 Déconnexion
                </button>
              </>
            ) : (
              <>
                <button style={styles.btnLogin} onClick={handleLoginClick}>Connexion</button>
                <button style={styles.btnRegister} onClick={handleRegisterClick}>Inscription</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
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
              onClick={() => document.getElementById('search').scrollIntoView({behavior: 'smooth'})}
            >
              Commencer
            </button>
            <button style={styles.btnSecondary}>En savoir plus</button>
          </div>
        </div>
        <div style={styles.heroImage}>
          <div style={styles.heroGraphic}>🔍</div>
        </div>
      </section>

      {/* SEARCH SECTION */}
      <section id="search" style={styles.section}>
        <div style={styles.sectionContainer}>
          <h2 style={styles.sectionTitle}>Rechercher un produit</h2>
          <form onSubmit={handleSearch} style={styles.searchBox}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom du produit (ex: Lait, Pommes, Pain...)"
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchBtn}>🔍 Rechercher</button>
          </form>
          {searchQuery.trim() !== '' && (
            <div style={styles.searchResults}>
              <p style={{
                ...styles.resultsCount,
                color: displayProducts.length > 0 ? '#16a34a' : '#ef4444'
              }}>
                {displayProducts.length > 0
                  ? `✅ ${displayProducts.length} produit(s) trouvé(s)`
                  : '❌ Aucun produit trouvé'}
              </p>
              <button
                onClick={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
              >
                ✕ Effacer
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SCANNER SECTION */}
      <section style={styles.sectionAlt}>
        <div style={styles.sectionContainer}>
          <h2 style={styles.sectionTitle}>Scanner un produit</h2>
          <div style={styles.scannerGrid}>
            <div style={styles.scannerCard}>
              <div style={styles.scannerIcon}>📱</div>
              <h3 style={styles.scannerTitle}>Code-barre</h3>
              <p style={styles.scannerText}>Scannez ou entrez le code-barre du produit</p>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="3012345678901"
                style={styles.scannerInput}
              />
              <button onClick={handleBarcodeScan} style={styles.btnScanner}>Scanner</button>
            </div>
            <div style={styles.scannerCard}>
              <div style={styles.scannerIcon}>📷</div>
              <h3 style={styles.scannerTitle}>Photo Ingrédients</h3>
              <p style={styles.scannerText}>Prenez en photo la liste des ingrédients</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{display: 'none'}}
              />
              <button onClick={() => fileInputRef.current?.click()} style={styles.btnScannerAlt}>
                📸 Prendre une photo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 🔴 PRODUCTS SECTION */}
      <section id="products-section" style={styles.section}>
        <div style={styles.sectionContainer}>
          <h2 style={styles.sectionTitle}>
            {searchQuery.trim() === '' ? '🛒 Produits Populaires' : '🔍 Résultats de la recherche'}
          </h2>
          {displayProducts.length === 0 ? (
            <div style={styles.noResults}>
              <span style={styles.noResultsIcon}>🔍</span>
              <h3 style={styles.noResultsTitle}>Aucun produit trouvé</h3>
              <p style={styles.noResultsText}>
                Essayez avec un autre nom de produit (ex: Lait, Pommes, Pain, Jus)
              </p>
              <button
                onClick={() => setSearchQuery('')}
                style={styles.btnReset}
              >
                Voir tous les produits
              </button>
            </div>
          ) : (
            <div style={styles.productsGrid}>
              {displayProducts.map((produit) => (
                <div key={produit.id_produit} style={styles.productCard}>
                  <div style={styles.productHeader}>
                    <span style={styles.productEmoji}>{produit.image}</span>
                    <span style={styles.bioBadge}>BIO</span>
                  </div>
                  <h3 style={styles.productName}>{produit.nom}</h3>
                  <p style={styles.productDesc}>{produit.description}</p>
                  <div style={styles.productStats}>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Score Bio</span>
                      <span style={{
                        ...styles.statValue,
                        backgroundColor: getScoreColor(produit.scoreBio)
                      }}>
                        {produit.scoreBio}
                      </span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>Risque</span>
                      <span style={{
                        ...styles.statValue,
                        color: getRiskColor(produit.risque)
                      }}>
                        {produit.risque}
                      </span>
                    </div>
                  </div>
                  {/* 🔴 NOTE MOYENNE */}
                  <div style={styles.productRating}>
                    <span style={styles.ratingScore}>{getAverageRating(produit.id_produit)}</span>
                    {renderStars(Math.round(getAverageRating(produit.id_produit)))}
                    <span style={styles.ratingCount}>
                      ({getProductComments(produit.id_produit).length})
                    </span>
                  </div>
                  <div style={styles.productOrigin}>📍 {produit.origine}</div>
                  <div style={styles.productActions}>
                    <button
                      onClick={() => addToFavorites(produit)}
                      style={styles.btnFavorite}
                    >
                      ❤️ Favoris
                    </button>
                    <button
                      onClick={() => openCommentsModal(produit)}
                      style={styles.btnComments}
                    >
                      💬 Avis ({getProductComments(produit.id_produit).length})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CHATBOT SECTION */}
      <section style={styles.sectionAlt}>
        <div style={styles.sectionContainer}>
          <h2 style={styles.sectionTitle}>Assistant Intelligent</h2>
          <div style={styles.chatbotBox}>
            <div style={styles.chatbotHeader}>
              <div style={styles.chatbotTitle}>
                <span>🤖</span><span>BioScan Assistant</span>
              </div>
              <span style={styles.onlineStatus}>● En ligne</span>
            </div>
            <div style={styles.chatMessages}>
              {chatHistory.map((msg, idx) => (
                <div key={idx} style={msg.sender === 'bot' ? styles.botMsg : styles.userMsg}>
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} style={styles.chatInputBox}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={user ? "Posez votre question..." : "Connectez-vous pour chatter"}
                style={styles.chatInput}
                disabled={!user}
              />
              <button
                type="submit"
                style={{
                  ...styles.chatSendBtn,
                  opacity: !user ? 0.5 : 1,
                  cursor: !user ? 'not-allowed' : 'pointer'
                }}
                disabled={!user}
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerGrid}>
            <div>
              <h3 style={styles.footerTitle}>🌿 BioScan</h3>
              <p style={styles.footerText}>Votre partenaire pour une alimentation saine et transparente.</p>
            </div>
            <div>
              <h4 style={styles.footerSubtitle}>Liens</h4>
              <ul style={styles.footerLinks}>
                <li><a href="#!" style={styles.footerLink}>Accueil</a></li>
                <li><a href="#!" style={styles.footerLink}>Produits</a></li>
                <li><a href="#!" style={styles.footerLink}>Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 style={styles.footerSubtitle}>Contact</h4>
              <p style={styles.footerText}>📧 contact@bioscan.com</p>
              <p style={styles.footerText}>📞 +33 1 23 45 67 89</p>
            </div>
          </div>
          <div style={styles.footerBottom}>
            <p>&copy; 2026 BioScan. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// 🎨 CSS STYLES
const styles = {
  page: { minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: '"Segoe UI", system-ui, sans-serif' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' },
  commentsModalContent: { backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', width: '90%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' },
  // 🔴 Styles pour les favoris
  favoritesModalContent: { backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', width: '90%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto' },
  // 🔴 Styles pour l'historique
  historyModalContent: { backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', width: '90%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto' },
  noHistory: { textAlign: 'center', padding: '3rem 2rem', backgroundColor: '#f9fafb', borderRadius: '1rem', border: '2px dashed #e5e7eb', marginTop: '1rem' },
  noHistoryIcon: { fontSize: '4rem', display: 'block', marginBottom: '1rem' },
  noHistoryTitle: { fontSize: '1.5rem', color: '#1f2937', marginBottom: '0.5rem' },
  noHistoryText: { fontSize: '1rem', color: '#6b7280', marginBottom: '1.5rem' },
  historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem' },
  historyCount: { fontSize: '1rem', fontWeight: '600', color: '#16a34a' },
  historyItems: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  historyItem: { padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
  historyItemMain: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 0 },
  historyItemQuery: { fontSize: '1.05rem', fontWeight: '600', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  historyItemDate: { fontSize: '0.875rem', color: '#6b7280' },
  historyItemActions: { display: 'flex', gap: '0.5rem' },
  btnHistoryUse: { width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer', fontSize: '1rem' },
  btnHistoryDelete: { width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', border: '1px solid #fecaca', backgroundColor: '#fef2f2', cursor: 'pointer', fontSize: '1rem' },
  noFavorites: { textAlign: 'center', padding: '3rem 2rem', backgroundColor: '#f9fafb', borderRadius: '1rem', border: '2px dashed #e5e7eb', marginTop: '1rem' },
  noFavoritesIcon: { fontSize: '4rem', display: 'block', marginBottom: '1rem' },
  noFavoritesTitle: { fontSize: '1.5rem', color: '#1f2937', marginBottom: '0.5rem' },
  noFavoritesText: { fontSize: '1rem', color: '#6b7280', marginBottom: '1.5rem' },
  btnBrowseProducts: { padding: '0.75rem 1.5rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' },
  favoritesHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem' },
  favoritesCount: { fontSize: '1rem', fontWeight: '600', color: '#16a34a' },
  btnClearAll: { padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500', fontSize: '0.875rem' },
  favoritesList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  favoriteCard: { padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb', transition: 'transform 0.2s, box-shadow 0.2s' },
  favoriteHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  favoriteEmoji: { fontSize: '2.5rem', marginRight: '1rem' },
  favoriteInfo: { flex: 1 },
  favoriteName: { fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' },
  favoriteOrigin: { fontSize: '0.875rem', color: '#6b7280' },
  btnRemoveFavorite: { padding: '0.5rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', opacity: 0.7, transition: 'opacity 0.2s' },
  favoriteStats: { display: 'flex', gap: '1.5rem', marginBottom: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem' },
  favoriteStat: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  favoriteStatLabel: { fontSize: '0.75rem', color: '#6b7280' },
  favoriteStatValue: { padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.875rem', backgroundColor: '#22c55e', color: 'white', display: 'inline-block' },
  favoriteRating: { display: 'flex', alignItems: 'center', gap: '0.25rem' },
  favoriteRatingScore: { fontSize: '1rem', fontWeight: '700', color: '#fbbf24' },
  favoriteActions: { display: 'flex', gap: '0.5rem' },
  btnFavoriteComments: { flex: 1, padding: '0.625rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' },
  btnFavoriteView: { flex: 1, padding: '0.625rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  modalTitle: { fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' },
  profileForm: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  formLabel: { fontSize: '0.875rem', fontWeight: '500', color: '#374151' },
  formInput: { padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none' },
  profileInfo: { padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#6b7280' },
  btnSave: { padding: '0.875rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' },
  averageRating: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', marginBottom: '1.5rem' },
  averageScore: { fontSize: '2.5rem', fontWeight: '700', color: '#fbbf24' },
  totalComments: { fontSize: '0.875rem', color: '#6b7280' },
  stars: { display: 'flex', gap: '0.25rem' },
  star: { transition: 'transform 0.2s' },
  addCommentForm: { padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', marginBottom: '1.5rem' },
  formTitle: { fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' },
  ratingSelector: { marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  commentTextarea: { width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'vertical', marginBottom: '0.75rem', outline: 'none' },
  btnSubmitComment: { padding: '0.75rem 1.5rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' },
  commentsList: { marginTop: '1rem' },
  noComment: { textAlign: 'center', color: '#6b7280', padding: '2rem', fontStyle: 'italic' },
  commentCard: { padding: '1.25rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #e5e7eb' },
  commentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' },
  commentAuthor: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  authorName: { fontWeight: '600', color: '#1f2937' },
  commentDate: { fontSize: '0.75rem', color: '#6b7280' },
  editedBadge: { fontStyle: 'italic', fontSize: '0.7rem' },
  commentText: { fontSize: '0.875rem', color: '#374151', lineHeight: '1.6', marginBottom: '0.75rem' },
  editTextarea: { width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem', resize: 'vertical' },
  commentActions: { display: 'flex', gap: '0.5rem' },
  btnEdit: { padding: '0.375rem 0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500' },
  btnDelete: { padding: '0.375rem 0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500' },
  btnSaveEdit: { padding: '0.375rem 0.75rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500' },
  btnCancelEdit: { padding: '0.375rem 0.75rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500' },
  productRating: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: '#fffbeb', borderRadius: '0.375rem' },
  ratingScore: { fontSize: '1.25rem', fontWeight: '700', color: '#fbbf24' },
  ratingCount: { fontSize: '0.75rem', color: '#6b7280' },
  navbar: { backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  navContainer: { maxWidth: '1200px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '700', fontSize: '1.5rem' },
  logoIcon: { fontSize: '1.75rem' },
  logoText: { color: '#16a34a' },
  navLinks: { display: 'flex', gap: '1.5rem' },
  navLink: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', color: '#4b5563', fontWeight: '500' },
  navActions: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  btnLogin: { padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #16a34a', backgroundColor: 'white', color: '#16a34a', cursor: 'pointer', fontWeight: '500' },
  btnRegister: { padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: '500' },
  btnProfile: { padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '500' },
  btnLogout: { padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '500' },
  hero: { maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' },
  heroTitle: { fontSize: '3rem', fontWeight: '800', color: '#1f2937', lineHeight: '1.2', marginBottom: '1rem' },
  highlight: { color: '#16a34a' },
  heroSubtitle: { fontSize: '1.125rem', color: '#6b7280', lineHeight: '1.7', marginBottom: '2rem' },
  heroButtons: { display: 'flex', gap: '1rem' },
  btnPrimary: { padding: '0.875rem 2rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' },
  btnSecondary: { padding: '0.875rem 2rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' },
  heroImage: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
  heroGraphic: { fontSize: '12rem', opacity: 0.8 },
  section: { padding: '4rem 2rem', backgroundColor: '#ffffff' },
  sectionAlt: { padding: '4rem 2rem', backgroundColor: '#f9fafb' },
  sectionContainer: { maxWidth: '1200px', margin: '0 auto' },
  sectionTitle: { fontSize: '2rem', fontWeight: '700', color: '#1f2937', textAlign: 'center', marginBottom: '3rem' },
  searchBox: { maxWidth: '700px', margin: '0 auto', display: 'flex', gap: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderRadius: '0.75rem', padding: '0.5rem', backgroundColor: 'white', border: '1px solid #e5e7eb' },
  searchInput: { flex: 1, padding: '1rem 1.25rem', border: 'none', outline: 'none', fontSize: '1rem', borderRadius: '0.5rem' },
  searchBtn: { padding: '1rem 2rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' },
  searchResults: { maxWidth: '700px', margin: '1rem auto 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  resultsCount: { fontSize: '0.875rem', fontWeight: '600' },
  clearSearchBtn: { padding: '0.375rem 0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '500' },
  searchHistory: { maxWidth: '700px', margin: '1.5rem auto 0', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' },
  historyTitle: { fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem', fontWeight: '500' },
  historyList: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  historyTag: { padding: '0.375rem 0.75rem', backgroundColor: '#e5e7eb', borderRadius: '1rem', fontSize: '0.75rem', color: '#374151', cursor: 'pointer' },
  noResults: { textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#f9fafb', borderRadius: '1rem', border: '2px dashed #e5e7eb' },
  noResultsIcon: { fontSize: '5rem', display: 'block', marginBottom: '1rem' },
  noResultsTitle: { fontSize: '1.5rem', color: '#1f2937', marginBottom: '0.5rem' },
  noResultsText: { fontSize: '1rem', color: '#6b7280', marginBottom: '1.5rem' },
  btnReset: { padding: '0.75rem 1.5rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' },
  scannerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '800px', margin: '0 auto' },
  scannerCard: { backgroundColor: 'white', padding: '2.5rem', borderRadius: '1rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' },
  scannerIcon: { fontSize: '4rem', marginBottom: '1rem' },
  scannerTitle: { fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' },
  scannerText: { color: '#6b7280', marginBottom: '1.5rem' },
  scannerInput: { width: '100%', padding: '0.875rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '1rem' },
  btnScanner: { width: '100%', padding: '0.875rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' },
  btnScannerAlt: { width: '100%', padding: '0.875rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600' },
  productsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' },
  productCard: { backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e5e7eb', transition: 'transform 0.2s, box-shadow 0.2s' },
  productHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  productEmoji: { fontSize: '3rem' },
  bioBadge: { backgroundColor: '#16a34a', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '600' },
  productName: { fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' },
  productDesc: { fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' },
  productStats: { display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' },
  stat: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  statLabel: { fontSize: '0.75rem', color: '#6b7280' },
  statValue: { padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontWeight: '600', fontSize: '0.875rem', backgroundColor: '#22c55e', color: 'white', display: 'inline-block' },
  productOrigin: { fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' },
  productActions: { display: 'flex', gap: '0.5rem', marginTop: '0.75rem' },
  btnFavorite: { flex: 1, padding: '0.625rem', backgroundColor: '#ec4899', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' },
  btnComments: { flex: 1, padding: '0.625rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' },
  chatbotBox: { maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  chatbotHeader: { padding: '1rem 1.25rem', backgroundColor: '#16a34a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  chatbotTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' },
  onlineStatus: { fontSize: '0.75rem', opacity: 0.9 },
  chatMessages: { padding: '1.25rem', minHeight: '250px', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  botMsg: { backgroundColor: 'white', padding: '0.875rem 1rem', borderRadius: '1rem', alignSelf: 'flex-start', maxWidth: '80%', fontSize: '0.875rem', color: '#374151', border: '1px solid #e5e7eb' },
  userMsg: { backgroundColor: '#16a34a', color: 'white', padding: '0.875rem 1rem', borderRadius: '1rem', alignSelf: 'flex-end', maxWidth: '80%', fontSize: '0.875rem' },
  chatInputBox: { display: 'flex', padding: '1rem', gap: '0.75rem', borderTop: '1px solid #e5e7eb' },
  chatInput: { flex: 1, padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' },
  chatSendBtn: { padding: '0.75rem 1.25rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '600' },
  footer: { backgroundColor: '#1f2937', color: 'white', padding: '3rem 2rem 1.5rem' },
  footerContainer: { maxWidth: '1200px', margin: '0 auto' },
  footerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' },
  footerTitle: { fontSize: '1.5rem', marginBottom: '1rem' },
  footerSubtitle: { fontSize: '1rem', marginBottom: '1rem', fontWeight: '600' },
  footerText: { fontSize: '0.875rem', color: '#9ca3af', lineHeight: '1.7', marginBottom: '0.5rem' },
  footerLinks: { listStyle: 'none', padding: 0, margin: 0 },
  footerLink: { color: '#9ca3af', textDecoration: 'none', fontSize: '0.875rem', lineHeight: '2', display: 'block' },
  footerBottom: { borderTop: '1px solid #374151', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }
};

export default Home;