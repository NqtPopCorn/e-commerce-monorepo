import { api } from "@/lib/api";
import { Book, CreateBookDto, UpdateBookDto } from "@/types/book";

export const booksService = {
  getAll: async (): Promise<Book[]> => {
    const res = await api.get("/books");
    return res.data;
  },
  getById: async (id: string | number): Promise<Book> => {
    const res = await api.get(`/books/${id}`);
    return res.data;
  },
  create: async (data: CreateBookDto): Promise<Book> => {
    const res = await api.post("/books", data);
    return res.data;
  },
  update: async (id: number | string, data: UpdateBookDto): Promise<Book> => {
    const res = await api.patch(`/books/${id}`, data);
    return res.data;
  },
  delete: async (id: number | string): Promise<Book> => {
    const res = await api.delete(`/books/${id}`);
    return res.data;
  },
};
