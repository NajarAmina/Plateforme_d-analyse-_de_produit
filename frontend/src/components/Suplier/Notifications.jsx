import React, { useState, useEffect } from 'react';

const Notifications = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.id) loadNotifications();
    }, [user]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/notifications?recipientId=${user.id}`);
            const data = await res.json().catch(() => []);
            if (res.ok) setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Erreur chargement notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            );
        } catch (err) {
            console.error('Erreur mark as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`/api/notifications/read-all?recipientId=${user.id}`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Erreur mark all as read:', err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error('Erreur suppression notification:', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (message = '') => {
        if (message.startsWith('✅')) return { icon: '✅', color: '#4CAF50', bg: '#E8F5E9' };
        if (message.startsWith('✏️')) return { icon: '✏️', color: '#1976D2', bg: '#E3F2FD' };
        if (message.startsWith('🗑️')) return { icon: '🗑️', color: '#f44336', bg: '#FFEBEE' };
        if (message.startsWith('❌')) return { icon: '❌', color: '#f44336', bg: '#FFEBEE' };
        return { icon: '🔔', color: '#FF9800', bg: '#FFF3E0' };
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);
        const diffH = Math.floor(diffMin / 60);
        const diffD = Math.floor(diffH / 24);

        if (diffMin < 1) return "À l'instant";
        if (diffMin < 60) return `Il y a ${diffMin} min`;
        if (diffH < 24) return `Il y a ${diffH}h`;
        if (diffD === 1) return 'Hier';
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };

    return (
        <div style={S.page}>
            {/* En-tête */}
            <div style={S.header}>
                <div style={S.headerLeft}>
                    <span style={S.headerIcon}>🔔</span>
                    <h2 style={S.headerTitle}>Notifications</h2>
                    {unreadCount > 0 && (
                        <span style={S.headerBadge}>{unreadCount}</span>
                    )}
                </div>
                <div style={S.headerActions}>
                    <button onClick={loadNotifications} style={S.btnRefresh} title="Actualiser">
                        🔄
                    </button>
                    {unreadCount > 0 && (
                        <button onClick={markAllAsRead} style={S.btnMarkAll}>
                            Tout marquer lu
                        </button>
                    )}
                </div>
            </div>

            {/* Contenu */}
            {loading ? (
                <div style={S.center}>
                    <p style={S.loadingText}>Chargement...</p>
                </div>
            ) : notifications.length === 0 ? (
                <div style={S.center}>
                    <div style={S.emptyIcon}>🔕</div>
                    <p style={S.emptyText}>Aucune notification</p>
                    <p style={S.emptySubText}>Vous serez notifié lorsqu'un agent agit sur vos produits</p>
                </div>
            ) : (
                <div style={S.list}>
                    {notifications.map(n => {
                        const { color, bg } = getIcon(n.message);
                        return (
                            <div
                                key={n._id}
                                style={{
                                    ...S.card,
                                    borderLeft: `4px solid ${color}`,
                                    backgroundColor: n.read ? '#fff' : '#FAFBFF',
                                    opacity: n.read ? 0.85 : 1
                                }}
                            >
                                {/* Icône */}
                                <div style={{ ...S.iconBox, backgroundColor: bg, color }}>
                                    {getIcon(n.message).icon}
                                </div>

                                {/* Contenu */}
                                <div style={S.cardBody}>
                                    {n.productName && (
                                        <p style={S.productName}>📦 {n.productName}</p>
                                    )}
                                    <p style={S.message}>{n.message}</p>
                                    <div style={S.cardMeta}>
                                        {n.agentName && (
                                            <span style={S.agentName}>👤 {n.agentName}</span>
                                        )}
                                        <span style={S.date}>{formatDate(n.date || n.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={S.cardActions}>
                                    {!n.read && (
                                        <button
                                            onClick={() => markAsRead(n._id)}
                                            style={S.btnRead}
                                            title="Marquer comme lu"
                                        >
                                            ✓
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(n._id)}
                                        style={S.btnDelete}
                                        title="Supprimer"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                {/* Point non lu */}
                                {!n.read && <div style={S.unreadDot} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
    page: {
        padding: '8px 0',
        fontFamily: 'sans-serif',
        maxWidth: 700
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 10
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
    },
    headerIcon: {
        fontSize: 24
    },
    headerTitle: {
        margin: 0,
        fontSize: 22,
        fontWeight: 700,
        color: '#222'
    },
    headerBadge: {
        backgroundColor: '#f44336',
        color: '#fff',
        borderRadius: 12,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 700
    },
    headerActions: {
        display: 'flex',
        gap: 8,
        alignItems: 'center'
    },
    btnRefresh: {
        background: 'none',
        border: '1px solid #ddd',
        borderRadius: 6,
        padding: '6px 10px',
        cursor: 'pointer',
        fontSize: 16
    },
    btnMarkAll: {
        backgroundColor: '#1976D2',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        padding: '7px 14px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600
    },
    center: {
        textAlign: 'center',
        padding: '60px 20px'
    },
    loadingText: {
        color: '#888',
        fontSize: 15
    },
    emptyIcon: {
        fontSize: 52,
        marginBottom: 12
    },
    emptyText: {
        fontSize: 17,
        fontWeight: 600,
        color: '#444',
        margin: '0 0 6px'
    },
    emptySubText: {
        fontSize: 13,
        color: '#888',
        margin: 0
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10
    },
    card: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 10,
        border: '1px solid #eee',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        position: 'relative',
        transition: 'box-shadow .2s'
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        flexShrink: 0
    },
    cardBody: {
        flex: 1,
        minWidth: 0
    },
    productName: {
        margin: '0 0 4px',
        fontSize: 13,
        fontWeight: 700,
        color: '#333'
    },
    message: {
        margin: '0 0 6px',
        fontSize: 14,
        color: '#444',
        lineHeight: 1.5
    },
    cardMeta: {
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    agentName: {
        fontSize: 12,
        color: '#888'
    },
    date: {
        fontSize: 12,
        color: '#aaa'
    },
    cardActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        flexShrink: 0
    },
    btnRead: {
        background: 'none',
        border: '1px solid #4CAF50',
        color: '#4CAF50',
        borderRadius: 6,
        padding: '4px 8px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 700
    },
    btnDelete: {
        background: 'none',
        border: '1px solid #eee',
        borderRadius: 6,
        padding: '4px 8px',
        cursor: 'pointer',
        fontSize: 13
    },
    unreadDot: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: '#1976D2'
    }
};

export default Notifications;

// ── Hook réutilisable pour compter les non lus (à importer dans Sidebar) ──────
export const useUnreadCount = (userId) => {
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
        if (!userId) return;
        const fetchCount = async () => {
            try {
                const res = await fetch(`/api/notifications?recipientId=${userId}&unread=true`);
                const data = await res.json().catch(() => []);
                if (res.ok) setCount(Array.isArray(data) ? data.filter(n => !n.read).length : 0);
            } catch { setCount(0); }
        };
        fetchCount();
        // Polling toutes les 30 secondes
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    return count;
};
