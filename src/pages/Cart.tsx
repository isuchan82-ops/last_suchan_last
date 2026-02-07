import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requestTossPayment } from "@/lib/tossPayments";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity?: number;
};

const Cart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cartItems") || "[]");
    if (Array.isArray(stored)) {
      setItems(stored);
    }
  }, []);

  const normalizedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        quantity: item.quantity ?? 1,
      })),
    [items],
  );

  const totalAmount = useMemo(
    () =>
      normalizedItems.reduce(
        (sum, item) => sum + item.price * (item.quantity ?? 1),
        0,
      ),
    [normalizedItems],
  );

  const handlePurchaseClick = async () => {
    if (totalAmount <= 0) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("로그인이 필요합니다");
        navigate("/auth");
        return;
      }
      const orderId = `cart-${Date.now()}`;
      const pendingOrder = {
        orderId,
        orderName: `장바구니 결제 (${normalizedItems.length}건)`,
        amount: totalAmount,
        paymentMethod: "toss",
        items: normalizedItems.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity ?? 1,
        })),
      };
      localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));
      await requestTossPayment({
        amount: totalAmount,
        orderName: `장바구니 결제 (${normalizedItems.length}건)`,
        orderId,
      });
    } catch (error) {
      console.error("Toss payment error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">장바구니</h1>
          <span className="text-sm text-muted-foreground">
            총 {normalizedItems.length}건
          </span>
        </div>

        {normalizedItems.length > 0 ? (
          <div className="space-y-4">
            {normalizedItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.price.toLocaleString()}원 · {item.quantity}개
                    </p>
                  </div>
                  <p className="font-semibold text-primary">
                    {(item.price * (item.quantity ?? 1)).toLocaleString()}원
                  </p>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <span className="font-semibold">총 결제금액</span>
                <span className="text-xl font-bold text-primary">
                  {totalAmount.toLocaleString()}원
                </span>
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full"
              onClick={handlePurchaseClick}
            >
              구매하기
            </Button>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-lg font-medium">장바구니가 비었습니다</p>
              <p className="text-sm text-muted-foreground">
                담긴 상품이 없습니다
              </p>
              <Button className="mt-4" disabled>
                구매하기
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Cart;
