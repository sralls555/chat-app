import { useState } from 'react';
import styles from './OnlineUsers.module.css';

export default function OnlineUsers({ users }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Desktop side panel */}
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>Online — {users.length}</h3>
        </div>
        <ul className={styles.list}>
          {users.length === 0 ? (
            <li className={styles.empty}>No users online</li>
          ) : (
            users.map((user) => (
              <li key={user} className={styles.userItem}>
                <span className={styles.avatar}>{user[0].toUpperCase()}</span>
                <span className={styles.username}>{user}</span>
                <span className={styles.dot} />
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Mobile: pill button in header area */}
      <button
        className={styles.mobileBtn}
        onClick={() => setDrawerOpen(true)}
        aria-label="Show online users"
      >
        <span className={styles.mobileDot} />
        {users.length}
      </button>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Online — {users.length}</h3>
              <button className={styles.closeBtn} onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            <ul className={styles.drawerList}>
              {users.length === 0 ? (
                <li className={styles.empty}>No users online</li>
              ) : (
                users.map((user) => (
                  <li key={user} className={styles.userItem}>
                    <span className={styles.avatar}>{user[0].toUpperCase()}</span>
                    <span className={styles.username}>{user}</span>
                    <span className={styles.dot} />
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
