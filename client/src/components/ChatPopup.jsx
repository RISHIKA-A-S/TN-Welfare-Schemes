import React, { useRef, useEffect } from 'react';
import Chatbot from './Chatbot';
import './popup.css';

const ChatPopup = ({ show, onClose }) => {
  const modalRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose(); // Close on outside click
      }
    };
    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="chatbot-modal-overlay">
      <div className="chatbot-modal-content" ref={modalRef}>
        <button className="chatbot-close-btn" onClick={onClose}>×</button>
        <Chatbot />
      </div>
    </div>
  );
};

export default ChatPopup;
