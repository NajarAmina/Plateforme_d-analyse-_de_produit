import React, { useState, useRef, useEffect } from 'react';

// Liste complète des pays (français)
const PAYS = [
  'Afghanistan', 'Afrique du Sud', 'Albanie', 'Algérie', 'Allemagne', 'Andorre', 'Angola',
  'Antigua-et-Barbuda', 'Arabie Saoudite', 'Argentine', 'Arménie', 'Australie', 'Autriche',
  'Azerbaïdjan', 'Bahamas', 'Bahreïn', 'Bangladesh', 'Barbade', 'Belgique', 'Belize',
  'Bénin', 'Bhoutan', 'Biélorussie', 'Birmanie', 'Bolivie', 'Bosnie-Herzégovine', 'Botswana',
  'Brésil', 'Brunei', 'Bulgarie', 'Burkina Faso', 'Burundi', 'Cambodge', 'Cameroun', 'Canada',
  'Cap-Vert', 'Centrafrique', 'Chili', 'Chine', 'Chypre', 'Colombie', 'Comores', 'Congo',
  'Corée du Nord', 'Corée du Sud', 'Costa Rica', 'Côte d\'Ivoire', 'Croatie', 'Cuba', 'Danemark',
  'Djibouti', 'Dominique', 'Égypte', 'Émirats Arabes Unis', 'Équateur', 'Érythrée', 'Espagne',
  'Estonie', 'Éthiopie', 'Fidji', 'Finlande', 'France', 'Gabon', 'Gambie', 'Géorgie', 'Ghana',
  'Grèce', 'Grenade', 'Guatemala', 'Guinée', 'Guinée-Bissau', 'Guinée équatoriale', 'Guyana',
  'Haïti', 'Honduras', 'Hongrie', 'Îles Marshall', 'Îles Salomon', 'Inde', 'Indonésie', 'Irak',
  'Iran', 'Irlande', 'Islande', 'Israël', 'Italie', 'Jamaïque', 'Japon', 'Jordanie', 'Kazakhstan',
  'Kenya', 'Kirghizistan', 'Kiribati', 'Kosovo', 'Koweït', 'Laos', 'Lesotho', 'Lettonie', 'Liban',
  'Libéria', 'Libye', 'Liechtenstein', 'Lituanie', 'Luxembourg', 'Macédoine du Nord', 'Madagascar',
  'Malaisie', 'Malawi', 'Maldives', 'Mali', 'Malte', 'Maroc', 'Maurice', 'Mauritanie', 'Mexique',
  'Micronésie', 'Moldavie', 'Monaco', 'Mongolie', 'Monténégro', 'Mozambique', 'Namibie', 'Nauru',
  'Népal', 'Nicaragua', 'Niger', 'Nigéria', 'Norvège', 'Nouvelle-Zélande', 'Oman', 'Ouganda',
  'Ouzbékistan', 'Pakistan', 'Palaos', 'Palestine', 'Panama', 'Papouasie-Nouvelle-Guinée',
  'Paraguay', 'Pays-Bas', 'Pérou', 'Philippines', 'Pologne', 'Portugal', 'Qatar',
  'République démocratique du Congo', 'République dominicaine', 'République tchèque', 'Roumanie',
  'Royaume-Uni', 'Russie', 'Rwanda', 'Saint-Kitts-et-Nevis', 'Saint-Marin', 'Saint-Vincent-et-les-Grenadines',
  'Sainte-Lucie', 'Salvador', 'Samoa', 'São Tomé-et-Príncipe', 'Sénégal', 'Serbie', 'Seychelles',
  'Sierra Leone', 'Singapour', 'Slovaquie', 'Slovénie', 'Somalie', 'Soudan', 'Soudan du Sud',
  'Sri Lanka', 'Suède', 'Suisse', 'Suriname', 'Syrie', 'Tadjikistan', 'Tanzanie', 'Tchad',
  'Thaïlande', 'Timor oriental', 'Togo', 'Tonga', 'Trinité-et-Tobago', 'Tunisie', 'Turkménistan',
  'Turquie', 'Tuvalu', 'Ukraine', 'Uruguay', 'Vanuatu', 'Vatican', 'Venezuela', 'Vietnam',
  'Yémen', 'Zambie', 'Zimbabwe'
];

