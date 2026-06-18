"use client"

import { useState, useEffect, useRef, FormEvent } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Wifi, WifiOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { MessageWithSender } from "@/types/intervention"
import type { StatutIntervention } from "@/types/demande"

type RealtimePayload<T> = {
  new: T
}

interface ChatTabProps {
  interventionId: number
  currentUserId: string
  statut: StatutIntervention
}

export function ChatTab({ interventionId, currentUserId, statut }: ChatTabProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "open" | "closed" | "error">("connecting")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const isTerminatedOrCancelled = statut === "TERMINEE" || statut === "ANNULEE"

  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/interventions/${interventionId}/messages`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data)
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()

    const channel = supabase
      .channel(`intervention:${interventionId}:messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `interventionId=eq.${interventionId}`,
        },
        (payload: RealtimePayload<MessageWithSender>) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id)
            if (exists) return prev.map((m) => (m.id === payload.new.id ? payload.new : m))
            return [...prev, payload.new]
          })
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("open")
        } else if (status === "CLOSED") {
          setConnectionStatus("closed")
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("error")
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [interventionId])

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scrollarea-viewport]")
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      }
    }

    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending || isTerminatedOrCancelled) return

    setIsSending(true)
    try {
      const res = await fetch(`/api/interventions/${interventionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: newMessage }),
      })

      if (res.ok) {
        const updated = await res.json()
        setMessages((prev) => [...prev, updated])
        setNewMessage("")
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Chargement des messages...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Discussion
          </span>
          <Badge
            variant={connectionStatus === "open" ? "outline" : "secondary"}
            className="text-xs"
          >
            {connectionStatus === "open" ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Connecté
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                {connectionStatus === "connecting" ? "Connexion..." : "Déconnecté"}
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-center text-muted-foreground">
              Aucun message. Démarrez la discussion.
            </p>
          </div>
        ) : (
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === currentUserId

                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwnMessage && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.sender.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(message.sender.firstName, message.sender.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {message.sender.firstName} {message.sender.lastName}
                        </span>
                        {isOwnMessage && message.lu && (
                          <span className="text-xs opacity-70">Lu</span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.contenu}
                      </p>
                      <p className="text-xs opacity-70 mt-1 text-right">
                        {format(new Date(message.createdAt), "HH:mm", { locale: fr })}
                      </p>
                    </div>

                    {isOwnMessage && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.sender.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(message.sender.firstName, message.sender.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              placeholder={
                isTerminatedOrCancelled
                  ? "Chat désactivé - intervention terminée ou annulée"
                  : "Écrire un message..."
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending || isTerminatedOrCancelled}
              rows={2}
              className="flex-1 min-h-[40px] resize-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || isSending || isTerminatedOrCancelled}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}