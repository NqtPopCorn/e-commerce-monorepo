"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const formSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu ít nhất 6 ký tự" }),
});

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.login({
        email: values.email,
        password: values.password,
      });
      setAuth(result.accessToken, result.user);

      if (result.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (e: any) {
      if (e.response?.status === 401) {
        setError("Email hoặc mật khẩu không đúng");
      } else {
        setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-[80vh] flex flex-col justify-center py-10">
      <div className="container mx-auto px-4 h-full">
        <div className="flex flex-col md:flex-row justify-center items-center h-full gap-10">
          <div className="w-full md:w-5/12 lg:w-1/2">
            <img
              src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
              className="w-full h-auto object-contain"
              alt="Login graphic"
            />
          </div>
          <div className="w-full md:w-7/12 lg:w-5/12 xl:w-4/12 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Đăng nhập</h2>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm border border-red-200">
                {error}
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12"
                          placeholder="Nhập địa chỉ email hợp lệ"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Mật khẩu</FormLabel>
                      <FormControl>
                        <Input
                          className="h-12"
                          type="password"
                          placeholder="Nhập mật khẩu"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                    />
                    <label
                      htmlFor="remember"
                      className="text-gray-600 cursor-pointer"
                    >
                      Ghi nhớ đăng nhập
                    </label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>

                <div className="mt-6 pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full lg:w-auto px-10 h-12 text-lg bg-[#007bff] hover:bg-blue-700 text-white rounded-md transition-colors shadow-md"
                  >
                    {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
                  </Button>
                  <p className="text-sm font-semibold mt-4 pt-1 mb-0 text-gray-600 text-center lg:text-left">
                    Bạn chưa có tài khoản?{" "}
                    <Link
                      href="/register"
                      className="text-red-600 hover:text-red-700 hover:underline"
                    >
                      Đăng ký ngay
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
