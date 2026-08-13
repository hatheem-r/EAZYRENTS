import { post } from './client.js'

// The server is stateless: send the whole visible conversation every time.
// It accepts at most 20 messages, so trim to the most recent turns here.
const MAX_MESSAGES = 20

export function sendChat(messages) {
  return post('/chat', { messages: messages.slice(-MAX_MESSAGES) })
}