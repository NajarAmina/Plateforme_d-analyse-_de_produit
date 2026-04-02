import React, { useState, useRef, useEffect } from 'react';

// Liste complète des pays (français)
const PAYS = [
  'Afghanistan', 'Afrique du Sud', 'Albanie', 'Algérie', 'Allemagne', 'Andorre', 'Angola',
  'Antigua-et-Barbuda', 'Arabie Saoudite', 'Argentine', 'Arménie', 'Australie', 'Autriche',
  'Azerbaïdjan', 'Bahamas', 'Bahreïn', 'Bangladesh', 'Barbade', 'Belgique', 'Belize',
  'Bénin', 'Bhoutan', 'Biélorussie', 'Birmanie', 'Bolivie', 'Bosnie-Herzégovine', 'Botswana',
  'Brésil', 'Brunei', 'Bulgarie', 'Burkina Faso', 'Burundi', 'Cambodge', 'Cameroun', 'Canada',
  'Cap-Vert', 'Centrafrique', 'Chili', 'Chine', 'Chypre', 'Colombie', 'Comores', 'Congo',
  'Corée du Nord', 'Corée du Sud', 'Costa Rica', "Côte d'Ivoire", 'Croatie', 'Cuba', 'Danemark',
  'Djibouti', 'Dominique', 'Égypte', 'Émirats Arabes Unis', 'Équateur', 'Érythrée', 'Espagne',
  'Estonie', 'Éthiopie', 'Fidji', 'Finlande', 'France', 'Gabon', 'Gambie', 'Géorgie', 'Ghana',
  'Grèce', 'Grenade', 'Guatemala', 'Guinée', 'Guinée-Bissau', 'Guinée équatoriale', 'Guyana',
  'Haïti', 'Honduras', 'Hongrie', 'Inde', 'Indonésie', 'Irak', 'Iran', 'Irlande', 'Islande',
  'Israël', 'Italie', 'Jamaïque', 'Japon', 'Jordanie', 'Kazakhstan', 'Kenya', 'Kosovo', 'Koweït',
  'Laos', 'Lettonie', 'Liban', 'Libéria', 'Libye', 'Lituanie', 'Luxembourg', 'Madagascar',
  'Malaisie', 'Malawi', 'Maldives', 'Mali', 'Malte', 'Maroc', 'Maurice', 'Mauritanie', 'Mexique',
  'Moldavie', 'Monaco', 'Mongolie', 'Monténégro', 'Mozambique', 'Namibie', 'Népal', 'Niger',
  'Nigéria', 'Norvège', 'Nouvelle-Zélande', 'Oman', 'Ouganda', 'Ouzbékistan', 'Pakistan',
  'Palestine', 'Panama', 'Paraguay', 'Pays-Bas', 'Pérou', 'Philippines', 'Pologne', 'Portugal',
  'Qatar', 'République démocratique du Congo', 'République dominicaine', 'République tchèque',
  'Roumanie', 'Royaume-Uni', 'Russie', 'Rwanda', 'Sénégal', 'Serbie', 'Sierra Leone',
  'Singapour', 'Slovaquie', 'Slovénie', 'Somalie', 'Soudan', 'Sri Lanka', 'Suède', 'Suisse',
  'Syrie', 'Tanzanie', 'Tchad', 'Thaïlande', 'Togo', 'Trinité-et-Tobago', 'Tunisie',
  'Turquie', 'Ukraine', 'Uruguay', 'Vatican', 'Venezuela', 'Vietnam', 'Yémen', 'Zambie', 'Zimbabwe'
];

