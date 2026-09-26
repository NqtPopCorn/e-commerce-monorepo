import React from "react";
import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Image as ImageIcon, // Placeholder for Pinterest if missing in lucide
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t py-8 mt-auto">
      <div className="w-full max-w-[1230px] mx-auto px-4">
        {/* Newsletter Section */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8 hidden">
          <div className="font-semibold text-gray-700">
            Đăng kí nhận thông tin
          </div>
          <div className="flex w-full md:w-auto max-w-md">
            <input
              type="email"
              placeholder="Email của bạn"
              className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:border-red-500"
            />
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-r-md font-medium transition-colors">
              Gửi
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          {/* Column 1: Info & Socials */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-6">
            <div className="mb-4 text-3xl font-bold text-[#c92127]">FAHASA</div>
            <address className="not-italic text-gray-600 mb-4 leading-relaxed">
              Địa chỉ: 273 D. An Dương Vương,
              <br />
              Phường 3, Quận 5, Hồ Chí Minh
            </address>
            <div className="flex gap-4 text-gray-500">
              <a href="#" className="hover:text-blue-600 transition-colors">
                <Facebook size={24} />
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                <Twitter size={24} />
              </a>
              <a href="#" className="hover:text-pink-600 transition-colors">
                <Instagram size={24} />
              </a>
              <a href="#" className="hover:text-red-600 transition-colors">
                <Youtube size={24} />
              </a>
            </div>
          </div>

          {/* Column 2: Services */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h5 className="font-bold text-lg mb-4 text-gray-800">Dịch vụ</h5>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link
                  href="/coming-soon"
                  className="hover:text-red-600 transition-colors"
                >
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link
                  href="/coming-soon"
                  className="hover:text-red-600 transition-colors"
                >
                  Chính sách bảo mật thông tin cá nhân
                </Link>
              </li>
              <li>
                <Link
                  href="/coming-soon"
                  className="hover:text-red-600 transition-colors"
                >
                  Chính sách bảo mật thanh toán
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h5 className="font-bold text-lg mb-4 text-gray-800">Hỗ trợ</h5>
            <ul className="space-y-3 text-gray-600">
              <li>
                <Link
                  href="/coming-soon"
                  className="hover:text-red-600 transition-colors"
                >
                  Chính sách đổi trả hoàn tiền
                </Link>
              </li>
              <li>
                <Link
                  href="/coming-soon"
                  className="hover:text-red-600 transition-colors"
                >
                  Chính sách bảo hành
                </Link>
              </li>
              <li>
                <Link
                  href="/coming-soon"
                  className="hover:text-red-600 transition-colors"
                >
                  Chính sách vận chuyển
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center text-gray-500 text-xs mt-10 pt-4 border-t border-gray-100">
          &copy; {new Date().getFullYear()} Fahasa Clone (BookShop V2). All
          rights reserved.
        </div>
      </div>
    </footer>
  );
}
