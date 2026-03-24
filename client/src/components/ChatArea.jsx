import { useEffect, useRef } from 'react';
import Message, { DateDivider } from './Message.jsx';
import styles from './ChatArea.module.css';

function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function isSameAuthorAndClose(a, b) {
  if (!a || !b) return false;
  if (a.type === 'system' || b.type === 'system') return false;
  if (a.username !== b.username) return false;
  // Within 5 minutes
  return Math.abs(new Date(b.timestamp) - new Date(a.timestamp)) < 5 * 60 * 1000;
}

export default function ChatArea({ messages, username, currentRoom, onReply }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>#</div>
        <h2 className={styles.emptyTitle}>Welcome to #{currentRoom.toLowerCase()}!</h2>
        <p className={styles.emptyText}>This is the start of the #{currentRoom.toLowerCase()} channel. Say hello!</p>
      </div>
    );
  }

  const items = [];
  let lastDate = null;

  messages.forEach((msg, i) => {
    const msgDate = msg.timestamp;

    // Date divider
    if (!lastDate || !isSameDay(lastDate, msgDate)) {
      items.push({ type: 'date', timestamp: msgDate, key: `date-${i}` });
      lastDate = msgDate;
    }

    const prev = messages[i - 1];
    const showAvatar = !isSameAuthorAndClose(prev, msg);
    items.push({ type: 'message', msg, showAvatar, key: msg.id || `msg-${i}` });
  });

  return (
    <div className={styles.container} ref={containerRef}>
      {items.map((item) => {
        if (item.type === 'date') {
          return <DateDivider key={item.key} timestamp={item.timestamp} />;
        }
        return (
          <Message
            key={item.key}
            message={item.msg}
            isOwn={item.msg.username === username}
            showAvatar={item.showAvatar}
            onReply={onReply}
          />
        );
      })}
      <div ref={bottomRef} className={styles.anchor} />
    </div>
  );
}
