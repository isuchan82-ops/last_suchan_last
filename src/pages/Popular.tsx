import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { MaterialCard, Material } from "@/components/MaterialCard";
import { TrendingUp } from "lucide-react";

// Mock data
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

const Popular = () => {
  const [allMaterials, setAllMaterials] = useState<Material[]>(mockMaterials);

  useEffect(() => {
    const userListings = JSON.parse(localStorage.getItem("userListings") || "[]");
    setAllMaterials([...userListings, ...mockMaterials]);
  }, []);

  // 인기 상품 계산 (하트 수와 조회수 기준)
  const getPopularMaterials = () => {
    const viewCounts = JSON.parse(localStorage.getItem("viewCounts") || "{}");
    const likeCounts = JSON.parse(localStorage.getItem("likeCounts") || "{}");
    
    return allMaterials
      .map((material) => {
        const views = viewCounts[material.id] || Math.floor(Math.random() * 200) + 50;
        const likes = likeCounts[material.id] || Math.floor(Math.random() * 30) + 5;
        return {
          ...material,
          views,
          likes,
        };
      })
      .sort((a, b) => {
        // 하트 수 우선, 같으면 조회수 순
        if (b.likes !== a.likes) {
          return b.likes - a.likes;
        }
        return b.views - a.views;
      });
  };

  const popularMaterials = getPopularMaterials();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">인기 상품</h1>
        </div>
        <p className="mb-6 text-muted-foreground">
          하트 수와 조회수가 많은 인기 자재를 확인하세요
        </p>

        {popularMaterials.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {popularMaterials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg text-muted-foreground">인기 상품이 없습니다</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Popular;

