import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ChevronLeft } from "lucide-react";
import { Material } from "@/components/MaterialCard";

interface Message {
  id: string;
  text: string;
  sender: "user" | "other";
  timestamp: string;
}

interface ChatRoom {
  listingId: string;
  listingTitle: string;
  sellerName: string;
  sellerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const Chat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const listingId = searchParams.get("listingId");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [listing, setListing] = useState<Material | null>(null);
  const [sellerName, setSellerName] = useState("판매자");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock materials
  const mockMaterials: Material[] = [
    {
      id: "1",
      title: "H빔 철골 200x200 (10개)",
      price: 1500000,
      tokenPrice: 3,
      type: "sale",
      category: "steel",
      location: "서울 강남구",
      imageUrl: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&auto=format&fit=crop",
      timeAgo: "2시간 전",
      status: "available",
    },
    {
      id: "2",
      title: "콘크리트 블록 (200개 이상)",
      price: 800000,
      tokenPrice: 2,
      type: "sale",
      category: "concrete",
      location: "인천 부평구",
      imageUrl: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop",
      timeAgo: "5시간 전",
      status: "available",
    },
    {
      id: "3",
      title: "건설용 비계파이프 일괄",
      price: 3000000,
      tokenPrice: 6,
      type: "rent",
      category: "scaffold",
      location: "경기 성남시",
      imageUrl: "https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=800&auto=format&fit=crop",
      timeAgo: "1일 전",
      status: "reserved",
    },
    {
      id: "4",
      title: "철근 D19 (1톤)",
      price: 2200000,
      tokenPrice: 4,
      type: "sale",
      category: "steel",
      location: "서울 송파구",
      imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop",
      timeAgo: "3시간 전",
      status: "available",
    },
    {
      id: "5",
      title: "각파이프 100x100x5T",
      price: 450000,
      tokenPrice: 1,
      type: "sale",
      category: "steel",
      location: "부산 해운대구",
      imageUrl: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&auto=format&fit=crop",
      timeAgo: "6시간 전",
      status: "available",
    },
    {
      id: "6",
      title: "타워크레인 임대 (월단위)",
      price: 15000000,
      tokenPrice: 30,
      type: "lease",
      category: "equipment",
      location: "경기 광명시",
      imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop",
      timeAgo: "2일 전",
      status: "sold",
    },
  ];

  useEffect(() => {
    if (listingId) {
      // Get listing info
      const userListings = JSON.parse(localStorage.getItem("userListings") || "[]");
      const allMaterials = [...userListings, ...mockMaterials];
      const foundListing = allMaterials.find((m: Material) => m.id === listingId);
      
      if (foundListing) {
        setListing(foundListing);
        setSellerName("판매자");
        
        // Load messages from localStorage
        const chatMessages = JSON.parse(localStorage.getItem(`chat_${listingId}`) || "[]");
        if (chatMessages.length === 0) {
          // Initialize with welcome message
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            text: `안녕하세요! ${foundListing.title}에 대해 문의드립니다.`,
            sender: "other",
            timestamp: new Date().toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          setMessages([welcomeMessage]);
        } else {
          setMessages(chatMessages);
        }
      }
    }
  }, [listingId]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && listingId) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: "user",
        timestamp: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);
      setNewMessage("");
      
      // Save to localStorage
      localStorage.setItem(`chat_${listingId}`, JSON.stringify(updatedMessages));
      
      // Update chat room list
      const chatRooms = JSON.parse(localStorage.getItem("chatRooms") || "[]");
      const existingRoomIndex = chatRooms.findIndex((room: ChatRoom) => room.listingId === listingId);
      
      const roomData: ChatRoom = {
        listingId: listingId,
        listingTitle: listing?.title || "",
        sellerName: sellerName,
        sellerAvatar: "",
        lastMessage: newMessage,
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      };
      
      if (existingRoomIndex >= 0) {
        chatRooms[existingRoomIndex] = roomData;
      } else {
        chatRooms.unshift(roomData);
      }
      
      // Sort by last message time
      chatRooms.sort((a: ChatRoom, b: ChatRoom) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
      
      localStorage.setItem("chatRooms", JSON.stringify(chatRooms));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!listingId || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="mb-4 text-2xl font-bold">채팅할 상품을 선택해주세요</h2>
          <Link to="/">
            <Button variant="hero">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 flex items-center gap-4">
          <Link to="/my-page">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-1 h-4 w-4" />
              목록으로
            </Button>
          </Link>
        </div>
        
        <Card className="mx-auto max-w-4xl">
          <CardContent className="p-0">
            <div className="flex h-[600px] flex-col">
              {/* 채팅 헤더 */}
              <div className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={""} />
                      <AvatarFallback>{sellerName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">{sellerName}</h3>
                      <p className="text-xs text-muted-foreground">{listing.title}</p>
                    </div>
                  </div>
                  <Link to={`/listing/${listingId}`}>
                    <Button variant="outline" size="sm">
                      상품 보기
                    </Button>
                  </Link>
                </div>
              </div>

              {/* 메시지 영역 */}
              <div className="messages-container flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="break-words">{message.text}</p>
                      <p
                        className={`mt-1 text-xs ${
                          message.sender === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* 입력 영역 */}
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="메시지를 입력하세요..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
