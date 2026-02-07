import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { MaterialCard, Material } from "@/components/MaterialCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import heroImage from "@/assets/hero-construction.jpg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const categories = [
  "전체",
  "철골/철근",
  "콘크리트",
  "목재",
  "비계",
  "장비/기계",
  "기타자재",
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedType, setSelectedType] = useState("all");
  const [allMaterials, setAllMaterials] = useState<Material[]>(mockMaterials);
  const materialsSectionRef = useRef<HTMLElement>(null);
  const filtersSectionRef = useRef<HTMLElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const userListings = JSON.parse(localStorage.getItem("userListings") || "[]");
    setAllMaterials([...userListings, ...mockMaterials]);
  }, []);

  // 카테고리 변경 시 부드럽게 스크롤 (필요한 경우에만)
  useEffect(() => {
    // 최초 마운트 시에는 스크롤하지 않음
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (materialsSectionRef.current) {
      const headerHeight = 64; // Header 높이 (h-16 = 64px)
      const filtersHeight = filtersSectionRef.current?.offsetHeight || 0;
      const offset = headerHeight + filtersHeight;
      const elementTop = (materialsSectionRef.current?.offsetTop || 0) - offset;
      const currentScrollY = window.scrollY;
      
      // 현재 스크롤 위치가 materials 섹션보다 위에 있고, 차이가 충분히 클 때만 스크롤
      // (사용자가 이미 해당 섹션을 보고 있으면 스크롤하지 않음)
      const scrollThreshold = 200; // 200px 이상 차이가 날 때만 스크롤
      const shouldScroll = currentScrollY < elementTop - scrollThreshold;

      if (shouldScroll) {
        // 약간의 지연 후 스크롤 (필터링이 완료된 후)
        setTimeout(() => {
          window.scrollTo({
            top: Math.max(0, elementTop),
            behavior: "smooth",
          });
        }, 150);
      }
    }
  }, [selectedCategory, selectedType]);

  // 카테고리 매핑
  const categoryMap: Record<string, "steel" | "concrete" | "wood" | "scaffold" | "equipment" | "other" | undefined> = {
    "전체": undefined,
    "철골/철근": "steel",
    "콘크리트": "concrete",
    "목재": "wood",
    "비계": "scaffold",
    "장비/기계": "equipment",
    "기타자재": "other",
  };

  // 검색 핸들러
  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    // 검색은 실시간으로 필터링되므로 별도 동작 불필요
    // 필요시 검색 로직 추가 가능
  };

  // 필터링된 자재
  const filteredMaterials = allMaterials.filter((material) => {
    // 카테고리 필터
    const categoryMatch = 
      selectedCategory === "전체" || 
      material.category === categoryMap[selectedCategory];
    
    // 거래 유형 필터
    const typeMatch = selectedType === "all" || material.type === selectedType;
    
    // 검색어 필터 (제목, 위치에서 검색)
    const searchMatch = 
      !searchQuery.trim() || 
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    return categoryMatch && typeMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="건설 자재"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        </div>
        <div className="container relative mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            건설 자재, 쉽고 빠르게
          </h1>
          <p className="mb-8 text-lg text-white/90 md:text-xl">
            내 주변에서 찾는 건설 자재 거래 플랫폼
          </p>
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="자재명, 규격, 지역 등을 검색하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className="h-14 pl-10 pr-4 text-base bg-white/95 backdrop-blur"
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="h-14 px-8">
                검색
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section ref={filtersSectionRef} className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category);
                    // 클릭한 버튼이 보이도록 스크롤 (모바일에서만, 가로 스크롤만)
                    const button = document.querySelector(`[data-category="${category}"]`) as HTMLElement;
                    if (button && window.innerWidth < 768) {
                      // 모바일에서만 가로 스크롤 (세로 스크롤은 하지 않음)
                      const container = button.parentElement;
                      if (container) {
                        const buttonLeft = button.offsetLeft;
                        const buttonWidth = button.offsetWidth;
                        const containerWidth = container.offsetWidth;
                        const scrollLeft = container.scrollLeft;
                        const buttonRight = buttonLeft + buttonWidth;
                        const visibleLeft = scrollLeft;
                        const visibleRight = scrollLeft + containerWidth;

                        // 버튼이 보이지 않을 때만 스크롤
                        if (buttonLeft < visibleLeft || buttonRight > visibleRight) {
                          container.scrollTo({
                            left: buttonLeft - containerWidth / 2 + buttonWidth / 2,
                            behavior: "smooth",
                          });
                        }
                      }
                    }
                  }}
                  data-category={category}
                  className="whitespace-nowrap transition-all duration-300 hover:scale-105"
                >
                  {category}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="거래유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="sale">판매</SelectItem>
                  <SelectItem value="buy">구매</SelectItem>
                  <SelectItem value="rent">대여</SelectItem>
                  <SelectItem value="lease">임대</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Materials Grid */}
      <section ref={materialsSectionRef} className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">최근 등록 자재</h2>
          <p className="text-sm text-muted-foreground">총 {filteredMaterials.length}개</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMaterials.map((material, index) => (
            <div
              key={material.id}
              className="fade-in"
              style={{
                animationDelay: `${Math.min(index * 30, 300)}ms`,
              }}
            >
              <MaterialCard material={material} />
            </div>
          ))}
        </div>
        {filteredMaterials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center fade-in">
            <p className="text-lg text-muted-foreground">조건에 맞는 자재가 없습니다</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
