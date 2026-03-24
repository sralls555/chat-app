import styles from './TypingIndicator.module.css';

export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return null;

  let label;
  if (typingUsers.length === 1) {
    label = `${typingUsers[0]} is typing`;
  } else if (typingUsers.length === 2) {
    label = `${typingUsers[0]} and ${typingUsers[1]} are typing`;
  } else {
    label = `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
