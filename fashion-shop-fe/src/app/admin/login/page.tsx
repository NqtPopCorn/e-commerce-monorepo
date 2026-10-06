"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  AlertCircle,
  KeyRound,
} from "lucide-react";

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  email: z.string().email({ message: "Email không đúng định dạng" }),
  password: z.string().min(6, { message: "Mật khẩu tối thiểu 6 ký tự" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Nếu đã đăng nhập với vai trò ADMIN thì chuyển thẳng vào /admin
  useEffect(() => {
    if (hasHydrated && user && user.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [hasHydrated, user, router]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.login({
        email: values.email,
        password: values.password,
      });

      if (result.user.role !== "ADMIN") {
        setError("Tài khoản không có quyền truy cập quản trị.");
        return;
      }

      setAuth(result.accessToken, result.user);
      router.push("/admin");
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Email hoặc mật khẩu không đúng.");
      } else {
        setError(
          err.response?.data?.message ||
            "Không thể kết nối đến máy chủ. Kiểm tra kết nối rồi thử lại.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const fillAdminCredentials = () => {
    form.setValue("email", "admin@fashionshop.com", {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue("password", "admin123", {
      shouldValidate: true,
      shouldDirty: true,
    });
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-muted/30 text-foreground">
      {/* Center Card */}
      <div className="w-full max-w-[420px]">
        {/* Link back to public shop */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang bán hàng</span>
          </Link>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 sm:p-8 shadow-xs text-card-foreground">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Đăng nhập quản trị
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Nhập thông tin tài khoản quản trị viên để tiếp tục.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-foreground">
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="admin@fashionshop.com"
                          type="email"
                          autoComplete="email"
                          className="pl-9 h-9 text-xs bg-background"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-foreground">
                      Mật khẩu
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="pl-9 pr-9 h-9 text-xs bg-background"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                          aria-label={
                            showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 text-xs font-semibold shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Đang đăng nhập...</span>
                    </>
                  ) : (
                    <span>Đăng nhập</span>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {/* Quick Demo Fill Helper */}
          <div className="mt-5 pt-4 border-t border-border">
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="w-full py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-border"
            >
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              <span>Điền mẫu tài khoản admin</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          &copy; {new Date().getFullYear()} Fashion Shop
        </p>
      </div>
    </div>
  );
}
