import Image from "next/image";
import Link from "next/link";
import instagramFeed from "@/site/config/instagram-feed.json";
import { SocialIcon } from "@/site/components/social/social-icons";

type StaticInstagramPost = {
  imageUrl: string;
  href: string;
  alt: string;
};

const DEFAULT_POST_LIMIT = 9;

export function InstagramGrid({ limit = DEFAULT_POST_LIMIT }: { limit?: number }) {
  const posts = (instagramFeed as StaticInstagramPost[]).slice(0, limit);

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {posts.map((post, index) => (
        <Link
          key={`${post.href}-${post.imageUrl}-${index}`}
          href={post.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-square overflow-hidden bg-canvas"
          aria-label={`${post.alt}. Abrir post original no Instagram em nova aba.`}
          title={post.alt}
        >
          <Image src={post.imageUrl} alt={post.alt} fill sizes="(max-width: 1024px) 33vw, 100px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
          <span className="absolute inset-0 bg-primary/0 transition-colors duration-300 group-hover:bg-primary/25" />
          <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <SocialIcon network="instagram" />
          </span>
        </Link>
      ))}
    </div>
  );
}
