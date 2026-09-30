"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { authService } from "@/services/auth.service";

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
import { toast } from "sonner";
import { Phone, Mail, Lock, User } from "lucide-react";

const formSchema = z
  .object({
    firstName: z.string().min(2, { message: "Tên ít nhất 2 ký tự" }),
    lastName: z.string().min(2, { message: "Họ ít nhất 2 ký tự" }),
    phone: z
      .string()
      .regex(/^(0|\+84)[0-9]{9}$/, {
        message: "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)",
      })
      .optional()
      .or(z.literal("")),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    email: z.string().email({ message: "Email không hợp lệ" }),
    password: z.string().min(6, { message: "Mật khẩu ít nhất 6 ký tự" }),
    confirmPassword: z.string().min(6, { message: "Mật khẩu ít nhất 6 ký tự" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      gender: "FEMALE",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true);
    setError(null);
    try {
      await authService.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phone: values.phone?.trim() || undefined,
        gender: values.gender || undefined,
      });
      toast.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
      router.push("/login");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Đăng ký thất bại. Vui lòng kiểm tra lại.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="min-h-[80vh] flex flex-col justify-center py-10 px-4">
      <div className="container mx-auto h-full">
        <div className="flex flex-col md:flex-row justify-center items-center h-full gap-10">
          <div className="w-full md:w-5/12 lg:w-1/2 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
              className="w-full max-w-md h-auto object-contain scale-x-[-1]"
              alt="Fashion Shop Register"
            />
          </div>
          <div className="w-full md:w-9/12 lg:w-8/12 xl:w-5/12 bg-card p-6 sm:p-8 rounded-2xl shadow-lg border border-border">
            <div className="flex flex-col mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Đăng Ký Tài Khoản
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tạo tài khoản để nhận ưu đãi thành viên và theo dõi đơn hàng
                thời trang.
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-xl mb-4 text-xs border border-destructive/20 font-medium">
                {error}
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3.5"
              >
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">
                          Họ & tên đệm
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-10 text-xs rounded-xl"
                            placeholder="Nguyễn Văn"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">
                          Tên
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-10 text-xs rounded-xl"
                            placeholder="An"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">
                          Số điện thoại (Nhận hàng)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                              className="pl-8 h-10 text-xs font-mono rounded-xl"
                              placeholder="0901 234 567"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">
                          Giới tính
                        </FormLabel>
                        <FormControl>
                          <select
                            value={field.value}
                            onChange={field.onChange}
                            className="w-full h-10 px-3 bg-background border border-input rounded-xl text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="FEMALE">Nữ</option>
                            <option value="MALE">Nam</option>
                            <option value="OTHER">Khác</option>
                          </select>
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">
                        Email đăng nhập
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            className="pl-8 h-10 text-xs rounded-xl"
                            placeholder="you@example.com"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">
                        Mật khẩu
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            className="pl-8 h-10 text-xs rounded-xl"
                            type="password"
                            placeholder="Tối thiểu 6 ký tự"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">
                        Xác nhận mật khẩu
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            className="pl-8 h-10 text-xs rounded-xl"
                            type="password"
                            placeholder="Nhập lại mật khẩu"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="agree"
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                    required
                  />
                  <label
                    htmlFor="agree"
                    className="text-muted-foreground text-xs cursor-pointer"
                  >
                    Tôi đồng ý với các điều khoản và chính sách bảo mật
                  </label>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 text-sm font-semibold rounded-xl transition-colors shadow-xs"
                  >
                    {submitting ? "Đang tạo tài khoản..." : "Đăng Ký Tài Khoản"}
                  </Button>
                  <p className="text-xs mt-4 text-muted-foreground text-center">
                    Đã có tài khoản?{" "}
                    <Link
                      href="/login"
                      className="text-primary hover:underline font-semibold"
                    >
                      Đăng nhập ngay
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
