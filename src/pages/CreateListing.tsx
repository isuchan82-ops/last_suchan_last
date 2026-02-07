import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { supabase } from "@/lib/supabase";

const CreateListing = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    category: "",
    price: "",
    tokenPrice: "",
    location: "",
    description: "",
  });

  // 로그인 체크
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error("로그인이 필요합니다");
        navigate("/auth");
        return;
      }
      setUser(currentUser);
    };
    checkAuth();
  }, [navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).slice(0, 10 - images.length);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setImages([...images, ...newFiles]);
      setImagePreviewUrls([...imagePreviewUrls, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    // 미리보기 URL 해제
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImages(images.filter((_, i) => i !== index));
    setImagePreviewUrls(imagePreviewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.price || !formData.location) {
      toast.error("필수 항목을 모두 입력해주세요");
      return;
    }

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("로그인이 필요합니다");
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const price = parseInt(formData.price);
      const tokenPrice = formData.tokenPrice 
        ? parseInt(formData.tokenPrice) 
        : Math.max(1, Math.round(price / 500000));

      // 1. 게시물 먼저 생성
      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          price: price,
          token_price: tokenPrice,
          type: formData.type,
          category: formData.category || null,
          location: formData.location,
          status: "available",
        })
        .select()
        .single();

      if (listingError) {
        console.error("Listing error:", listingError);
        toast.error("게시물 등록에 실패했습니다: " + listingError.message);
        return;
      }

      // 2. 이미지가 있으면 업로드 및 저장
      if (images.length > 0 && listing) {
        const uploadedImageUrls: string[] = [];

        // 이미지를 Supabase Storage에 업로드하거나 base64로 저장
        // Storage 버킷이 설정되지 않은 경우를 대비해 일단 이미지 URL만 저장
        // (실제 구현 시 Storage 업로드 코드 추가 필요)
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${listing.id}/${Date.now()}-${i}.${fileExt}`;

          // Supabase Storage에 업로드 시도
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            // Storage 업로드 실패 시 미리보기 URL 사용 (임시)
            uploadedImageUrls.push(imagePreviewUrls[i]);
          } else {
            // 업로드 성공 시 Public URL 가져오기
            const { data: { publicUrl } } = supabase.storage
              .from('listing-images')
              .getPublicUrl(fileName);
            uploadedImageUrls.push(publicUrl);
          }

          // listing_images 테이블에 저장
          await supabase.from("listing_images").insert({
            listing_id: listing.id,
            image_url: uploadedImageUrls[i] || imagePreviewUrls[i],
            image_order: i,
          });
        }
      } else if (listing) {
        // 이미지가 없을 경우 기본 이미지 URL 저장
        const defaultImageUrl = "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&auto=format&fit=crop";
        await supabase.from("listing_images").insert({
          listing_id: listing.id,
          image_url: defaultImageUrl,
          image_order: 0,
        });
      }

      toast.success("자재가 등록되었습니다!");
      
      // 이전 localStorage 기반 이벤트 (기존 코드 호환성)
      window.dispatchEvent(new Event("userListingsUpdated"));
      
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("게시물 등록 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-3xl font-bold">자재 등록</h1>
          <p className="mb-6 text-muted-foreground">
            건설 자재 정보를 입력하고 거래를 시작하세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardContent className="p-6">
                <Label className="mb-2 block">사진 등록 (최대 10장)</Label>
                <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
                  {imagePreviewUrls.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={preview}
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
                        {imagePreviewUrls.length}/10
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
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/")}
              >
                취소
              </Button>
              <Button 
                type="submit" 
                variant="hero" 
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "등록 중..." : "등록하기"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateListing;
