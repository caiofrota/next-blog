export type WpPost = {
  id: number;
  date_gmt: string;
  link: string;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  categories: number[];
  tags: number[];
  featured_media: number;
  _embedded?: {
    "wp:featuredmedia"?: WpMedia[];
  };
};

export type WpTerm = {
  id: number;
  name: string;
  slug: string;
  description?: string;
};

export type WpMedia = {
  id: number;
  source_url: string;
  alt_text?: string;
  mime_type: string;
  media_details?: {
    file?: string;
    width?: number;
    height?: number;
  };
};

export class WordPressRequestError extends Error {
  constructor(
    public status: number,
    public path: string,
    public code?: string,
    public details?: unknown
  ) {
    super(`WordPress request failed ${status}${code ? ` (${code})` : ""}: ${path}`);
  }
}

export class WordPressClient {
  constructor(private baseUrl: string) {}

  async getPosts(page = 1, perPage = 20) {
    return this.fetchJson<WpPost[]>(`/wp-json/wp/v2/posts?_embed=1&page=${page}&per_page=${perPage}`);
  }

  async getPost(id: number) {
    return this.fetchJson<WpPost>(`/wp-json/wp/v2/posts/${id}?_embed=1`);
  }

  async getCategory(id: number) {
    return this.fetchJson<WpTerm>(`/wp-json/wp/v2/categories/${id}`);
  }

  async getTag(id: number) {
    return this.fetchJson<WpTerm>(`/wp-json/wp/v2/tags/${id}`);
  }

  async getMedia(id: number) {
    return this.fetchJson<WpMedia>(`/wp-json/wp/v2/media/${id}`);
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}${path}`);
    if (!response.ok) {
      let payload: { code?: string } | undefined;
      try {
        payload = (await response.json()) as { code?: string };
      } catch {
        payload = undefined;
      }
      throw new WordPressRequestError(response.status, path, payload?.code, payload);
    }
    return response.json() as Promise<T>;
  }
}
