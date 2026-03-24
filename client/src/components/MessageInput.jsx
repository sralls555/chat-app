import { useState, useRef, useEffect } from 'react';
import styles from './MessageInput.module.css';

export default function MessageInput({ onSend, currentRoom, disabled, replyTo, onCancelReply, onTyping, onStopTyping }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const isTypingRef = useRef(false);
  const stopTypingTimer = useRef(null);

  // Clear typing state when unmounted or room changes
  useEffect(() => {
    return () => {
      clearTimeout(stopTypingTimer.current);
      if (isTypingRef.current && onStopTyping) {
        onStopTyping();
        isTypingRef.current = false;
      }
    };
  }, [currentRoom, onStopTyping]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, replyTo || null);
    setText('');
    if (onCancelReply) onCancelReply();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    // Stop typing indicator immediately on send
    clearTimeout(stopTypingTimer.current);
    if (isTypingRef.current && onStopTyping) {
      onStopTyping();
      isTypingRef.current = false;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setText(val);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
    // Typing events
    if (val.trim()) {
      if (!isTypingRef.current && onTyping) {
        onTyping();
        isTypingRef.current = true;
      }
      // Reset stop-typing debounce
      clearTimeout(stopTypingTimer.current);
      stopTypingTimer.current = setTimeout(() => {
        if (isTypingRef.current && onStopTyping) {
          onStopTyping();
          isTypingRef.current = false;
        }
      }, 2000);
    } else {
      clearTimeout(stopTypingTimer.current);
      if (isTypingRef.current && onStopTyping) {
        onStopTyping();
        isTypingRef.current = false;
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Reply preview bar */}
      {replyTo && (
        <div className={styles.replyBar}>
          <div className={styles.replyBarInner}>
            <span className={styles.replyBarIcon}>↩</span>
            <div className={styles.replyBarContent}>
              <span className={styles.replyBarName}>Replying to {replyTo.username}</span>
              <span className={styles.replyBarText}>
                {replyTo.text.length > 60 ? replyTo.text.slice(0, 60) + '…' : replyTo.text}
              </span>
            </div>
          </div>
          <button
            className={styles.replyBarClose}
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >✕</button>
        </div>
      )}

      <div className={`${styles.inputBox} ${disabled ? styles.disabled : ''}`}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder={disabled ? 'Connecting...' : `Message #${currentRoom.toLowerCase()}`}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          maxLength={2000}
        />
        <button
          className={`${styles.sendBtn} ${text.trim() && !disabled ? styles.active : ''}`}
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          title="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <p className={styles.hint}>
        Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
