import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Coins, ArrowUpRight, ArrowDownRight, CreditCard, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast as sonnerToast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface UserAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_default: boolean;
}

export default function TokenMarket() {
  const navigate = useNavigate();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [myTokens, setMyTokens] = useState(0);
  const [myBalance, setMyBalance] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bank_name: "",
    account_number: "",
    account_holder: "",
  });

  // GMT 토큰 가격
  const tokenPrice = 1250; // 1토큰당 원화 가격 (GMT)

  // 사용자 정보 및 계좌 정보 로드
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        sonnerToast.error("로그인이 필요합니다");
        navigate("/auth");
        return;
      }

      setUser(currentUser);

      // 프로필 정보 가져오기
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileData) {
        setMyTokens(profileData.tokens || 0);
        setMyBalance(profileData.balance || 0);
      } else {
        setMyTokens(0);
        setMyBalance(0);
      }

      // 계좌 정보 가져오기
      await loadAccounts(currentUser.id);
    } catch (error) {
      console.error("Load user data error:", error);
    }
  };

  const loadAccounts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_accounts")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Load accounts error:", error);
        return;
      }

      if (data && data.length > 0) {
        setAccounts(data);
        const defaultAccount = data.find((acc) => acc.is_default) || data[0];
        setSelectedAccountId(defaultAccount.id);
      } else {
        setAccounts([]);
        setSelectedAccountId("");
      }
    } catch (error) {
      console.error("Load accounts error:", error);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.bank_name || !newAccount.account_number || !newAccount.account_holder) {
      sonnerToast.error("모든 정보를 입력해주세요");
      return;
    }

    if (!user) return;

    try {
      const isFirstAccount = accounts.length === 0;

      const { data, error } = await supabase
        .from("user_accounts")
        .insert({
          user_id: user.id,
          bank_name: newAccount.bank_name,
          account_number: newAccount.account_number,
          account_holder: newAccount.account_holder,
          is_default: isFirstAccount, // 첫 계좌는 자동으로 기본 계좌
        })
        .select()
        .single();

      if (error) {
        console.error("Add account error:", error);
        sonnerToast.error("계좌 추가에 실패했습니다");
        return;
      }

      sonnerToast.success("계좌가 추가되었습니다");
      setNewAccount({ bank_name: "", account_number: "", account_holder: "" });
      setIsAccountDialogOpen(false);
      await loadAccounts(user.id);
      if (data) {
        setSelectedAccountId(data.id);
      }
    } catch (error) {
      console.error("Add account error:", error);
      sonnerToast.error("계좌 추가 중 오류가 발생했습니다");
    }
  };

  const priceHistory = [
    { date: "2025-10-28", price: 1100 },
    { date: "2025-10-29", price: 1150 },
    { date: "2025-10-30", price: 1200 },
    { date: "2025-10-31", price: 1180 },
    { date: "2025-11-01", price: 1220 },
    { date: "2025-11-02", price: 1250 },
  ];

  // localStorage에서 거래 내역 불러오기
  const [tradeHistory, setTradeHistory] = useState<Array<{
    id: number;
    type: string;
    amount: number;
    price: number;
    date: string;
  }>>([]);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("tokenTradeHistory") || "[]");
    setTradeHistory(savedHistory);
  }, []);

  const handleBuy = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      sonnerToast.error("구매할 토큰 수량을 입력해주세요.");
      return;
    }

    if (!selectedAccountId) {
      sonnerToast.error("결제 계좌를 선택해주세요.");
      setIsPaymentDialogOpen(true);
      return;
    }

    const buyTokens = parseFloat(buyAmount);
    const cost = buyTokens * tokenPrice;

    if (!user) {
      sonnerToast.error("로그인이 필요합니다");
      navigate("/auth");
      return;
    }

    // 결제 처리 (실제로는 결제 API 연동 필요)
    try {
      // 1. 결제 내역 저장
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          amount: cost,
          payment_method: "bank_transfer",
          status: "completed",
          description: `${buyTokens.toLocaleString()} GMT 구매`,
        });

      if (paymentError) {
        console.error("Payment error:", paymentError);
        sonnerToast.error("결제 처리에 실패했습니다");
        return;
      }

      // 2. 프로필 업데이트 (토큰 증가, 원화 감소)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("tokens, balance")
        .eq("id", user.id)
        .single();

      if (profileData) {
        const newTokens = (profileData.tokens || 0) + buyTokens;
        const newBalance = Math.max(0, (profileData.balance || 0) - cost);

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            tokens: newTokens,
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Update profile error:", updateError);
          sonnerToast.error("토큰 업데이트에 실패했습니다");
          return;
        }

        setMyTokens(newTokens);
        setMyBalance(newBalance);
      }

      // 3. 토큰 거래 내역 저장
      await supabase
        .from("token_transactions")
        .insert({
          user_id: user.id,
          amount: buyTokens,
          transaction_type: "purchase",
          description: `${buyTokens.toLocaleString()} GMT 구매`,
        });

      // 4. localStorage 거래 내역 저장 (호환성)
      const savedHistory = JSON.parse(localStorage.getItem("tokenTradeHistory") || "[]");
      const newTrade = {
        id: Date.now(),
        type: "매수",
        amount: buyTokens,
        price: tokenPrice,
        date: new Date().toLocaleString("ko-KR"),
      };
      savedHistory.unshift(newTrade);
      localStorage.setItem("tokenTradeHistory", JSON.stringify(savedHistory));
      setTradeHistory(savedHistory);

      // Header 업데이트를 위한 이벤트 발생
      window.dispatchEvent(new Event("tokensUpdated"));

      sonnerToast.success(`${buyTokens.toLocaleString()} GMT를 ${cost.toLocaleString()}원에 구매했습니다.`);
      setBuyAmount("");
      setIsPaymentDialogOpen(false);
    } catch (error) {
      console.error("Buy error:", error);
      sonnerToast.error("구매 처리 중 오류가 발생했습니다");
    }
  };

  const handleSell = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      sonnerToast.error("판매할 토큰 수량을 입력해주세요.");
      return;
    }

    const sellTokens = parseFloat(sellAmount);

    if (sellTokens > myTokens) {
      sonnerToast.error("보유 토큰이 부족합니다.");
      return;
    }

    if (!user) {
      sonnerToast.error("로그인이 필요합니다");
      navigate("/auth");
      return;
    }

    try {
      const revenue = sellTokens * tokenPrice;

      // 프로필 업데이트 (토큰 감소, 원화 증가)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("tokens, balance")
        .eq("id", user.id)
        .single();

      if (profileData) {
        const newTokens = Math.max(0, (profileData.tokens || 0) - sellTokens);
        const newBalance = (profileData.balance || 0) + revenue;

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            tokens: newTokens,
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Update profile error:", updateError);
          sonnerToast.error("토큰 업데이트에 실패했습니다");
          return;
        }

        setMyTokens(newTokens);
        setMyBalance(newBalance);
      }

      // 토큰 거래 내역 저장
      await supabase
        .from("token_transactions")
        .insert({
          user_id: user.id,
          amount: sellTokens,
          transaction_type: "sell",
          description: `${sellTokens.toLocaleString()} GMT 판매`,
        });

      // localStorage 거래 내역 저장
      const savedHistory = JSON.parse(localStorage.getItem("tokenTradeHistory") || "[]");
      const newTrade = {
        id: Date.now(),
        type: "매도",
        amount: sellTokens,
        price: tokenPrice,
        date: new Date().toLocaleString("ko-KR"),
      };
      savedHistory.unshift(newTrade);
      localStorage.setItem("tokenTradeHistory", JSON.stringify(savedHistory));
      setTradeHistory(savedHistory);

      // Header 업데이트를 위한 이벤트 발생
      window.dispatchEvent(new Event("tokensUpdated"));

      sonnerToast.success(`${sellTokens.toLocaleString()} GMT를 ${revenue.toLocaleString()}원에 판매했습니다.`);
      setSellAmount("");
    } catch (error) {
      console.error("Sell error:", error);
      sonnerToast.error("판매 처리 중 오류가 발생했습니다");
    }
  };

  const priceChange = priceHistory[priceHistory.length - 1].price - priceHistory[priceHistory.length - 2].price;
  const priceChangePercent = ((priceChange / priceHistory[priceHistory.length - 2].price) * 100).toFixed(2);

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">토큰 마켓</h1>
          <p className="text-muted-foreground">건설마켓 토큰을 거래하고 자산을 관리하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 현재 시세 & 차트 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 현재 시세 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">건마켓 토큰 (GMT)</CardTitle>
                    <CardDescription>1 GMT = {tokenPrice.toLocaleString()}원</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">{tokenPrice.toLocaleString()}원</div>
                    <div className={`flex items-center gap-1 text-sm ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span>{priceChange >= 0 ? '+' : ''}{priceChange.toLocaleString()}원 ({priceChangePercent}%)</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 간단한 가격 차트 */}
                <div className="h-64 flex items-end justify-between gap-2">
                  {priceHistory.map((item, index) => {
                    const maxPrice = Math.max(...priceHistory.map(h => h.price));
                    const minPrice = Math.min(...priceHistory.map(h => h.price));
                    const heightPercent = ((item.price - minPrice) / (maxPrice - minPrice)) * 100;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-primary/20 hover:bg-primary/30 transition-colors rounded-t"
                          style={{ height: `${Math.max(heightPercent, 10)}%` }}
                        >
                          <div className="w-full h-full bg-gradient-to-t from-primary to-primary/60 rounded-t" />
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          {item.date.split('-').slice(1).join('/')}
                        </div>
                        <div className="text-xs font-medium text-foreground">
                          {item.price.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 거래 내역 */}
            <Card>
              <CardHeader>
                <CardTitle>최근 거래 내역</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tradeHistory.length > 0 ? (
                    tradeHistory.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${trade.type === '매수' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            {trade.type === '매수' ? (
                              <ArrowUpRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{trade.type}</div>
                            <div className="text-sm text-muted-foreground">{trade.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{trade.amount.toLocaleString()} GMT</div>
                          <div className="text-sm text-muted-foreground">@{trade.price.toLocaleString()}원</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      거래 내역이 없습니다
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽: 매수/매도 & 보유 현황 */}
          <div className="space-y-6">
            {/* 보유 현황 */}
            <Card>
              <CardHeader>
                <CardTitle>내 자산</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">보유 토큰</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">{myTokens.toLocaleString()} GMT</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">보유 원화</span>
                  <span className="font-bold text-foreground">{myBalance.toLocaleString()}원</span>
                </div>
              </CardContent>
            </Card>

            {/* 매수/매도 */}
            <Card>
              <CardHeader>
                <CardTitle>거래</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="buy">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy">매수</TabsTrigger>
                    <TabsTrigger value="sell">매도</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="buy" className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">매수 수량</label>
                      <Input
                        type="number"
                        placeholder="토큰 수량 입력"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                      />
                      {buyAmount && (
                        <div className="text-xs text-muted-foreground mt-1">
                          총 비용: {(parseFloat(buyAmount) * tokenPrice).toLocaleString()}원
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-muted-foreground">결제 계좌</label>
                        <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-1">
                              <Plus className="h-4 w-4 mr-1" />
                              계좌 추가
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>계좌 추가</DialogTitle>
                              <DialogDescription>
                                결제에 사용할 계좌 정보를 입력하세요
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="bank_name">은행명</Label>
                                <Input
                                  id="bank_name"
                                  value={newAccount.bank_name}
                                  onChange={(e) => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                                  placeholder="예: 국민은행"
                                />
                              </div>
                              <div>
                                <Label htmlFor="account_number">계좌번호</Label>
                                <Input
                                  id="account_number"
                                  value={newAccount.account_number}
                                  onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
                                  placeholder="예: 123-456-789012"
                                />
                              </div>
                              <div>
                                <Label htmlFor="account_holder">예금주</Label>
                                <Input
                                  id="account_holder"
                                  value={newAccount.account_holder}
                                  onChange={(e) => setNewAccount({ ...newAccount, account_holder: e.target.value })}
                                  placeholder="예금주명"
                                />
                              </div>
                              <Button onClick={handleAddAccount} className="w-full">
                                계좌 추가
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      {accounts.length > 0 ? (
                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                          <SelectTrigger>
                            <SelectValue placeholder="계좌 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.bank_name} {account.account_number} ({account.account_holder})
                                {account.is_default && " [기본]"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-3 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
                          <CreditCard className="h-5 w-5 mx-auto mb-2" />
                          <p>결제 계좌를 추가해주세요</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => setIsAccountDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            계좌 추가
                          </Button>
                        </div>
                      )}
                    </div>

                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>결제 계좌 선택</DialogTitle>
                          <DialogDescription>
                            매수를 위해 결제 계좌를 선택해주세요
                          </DialogDescription>
                        </DialogHeader>
                        {accounts.length > 0 ? (
                          <div className="space-y-2 py-4">
                            {accounts.map((account) => (
                              <div
                                key={account.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  selectedAccountId === account.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-muted/50"
                                }`}
                                onClick={() => {
                                  setSelectedAccountId(account.id);
                                  setIsPaymentDialogOpen(false);
                                }}
                              >
                                <div className="font-medium">{account.bank_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {account.account_number} ({account.account_holder})
                                </div>
                                {account.is_default && (
                                  <span className="text-xs text-primary">기본 계좌</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4">
                            <p className="text-sm text-muted-foreground mb-4">
                              등록된 계좌가 없습니다. 계좌를 추가해주세요.
                            </p>
                            <Button
                              onClick={() => {
                                setIsPaymentDialogOpen(false);
                                setIsAccountDialogOpen(true);
                              }}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              계좌 추가하기
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button 
                      onClick={handleBuy} 
                      className="w-full" 
                      variant="default"
                      disabled={!selectedAccountId || !buyAmount || parseFloat(buyAmount) <= 0}
                    >
                      매수하기
                    </Button>
                  </TabsContent>

                  <TabsContent value="sell" className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">매도 수량</label>
                      <Input
                        type="number"
                        placeholder="토큰 수량 입력"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                      />
                      {sellAmount && (
                        <div className="text-xs text-muted-foreground mt-1">
                          예상 수익: {(parseFloat(sellAmount) * tokenPrice).toLocaleString()}원
                        </div>
                      )}
                    </div>
                    <Button onClick={handleSell} className="w-full" variant="destructive">
                      매도하기
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
