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

const formSchema = z
  .object({
    firstName: z.string().min(2, { message: "Tên ít nhất 2 ký tự" }),
    lastName: z.string().min(2, { message: "Họ ít nhất 2 ký tự" }),
    phone_number: z
      .string()
      .regex(/^\d{10}$/, { message: "Số điện thoại phải có 10 chữ số" })
      .optional(),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone_number: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await authService.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      });
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    }
  }

  return (
    <section className="min-h-[80vh] flex flex-col justify-center py-10">
      <div className="container mx-auto px-4 h-full">
        <div className="flex flex-col md:flex-row justify-center items-center h-full gap-10">
          <div className="w-full md:w-5/12 lg:w-1/2">
            <img
              src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
              className="w-full h-auto object-contain scale-x-[-1]"
              alt="Register graphic"
            />
          </div>
          <div className="w-full md:w-7/12 lg:w-5/12 xl:w-4/12 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                Đăng Ký Tài Khoản
              </h2>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-sm border border-red-200">
                {error}
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Họ</FormLabel>
                        <FormControl>
                          <Input className="h-11" placeholder="Họ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Tên</FormLabel>
                        <FormControl>
                          <Input
                            className="h-11"
                            placeholder="Tên"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        Số Điện Thoại
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-11"
                          placeholder="Nhập số điện thoại"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Email</FormLabel>
                      <FormControl>
                        <Input
                          className="h-11"
                          placeholder="you@example.com"
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
                          className="h-11"
                          type="password"
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        Xác Nhận Mật Khẩu
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-11"
                          type="password"
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="agree"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <label
                    htmlFor="agree"
                    className="text-gray-600 text-sm cursor-pointer"
                  >
                    Tôi đồng ý với các điều khoản và điều kiện
                  </label>
                </div>

                <div className="mt-6 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-12 text-lg bg-[#007bff] hover:bg-blue-700 text-white rounded-md transition-colors shadow-md"
                  >
                    Đăng Ký
                  </Button>
                  <p className="text-sm font-semibold mt-4 pt-1 mb-0 text-gray-600 text-center">
                    Đã có tài khoản?{" "}
                    <Link
                      href="/login"
                      className="text-red-600 hover:text-red-700 hover:underline"
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
