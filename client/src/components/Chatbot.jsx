import React, { useState } from 'react';
import './chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const getTime = () => {
    const date = new Date();
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;

    const userMsg = { sender: 'user', text: msg, time: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setMsg('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg }),
      });

      const data = await res.json();
      const botText = data?.response?.trim();
      if (botText) {
        const botMsg = { sender: 'bot', text: botText, time: getTime() };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error('Error fetching chatbot response:', err);
      const errorMsg = { sender: 'bot', text: "⚠️ Failed to get response.", time: getTime() };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
      <div className="card">
        <div className="card-header msg_head">
          <div className="d-flex bd-highlight">
            <div className="img_cont">
              <img
                src="https://cdn-icons-png.flaticon.com/512/10554/10554290.png"
                className="user_img"
                alt="bot"
              />
            </div>
            <div className="user_info ml-3">
              <span>Welfare Schemes Chatbot</span>
              <p>Get info on government benefits & schemes</p>
            </div>
          </div>
        </div>

        <div className="card-body msg_card_body" id="messageFormeight">
          {messages
            .filter((m) => m.text && m.text.trim() !== '')
            .map((m, i) => (
              <div
                key={i}
                className={`d-flex justify-content-${m.sender === 'user' ? 'end' : 'start'} mb-4`}
              >
                {m.sender === 'bot' && (
                  <div className="img_cont_msg">
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/1144/1144760.png"
                      className="user_img_msg"
                      alt="bot"
                    />
                  </div>
                )}
                <div className={m.sender === 'user' ? 'msg_cotainer_send' : 'msg_cotainer'}>
                  {m.text}
                  <span className={m.sender === 'user' ? 'msg_time_send' : 'msg_time'}>
                    {m.time}
                  </span>
                </div>
                {m.sender === 'user' && (
                  <div className="img_cont_msg">
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/10817/10817417.png"
                      className="user_img_msg"
                      alt="user"
                    />
                  </div>
                )}
              </div>
            ))}
          {loading && (
            <div id="loading" className="text-center my-2">
              <img
                src="https://i.gifer.com/ZZ5H.gif"
                width="50"
                alt="Loading..."
              />
            </div>
          )}
        </div>

        <div className="card-footer">
          <form className="chat-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Type your question..."
              className="type_msg"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              required
            />
            <button type="submit" className="send_btn">
              <i className="fas fa-paper-plane" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
