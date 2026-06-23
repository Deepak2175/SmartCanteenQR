import { Outlet, useLocation, useNavigate } from "react-router";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Home, ShoppingCart, ClipboardList, User, ScanLine, Moon, Sun } from "lucide-react";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/menu", icon: ScanLine, label: "Menu" },
  { path: "/cart", icon: ShoppingCart, label: "Cart" },
  { path: "/orders", icon: ClipboardList, label: "Orders" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function StudentLayout() {
  const { student, isAuthenticated } = useStudentAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const hideNavPaths = ["/checkout", "/qr"];
  const shouldHideNav = hideNavPaths.some((p) => location.pathname.startsWith(p));
  const isLoading = !student && location.pathname !== "/" && location.pathname !== "/menu";

  useEffect(() => {
    if (shouldHideNav) return;
    // Redirect unauthenticated users on protected routes to login
    const protectedPaths = ["/cart", "/checkout", "/orders"];
    if (!isAuthenticated && !isLoading && protectedPaths.some((p) => location.pathname === p)) {
      navigate("/student-login");
    }
  }, [isAuthenticated, location.pathname, navigate, shouldHideNav]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {!shouldHideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card dark:bg-[#070707] border-t border-border dark:border-[#1a1a1a] z-50">
          <div className="flex justify-around items-center h-16 max-w-lg mx-auto relative">
            {tabs.map((tab) => {
              const isActive =
                tab.path === "/profile"
                  ? location.pathname === "/profile" || location.pathname === "/student-login" || location.pathname === "/student-register"
                  : location.pathname === tab.path;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.path}
                  onClick={() => {
                    if (tab.path === "/profile" && !isAuthenticated) {
                      navigate("/student-login");
                    } else {
                      navigate(tab.path);
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                    isActive ? "text-green-600" : "text-muted-foreground dark:text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className={`text-[10px] ${isActive ? "font-semibold" : ""}`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 w-8 h-0.5 bg-green-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="fixed bottom-20 right-4 z-50 w-10 h-10 rounded-full bg-card dark:bg-[#121212] border border-border dark:border-[#1f1f1f] shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
      </button>
    </div>
  );
}
