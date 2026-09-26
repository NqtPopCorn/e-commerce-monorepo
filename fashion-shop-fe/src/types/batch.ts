export interface CreateBatchDto {
  code: string;
  bookId: number;
  quantity: number;
}

export interface Batch {
  id: number;
  code: string;
  quantity: number;
  bookId: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  book?: {
    title: string;
  };
}
