---
name: create-fe-page
description: >-
  Quy trình tạo trang mới trong Next.js frontend App Router.
  Sử dụng khi cần thêm page, layout, hoặc component mới.
---

# Create Frontend Page

## Steps

### 1. Tạo route trong App Router
```
fashion-shop-fe/src/app/<route>/
├── page.tsx          # Page component
├── layout.tsx        # Layout wrapper (optional)
└── loading.tsx       # Loading skeleton (optional)
```

### 2. Tạo types
```typescript
// fashion-shop-fe/src/types/<feature>.ts
export interface Feature {
  id: string;
  name: string;
  // ...
}
```

### 3. Tạo API service
```typescript
// fashion-shop-fe/src/services/<feature>.service.ts
import api from '@/lib/axios';
import { Feature } from '@/types/<feature>';

export const featureService = {
  getAll: () => api.get<Feature[]>('/api/<features>'),
  getById: (id: string) => api.get<Feature>(`/api/<features>/${id}`),
  create: (data: Partial<Feature>) => api.post('/api/<features>', data),
};
```

### 4. Tạo components
```
fashion-shop-fe/src/components/<feature>/
├── FeatureList.tsx       # Danh sách
├── FeatureCard.tsx       # Card item
├── FeatureForm.tsx       # Form tạo/sửa
└── FeatureDetailModal.tsx # Chi tiết (dialog)
```

### 5. Sử dụng React Query
```typescript
import { useQuery } from '@tanstack/react-query';
import { featureService } from '@/services/<feature>.service';

export function useFeatures() {
  return useQuery({
    queryKey: ['features'],
    queryFn: () => featureService.getAll().then(res => res.data),
  });
}
```

### 6. UI Components
- Dùng shadcn/ui (Radix UI) cho Dialog, Button, Input, Select, Table
- Dùng `cn()` helper cho conditional class names
- Dùng `lucide-react` cho icons
- Responsive design: dùng Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
