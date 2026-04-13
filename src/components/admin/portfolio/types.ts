export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  order: number;
  _count?: { works: number };
}
