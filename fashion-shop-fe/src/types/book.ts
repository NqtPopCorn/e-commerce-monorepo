export * from "./product";
import { Product, ProductVariant, CreateProductDto, UpdateProductDto } from "./product";

export type Book = Product;
export type BookVariant = ProductVariant;
export type CreateBookDto = CreateProductDto;
export type UpdateBookDto = UpdateProductDto;
