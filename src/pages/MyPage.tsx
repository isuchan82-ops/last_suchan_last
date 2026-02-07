import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { MaterialCard, Material } from "@/components/MaterialCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Heart, Package, MessageCircle, CreditCard, Edit, Save, X, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ChatRoom {
  listingId: string;
  listingTitle: string;
  sellerName: string;
  sellerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  status: string;
  payment_date: string;
  description: string;
}

const MyPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myListings, setMyListings] = useState<Material[]>([]);
  const [likedListings, setLikedListings] = useState<Material[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tokenTransactions, setTokenTransactions] = useState<any[]>([]);
  const [paymentStatusOpen, setPaymentStatusOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "fail" | null>(null);
  const processedOrderIds = useRef(new Set<string>());
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    avatar_url: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // 사용자 정보 로드
  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const status = searchParams.get("payment");
    if (status === "success" || status === "fail") {
      setPaymentStatus(status);
      setPaymentStatusOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const status = searchParams.get("payment");
    const orderId = searchParams.get("orderId");
    if (status !== "success" || !orderId || !user) return;
    if (processedOrderIds.current.has(orderId)) return;
    processedOrderIds.current.add(orderId);

    const insertPaymentData = async () => {
      try {
        const pendingOrder = JSON.parse(localStorage.getItem("pendingOrder") || "null");
        const orderNameParam = searchParams.get("orderName");
        const amountParam = searchParams.get("amount");
        const orderName = pendingOrder?.orderName || orderNameParam || "결제";
        const amount = pendingOrder?.amount || (amountParam ? parseInt(amountParam, 10) : 0);

        const { data: existingOrder } = await supabase
          .from("orders")
          .select("id")
          .eq("order_id", orderId)
          .maybeSingle();

        if (!existingOrder) {
          const { error: orderError } = await supabase.from("orders").insert({
            user_id: user.id,
            order_id: orderId,
            amount,
            order_name: orderName,
            payment_method: "toss",
            status: "completed",
            listing_id: pendingOrder?.listingId || null,
            items: pendingOrder?.items || null,
          });

          if (orderError) {
            console.error("Order insert error:", orderError);
            toast.error(`주문 저장 실패: ${orderError.message}`);
          }
        }

        const { data: existingPayment } = await supabase
          .from("payments")
          .select("id")
          .eq("transaction_id", orderId)
          .maybeSingle();

        if (!existingPayment) {
          const { data: newPayment, error: paymentError } = await supabase
            .from("payments")
            .insert({
            user_id: user.id,
            amount,
            payment_method: "toss",
            status: "completed",
            transaction_id: orderId,
            description: orderName,
              payment_date: new Date().toISOString(),
            })
            .select()
            .single();

          if (paymentError) {
            console.error("Payment insert error:", paymentError);
            toast.error(`결제 내역 저장 실패: ${paymentError.message}`);
          } else if (newPayment) {
            setPayments((prev) => [newPayment, ...prev]);
          }
        }

        await loadPayments(user.id);
        localStorage.removeItem("pendingOrder");
      } catch (error) {
        console.error("Payment success handling error:", error);
      }
    };

    insertPaymentData();
  }, [searchParams, user]);

  const loadUserData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast.error("로그인이 필요합니다");
        navigate("/auth");
        return;
      }

      setUser(currentUser);

      // 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile error:", profileError);
      }

      if (profileData) {
        setProfile(profileData);
        setEditFormData({
          name: profileData.name || "",
          phone: profileData.phone || "",
          avatar_url: profileData.avatar_url || "",
        });
      } else {
        // 프로필이 없으면 기본값으로 생성
        setProfile({
          id: currentUser.id,
          name: currentUser.user_metadata?.name || currentUser.email?.split("@")[0] || "사용자",
          phone: currentUser.user_metadata?.phone || "",
          tokens: 0,
          balance: 0,
          rating: 0,
          total_reviews: 0,
          response_rate: 0,
          total_sales: 0,
        });
      }

      // 내 게시물 가져오기
      await loadMyListings(currentUser.id);

      // 결제 내역 가져오기
      await loadPayments(currentUser.id);

      // 토큰 거래 내역 가져오기
      await loadTokenTransactions(currentUser.id);

      // 채팅방 가져오기 (localStorage에서)
      const savedChatRooms = JSON.parse(localStorage.getItem("chatRooms") || "[]");
      setChatRooms(savedChatRooms);

      // 관심 목록 가져오기 (localStorage에서)
      const likedItemIds = JSON.parse(localStorage.getItem("likedItems") || "[]");
      // 모든 게시물에서 관심 목록 찾기
      const { data: allListings } = await supabase
        .from("listings")
        .select("*, listing_images(image_url)")
        .in("id", likedItemIds)
        .order("created_at", { ascending: false });

      if (allListings) {
        const likedMaterials = allListings.map((listing: any) => ({
          id: listing.id,
          title: listing.title,
          price: listing.price,
          tokenPrice: listing.token_price,
          type: listing.type,
          category: listing.category,
          location: listing.location,
          imageUrl: listing.listing_images?.[0]?.image_url || "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&auto=format&fit=crop",
          timeAgo: getTimeAgo(listing.created_at),
          status: listing.status,
        }));
        setLikedListings(likedMaterials);
      }
    } catch (error) {
      console.error("Load user data error:", error);
      toast.error("사용자 정보를 불러오는데 실패했습니다");
    }
  };

  const loadMyListings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*, listing_images(image_url)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Listings error:", error);
        return;
      }

      if (data) {
        const materials = data.map((listing: any) => ({
          id: listing.id,
          title: listing.title,
          price: listing.price,
          tokenPrice: listing.token_price,
          type: listing.type,
          category: listing.category,
          location: listing.location,
          imageUrl: listing.listing_images?.[0]?.image_url || "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&auto=format&fit=crop",
          timeAgo: getTimeAgo(listing.created_at),
          status: listing.status,
        }));
        setMyListings(materials);
      }
    } catch (error) {
      console.error("Load listings error:", error);
    }
  };

  const loadPayments = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Payments error:", error);
        return;
      }

      if (data) {
        setPayments(data);
      }
    } catch (error) {
      console.error("Load payments error:", error);
    }
  };

  const loadTokenTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("token_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Token transactions error:", error);
        return;
      }

      if (data) {
        setTokenTransactions(data);
      }
    } catch (error) {
      console.error("Load token transactions error:", error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "방금 전";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  const handleUpdateProfile = async () => {
    if (!user || !profile) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: editFormData.name,
          phone: editFormData.phone,
          avatar_url: editFormData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Update error:", error);
        toast.error("프로필 수정에 실패했습니다");
        return;
      }

      // 업데이트된 프로필 다시 로드
      await loadUserData();
      setIsEditDialogOpen(false);
      toast.success("프로필이 수정되었습니다");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("프로필 수정 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePaymentStatus = () => {
    setPaymentStatusOpen(false);
    setPaymentStatus(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("payment");
    setSearchParams(nextParams, { replace: true });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      card: "신용카드",
      bank_transfer: "계좌이체",
      virtual_account: "가상계좌",
      toss: "토스페이",
      kakao_pay: "카카오페이",
    };
    return labels[method] || method;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "대기중",
      completed: "완료",
      failed: "실패",
      cancelled: "취소됨",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      completed: "bg-green-500/10 text-green-700 dark:text-green-400",
      failed: "bg-red-500/10 text-red-700 dark:text-red-400",
      cancelled: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    };
    return colors[status] || "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Dialog open={paymentStatusOpen} onOpenChange={(open) => {
        if (!open) {
          handleClosePaymentStatus();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentStatus === "success" ? "결제가 완료되었습니다" : "결제가 실패했습니다"}
            </DialogTitle>
            <DialogDescription>
              {paymentStatus === "success"
                ? "결제 내역은 마이페이지에서 확인할 수 있습니다."
                : "결제 과정에서 문제가 발생했습니다. 다시 시도해주세요."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleClosePaymentStatus}>확인</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Left Sidebar - Profile */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="mb-6 flex flex-col items-center text-center">
                <Avatar className="mb-4 h-24 w-24">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                    {profile.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mb-1 text-xl font-bold">{profile.name || user.email?.split("@")[0]}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>

              <div className="mb-6 space-y-3 rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    보유 토큰
                  </span>
                  <span className="font-medium">{profile.tokens?.toLocaleString() || 0}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">평점</span>
                  <span className="font-medium">⭐ {profile.rating || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">후기</span>
                  <span className="font-medium">{profile.total_reviews || 0}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">응답률</span>
                  <span className="font-medium">{profile.response_rate || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">총 거래</span>
                  <span className="font-medium">{profile.total_sales || 0}건</span>
                </div>
              </div>

              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    프로필 수정
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>프로필 수정</DialogTitle>
                    <DialogDescription>
                      회원 정보를 수정할 수 있습니다.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="edit-name">이름</Label>
                      <Input
                        id="edit-name"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        placeholder="이름을 입력하세요"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone">전화번호</Label>
                      <Input
                        id="edit-phone"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        placeholder="010-0000-0000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-avatar">프로필 이미지 URL</Label>
                      <Input
                        id="edit-avatar"
                        value={editFormData.avatar_url}
                        onChange={(e) => setEditFormData({ ...editFormData, avatar_url: e.target.value })}
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditDialogOpen(false)}
                        disabled={isLoading}
                      >
                        취소
                      </Button>
                      <Button onClick={handleUpdateProfile} disabled={isLoading}>
                        {isLoading ? "저장 중..." : "저장"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Right Content - Tabs */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="selling" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="selling" className="flex-1">
                  <Package className="mr-2 h-4 w-4" />
                  판매중
                </TabsTrigger>
                <TabsTrigger value="liked" className="flex-1">
                  <Heart className="mr-2 h-4 w-4" />
                  관심목록
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex-1">
                  <CreditCard className="mr-2 h-4 w-4" />
                  결제 내역
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex-1">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  채팅
                </TabsTrigger>
              </TabsList>

              <TabsContent value="selling" className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold">내 판매 목록</h3>
                  <Link to="/create-listing">
                    <Button variant="hero">새 자재 등록</Button>
                  </Link>
                </div>
                {myListings.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {myListings.map((material) => (
                      <MaterialCard key={material.id} material={material} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                      <Package className="mb-4 h-16 w-16 text-muted-foreground" />
                      <p className="mb-2 text-lg font-medium">등록된 자재가 없습니다</p>
                      <p className="mb-4 text-sm text-muted-foreground">
                        새 자재를 등록하여 판매를 시작해보세요
                      </p>
                      <Link to="/create-listing">
                        <Button variant="hero">자재 등록하기</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="liked" className="mt-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">관심 자재</h3>
                  <p className="text-sm text-muted-foreground">
                    마음에 드는 자재를 저장하세요
                  </p>
                </div>
                {likedListings.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {likedListings.map((material) => (
                      <MaterialCard key={material.id} material={material} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                      <Heart className="mb-4 h-16 w-16 text-muted-foreground" />
                      <p className="mb-2 text-lg font-medium">관심 자재가 없습니다</p>
                      <p className="text-sm text-muted-foreground">
                        자재 상세 페이지에서 하트를 눌러 관심 자재로 저장하세요
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="payments" className="mt-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">결제 내역</h3>
                  <p className="text-sm text-muted-foreground">
                    결제 및 토큰 거래 내역을 확인하세요
                  </p>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>결제 내역</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {payments.length > 0 ? (
                        <div className="space-y-3">
                          {payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between rounded-lg border p-4"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">
                                    {payment.amount.toLocaleString()}원
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                                    {getStatusLabel(payment.status)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {getPaymentMethodLabel(payment.payment_method)} · {payment.description || "결제"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(payment.payment_date).toLocaleString("ko-KR")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                          <CreditCard className="mb-4 h-16 w-16 text-muted-foreground" />
                          <p className="text-lg font-medium">결제 내역이 없습니다</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>토큰 거래 내역</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tokenTransactions.length > 0 ? (
                        <div className="space-y-3">
                          {tokenTransactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between rounded-lg border p-4"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-semibold ${transaction.transaction_type === 'spend' ? 'text-red-500' : 'text-green-500'}`}>
                                    {transaction.transaction_type === 'spend' ? '-' : '+'}{transaction.amount.toLocaleString()} 토큰
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {transaction.description || "거래"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(transaction.created_at).toLocaleString("ko-KR")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                          <Coins className="mb-4 h-16 w-16 text-muted-foreground" />
                          <p className="text-lg font-medium">토큰 거래 내역이 없습니다</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="messages" className="mt-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">채팅 목록</h3>
                </div>
                {chatRooms.length > 0 ? (
                  <div className="space-y-2">
                    {chatRooms.map((room) => (
                      <Card
                        key={room.listingId}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => navigate(`/chat?listingId=${room.listingId}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={room.sellerAvatar} />
                              <AvatarFallback>
                                {room.sellerName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-foreground truncate">
                                  {room.sellerName}
                                </h4>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {new Date(room.lastMessageTime).toLocaleDateString("ko-KR", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {room.listingTitle}
                              </p>
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {room.lastMessage}
                              </p>
                            </div>
                            {room.unreadCount > 0 && (
                              <div className="flex-shrink-0">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                  {room.unreadCount}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                      <MessageCircle className="mb-4 h-16 w-16 text-muted-foreground" />
                      <p className="mb-2 text-lg font-medium">채팅 내역이 없습니다</p>
                      <p className="text-sm text-muted-foreground">
                        관심있는 자재의 판매자와 채팅을 시작해보세요
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
