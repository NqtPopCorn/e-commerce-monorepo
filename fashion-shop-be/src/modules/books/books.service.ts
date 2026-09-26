import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";
@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}
  create(dto: CreateBookDto) {
    const { variants, ...bookData } = dto;
    return this.prisma.book.create({
      data: {
        ...bookData,
        variants: {
          create: variants,
        },
      },
    });
  }
  findAll(search?: string) {
    return this.prisma.book.findMany({
      where: search
        ? { title: { contains: search, mode: "insensitive" } }
        : undefined,
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
    });
  }
  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: { category: true, variants: true },
    });
    if (!book) throw new NotFoundException("Book not found");
    return book;
  }
  async update(id: number, dto: UpdateBookDto) {
    await this.findOne(id);
    const { variants, ...bookData } = dto;
    return this.prisma.$transaction(async (tx) => {
      if (variants) {
        // Simple strategy: delete existing and recreate
        await tx.bookVariant.deleteMany({ where: { bookId: id } });
      }
      return tx.book.update({
        where: { id },
        data: {
          ...bookData,
          ...(variants
            ? {
                variants: {
                  create: variants,
                },
              }
            : {}),
        },
      });
    });
  }
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.book.delete({ where: { id } });
  }
}
