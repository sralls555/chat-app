import styles from './Sidebar.module.css';

const ROOMS = ['General', 'Random', 'Dev', 'MoonStar'];

export default function Sidebar({ currentRoom, onRoomChange, username, connected, isOpen }) {
  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <span className={styles.logo}>💬</span>
        <span className={styles.appName}>Chatter</span>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Channels</h3>
        <ul className={styles.roomList}>
          {ROOMS.map((room) => (
            <li key={room}>
              <button
                className={`${styles.roomBtn} ${currentRoom === room ? styles.active : ''}`}
                onClick={() => onRoomChange(room)}
              >
                <span className={styles.hash}>#</span>
                <span className={styles.roomName}>{room.toLowerCase()}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.userArea}>
        <div className={`${styles.statusDot} ${connected ? styles.online : styles.offline}`} />
        <div className={styles.userInfo}>
          <span className={styles.usernameText}>{username}</span>
          <span className={styles.statusText}>{connected ? 'Online' : 'Connecting...'}</span>
        </div>
      </div>
    </aside>
  );
}
