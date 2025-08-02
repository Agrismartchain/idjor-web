import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useChat(sessionId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  // 1) Charger l’historique Supabase
  useEffect(() => {
    if (!sessionId) return
    supabase
      .from('messages')
      .select('role,content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data || []))
  }, [sessionId])

  // 2) Envoyer l’historique + nouveau message
  const sendMessage = async (content) => {
    if (!sessionId || !content) return
    setLoading(true)

    // a) ajouter localement le message user
    const userMsg = { role: 'user', content }
    setMessages((m) => [...m, userMsg])

    // b) construire payload complet
    const payload = {
      sessionId,
      messages: [...messages, userMsg]
    }

    // c) appel au proxy
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      console.error('API error', await res.text())
      setLoading(false)
      return
    }

    const { reply } = await res.json()

    // d) ajouter localement la réponse bot
    const botMsg = { role: 'assistant', content: reply }
    setMessages((m) => [...m, botMsg])
    setLoading(false)
  }

  return { messages, sendMessage, loading }
}
