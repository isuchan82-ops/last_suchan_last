import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MaterialCard, Material } from "@/components/MaterialCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Edit2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Materials = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);

  useEffect(() => {
    const userListings = JSON.parse(localStorage.getItem("userListings") || "[]");
    setAllMaterials(userListings);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!searchQuery.trim()) {
      return;
    }

    const filtered = allMaterials.filter((material) => {
      const typeMatch = selectedType === "all" || material.type === selectedType;
      const searchMatch = 
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.location.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && searchMatch;
    });

    // 검색 결과가 1개일 때 자동으로 상세 페이지로 이동
    if (filtered.length === 1) {
      navigate(`/listing/${filtered[0].id}`);
    }
  };

  const filteredMaterials = allMaterials.filter((material) => {
    const typeMatch = selectedType === "all" || material.type === selectedType;
    const searchMatch = 
      !searchQuery.trim() || 
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.location.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && searchMatch;
  });

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/edit-listing/${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search Section */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="자재명, 지역 등을 검색하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className="h-12 pl-10 pr-4"
                />
              </div>
              <Button type="submit" onClick={handleSearch} size="lg">
                검색
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("all")}
              className="whitespace-nowrap"
            >
              전체
            </Button>
            <Button
              variant={selectedType === "sale" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("sale")}
              className="whitespace-nowrap"
            >
              판매
            </Button>
            <Button
              variant={selectedType === "buy" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("buy")}
              className="whitespace-nowrap"
            >
              구매
            </Button>
            <Button
              variant={selectedType === "rent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("rent")}
              className="whitespace-nowrap"
            >
              대여
            </Button>
            <Button
              variant={selectedType === "lease" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("lease")}
              className="whitespace-nowrap"
            >
              임대
            </Button>
          </div>
        </div>
      </section>

      {/* Materials Grid */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">등록 자재</h2>
          <p className="text-sm text-muted-foreground">총 {filteredMaterials.length}개</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="relative">
              <MaterialCard material={material} />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 left-2 z-10 h-8 w-8"
                onClick={(e) => handleEdit(material.id, e)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {filteredMaterials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg text-muted-foreground">
              {searchQuery.trim() || selectedType !== "all" 
                ? "조건에 맞는 자재가 없습니다" 
                : "등록된 자재가 없습니다"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Materials;
