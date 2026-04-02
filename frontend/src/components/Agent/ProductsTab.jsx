import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import AddProductTab from '../Suplier/AddProductTab'; // ✅ Réutilisation du formulaire fournisseur

const API_TIMEOUT_MS = 25000;

/** fetch JSON avec délai max pour éviter un « Chargement... » infini si l’API ou Mongo est lent / HS */
async function fetchJsonWithTimeout(url, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* réponse non-JSON */
    }
    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || `Erreur ${res.status}`;
      throw new Error(typeof msg === 'string' ? msg : 'Réponse invalide');
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error(`Délai dépassé (${API_TIMEOUT_MS / 1000}s) — vérifiez que le backend tourne et que MongoDB répond.`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Liste pays ───────────────────────────────────────────────────────────────
const PAYS = [
  'Afghanistan','Afrique du Sud','Albanie','Algérie','Allemagne','Andorre','Angola',
  'Arabie Saoudite','Argentine','Arménie','Australie','Autriche','Azerbaïdjan',
  'Bahamas','Bahreïn','Bangladesh','Belgique','Bénin','Biélorussie','Bolivie',
  'Bosnie-Herzégovine','Botswana','Brésil','Bulgarie','Burkina Faso','Burundi',
  'Cambodge','Cameroun','Canada','Centrafrique','Chili','Chine','Chypre','Colombie',
  'Congo','Corée du Nord','Corée du Sud','Costa Rica',"Côte d'Ivoire",'Croatie',
  'Cuba','Danemark','Djibouti','Égypte','Émirats Arabes Unis','Équateur','Espagne',
  'Estonie','Éthiopie','Fidji','Finlande','France','Gabon','Gambie','Géorgie',
  'Ghana','Grèce','Guatemala','Guinée','Guyana','Haïti','Honduras','Hongrie',
  'Inde','Indonésie','Irak','Iran','Irlande','Islande','Israël','Italie',
  'Jamaïque','Japon','Jordanie','Kazakhstan','Kenya','Kosovo','Koweït','Laos',
  'Lettonie','Liban','Libye','Lituanie','Luxembourg','Madagascar','Malaisie',
  'Mali','Malte','Maroc','Maurice','Mauritanie','Mexique','Moldavie','Monaco',
  'Mongolie','Monténégro','Mozambique','Namibie','Népal','Niger','Nigéria',
  'Norvège','Nouvelle-Zélande','Oman','Ouganda','Pakistan','Palestine','Panama',
  'Paraguay','Pays-Bas','Pérou','Philippines','Pologne','Portugal','Qatar',
  'République démocratique du Congo','République dominicaine','République tchèque',
  'Roumanie','Royaume-Uni','Russie','Rwanda','Sénégal','Serbie','Sierra Leone',
  'Singapour','Slovaquie','Slovénie','Somalie','Soudan','Sri Lanka','Suède',
  'Suisse','Syrie','Tanzanie','Tchad','Thaïlande','Togo','Trinité-et-Tobago',
  'Tunisie','Turquie','Ukraine','Uruguay','Vatican','Venezuela','Vietnam',
  'Yémen','Zambie','Zimbabwe'
];

// ✅ Helper : lien Google Maps depuis localisation
const MapsLink = ({ localisation }) => {
  if (!localisation?.lat || !localisation?.lng) return null;
  const url = `https://www.google.com/maps?q=${localisation.lat},${localisation.lng}`;
  return (
    <a href={url} target="_blank" rel="noreferrer" style={S.mapsLink}>
      🗺️ Voir sur Google Maps
    </a>
  );
};

// ─── Autocomplete générique ───────────────────────────────────────────────────
const Autocomplete = ({ value, onChange, placeholder, fetchFn, staticList }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = async (val) => {
    if (!val.trim()) { setSuggestions([]); setOpen(false); return; }
    if (staticList) {
      const filtered = staticList.filter(p => p.toLowerCase().startsWith(val.toLowerCase())).slice(0, 8);
      setSuggestions(filtered.map(s => ({ label: s, value: s })));
      setOpen(filtered.length > 0);
    } else if (fetchFn) {
      setLoading(true);
      try { 
        const results = await fetchFn(val);
        setSuggestions(results);
        setOpen(results.length > 0);
      } finally { setLoading(false); }
    }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val); onChange(val); setHighlighted(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = (item) => {
    setQuery(item.label); onChange(item.value); setSuggestions([]); setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && highlighted >= 0) { e.preventDefault(); handleSelect(suggestions[highlighted]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text" placeholder={placeholder} value={query}
          onChange={handleInput} onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          style={S.input} autoComplete="off"
        />
        {loading && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#999' }}>⏳</span>}
      </div>
      {open && (
        <ul style={S.dropdown}>
          {suggestions.map((item, i) => {
            const parts = item.label.split(', ');
            const main = parts[0];
            const sub = parts.slice(1).join(', ');
            return (
              <li key={i} onMouseDown={() => handleSelect(item)} onMouseEnter={() => setHighlighted(i)}
                style={{ ...S.dropdownItem, ...(i === highlighted ? S.dropdownItemHL : {}) }}
              >
                {staticList ? (
                  <>
                    <span style={{ fontWeight: 700, color: '#1976D2' }}>{item.label.slice(0, query.length)}</span>
                    <span>{item.label.slice(query.length)}</span>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>📍 {parts[0]}</div>
                    {parts.slice(1).join(', ') && <div style={{ fontSize: 11, color: '#888' }}>{parts.slice(1).join(', ')}</div>}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// Nominatim fetch pour adresses en Tunisie
const fetchAdresseTunisie = async (val) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=tn&addressdetails=1&limit=8&q=${encodeURIComponent(val)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'fr', 'User-Agent': 'ProductApp/1.0' } });
  const data = await res.json();
  return (data || []).map(item => {
    const label = item.display_name.replace(/, Tunisie$/, '').replace(/, Tunisia$/, '');
    return { label, value: label };
  });
};

// ─── Notification ─────────────────────────────────────────────────────────────
const sendNotification = async ({ recipientId, message, productName, agentName }) => {
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId, message, productName, agentName, date: new Date().toISOString() })
    });
  } catch (err) { console.error('Erreur notification:', err); }
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        padding: '12px 20px', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14,
        backgroundColor: t.type === 'success' ? '#4CAF50' : t.type === 'error' ? '#f44336' : '#1976D2',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>{t.msg}</div>
    ))}
  </div>
);

// ─── Modal confirmation ───────────────────────────────────────────────────────
const ConfirmModal = ({ open, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 8888, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: '28px 32px', maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <p style={{ marginBottom: 24, fontSize: 15, color: '#333', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={S.btnSecondary}>Annuler</button>
          <button onClick={onConfirm} style={S.btnDanger}>Confirmer</button>
        </div>
      </div>
    </div>
  );
};

// ─── Formulaire produit ───────────────────────────────────────────────────────
const ProductForm = ({ form, setForm, pointsDeVente, onSubmit, onCancel, submitLabel }) => {
  const readFile = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ''));
    r.onerror = () => rej(new Error('Erreur lecture'));
    r.readAsDataURL(file);
  });

  return (
    <div style={S.formCard}>
      <div style={S.formGrid}>
        <input placeholder="Nom du produit *" value={form.nom}
          onChange={e => setForm({ ...form, nom: e.target.value })} style={S.input} />
        <input placeholder="Code-barre *" value={form.code_barre}
          onChange={e => setForm({ ...form, code_barre: e.target.value })} style={S.input} />
      </div>

      <Autocomplete value={form.origine} onChange={val => setForm({ ...form, origine: val })}
        placeholder="Origine (pays) *" staticList={PAYS} />

      <textarea placeholder="Description *" value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        style={{ ...S.input, minHeight: 80, resize: 'vertical' }} />
      <textarea placeholder="Ingrédients" value={form.ingredients}
        onChange={e => setForm({ ...form, ingredients: e.target.value })}
        style={{ ...S.input, minHeight: 60, resize: 'vertical' }} />

      <input type="file" accept="image/*"
        onChange={async e => {
          const file = e.target.files?.[0];
          if (!file) return;
          try { setForm({ ...form, image: await readFile(file) }); }
          catch { alert("Impossible de lire l'image"); }
        }} style={S.input} />
      {form.image && <img src={form.image} alt="Preview" style={{ maxWidth: 180, borderRadius: 8, marginTop: 6 }} />}

      <label style={{ fontSize: 13, color: '#555' }}>Points de vente</label>
      <select multiple value={form.pointsDeVente || []}
        onChange={e => {
          const selected = Array.from(e.target.selectedOptions).map(o => o.value);
          setForm({ ...form, pointsDeVente: selected });
        }} style={{ ...S.input, minHeight: 90 }}>
        {pointsDeVente.map(pv => (
          <option key={pv._id} value={pv._id}>{pv.nom} — {pv.adresse}</option>
        ))}
      </select>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={onSubmit} style={S.btnSuccess}>{submitLabel}</button>
        <button onClick={onCancel} style={S.btnSecondary}>Annuler</button>
      </div>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
const ProductsTab = () => {
  const { user } = useAuth();

  // Données
  const [products, setProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [pointsDeVente, setPointsDeVente] = useState([]);

  const [activeTab, setActiveTab] = useState('approved');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, message: '', onConfirm: null });

  // Formulaires
  const emptyForm = { nom: '', description: '', code_barre: '', origine: '', ingredients: '', image: '', pointsDeVente: [] };
  const [productForm, setProductForm] = useState(emptyForm);
  const [newProductForm, setNewProductForm] = useState(emptyForm);
  const [newPoint, setNewPoint] = useState({ nom: '', adresse: '' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoadingProducts(true);
    const labels = ['Produits validés', 'Produits en attente', 'Points de vente'];
    try {
      const settled = await Promise.allSettled([
        fetchJsonWithTimeout('/api/produits?status=approved'),
        fetchJsonWithTimeout('/api/produits/pending'),
        fetchJsonWithTimeout('/api/pointDeVente'),
      ]);
      const failed = [];
      const unwrap = (i, setter) => {
        const r = settled[i];
        if (r.status === 'fulfilled' && Array.isArray(r.value)) {
          setter(r.value);
          return;
        }
        setter([]);
        if (r.status === 'rejected') failed.push(`${labels[i]} : ${r.reason?.message || r.reason}`);
        else if (r.status === 'fulfilled') failed.push(`${labels[i]} : réponse inattendue`);
      };
      unwrap(0, setProducts);
      unwrap(1, setPendingProducts);
      unwrap(2, setPointsDeVente);
      if (failed.length === settled.length) {
        toast(failed[0] || 'Impossible de charger les données.', 'error');
      } else if (failed.length > 0) {
        toast(`Certaines listes n’ont pas pu être chargées. ${failed.join(' · ')}`, 'error');
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  // ── Toast ──
  const toast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  // ── Confirm dialog ──
  const askConfirm = (message) => new Promise(resolve => {
    setConfirm({ open: true, message, onConfirm: () => { setConfirm(c => ({ ...c, open: false })); resolve(true); } });
  });

  // ── Ajouter produit (par agent) ──
  const handleAddProduct = async () => {
    const { nom, description, code_barre, origine } = newProductForm;
    if (!nom.trim() || !description.trim() || !code_barre.trim() || !origine.trim()) {
      toast('Veuillez remplir les champs obligatoires (*)', 'error'); return;
    }
    try {
      const res = await fetch('/api/produits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProductForm, createdBy: user?.id, status: 'approved' })
      });
      if (!res.ok) throw new Error('Erreur ajout produit');
      setNewProductForm(emptyForm);
      setActiveTab('approved');
      await loadAll();
      toast('Produit ajouté avec succès ✅');
    } catch (err) { toast(err.message, 'error'); }
  };

  // ── Accepter produit pending ──
  const acceptProduct = async (product) => {
    try {
      const res = await fetch(`/api/produits/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', validatedBy: user?.id })
      });
      if (!res.ok) throw new Error('Erreur acceptation produit');

      // Notification fournisseur
      await sendNotification({
        recipientId: product.createdBy,
        productName: product.nom,
        agentName: user?.name || 'Un agent',
        message: `✅ Votre produit "${product.nom}" a été accepté et publié par l'agent ${user?.name || ''}.`
      });

      await loadAll();
      toast(`Produit "${product.nom}" accepté ✅`);
    } catch (err) { toast(err.message, 'error'); }
  };

  // ── Modifier produit ──
  const startEdit = (p) => {
    setEditingProductId(p._id);
    setProductForm({
      nom: p.nom || '', description: p.description || '', code_barre: p.code_barre || '',
      origine: p.origine || '',
      ingredients: Array.isArray(p.ingredients)
        ? p.ingredients.map(i => i?.nom || i).filter(Boolean).join(', ')
        : (p.ingredients || ''),
      image: p.image || '',
      pointsDeVente: Array.isArray(p.pointsDeVente)
        ? p.pointsDeVente.map(pv => pv?._id || pv).filter(Boolean) : []
    });
    setActiveTab('approved');
  };

  const saveEdit = async (product) => {
    try {
      const res = await fetch(`/api/produits/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productForm, modifiedBy: user?.id })
      });
      if (!res.ok) throw new Error('Erreur modification produit');

      // Notification si produit créé par un fournisseur (différent de l'agent)
      if (product.createdBy && product.createdBy !== user?.id) {
        await sendNotification({
          recipientId: product.createdBy, productName: product.nom,
          agentName: user?.name || 'Un agent',
          message: `✏️ Votre produit "${product.nom}" a été modifié par l'agent ${user?.name || ''}.`
        });
      }
      setEditingProductId(null); setProductForm(emptyForm);
      await loadAll();
      toast(`Produit "${product.nom}" modifié ✅`);
    } catch (err) { toast(err.message, 'error'); }
  };

  // ── Supprimer produit ──
  const deleteProduct = async (product) => {
    const ok = await askConfirm(`Supprimer le produit "${product.nom}" ?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/produits/${product._id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedBy: user?.id })
      });
      if (!res.ok) throw new Error('Erreur suppression produit');
      if (product.createdBy && product.createdBy !== user?.id) {
        await sendNotification({
          recipientId: product.createdBy, productName: product.nom,
          agentName: user?.name || 'Un agent',
          message: `🗑️ Votre produit "${product.nom}" a été supprimé par l'agent ${user?.name || ''}.`
        });
      }
      await loadAll();
      toast(`Produit "${product.nom}" supprimé`, 'info');
    } catch (err) { toast(err.message, 'error'); }
  };

  // ── Refuser produit pending ──
  const refuseProduct = async (product) => {
    const ok = await askConfirm(`Refuser et supprimer le produit "${product.nom}" ?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/produits/${product._id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedBy: user?.id, reason: 'refused' })
      });
      if (!res.ok) throw new Error('Erreur refus produit');

      await sendNotification({
        recipientId: product.createdBy, productName: product.nom,
        agentName: user?.name || 'Un agent',
        message: `❌ Votre produit "${product.nom}" a été refusé par l'agent ${user?.name || ''}.`
      });
      await loadAll();
      toast(`Produit "${product.nom}" refusé`, 'info');
    } catch (err) { toast(err.message, 'error'); }
  };

  // ── Points de vente ──
  const handleAddPoint = async () => {
    if (!newPoint.nom.trim() || !newPoint.adresse.trim()) { toast('Nom et adresse requis', 'error'); return; }
    try {
      const res = await fetch('/api/pointDeVente', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPoint)
      });
      if (!res.ok) throw new Error('Erreur ajout point de vente');
      setNewPoint({ nom: '', adresse: '' });
      await loadAll();
      toast('Point de vente ajouté ✅');
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleDeletePoint = async (pv) => {
    const ok = await askConfirm(`Supprimer le point de vente "${pv.nom}" ?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/pointDeVente/${pv._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression');
      await loadAll();
      toast(`Point "${pv.nom}" supprimé`, 'info');
    } catch (err) { toast(err.message, 'error'); }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <Toast toasts={toasts} />
      <ConfirmModal open={confirm.open} message={confirm.message}
        onConfirm={confirm.onConfirm} onCancel={() => setConfirm(c => ({ ...c, open: false }))} />

      <h2 style={S.pageTitle}>📦 Gérer les Produits</h2>

      {/* Onglets */}
      <div style={S.tabs}>
        {[
          { key: 'approved', label: `✅ Produits validés (${products.length})` },
          { key: 'pending', label: `⏳ En attente (${pendingProducts.length})`, badge: pendingProducts.length > 0 },
          { key: 'add', label: '➕ Nouveau produit' },
          { key: 'points', label: `📍 Points de vente (${pointsDeVente.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setEditingProductId(null); }}
            style={{ ...S.tab, ...(activeTab === tab.key ? S.tabActive : {}), ...(tab.badge ? S.tabBadge : {}) }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loadingProducts ? <div style={S.loading}>Chargement...</div> : (
        <>
          {/* ── Produits validés ── */}
          {activeTab === 'approved' && (
            <div>
              {products.length === 0 ? <p style={S.empty}>Aucun produit validé.</p> : products.map(p => (
                <div key={p._id} style={S.card}>
                  {editingProductId === p._id ? (
                    <>
                      <h4 style={S.cardTitle}>✏️ Modifier : {p.nom}</h4>
                      <ProductForm form={productForm} setForm={setProductForm} pointsDeVente={pointsDeVente}
                        onSubmit={() => saveEdit(p)}
                        onCancel={() => { setEditingProductId(null); setProductForm(emptyForm); }}
                        submitLabel="💾 Enregistrer" />
                    </>
                  ) : (
                    <div style={S.cardRow}>
                      {p.image && <img src={p.image} alt={p.nom} style={S.productImg} />}
                      <div style={{ flex: 1 }}>
                        <div style={S.cardHeader}>
                          <h3 style={S.cardTitle}>{p.nom}</h3>
                          {p.origine && <span style={S.badge}>{p.origine}</span>}
                        </div>
                        <p style={S.cardDesc}>{p.description}</p>
                        {p.code_barre && <p style={S.meta}>🔖 {p.code_barre}</p>}
                        {p.pointsDeVente?.length > 0 && (
                          <p style={S.meta}>
                            📍 {p.pointsDeVente.map(pv => typeof pv === 'object' ? (pv?.nom || pv?.adresse || '') : String(pv)).filter(Boolean).join(', ')}
                          </p>
                        )}
                        {/* ✅ NOUVEAU : lien Google Maps */}
                        <MapsLink localisation={p.localisation} />
                      </div>
                      <div style={S.cardActions}>
                        <button onClick={() => startEdit(p)} style={S.btnEdit}>✏️ Modifier</button>
                        <button onClick={() => deleteProduct(p)} style={S.btnDanger}>🗑️ Supprimer</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── En attente ── */}
          {activeTab === 'pending' && (
            <div>
              {pendingProducts.length === 0 ? <p style={S.empty}>Aucun produit en attente.</p> : pendingProducts.map(p => (
                <div key={p._id} style={{ ...S.card, borderLeft: '4px solid #FF9800' }}>
                  <div style={S.cardRow}>
                    {p.image && <img src={p.image} alt={p.nom} style={S.productImg} />}
                    <div style={{ flex: 1 }}>
                      <div style={S.cardHeader}>
                        <h3 style={S.cardTitle}>{p.nom}</h3>
                        <span style={{ ...S.badge, backgroundColor: '#FFF3E0', color: '#E65100' }}>En attente</span>
                      </div>
                      <p style={S.cardDesc}>{p.description}</p>
                      {p.code_barre && <p style={S.meta}>🔖 {p.code_barre}</p>}
                      {p.origine && <p style={S.meta}>🌍 {String(p.origine)}</p>}
                      {p.ingredients && (
                        <p style={S.meta}>🧪 {
                          Array.isArray(p.ingredients)
                            ? p.ingredients.map(i => typeof i === 'object' ? (i?.nom || '') : String(i)).filter(Boolean).join(', ')
                            : String(p.ingredients)
                        }</p>
                      )}
                      {p.pointsDeVente?.length > 0 && (
                        <p style={S.meta}>
                          📍 {p.pointsDeVente.map(pv => typeof pv === 'object' ? (pv?.nom || pv?.adresse || '') : String(pv)).filter(Boolean).join(', ')}
                        </p>
                      )}
                      {/* ✅ NOUVEAU : lien Google Maps pour l'agent (aide à vérifier le point de vente) */}
                      {p.localisation?.lat && p.localisation?.lng && (
                        <div style={S.mapsBox}>
                          <span style={{ fontSize: 12, color: '#555', marginRight: 6 }}>📌 Point de vente :</span>
                          {p.localisation.adresse && (
                            <span style={{ fontSize: 12, color: '#333', marginRight: 8 }}>{p.localisation.adresse}</span>
                          )}
                          <MapsLink localisation={p.localisation} />
                        </div>
                      )}
                      <p style={{ ...S.meta, color: '#999' }}>
                        Soumis par : {p.createdByName || (typeof p.createdBy === 'object' ? (p.createdBy?.nom || p.createdBy?.email || 'Fournisseur') : p.createdBy) || 'Fournisseur'}
                      </p>
                    </div>
                    <div style={S.cardActions}>
                      <button onClick={() => acceptProduct(p)} style={S.btnSuccess}>✅ Accepter</button>
                      <button onClick={() => refuseProduct(p)} style={S.btnDanger}>❌ Refuser</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Ajouter produit ── */}
          {/* ── Ajouter produit : réutilise AddProductTab du fournisseur ── */}
          {activeTab === 'add' && (
            <AddProductTab
              user={user}
              directApprove={true}
              onSuccess={() => { loadAll(); setActiveTab('approved'); toast('Produit ajouté et publié ✅'); }}
            />
          )}

          {/* ── Points de vente ── */}
          {activeTab === 'points' && (
            <div>
              <h3 style={S.sectionTitle}>Ajouter un point de vente</h3>
              <div style={S.pointForm}>
                <input placeholder="Nom du point de vente" value={newPoint.nom}
                  onChange={e => setNewPoint({ ...newPoint, nom: e.target.value })} style={S.input} />
                <Autocomplete value={newPoint.adresse} onChange={val => setNewPoint({ ...newPoint, adresse: val })}
                  placeholder="Adresse en Tunisie 📍" fetchFn={fetchAdresseTunisie} />
                <button onClick={handleAddPoint} style={S.btnSuccess}>+ Ajouter</button>
              </div>

              <h3 style={{ ...S.sectionTitle, marginTop: 24 }}>Liste des points de vente</h3>
              {pointsDeVente.length === 0 ? <p style={S.empty}>Aucun point de vente.</p> : (
                pointsDeVente.map(pv => (
                  <div key={pv._id} style={S.pointCard}>
                    <div>
                      <strong>{pv.nom}</strong>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: '#666' }}>📍 {pv.adresse}</p>
                      {/* ✅ NOUVEAU : lien Maps dans la liste des points de vente */}
                      {pv.lat && pv.lng && (
                        <a href={`https://www.google.com/maps?q=${pv.lat},${pv.lng}`}
                          target="_blank" rel="noreferrer" style={S.mapsLink}>
                          🗺️ Voir sur Google Maps
                        </a>
                      )}
                    </div>
                    <button onClick={() => handleDeletePoint(pv)} style={S.btnDangerSm}>🗑️</button>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: { padding: '8px 0', fontFamily: 'sans-serif' },
  pageTitle: { fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#222' },
  tabs: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  tab: { padding: '8px 16px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', backgroundColor: '#fff', fontSize: 14, color: '#555', fontWeight: 500 },
  tabActive: { backgroundColor: '#1976D2', color: '#fff', border: '1px solid #1976D2' },
  tabBadge: { border: '1px solid #FF9800', color: '#E65100' },
  loading: { padding: 32, textAlign: 'center', color: '#888', fontSize: 15 },
  empty: { color: '#888', fontStyle: 'italic', padding: '16px 0' },
  card: { backgroundColor: '#fff', padding: 16, marginBottom: 12, borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardRow: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: '#222' },
  cardDesc: { margin: '0 0 6px', fontSize: 14, color: '#555' },
  cardActions: { display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 },
  meta: { margin: '2px 0', fontSize: 12, color: '#777' },
  badge: { fontSize: 11, padding: '2px 8px', borderRadius: 12, backgroundColor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 },
  productImg: { width: 70, height: 70, objectFit: 'cover', borderRadius: 8, flexShrink: 0 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 12 },
  formCard: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 10, border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', gap: 12 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none' },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #1976D2', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, listStyle: 'none', margin: '4px 0 0', padding: '4px 0', maxHeight: 240, overflowY: 'auto' },
  dropdownItem: { padding: '9px 14px', cursor: 'pointer', fontSize: 14, color: '#333' },
  dropdownItemHL: { backgroundColor: '#E3F2FD', color: '#1976D2' },
  pointForm: { display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'start', marginBottom: 12 },
  pointCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '10px 14px', marginBottom: 8, borderRadius: 8, border: '1px solid #e5e7eb' },
  // ✅ Styles liens Maps
  mapsLink: { display: 'inline-block', color: '#1976D2', fontSize: 12, fontWeight: 600, textDecoration: 'none', marginTop: 4 },
  mapsBox: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4, padding: '6px 10px', backgroundColor: '#E3F2FD', borderRadius: 6 },
  btnSuccess: { backgroundColor: '#4CAF50', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  btnEdit: { backgroundColor: '#1976D2', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  btnDanger: { backgroundColor: '#f44336', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  btnDangerSm: { backgroundColor: '#f44336', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  btnSecondary: { backgroundColor: '#fff', color: '#555', border: '1px solid #ccc', padding: '9px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: 13 },
};

export default ProductsTab;
