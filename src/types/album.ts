export interface NeteaseAlbum {
  id: number;
  name: string;
  picUrl: string;
  artist: { name: string };
  publishTime: number;
  size: number; // 曲目数
}

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
  reviewContent: string; // MDX 编译后的内容
}

export interface CacheEntry {
  data: NeteaseAlbum;
  cachedAt: number;
}

export interface AlbumFrontmatter {
  id: number;
  artist?: string;
  album?: string;
  date: string;
  genre?: string;
}
