export interface Album {
  slug: string;
  neteaseId: number;
  name: string;
  artist: string;
  coverUrl: string;
  year: number;
  trackCount: number;
  date: string; // 乐评日期
  genre?: string; // 音乐流派
  reviewContent: string; // MDX 原文，用于生成页面摘要
}
