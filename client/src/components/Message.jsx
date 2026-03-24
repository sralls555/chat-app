import { useState, useRef } from 'react';
import styles from './Message.module.css';

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

export function DateDivider({ timestamp }) {
  return (
    <div className={styles.dateDivider}>
      <span className={styles.dateLine} />
      <span className={styles.dateText}>{formatDate(timestamp)}</span>
      <span className={styles.dateLine} />
    </div>
  );
}

const SWIPE_THRESHOLD = 60;
const SWIPE_MAX = 80;

export default function Message({ message, isOwn, showAvatar, onReply }) {
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const dragging = useRef(false);
  const lockAxis = useRef(null); // 'x' | 'y' | null

  if (message.type === 'system') {
    return (
      <div className={styles.systemMsg}>
        <span className={styles.systemText}>{message.text}</span>
        <span className={styles.systemTime}>{formatTime(message.timestamp)}</span>
      </div>
    );
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    dragging.current = true;
    lockAxis.current = null;
  };

  const handleTouchMove = (e) => {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Determine axis lock after first meaningful movement
    if (!lockAxis.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5) {
        lockAxis.current = 'x';
      } else if (Math.abs(dy) > 5) {
        lockAxis.current = 'y';
        return;
      } else {
        return;
      }
    }

    if (lockAxis.current !== 'x') return;

    // Only allow rightward swipe
    if (dx > 0) {
      e.preventDefault(); // prevent scroll while swiping
      setSwipeX(Math.min(dx, SWIPE_MAX));
    } else {
      setSwipeX(0);
    }
  };

  const handleTouchEnd = () => {
    if (swipeX >= SWIPE_THRESHOLD && onReply) {
      onReply(message);
    }
    setSwipeX(0);
    dragging.current = false;
    lockAxis.current = null;
  };

  const replyIconOpacity = Math.min(swipeX / SWIPE_THRESHOLD, 1);
  const replyIconScale = 0.6 + 0.4 * Math.min(swipeX / SWIPE_THRESHOLD, 1);

  return (
    <div
      className={styles.swipeWrapper}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Reply icon revealed behind message */}
      <div
        className={styles.replyIcon}
        style={{ opacity: replyIconOpacity, transform: `scale(${replyIconScale})` }}
      >
        ↩
      </div>

      {/* Sliding message row */}
      <div
        className={`${styles.message} ${isOwn ? styles.own : ''}`}
        style={{
          transform: swipeX > 0 ? `translateX(${swipeX}px)` : undefined,
          transition: swipeX === 0 ? 'transform 0.2s ease' : 'none',
        }}
      >
        {!isOwn && showAvatar && (
          <div className={styles.avatar}>
            {message.username[0].toUpperCase()}
          </div>
        )}
        {!isOwn && !showAvatar && <div className={styles.avatarSpacer} />}

        <div className={styles.content}>
          {showAvatar && (
            <div className={styles.meta}>
              <span
                className={styles.username}
                style={{ color: isOwn ? 'var(--accent-light)' : getUserColor(message.username) }}
              >
                {isOwn ? 'You' : message.username}
              </span>
              <span className={styles.time}>{formatTime(message.timestamp)}</span>
            </div>
          )}

          <div className={`${styles.bubble} ${isOwn ? styles.ownBubble : styles.otherBubble} ${!showAvatar && !message.replyTo ? styles.continuation : ''}`}>
            {/* Quoted reply preview inside bubble */}
            {message.replyTo && (
              <div className={`${styles.replyQuote} ${isOwn ? styles.replyQuoteOwn : ''}`}>
                <span className={styles.replyQuoteName}>{message.replyTo.username}</span>
                <p className={styles.replyQuoteText}>
                  {message.replyTo.text.length > 80
                    ? message.replyTo.text.slice(0, 80) + '…'
                    : message.replyTo.text}
                </p>
              </div>
            )}
            {/* Wrap text + inline timestamp together */}
            <div className={`${!showAvatar && !message.replyTo ? styles.textRow : ''}`}>
              <p className={styles.text}>{message.text}</p>
              {!showAvatar && (
                <span className={styles.timeInline}>{formatTime(message.timestamp)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getUserColor(username) {
  const colors = [
    '#e67e73', '#f0a500', '#5dca77', '#4db6e0',
    '#a78bfa', '#fb923c', '#34d399', '#60a5fa',
    '#f472b6', '#a3e635',
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