// ─── Autocomplete Pays ────────────────────────────────────────────────────────
const PaysAutocomplete = ({ value, onChange }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);
  useEffect(() => {
    const h = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val); onChange(val); setHighlighted(-1);
    if (!val.trim()) { setSuggestions([]); setOpen(false); return; }
    const filtered = PAYS.filter(p => p.toLowerCase().startsWith(val.toLowerCase())).slice(0, 8);
    setSuggestions(filtered); setOpen(filtered.length > 0);
  };
  const handleSelect = (pays) => { setQuery(pays); onChange(pays); setSuggestions([]); setOpen(false); };
  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); handleSelect(suggestions[highlighted]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={wrapperRef} style={styles.autocompleteWrapper}>
      <input type="text" placeholder="Origine (pays) *" value={query}
        onChange={handleInput} onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        style={styles.input} autoComplete="off" />
      {open && (
        <ul style={styles.dropdown}>
          {suggestions.map((pays, i) => (
            <li key={pays} onMouseDown={() => handleSelect(pays)} onMouseEnter={() => setHighlighted(i)}
              style={{ ...styles.dropdownItem, ...(i === highlighted ? styles.dropdownItemHighlighted : {}) }}>
              <span style={{ fontWeight: 700, color: '#1976D2' }}>{pays.slice(0, query.length)}</span>
              <span>{pays.slice(query.length)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── Autocomplete Adresse Nominatim ──────────────────────────────────────────
const AdresseAutocomplete = ({ value, onChange, onSelectCoords, placeholder }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);
  useEffect(() => {
    const h = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fetchSuggestions = async (val) => {
    if (val.trim().length < 1) { setSuggestions([]); setOpen(false); return; }
    setLoadingAddr(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=tn&addressdetails=1&limit=8&q=${encodeURIComponent(val)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'fr', 'User-Agent': 'AddProductApp/1.0' } });
      const data = await res.json();
      setSuggestions(data || []); setOpen((data || []).length > 0);
    } catch { setSuggestions([]); setOpen(false); }
    finally { setLoadingAddr(false); }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val); onChange(val); setHighlighted(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const handleSelect = (item) => {
    // Construire une adresse lisible : afficher display_name sans la partie pays
    const addr = item.display_name.replace(/, Tunisie$/, '').replace(/, Tunisia$/, '');
    setQuery(addr); onChange(addr);
    if (onSelectCoords) onSelectCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setSuggestions([]); setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); handleSelect(suggestions[highlighted]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={wrapperRef} style={styles.autocompleteWrapper}>
      <div style={{ position: 'relative' }}>
        <input type="text" placeholder={placeholder || 'Adresse 📍'}
          value={query} onChange={handleInput} onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          style={{ ...styles.input, paddingRight: '32px' }} autoComplete="off" />
        {loadingAddr && (
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#999' }}>⏳</span>
        )}
      </div>
      {open && (
        <ul style={styles.dropdown}>
          {suggestions.map((item, i) => {
            const addr = item.display_name.replace(/, Tunisie$/, '').replace(/, Tunisia$/, '');
            const parts = addr.split(', ');
            const main = parts[0];
            const sub = parts.slice(1).join(', ');
            return (
              <li key={item.place_id} onMouseDown={() => handleSelect(item)} onMouseEnter={() => setHighlighted(i)}
                style={{ ...styles.dropdownItem, ...(i === highlighted ? styles.dropdownItemHighlighted : {}) }}>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>📍 {parts[0]}</div>
                {parts.slice(1).join(', ') && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{parts.slice(1).join(', ')}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
const AddProductTab = ({ user, directApprove = false, onSuccess }) => {
  const [productForm, setProductForm] = useState({
    nom: '', description: '', code_barre: '', origine: '',
    ingredients: '', image: '', pointsDeVente: []
  });

  // Points de vente ajoutés (objets complets pour l'affichage)
  const [pointsDeVente, setPointsDeVente] = useState([]);

  // Formulaire d'un nouveau point de vente
  const [newPoint, setNewPoint] = useState({ nom: '', adresse: '', lat: null, lng: null });
  const [addingPoint, setAddingPoint] = useState(false);

  const [loading, setLoading] = useState(false);

  const canSubmit =
    productForm.nom?.trim() && productForm.description?.trim() &&
    productForm.code_barre?.trim() && productForm.origine?.trim();

  const isMongoObjectId = (v) => /^[a-fA-F0-9]{24}$/.test(String(v || '').trim());

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Erreur lecture image'));
      reader.readAsDataURL(file);
    });

  // ── Ajouter un point de vente ──────────────────────────────────────────────
  const handleAddPoint = async (e) => {
    e.preventDefault();
    if (!newPoint.nom.trim() || !newPoint.adresse.trim()) {
      alert('Veuillez remplir le nom et l\'adresse du point de vente');
      return;
    }
    setAddingPoint(true);
    try {
      const res = await fetch('/api/pointDeVente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom:     newPoint.nom.trim(),
          adresse: newPoint.adresse.trim(),
          lat:     newPoint.lat  || null,
          lng:     newPoint.lng  || null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erreur ajout point de vente');

      // ✅ Ajouter à la liste ET cocher automatiquement dans le produit
      setPointsDeVente(prev => [...prev, data]);
      setProductForm(prev => ({
        ...prev,
        pointsDeVente: [...(prev.pointsDeVente || []), data._id]
      }));
      setNewPoint({ nom: '', adresse: '', lat: null, lng: null });
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'ajout du point de vente');
    } finally {
      setAddingPoint(false);
    }
  };

  // ── Supprimer un point de la liste ────────────────────────────────────────
  const removePoint = (id) => {
    setPointsDeVente(prev => prev.filter(p => p._id !== id));
    setProductForm(prev => ({
      ...prev,
      pointsDeVente: (prev.pointsDeVente || []).filter(pid => pid !== id)
    }));
  };

  // ── Soumettre le produit ───────────────────────────────────────────────────
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!user?.id) { alert('Veuillez vous connecter'); return; }
    if (!canSubmit) { alert('Veuillez remplir les champs obligatoires (*)'); return; }

    setLoading(true);
    try {
      const cleanedPoints = (productForm.pointsDeVente || [])
        .map(id => String(id).trim())
        .filter(id => id && isMongoObjectId(id));

      const payload = { ...productForm, pointsDeVente: cleanedPoints, createdBy: user.id };

      // ✅ Si directApprove (agent) → /api/produits avec status approved
      //    Sinon (fournisseur) → /api/produits/pending avec status pending
      const url    = directApprove ? '/api/produits' : '/api/produits/pending';
      const status = directApprove ? 'approved'      : 'pending';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, status })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la soumission');

      setProductForm({ nom: '', description: '', code_barre: '', origine: '', ingredients: '', image: '', pointsDeVente: [] });
      setPointsDeVente([]);

      if (onSuccess) {
        onSuccess(); // callback pour le parent (ex: recharger la liste + changer d'onglet)
      } else {
        alert(directApprove
          ? 'Produit ajouté et publié directement ✅'
          : 'Produit soumis et en attente de validation ✅'
        );
      }
    } catch (err) {
      alert(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <h2>Ajouter un Nouveau Produit</h2>
      <form onSubmit={handleAddProduct} style={styles.form}>

        {/* ── Infos produit ── */}
        <input placeholder="Nom du produit *" value={productForm.nom}
          onChange={e => setProductForm({ ...productForm, nom: e.target.value })} style={styles.input} />

        <textarea placeholder="Description *" value={productForm.description}
          onChange={e => setProductForm({ ...productForm, description: e.target.value })} style={styles.textarea} />

        <input placeholder="Code-barre *" value={productForm.code_barre}
          onChange={e => setProductForm({ ...productForm, code_barre: e.target.value })} style={styles.input} />

        <PaysAutocomplete value={productForm.origine}
          onChange={val => setProductForm({ ...productForm, origine: val })} />

        <textarea placeholder="Ingrédients" value={productForm.ingredients}
          onChange={e => setProductForm({ ...productForm, ingredients: e.target.value })} style={styles.textarea} />

        <input type="file" accept="image/*"
          onChange={async e => {
            const file = e.target.files?.[0]; if (!file) return;
            try { setProductForm({ ...productForm, image: await readFileAsDataUrl(file) }); }
            catch { alert('Impossible de lire l\'image'); }
          }} style={styles.input} />
        {productForm.image && (
          <img src={productForm.image} alt="Preview" style={{ maxWidth: '220px', borderRadius: '8px', marginTop: '4px' }} />
        )}

        {/* ── Section Points de vente ── */}
        <div style={styles.sectionBox}>
          <p style={styles.sectionTitle}>🏪 Points de vente</p>

          {/* Points déjà ajoutés */}
          {pointsDeVente.length > 0 ? (
            <div style={styles.pointsList}>
              {pointsDeVente.map(p => (
                <div key={p._id} style={styles.pointItem}>
                  <div style={{ flex: 1 }}>
                    <span style={styles.pointNom}>{p.nom}</span>
                    <span style={styles.pointAdresse}>📍 {p.adresse}</span>
                    {p.lat && p.lng && (
                      <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                        target="_blank" rel="noreferrer" style={styles.mapsLink}>
                        🗺️ Voir sur Google Maps
                      </a>
                    )}
                  </div>
                  <button type="button" onClick={() => removePoint(p._id)} style={styles.removeBtn}
                    title="Retirer ce point de vente">✕</button>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.emptyPoints}>Aucun point de vente ajouté pour l'instant.</p>
          )}

          {/* ─ Formulaire ajout nouveau point ─ */}
          <div style={styles.addPointBox}>
            <p style={styles.addPointTitle}>➕ Nouveau point de vente</p>

            <input
              placeholder="Nom (ex: Carrefour La Marsa)"
              value={newPoint.nom}
              onChange={e => setNewPoint({ ...newPoint, nom: e.target.value })}
              style={styles.input}
            />

            <AdresseAutocomplete
              value={newPoint.adresse}
              placeholder="Adresse — tapez pour chercher, sélectionnez pour remplir les coords 📍"
              onChange={val => setNewPoint(prev => ({ ...prev, adresse: val }))}
              onSelectCoords={({ lat, lng }) => setNewPoint(prev => ({ ...prev, lat, lng }))}
            />

            {/* Aperçu coordonnées + lien vérification */}
            {newPoint.lat && newPoint.lng ? (
              <div style={styles.coordsPreview}>
                <span>✅ Coordonnées : {newPoint.lat.toFixed(5)}, {newPoint.lng.toFixed(5)}</span>
                <a href={`https://www.google.com/maps?q=${newPoint.lat},${newPoint.lng}`}
                  target="_blank" rel="noreferrer" style={styles.mapsLink}>
                  🗺️ Vérifier sur Google Maps
                </a>
              </div>
            ) : (
              <p style={styles.coordsHint}>
                💡 Sélectionnez une adresse dans la liste pour remplir automatiquement les coordonnées GPS.
              </p>
            )}

            <button type="button" onClick={handleAddPoint} style={styles.addPointBtn} disabled={addingPoint}>
              {addingPoint ? '⏳ Ajout en cours...' : '+ Ajouter ce point de vente'}
            </button>
          </div>
        </div>

        {/* ── Soumettre ── */}
        <button type="submit"
          style={{ ...styles.submitButton, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          disabled={loading}>
          {loading ? 'Envoi en cours...' : '✅ Soumettre le produit'}
        </button>
      </form>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '620px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px' },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', width: '100%', boxSizing: 'border-box', fontSize: '14px' },
  textarea: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', minHeight: '80px', fontSize: '14px', resize: 'vertical' },
  autocompleteWrapper: { position: 'relative', width: '100%' },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #1976D2', borderRadius: '5px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, listStyle: 'none', margin: '4px 0 0 0', padding: '4px 0', maxHeight: '260px', overflowY: 'auto' },
  dropdownItem: { padding: '10px 14px', cursor: 'pointer', fontSize: '14px', color: '#333' },
  dropdownItemHighlighted: { backgroundColor: '#E3F2FD', color: '#1976D2' },
  submitButton: { backgroundColor: '#4CAF50', color: '#fff', padding: '13px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },

  // Section points de vente
  sectionBox: { border: '1px solid #c8e6c9', borderRadius: '8px', padding: '16px', backgroundColor: '#f9fffe', display: 'flex', flexDirection: 'column', gap: '12px' },
  sectionTitle: { margin: 0, fontWeight: 700, fontSize: '15px', color: '#2e7d32' },
  emptyPoints: { margin: 0, fontSize: '13px', color: '#999', fontStyle: 'italic' },

  // Liste des points ajoutés
  pointsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  pointItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#fff', border: '1px solid #a5d6a7', borderRadius: '7px', padding: '10px 12px' },
  pointNom: { display: 'block', fontWeight: 700, fontSize: '14px', color: '#1b5e20' },
  pointAdresse: { display: 'block', fontSize: '12px', color: '#555', marginTop: '2px' },
  mapsLink: { display: 'inline-block', marginTop: '4px', fontSize: '12px', fontWeight: 600, color: '#1976D2', textDecoration: 'none' },
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#e53935', fontSize: '18px', padding: '0 4px', lineHeight: 1, flexShrink: 0 },

  // Formulaire ajout point
  addPointBox: { backgroundColor: '#f0f7ff', border: '1px dashed #90caf9', borderRadius: '7px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' },
  addPointTitle: { margin: 0, fontWeight: 600, fontSize: '13px', color: '#1565c0' },
  coordsPreview: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '5px', padding: '8px 12px', fontSize: '12px', color: '#2e7d32', flexWrap: 'wrap' },
  coordsHint: { margin: 0, fontSize: '12px', color: '#888', fontStyle: 'italic' },
  addPointBtn: { backgroundColor: '#1976D2', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' },
};

export default AddProductTab;
