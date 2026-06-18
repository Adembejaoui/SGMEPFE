"use client"

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Send, Loader2, AlertTriangle, CheckCircle, Wrench, X } from "lucide-react"
import type { AiChatSessionWithMessages, AiMessage } from "@/types/intervention"

interface AiChatTabProps {
  interventionId: number
  technicianId: string
}

type Phase = "IDLE" | "LOADING" | "SENDING" | "ERROR"

export function AiChatTab({ interventionId, technicianId }: AiChatTabProps) {
  const [session, setSession] = useState<AiChatSessionWithMessages | null>(null)
  const [equipmentType, setEquipmentType] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [phase, setPhase] = useState<Phase>("IDLE")
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isLoading = phase === "LOADING" || phase === "SENDING"

  useEffect(() => {
    fetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interventionId, technicianId])

  // Auto-scroll to bottom whenever messages change or sending state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [session?.messages, phase])

  const fetchSession = async () => {
    setPhase("LOADING")
    setError(null)
    try {
      const res = await fetch(`/api/interventions/${interventionId}/ai-chat`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur inconnue" }))
        throw new Error(data.error || "Erreur API")
      }
      const data = await res.json()
      setSession(data.session)
      setEquipmentType(data.equipmentType)
    } catch (err: any) {
      console.error("Error loading AI chat session:", err)
      setError(err.message || "Impossible de charger la session")
      setSession(null)
    } finally {
      setPhase("IDLE")
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = newMessage.trim()
    if (!trimmed || isLoading || !session) return

    setError(null)
    setPhase("SENDING")

    // Optimistic update: show the technician's message immediately
    const optimisticMessage: AiMessage = {
      id: `temp-${Date.now()}`,
      role: "TECHNICIEN",
      contenu: trimmed,
      createdAt: new Date().toISOString(),
      diagnostic: null,
      suggestedActions: null,
    } as unknown as AiMessage

    setSession((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimisticMessage] } : prev
    )
    setNewMessage("")

    try {
      const res = await fetch(`/api/interventions/${interventionId}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur inconnue" }))
        throw new Error(data.error || "Erreur API")
      }

      const data = await res.json()
      setSession(data.session)
    } catch (err: any) {
      console.error("Error sending AI message:", err)
      setError(err.message || "Impossible d'envoyer le message")
      // Roll back optimistic message on failure
      setSession((prev) =>
        prev
          ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimisticMessage.id) }
          : prev
      )
      setNewMessage(trimmed)
    } finally {
      setPhase("IDLE")
    }
  }

  // Submit on Enter, allow newline with Shift+Enter
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  const isAssistant = (message: AiMessage) => message.role === "ASSISTANT"
  const isTechnician = (message: AiMessage) => message.role === "TECHNICIEN"

  const renderDiagnosticBadge = (message: AiMessage) => {
    if (!message.diagnostic || !isAssistant(message)) return null
    return (
      <Badge variant="secondary" className="mt-2 flex items-center gap-1 w-fit">
        <AlertTriangle className="w-3 h-3" />
        <span>{message.diagnostic}</span>
      </Badge>
    )
  }

  const renderSuggestedActions = (message: AiMessage) => {
    if (!message.suggestedActions || !isAssistant(message)) return null
    const actions = message.suggestedActions.split("\n").filter(Boolean)
    if (actions.length === 0) return null
    return (
      <div className="mt-2 p-2 rounded-md bg-muted/50 border">
        <p className="text-xs font-medium text-muted-foreground mb-1">Actions suggérées :</p>
        <ul className="text-xs space-y-1">
          {actions.map((action, i) => (
            <li key={i} className="flex gap-2">
              <CheckCircle className="w-3 h-3 mt-0.5 shrink-0 text-green-600" />
              <span>{action.replace(/^•\s*/, "")}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")

  const parseMarkdown = (text: string) => {
    let html = escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-sm mt-2 mb-1">$1</h3>')
      .replace(/^(•\s.+)$/gm, (match) => `<span class="flex gap-2"><span class="text-muted-foreground select-none">•</span><span>${match.replace(/^•\s*/, "")}</span></span>`)
      .replace(/^(\d+\.\s.+)$/gm, (match) => {
        const num = match.match(/^(\d+\.)/)?.[1] ?? ""
        return `<span class="flex gap-2"><span class="text-muted-foreground select-none">${num}</span><span>${match.replace(/^\d+\.\s*/, "")}</span></span>`
      })
      .replace(/\n/g, "<br/>")
    return { __html: html }
  }

  if (phase === "LOADING" && !session) {
    return (
      <Card className="flex flex-col h-[500px]">
        <CardContent className="flex-1 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Initialisation de l'assistant...</p>
        </CardContent>
      </Card>
    )
  }

  if (!session || (error && !session)) {
    return (
      <Card className="flex flex-col h-[500px]">
        <CardContent className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <p className="text-sm text-center text-destructive">{error || "Impossible de charger l'assistant"}</p>
          <Button variant="outline" onClick={fetchSession} className="mt-2">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    )
  }

  const messages = session.messages

  return (
    <Card className="flex flex-col h-[500px] overflow-hidden">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            Assistant IA — Diagnostic
          </span>
          {equipmentType && (
            <Badge variant="secondary" className="text-xs">
              {equipmentType}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-center font-medium">Assistant Diagnostic</p>
            <p className="text-center text-sm text-muted-foreground mt-1">
              Décrivez la panne et je vous aiderai à trouver la cause.
            </p>
          </div>
        ) : (
          <ScrollArea ref={scrollRef} className="flex-1 px-4 min-h-0">
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isOwnMessage = isTechnician(message)
                const isPending = String(message.id).startsWith("temp-")

                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwnMessage && (
                      <Avatar className="w-8 h-8 bg-muted shrink-0">
                        <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                          <Wrench className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      } ${isPending ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {isOwnMessage ? "Vous" : "Assistant IA"}
                        </span>
                      </div>

                      {isAssistant(message) ? (
                        <div
                          className="text-sm whitespace-pre-wrap break-words prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={parseMarkdown(message.contenu)}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.contenu}</p>
                      )}

                      {renderDiagnosticBadge(message)}
                      {renderSuggestedActions(message)}

                      <p className="text-xs opacity-70 mt-1 text-right">
                        {format(new Date(message.createdAt), "HH:mm", { locale: fr })}
                      </p>
                    </div>

                    {isOwnMessage && (
                      <Avatar className="w-8 h-8 bg-primary shrink-0">
                        <AvatarFallback className="text-xs font-bold text-primary-foreground">
                          <MessageSquare className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )
              })}

              {phase === "SENDING" && (
                <div className="flex gap-2 justify-start">
                  <Avatar className="w-8 h-8 bg-muted shrink-0">
                    <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                      <Wrench className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-xs text-muted-foreground">L'assistant réfléchit...</span>
                  </div>
                </div>
              )}

              {/* Anchor for auto-scroll */}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}

        {error && (
          <div className="px-4 py-2 shrink-0">
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto h-auto p-1"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 border-t shrink-0">
          <div className="flex gap-2">
            <Textarea
              placeholder="Décrivez la panne, les symptômes observés... (Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne)"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={2}
              className="flex-1 min-h-[40px] resize-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || isLoading}
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}