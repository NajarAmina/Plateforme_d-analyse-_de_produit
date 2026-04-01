import React from 'react';
import { useUnreadCount } from './Notifications';

const Sidebar = ({ activeTab, setActiveTab, handleLogout, user }) => {
    // Compteur de notifications non lues (polling 30s)
    const unreadCount = useUnreadCount(user?.id);

    const menuItems = [
        { key: 'addProduct',     label: 'Ajouter Produit',  icon: '➕' },
        { key: 'myProducts',     label: 'Mes Produits',     icon: '📦' },
        { key: 'messages',       label: 'Messages',         icon: '💬' },
        {
            key: 'notifications',
            label: 'Notifications',
            icon: '🔔',
            badge: unreadCount > 0 ? unreadCount : null
        },
    ];

    return (
        <div style={styles.sidebar}>
            <h2 style={styles.title}>Espace Fournisseur</h2>

            <nav style={styles.nav}>
                {menuItems.map(item => (
                    <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key)}
                        style={activeTab === item.key ? styles.activeButton : styles.menuButton}
                    >
                        <span style={styles.btnContent}>
                            <span>{item.icon} {item.label}</span>
                            {item.badge && (
                                <span style={styles.badge}>{item.badge > 99 ? '99+' : item.badge}</span>
                            )}
                        </span>
                    </button>
                ))}
            </nav>

            <button onClick={handleLogout} style={styles.logoutButton}>
                🚪 Déconnexion
            </button>
        </div>
    );
};

const styles = {
    sidebar: {
        width: '250px',
        minHeight: '100vh',
        backgroundColor: '#1976D2',
        color: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
    },
    title: {
        margin: '0 0 24px',
        fontSize: 18,
        fontWeight: 700,
        color: '#fff'
    },
    nav: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        flex: 1
    },
    menuButton: {
        width: '100%',
        padding: '12px 14px',
        backgroundColor: 'transparent',
        border: '2px solid rgba(255,255,255,0.5)',
        color: 'white',
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: 14,
        transition: 'border-color .2s, background .2s'
    },
    activeButton: {
        width: '100%',
        padding: '12px 14px',
        backgroundColor: 'white',
        color: '#1976D2',
        border: '2px solid white',
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'left',
        fontWeight: 700,
        fontSize: 14
    },
    btnContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
    },
    badge: {
        backgroundColor: '#f44336',
        color: '#fff',
        borderRadius: 10,
        padding: '1px 7px',
        fontSize: 11,
        fontWeight: 700,
        minWidth: 18,
        textAlign: 'center'
    },
    logoutButton: {
        marginTop: '20px',
        padding: '12px',
        width: '100%',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: 14
    }
};

export default Sidebar;