// Composant Autocomplete Pays
const PaysAutocomplete = ({ value, onChange }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setHighlighted(-1);

    if (val.trim().length === 0) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const filtered = PAYS.filter((p) =>
      p.toLowerCase().startsWith(val.toLowerCase())
    ).slice(0, 8);

    setSuggestions(filtered);
    setOpen(filtered.length > 0);
  };

  const handleSelect = (pays) => {
    setQuery(pays);
    onChange(pays);
    setSuggestions([]);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} style={styles.autocompleteWrapper}>
      <input
        type="text"
        placeholder="Origine (pays) *"
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        style={styles.input}
        autoComplete="off"
      />
      {open && (
        <ul style={styles.dropdown}>
          {suggestions.map((pays, i) => (
            <li
              key={pays}
              onMouseDown={() => handleSelect(pays)}
              style={{
                ...styles.dropdownItem,
                ...(i === highlighted ? styles.dropdownItemHighlighted : {})
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              {/* Mettre en gras la partie tapée */}
              <span style={{ fontWeight: 700, color: '#1976D2' }}>
                {pays.slice(0, query.length)}
              </span>
              <span>{pays.slice(query.length)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Composant Autocomplete Adresse Tunisie (Nominatim OpenStreetMap)
const AdresseAutocomplete = ({ value, onChange }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (val) => {
    if (val.trim().length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoadingAddr(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=tn&addressdetails=1&limit=8&q=${encodeURIComponent(val)}`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'fr', 'User-Agent': 'AddProductApp/1.0' }
      });
      const data = await res.json();
      setSuggestions(data || []);
      setOpen((data || []).length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoadingAddr(false);
    }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setHighlighted(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const handleSelect = (item) => {
    // Construire une adresse lisible : afficher display_name sans la partie pays
    const addr = item.display_name.replace(/, Tunisie$/, '').replace(/, Tunisia$/, '');
    setQuery(addr);
    onChange(addr);
    setSuggestions([]);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} style={styles.autocompleteWrapper}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Adresse en Tunisie 📍"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          style={{ ...styles.input, paddingRight: '32px' }}
          autoComplete="off"
        />
        {loadingAddr && (
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#999' }}>
            ⏳
          </span>
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
              <li
                key={item.place_id}
                onMouseDown={() => handleSelect(item)}
                onMouseEnter={() => setHighlighted(i)}
                style={{
                  ...styles.dropdownItem,
                  ...(i === highlighted ? styles.dropdownItemHighlighted : {})
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '13px' }}>📍 {main}</div>
                {sub && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{sub}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// Composant pour ajouter un point
const AddPointForm = ({ newPoint, setNewPoint, handleAddPoint, loading }) => (
  <div style={styles.inlineBox}>
    <input
      type="text"
      placeholder="Nom du point de vente"
      value={newPoint.nom}
      onChange={(e) => setNewPoint({ ...newPoint, nom: e.target.value })}
      style={styles.input}
    />
    <AdresseAutocomplete
      value={newPoint.adresse}
      onChange={(val) => setNewPoint({ ...newPoint, adresse: val })}
    />
    <button onClick={handleAddPoint} style={styles.secondaryButton} disabled={loading}>
      + Ajouter
    </button>
  </div>
);

const AddProductTab = ({ user }) => {
  const [productForm, setProductForm] = useState({
    nom: '',
    description: '',
    code_barre: '',
    origine: '',
    ingredients: '',
    image: '',
    pointsDeVente: []
  });
  const [pointsDeVente, setPointsDeVente] = useState([]);
  const [newPoint, setNewPoint] = useState({ nom: '', adresse: '' });
  const [loading, setLoading] = useState(false);

  const canSubmit =
    productForm.nom?.trim() &&
    productForm.description?.trim() &&
    productForm.code_barre?.trim() &&
    productForm.origine?.trim();

  const isMongoObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || '').trim());

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Erreur lecture image'));
      reader.readAsDataURL(file);
    });

  const handleAddPoint = async (e) => {
    e.preventDefault();
    if (!newPoint.nom.trim() || !newPoint.adresse.trim()) return;

    try {
      const res = await fetch('/api/pointDeVente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: newPoint.nom.trim(),
          adresse: newPoint.adresse.trim()
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erreur ajout point de vente');

      setProductForm((prev) => ({
        ...prev,
        pointsDeVente: [...(prev.pointsDeVente || []), data._id]
      }));
      setPointsDeVente((prev) => [...prev, data]);
      setNewPoint({ nom: '', adresse: '' });
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'ajout du point de vente');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      alert('Veuillez vous connecter');
      return;
    }
    if (!canSubmit) {
      alert('Veuillez remplir les champs obligatoires (*)');
      return;
    }

    setLoading(true);
    try {
      const cleanedPoints = (productForm.pointsDeVente || [])
        .map((id) => String(id).trim())
        .filter((id) => id && isMongoObjectId(id));

      if ((productForm.pointsDeVente || []).length !== cleanedPoints.length) {
        throw new Error('Un point de vente invalide a été détecté. Supprimez-le puis ajoutez-le à nouveau.');
      }

      const payload = { ...productForm, pointsDeVente: cleanedPoints, createdBy: user.id };
      const res = await fetch('/api/produits/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la soumission');

      alert('Produit soumis et en attente de validation par l\'admin ✅');
      setProductForm({
        nom: '',
        description: '',
        code_barre: '',
        origine: '',
        ingredients: '',
        image: '',
        pointsDeVente: []
      });
      setPointsDeVente([]);
    } catch (err) {
      alert(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Ajouter un Nouveau Produit</h2>
      <form onSubmit={handleAddProduct} style={styles.form}>
        <input
          placeholder="Nom du produit *"
          value={productForm.nom}
          onChange={(e) => setProductForm({ ...productForm, nom: e.target.value })}
          style={styles.input}
        />
        <textarea
          placeholder="Description *"
          value={productForm.description}
          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
          style={styles.textarea}
        />
        <input
          placeholder="Code-barre *"
          value={productForm.code_barre}
          onChange={(e) => setProductForm({ ...productForm, code_barre: e.target.value })}
          style={styles.input}
        />

        {/* ✅ Champ Origine avec Autocomplete Pays */}
        <PaysAutocomplete
          value={productForm.origine}
          onChange={(val) => setProductForm({ ...productForm, origine: val })}
        />

        <textarea
          placeholder="Ingrédients"
          value={productForm.ingredients}
          onChange={(e) => setProductForm({ ...productForm, ingredients: e.target.value })}
          style={styles.textarea}
        />
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const dataUrl = await readFileAsDataUrl(file);
              setProductForm({ ...productForm, image: dataUrl });
            } catch {
              alert('Impossible de lire l\'image');
            }
          }}
          style={styles.input}
        />
        {productForm.image && (
          <img
            src={productForm.image}
            alt="Preview"
            style={{ maxWidth: '220px', borderRadius: '8px', marginTop: '10px' }}
          />
        )}

        <select
          multiple
          value={productForm.pointsDeVente || []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
            setProductForm({ ...productForm, pointsDeVente: selected });
          }}
          style={styles.select}
        >
          {pointsDeVente.map((p) => (
            <option key={p._id} value={p._id}>
              {p.nom}
            </option>
          ))}
        </select>

        <AddPointForm
          newPoint={newPoint}
          setNewPoint={setNewPoint}
          handleAddPoint={handleAddPoint}
          loading={loading}
        />

        <button type="submit" style={styles.submitButton}>
          {loading ? 'Envoi...' : 'Soumettre'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    maxWidth: '600px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px'
  },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', minHeight: '80px' },
  select: { padding: '10px', border: '1px solid #ddd', borderRadius: '5px', minHeight: '100px' },
  inlineBox: { display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center' },
  submitButton: { backgroundColor: '#4CAF50', color: '#fff', padding: '12px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#1976D2', color: '#fff', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  autocompleteWrapper: {
    position: 'relative',
    width: '100%'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #1976D2',
    borderRadius: '5px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    listStyle: 'none',
    margin: '4px 0 0 0',
    padding: '4px 0',
    maxHeight: '260px',
    overflowY: 'auto'
  },
  dropdownItem: {
    padding: '10px 14px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#333',
    transition: 'background 0.15s'
  },
  dropdownItemHighlighted: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2'
  }
};

export default AddProductTab;
