import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Plus, User, Menu, Coins, Moon, Sun, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [myTokens, setMyTokens] = useState(50000);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
      setMyTokens(data.tokens || 0);
    }
  };

  // 사용자 인증 상태 확인
  useEffect(() => {
    // 현재 세션 확인
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadUserProfile(user.id);
      }
    };
    
    initAuth();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setProfile(null);
        setMyTokens(0);
      }
    });

    // 커스텀 이벤트 리스너 (다른 탭에서 로그인/로그아웃 시)
    const handleAuthStateChanged = () => {
      initAuth();
    };

    window.addEventListener("authStateChanged", handleAuthStateChanged);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("authStateChanged", handleAuthStateChanged);
    };
  }, []);

  // localStorage에서 보유 토큰 불러오기 (백업)
  useEffect(() => {
    if (!user) {
      const savedTokens = localStorage.getItem("userTokens");
      if (savedTokens) {
        setMyTokens(parseInt(savedTokens));
      } else {
        localStorage.setItem("userTokens", "0");
        setMyTokens(0);
      }

      // 토큰 업데이트 이벤트 리스너
      const handleTokensUpdate = () => {
        const updatedTokens = localStorage.getItem("userTokens");
        if (updatedTokens) {
          setMyTokens(parseInt(updatedTokens));
        }
      };

      window.addEventListener("tokensUpdated", handleTokensUpdate);
      return () => window.removeEventListener("tokensUpdated", handleTokensUpdate);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("로그아웃에 실패했습니다");
        return;
      }
      setUser(null);
      setProfile(null);
      localStorage.removeItem("user");
      // 인증 상태 변경 이벤트 트리거
      window.dispatchEvent(new CustomEvent("authStateChanged"));
      toast.success("로그아웃되었습니다");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("로그아웃 중 오류가 발생했습니다");
    }
  };

  const toggleTheme = () => {
    const currentTheme = theme || "light";
    if (currentTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  const isDark = mounted && (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">건</span>
          </div>
          <span className="text-xl font-bold text-foreground">건설 마켓</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
            홈
          </Link>
          <Link to="/popular" className="text-sm font-medium transition-colors hover:text-primary">
            인기 상품
          </Link>
          <Link to="/cart" className="text-sm font-medium transition-colors hover:text-primary">
            장바구니
          </Link>
          <Link to="/create-listing" className="text-sm font-medium transition-colors hover:text-primary">
            판매하기
          </Link>
          <Link to="/my-page" className="text-sm font-medium transition-colors hover:text-primary">
            마이페이지
          </Link>
          <Link to="/token-market">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{myTokens.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">토큰</span>
            </div>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/token-market">
            <div className="flex md:hidden items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors">
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">{myTokens.toLocaleString()}</span>
            </div>
          </Link>
          {user ? (
            <>
              <Link to="/create-listing" className="hidden md:block">
                <Button variant="hero" size="default">
                  <Plus className="mr-2 h-4 w-4" />
                  자재 등록
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/my-page" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      마이페이지
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/create-listing" className="hidden md:block">
                <Button variant="hero" size="default">
                  <Plus className="mr-2 h-4 w-4" />
                  자재 등록
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="container mx-auto flex flex-col gap-2 p-4">
            <Link
              to="/"
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              홈
            </Link>
            <Link
              to="/popular"
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              인기 상품
            </Link>
            <Link
              to="/cart"
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              장바구니
            </Link>
            <Link
              to="/create-listing"
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              판매하기
            </Link>
            {user ? (
              <>
                <Link
                  to="/my-page"
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  onClick={() => setIsMenuOpen(false)}
                >
                  마이페이지
                </Link>
                <button
                  className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors hover:bg-muted text-destructive"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                onClick={() => setIsMenuOpen(false)}
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
