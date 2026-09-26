"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Search, FileDown } from "lucide-react";
import { CreatePurchaseModal } from "@/components/admin/purchase/CreatePurchaseModal";
import { PurchaseDetailModal } from "@/components/admin/purchase/PurchaseDetailModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetBatches } from "@/hooks/useBatches";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function PurchasePage() {
  const { data: batches, isLoading } = useGetBatches();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleView = (purchase: any) => {
    setSelectedPurchase(purchase);
    setIsDetailOpen(true);
  };

  const filteredBatches = batches?.filter((b: any) => 
    b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.variant?.book?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý Nhập kho
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi và quản lý các lô hàng nhập kho của bạn
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 text-gray-600"
          >
            <FileDown className="w-4 h-4" /> Xuất Excel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4" /> Tạo Phiếu Nhập
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm theo mã phiếu hoặc tên sách..."
              className="pl-9 border-gray-200 focus-visible:ring-blue-500 bg-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
            Tổng số: <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{filteredBatches?.length || 0}</span> phiếu nhập
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[130px] font-semibold text-gray-600">Mã phiếu</TableHead>
                <TableHead className="font-semibold text-gray-600 min-w-[150px]">Ngày nhập</TableHead>
                <TableHead className="font-semibold text-gray-600 min-w-[250px]">Sản phẩm (Sách)</TableHead>
                <TableHead className="font-semibold text-gray-600">Người tạo</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">Số lượng</TableHead>
                <TableHead className="text-center font-semibold text-gray-600">Trạng thái</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="font-medium text-gray-500">Đang tải dữ liệu...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBatches?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-700">Không tìm thấy phiếu nhập nào</p>
                      <p className="text-sm mt-1">Hãy thử thay đổi từ khóa tìm kiếm của bạn</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches?.map((p: any) => (
                  <TableRow key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                    <TableCell className="font-semibold text-gray-800">
                      {p.code}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Intl.DateTimeFormat("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(p.createdAt))}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900 line-clamp-1">{p.variant?.book?.title || 'Sách không xác định'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">SKU: {p.variant?.sku || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                          A
                        </div>
                        <span className="text-sm font-medium text-gray-700">Admin</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                        {p.quantity} quyển
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                        Hoàn thành
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(p)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100 md:opacity-100 focus:opacity-100"
                      >
                        <Eye className="w-4 h-4 mr-1.5" /> Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreatePurchaseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      <PurchaseDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        purchase={selectedPurchase}
      />
    </div>
  );
}
