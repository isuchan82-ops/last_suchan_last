import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Material } from "@/components/MaterialCard";

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    category: "",
    price: "",
    tokenPrice: "",
    location: "",
    description: "",
  });

  useEffect(() => {
    const userListings = JSON.parse(localStorage.getItem("userListings") || "[]");
    const listing = userListings.find((item: Material) => item.id === id);
    
    if (listing) {
      setFormData({
        title: listing.title,
        type: listing.type,
        category: listing.category || "",
        price: listing.price.toString(),
        tokenPrice: listing.tokenPrice?.toString() || "",
        location: listing.location,
        description: "",
      });
      setImages([listing.imageUrl]);
    } else {
      toast.error("자재를 찾을 수 없습니다");
      navigate("/materials");
    }
  }, [id, navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) =>
        URL.createObjectURL(file)
      );
      setImages([...images, ...newImages].slice(0, 10));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.price || !formData.location) {
      toast.error("필수 항목을 모두 입력해주세요");
      return;
    }

    const userListings = JSON.parse(localStorage.getItem("userListings") || "[]");
    const price = parseInt(formData.price);
    const tokenPrice = formData.tokenPrice 
      ? parseInt(formData.tokenPrice) 
      : Math.max(1, Math.round(price / 500000));
    
    const updatedListings = userListings.map((listing: Material) => {
      if (listing.id === id) {
        return {
          ...listing,
          title: formData.title,
          price: price,
          tokenPrice: tokenPrice,
          type: formData.type as "sale" | "buy" | "rent" | "lease",
          category: formData.category as "steel" | "concrete" | "wood" | "scaffold" | "equipment" | "other" | undefined,
          location: formData.location,
          imageUrl: images[0] || listing.imageUrl,
        };
      }
      return listing;
    });

    localStorage.setItem("userListings", JSON.stringify(updatedListings));

    // Dispatch custom event to update MyPage in real-time
    window.dispatchEvent(new Event("userListingsUpdated"));

    toast.success("자재가 수정되었습니다!");
    setTimeout(() => {
      navigate("/materials");
    }, 1000);
  };

  const handleDelete = () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const userListings = JSON.parse(localStorage.getItem("userListings") || "[]");
    const updatedListings = userListings.filter((listing: Material) => listing.id !== id);
    localStorage.setItem("userListings", JSON.stringify(updatedListings));

    // Dispatch custom event to update MyPage in real-time
    window.dispatchEvent(new Event("userListingsUpdated"));

    toast.success("자재가 삭제되었습니다");
    navigate("/materials");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-3xl font-bold">자재 수정</h1>
          <p className="mb-6 text-muted-foreground">
            자재 정보를 수정하세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardContent className="p-6">
                <Label className="mb-2 block">사진 (최대 10장)</Label>
                <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="h-full w-full rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {images.length < 10 && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted transition-colors hover:bg-muted/60">
                      <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {images.length}/10
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    placeholder="예: H빔 철골 200x200 (10개)"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="type">거래 유형 *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">판매</SelectItem>
                        <SelectItem value="buy">구매</SelectItem>
                        <SelectItem value="rent">대여</SelectItem>
                        <SelectItem value="lease">임대</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">카테고리</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="steel">철골/철근</SelectItem>
                        <SelectItem value="concrete">콘크리트</SelectItem>
                        <SelectItem value="wood">목재</SelectItem>
                        <SelectItem value="scaffold">비계</SelectItem>
                        <SelectItem value="equipment">장비/기계</SelectItem>
                        <SelectItem value="other">기타자재</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="price">가격 (원) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="1500000"
                      value={formData.price}
                      onChange={(e) => {
                        const priceValue = e.target.value;
                        setFormData({ ...formData, price: priceValue });
                        // 가격이 변경되면 토큰 가격 자동 계산 (토큰 가격이 비어있을 때만)
                        if (priceValue && !formData.tokenPrice) {
                          const calculatedToken = Math.max(1, Math.round(parseInt(priceValue) / 500000));
                          setFormData(prev => ({ ...prev, tokenPrice: calculatedToken.toString() }));
                        }
                      }}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="tokenPrice">토큰 개수</Label>
                    <Input
                      id="tokenPrice"
                      type="number"
                      placeholder="자동 계산"
                      value={formData.tokenPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, tokenPrice: e.target.value })
                      }
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">거래 지역 *</Label>
                  <Input
                    id="location"
                    placeholder="예: 서울 강남구"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">상세 설명</Label>
                  <Textarea
                    id="description"
                    placeholder="자재의 상태, 규격, 수량 등을 자세히 작성해주세요"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={8}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
              >
                삭제
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/materials")}
              >
                취소
              </Button>
              <Button type="submit" variant="hero" className="flex-1">
                수정하기
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditListing;
