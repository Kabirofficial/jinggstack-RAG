import { useState, useEffect, useRef } from "react";
import axios from "axios";
import userIcon from "../assets/user.svg";
import botIcon from "/logo.png";
import logo from "/logo.png";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const SENDER_TYPES = {
  USER: "user",
  BOT: "bot",
};

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { sender: SENDER_TYPES.USER, text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/ask`, { query: userMessage.text });
      const botReply = res.data?.answer || "Sorry, I couldn't get a response from the server.";
      setMessages((prev) => [...prev, { sender: SENDER_TYPES.BOT, text: botReply }]);
    } catch (e) {
      console.error("Error sending message:", e);
      setMessages((prev) => [
        ...prev,
        { sender: SENDER_TYPES.BOT, text: "Oops! Something went wrong. Please try again later. Check your network connection." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0D0D1A] to-[#1A1A2E] p-4 font-sans text-gray-100">
      <div className="w-full max-w-xl lg:max-w-2xl bg-[#24243A] rounded-3xl shadow-2xl flex flex-col h-[85vh] border border-[#3A3A5E]">
        <div className="p-4 border-b border-[#3A3A5E] text-center font-extrabold text-xl text-[#A879FF] bg-[#131320] rounded-t-3xl flex items-center justify-center gap-3 shadow-inner">
          <img src={logo} alt="JinggStack AI Logo" className="h-10 w-10 object-contain" />
          <span>JinggStack AI Chat Assistant</span>
        </div>

        <div
          className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
          aria-live="polite"
          aria-atomic="false"
        >
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 text-lg md:text-xl py-10 px-4">
              <img src={botIcon} alt="Bot Welcome" className="w-24 h-24 mb-4 rounded-full object-contain border border-[#A879FF] p-1 bg-gradient-to-br from-[#A879FF] to-[#C29FFF] animate-pulse" />
              <p className="text-gray-300 font-semibold mb-2">Hello! I'm JinggStack AI.</p>
              <p>Ask me anything about web development, programming, or general knowledge!</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-end gap-3 animate-fade-in ${msg.sender === SENDER_TYPES.USER ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === SENDER_TYPES.BOT && (
                <img
                  src={botIcon}
                  alt="Chatbot Avatar"
                  className="w-9 h-9 rounded-full flex-shrink-0 object-cover border border-[#A879FF] p-[1px] bg-gradient-to-br from-[#A879FF] to-[#C29FFF]"
                />
              )}
              <div
                className={`px-5 py-3 rounded-3xl max-w-[75%] text-sm md:text-base leading-relaxed break-words relative 
                  ${msg.sender === SENDER_TYPES.USER
                    ? "bg-gradient-to-r from-[#00E5FF] to-[#009DFF] text-white shadow-lg shadow-[#00E5FF]/30 rounded-br-none hover:scale-[1.02] transition-transform"
                    : "bg-gradient-to-r from-[#A879FF] to-[#C29FFF] text-white shadow-lg shadow-[#A879FF]/30 rounded-bl-none hover:scale-[1.02] transition-transform"
                  }`}
              >
                {msg.text}
              </div>
              {msg.sender === SENDER_TYPES.USER && (
                <img
                  src={userIcon}
                  alt="User Avatar"
                  className="w-9 h-9 rounded-full flex-shrink-0 object-cover border border-[#00E5FF] p-[1px] bg-gradient-to-br from-[#00E5FF] to-[#009DFF]"
                />
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-end justify-start gap-3 animate-fade-in">
              <img
                src={botIcon}
                alt="Chatbot is thinking"
                className="w-9 h-9 rounded-full flex-shrink-0 object-cover border border-[#A879FF] p-[1px] bg-gradient-to-br from-[#A879FF] to-[#C29FFF]"
              />
              <div className="px-5 py-3 rounded-3xl bg-gradient-to-r from-[#A879FF] to-[#C29FFF] text-white flex items-center gap-2 shadow-lg shadow-[#A879FF]/30 rounded-bl-none">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </div>
                <span className="ml-1 text-sm text-gray-200">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-[#3A3A5E] flex gap-3 bg-[#131320] rounded-b-3xl">
          <input
            type="text"
            placeholder="Ask me anything..."
            aria-label="Ask me anything input field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-5 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-[#A879FF] bg-[#1C1C2C] text-white placeholder-gray-400 border border-[#3A3A5E] text-sm md:text-base transition-all duration-200 ease-in-out"
            disabled={loading}
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-[#A879FF] to-[#C29FFF] text-white font-semibold rounded-full hover:from-[#9568FF] hover:to-[#B08FFF] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#A879FF]/30 transition-all duration-200 ease-in-out text-sm md:text-base flex items-center justify-center gap-2"
            aria-label={loading ? "Sending message" : "Send message"}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <span>Send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;