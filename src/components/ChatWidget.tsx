import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { callOpenAI, ChatMessage } from "@/lib/openai";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

// 세션 ID 가져오기 또는 생성
const getSessionId = (): string => {
  let sessionId = localStorage.getItem("chatbot_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("chatbot_session_id", sessionId);
  }
  return sessionId;
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = getSessionId();
  const channelRef = useRef<any>(null);

  // Supabase에서 메시지 로드
  useEffect(() => {
    if (isOpen) {
      loadMessages();
      setupRealtimeSubscription();
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [isOpen]);

  // 메시지가 업데이트될 때 스크롤
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from("chatbot_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (user) {
        query = query.eq("user_id", user.id);
      } else {
        query = query.eq("session_id", sessionId).is("user_id", null);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          text: msg.message,
          sender: msg.sender as "user" | "bot",
          timestamp: new Date(msg.created_at),
        }));
        setMessages(formattedMessages);
      } else {
        // 첫 메시지가 없으면 환영 메시지 추가
        const welcomeMessage: Message = {
          id: "welcome",
          text: "안녕하세요! 건마켓에 오신 것을 환영합니다. 무엇을 도와드릴까요?",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error("메시지 로드 오류:", error);
      // 오류 발생 시 기본 환영 메시지
      const welcomeMessage: Message = {
        id: "welcome",
        text: "안녕하세요! 건마켓에 오신 것을 환영합니다. 무엇을 도와드릴까요?",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  };

  const setupRealtimeSubscription = async () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const { data: { user } } = await supabase.auth.getUser();

    channelRef.current = supabase
      .channel(`chatbot_messages_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chatbot_messages",
        },
        (payload: any) => {
          // 현재 세션 또는 사용자의 메시지만 처리
          const isUserMessage = user 
            ? payload.new.user_id === user.id
            : payload.new.session_id === sessionId;
          
          if (isUserMessage) {
            const newMessage: Message = {
              id: payload.new.id,
              text: payload.new.message,
              sender: payload.new.sender as "user" | "bot",
              timestamp: new Date(payload.new.created_at),
            };
            setMessages((prev) => {
              // 중복 방지
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
          }
        }
      )
      .subscribe();
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageText = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 사용자 메시지 저장
      const { error: insertError } = await supabase
        .from("chatbot_messages")
        .insert({
          user_id: user?.id || null,
          session_id: sessionId,
          message: messageText,
          sender: "user",
        });

      if (insertError) throw insertError;

      // 키워드 체크: "상품", "제품", "물건", "목록" 등
      const productKeywords = ["상품", "제품", "물건", "목록", "텍스트"];
      const isProductQuery = productKeywords.some(keyword => 
        messageText.toLowerCase().includes(keyword.toLowerCase())
      );

      if (isProductQuery) {
        // 상품 목록 조회
        setTimeout(async () => {
          try {
            const { data: products, error: productsError } = await supabase
              .from("products")
              .select("title")
              .order("created_at", { ascending: true });

            if (productsError) throw productsError;

            let botResponse = "📦 현재 등록된 상품 목록입니다:\n\n";
            
            if (products && products.length > 0) {
              products.forEach((product, index) => {
                botResponse += `${index + 1}. ${product.title}\n`;
              });
              botResponse += `\n총 ${products.length}개의 상품이 있습니다.`;
            } else {
              botResponse = "현재 등록된 상품이 없습니다.";
            }

            const { error: botError } = await supabase
              .from("chatbot_messages")
              .insert({
                user_id: user?.id || null,
                session_id: sessionId,
                message: botResponse,
                sender: "bot",
              });

            if (botError) {
              console.error("봇 메시지 저장 오류:", botError);
            }
          } catch (error) {
            console.error("상품 조회 오류:", error);
            const { error: botError } = await supabase
              .from("chatbot_messages")
              .insert({
                user_id: user?.id || null,
                session_id: sessionId,
                message: "상품 목록을 불러오는 중 오류가 발생했습니다.",
                sender: "bot",
              });
            if (botError) {
              console.error("봇 메시지 저장 오류:", botError);
            }
          }
          setIsLoading(false);
        }, 500);
      } else {
        // OpenAI를 사용한 봇 응답
        try {
          // 최근 대화 내역 가져오기 (컨텍스트 유지)
          const recentMessages = messages.slice(-10); // 최근 10개 메시지만 사용
          
          const chatMessages: ChatMessage[] = recentMessages.map(msg => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.text,
          }));
          
          // 현재 사용자 메시지 추가
          chatMessages.push({
            role: "user",
            content: messageText,
          });

          // 시스템 프롬프트 설정
          const systemPrompt = `당신은 건마켓(건설 자재 거래 플랫폼)의 친절한 챗봇입니다. 
사용자에게 건설 자재에 대한 정보를 제공하고, 플랫폼 사용 방법을 안내합니다.
한국어로 자연스럽고 친절하게 답변해주세요.
간결하고 명확한 답변을 선호합니다.`;

          // OpenAI API 호출
          const botResponse = await callOpenAI(chatMessages, systemPrompt);

          // 봇 응답 저장
          const { error: botError } = await supabase
            .from("chatbot_messages")
            .insert({
              user_id: user?.id || null,
              session_id: sessionId,
              message: botResponse,
              sender: "bot",
            });

          if (botError) {
            console.error("봇 메시지 저장 오류:", botError);
          }
        } catch (error: any) {
          console.error("OpenAI API 오류:", error);
          
          // 오류 발생 시 기본 응답
          let errorMessage = "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          
          if (error.message?.includes("API 키")) {
            errorMessage = "OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의해주세요.";
          }

          const { error: botError } = await supabase
            .from("chatbot_messages")
            .insert({
              user_id: user?.id || null,
              session_id: sessionId,
              message: errorMessage,
              sender: "bot",
            });

          if (botError) {
            console.error("봇 메시지 저장 오류:", botError);
          }
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* 채팅 버튼 */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* 채팅창 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] bg-card border border-border rounded-lg shadow-2xl z-50 flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">채팅 상담</h3>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 메시지 영역 */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* 입력 영역 */}
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={handleSend} size="icon" disabled={!inputValue.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;

