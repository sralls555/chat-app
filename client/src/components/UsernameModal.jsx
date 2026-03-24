import { useState } from 'react';
import styles from './UsernameModal.module.css';

export default function UsernameModal({ onSubmit }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Please enter a username');
      return;
    }
    if (trimmed.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    if (trimmed.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }
    if (!/^[a-zA-Z0-9_\-. ]+$/.test(trimmed)) {
      setError('Username can only contain letters, numbers, spaces, dots, hyphens and underscores');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>💬</span>
          <h1 className={styles.logoText}>Chatter</h1>
        </div>
        <p className={styles.subtitle}>Real-time messaging for your team</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label} htmlFor="username-input">
            Choose a username to get started
          </label>
          <input
            id="username-input"
            className={styles.input}
            type="text"
            placeholder="e.g. john_doe"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
            autoFocus
            maxLength={20}
            autoComplete="off"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button}>
            Enter Chat
          </button>
        </form>
      </div>
    </div>
  );
}
