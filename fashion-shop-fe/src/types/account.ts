export interface Account {
  id: number;
  email: string;
  name?: string;
  role: string;
  status: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
