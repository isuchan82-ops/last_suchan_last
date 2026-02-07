import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Material } from "@/components/MaterialCard";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Clock,
  MessageCircle,
  Heart,
  Share2,
  Phone,
  ChevronLeft,
  Coins,
} from "lucide-react";
import { requestTossPayment } from "@/lib/tossPayments";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Mock materials data (same as in Index.tsx)
const mockMaterials = [
  {
    id: "1",
    title: "H빔 철골 200x200 (10개)",
    price: 1500000,
    tokenPrice: 3,
    type: "sale",
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
    location: "경기 광명시",
    imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop",
    timeAgo: "2일 전",
    status: "sold",
  },
];

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [material, setMaterial] = useState<Material | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);

  const typeLabels: Record<string, string> = {
    sale: "판매",
    buy: "구매",
    rent: "대여",
    lease: "임대",
  };

  const statusLabels: Record<string, string> = {
    available: "거래가능",
    reserved: "예약중",
    sold: "거래완료",
  };

  useEffect(() => {
    // Get user listings from localStorage
    const userListings = JSON.parse(localStorage.getItem("userListings") || "[]");
    const allMaterials = [...userListings, ...mockMaterials];
    
    // Find the material by id
    const foundMaterial = allMaterials.find((m: Material) => m.id === id);
    
    if (foundMaterial) {
      setMaterial(foundMaterial);
      // Initialize views and likes
      const initialViews = Math.floor(Math.random() * 200) + 50;
      const initialLikes = Math.floor(Math.random() * 30) + 5;
      setViews(initialViews);
      setLikes(initialLikes);
      
      // Load liked status from localStorage
      const likedItems = JSON.parse(localStorage.getItem("likedItems") || "[]");
      setIsLiked(likedItems.includes(id));
    }
    
    // Increase view count when page loads
    if (id) {
      const viewCounts = JSON.parse(localStorage.getItem("viewCounts") || "{}");
      const currentViews = viewCounts[id] || Math.floor(Math.random() * 200) + 50;
      viewCounts[id] = currentViews + 1;
      localStorage.setItem("viewCounts", JSON.stringify(viewCounts));
      setViews(viewCounts[id]);
    }
  }, [id]);

  if (!material) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="mb-4 text-2xl font-bold">자재를 찾을 수 없습니다</h2>
          <Link to="/">
            <Button variant="hero">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Handle like button click
  const handleLikeClick = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    // Update likes count
    if (newLikedState) {
      setLikes(likes + 1);
    } else {
      setLikes(Math.max(0, likes - 1));
    }
    
    // Save liked status to localStorage
    const likedItems = JSON.parse(localStorage.getItem("likedItems") || "[]");
    if (newLikedState) {
      if (!likedItems.includes(id)) {
        likedItems.push(id);
      }
    } else {
      const index = likedItems.indexOf(id);
      if (index > -1) {
        likedItems.splice(index, 1);
      }
    }
    localStorage.setItem("likedItems", JSON.stringify(likedItems));
  };

  const handlePurchaseClick = async () => {
    if (!material) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("로그인이 필요합니다");
        navigate("/auth");
        return;
      }
      const orderId = `listing-${material.id}-${Date.now()}`;
      const pendingOrder = {
        orderId,
        orderName: material.title,
        amount: material.price,
        paymentMethod: "toss",
        listingId: material.id,
        items: [
          {
            id: material.id,
            title: material.title,
            price: material.price,
            quantity: 1,
          },
        ],
      };
      localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));
      await requestTossPayment({
        amount: material.price,
        orderName: material.title,
        orderId,
      });
    } catch (error) {
      console.error("Toss payment error:", error);
    }
  };

  // Convert single image to array for display
  const images = [material.imageUrl];
  
  const listing = {
    ...material,
    images,
    description: `${material.title}

거래 지역: ${material.location}
거래 유형: ${typeLabels[material.type]}
상태: ${statusLabels[material.status]}

문의 및 실물 확인 환영합니다.`,
    views,
    likes,
    seller: {
      name: "판매자",
      avatar: "",
      rating: 4.8,
      reviews: 23,
      responseRate: 95,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="mr-1 h-4 w-4" />
            목록으로
          </Button>
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-muted">
              <img
                src={listing.images[selectedImage]}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="mb-6 flex gap-2 overflow-x-auto">
              {listing.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === index
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${listing.title} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-bold">상품 설명</h2>
                <p className="whitespace-pre-line text-muted-foreground">
                  {listing.description}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Seller Info and Actions */}
          <div className="space-y-4">
            {/* Price and Info */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {typeLabels[listing.type]}
                    </Badge>
                    <h1 className="mb-2 text-2xl font-bold">{listing.title}</h1>
                    <div className="flex items-center gap-3">
                      <p className="text-3xl font-bold text-primary">
                        {listing.price.toLocaleString()}원
                      </p>
                      {listing.tokenPrice && (
                        <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                          <Coins className="h-5 w-5" />
                          <span>{listing.tokenPrice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLikeClick}
                  >
                    <Heart
                      className={`h-5 w-5 ${isLiked ? "fill-primary text-primary" : ""}`}
                    />
                  </Button>
                </div>

                <div className="space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{listing.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{listing.timeAgo}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>조회 {listing.views}</span>
                    <span>•</span>
                    <span>관심 {listing.likes}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 font-semibold">판매자 정보</h3>
                <div className="mb-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={listing.seller.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {listing.seller.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{listing.seller.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>⭐ {listing.seller.rating}</span>
                      <span>•</span>
                      <span>후기 {listing.seller.reviews}</span>
                    </div>
                  </div>
                </div>
                <div className="mb-4 rounded-lg bg-muted p-3 text-sm">
                  <p className="text-muted-foreground">
                    응답률: <span className="font-medium text-foreground">{listing.seller.responseRate}%</span>
                  </p>
                </div>
                <Link to="/my-page" className="block">
                  <Button variant="outline" className="w-full">
                    판매자 상점 보기
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="default"
                size="lg"
                className="w-full"
                onClick={handlePurchaseClick}
              >
                구매하기
              </Button>
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={() => navigate(`/chat?listingId=${id}`)}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                채팅하기
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="lg" className="flex-1">
                  <Phone className="mr-2 h-5 w-5" />
                  전화하기
                </Button>
                <Button variant="outline" size="icon" className="h-12">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
