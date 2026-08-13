import { useEffect, useRef, useState } from 'react'
import { sendChat } from '../api/chat.js'
import VehicleArt from './VehicleArt.jsx'

const GREETING = {
  role: 'assistant',
  content:
    "Ayubowan! 🙏 Planning a trip around Sri Lanka? Ask me about places to visit or which vehicle to book — I'm happy to help!",
}

const SUGGESTIONS = [
  'Which vehicle should I rent for Ella?',
  'Plan a 3-day trip from Colombo',
  'Is a tuk-tuk good for the south coast?',
]

const MAX_INPUT_LENGTH = 1000

function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Escape closes the panel from anywhere inside it.
  useEffect(() => {
    if (!open) return

    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open])

  async function send(text) {
    const content = text.trim()
    if (!content || loading) return

    const nextMessages = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const { reply } = await sendChat(nextMessages)
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit() {
    send(input)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send(input)
    }
  }

  const showSuggestions = messages.length === 1 && !loading

  return (
    <div className="chat-widget">
      {open && (
        <section className="chat-panel" role="dialog" aria-label="EazyRents travel assistant">
          <header className="chat-panel__header">
            <VehicleArt type="tuktuk" className="chat-panel__art" />
            <div>
              <p className="chat-panel__title">Trip Buddy</p>
              <p className="chat-panel__subtitle">Your Sri Lanka travel assistant</p>
            </div>
            <button
              type="button"
              className="chat-panel__close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              {'\u2715'}
            </button>
          </header>

          <div className="chat-panel__messages" ref={scrollRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === 'user'
                    ? 'chat-bubble chat-bubble--user'
                    : 'chat-bubble chat-bubble--assistant'
                }
              >
                {message.content}
              </div>
            ))}

            {loading && (
              <div className="chat-bubble chat-bubble--assistant chat-bubble--typing" aria-label="Assistant is typing">
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
              </div>
            )}

            {error && <p className="chat-error">{error}</p>}

            {showSuggestions && (
              <div className="chat-suggestions">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="chat-suggestion"
                    onClick={() => send(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="chat-panel__composer">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Ask about places, vehicles…"
              value={input}
              maxLength={MAX_INPUT_LENGTH}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Type your message"
            />
            <button
              type="button"
              className="btn btn--primary btn--small chat-send"
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </section>
      )}

      <button
        type="button"
        className={open ? 'chat-fab chat-fab--open' : 'chat-fab'}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Close travel assistant' : 'Open travel assistant'}
      >
        <VehicleArt type="tuktuk" className="chat-fab__art" />
      </button>
    </div>
  )
}

export default ChatWidget
