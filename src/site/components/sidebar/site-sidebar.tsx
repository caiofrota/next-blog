import Image from "next/image";
import Link from "next/link";
import { env } from "@/lib/env";
import { brand } from "@/site/config/brand";
import { listCategories } from "@/blog-engine/services/categories";
import { ContactForm, NewsletterForm } from "@/site/components/contact/contact-form";
import { InstagramGrid } from "@/site/components/instagram/instagram-grid";
import { SocialIcon } from "@/site/components/social/social-icons";

export async function SiteSidebar() {
  const categories = await listCategories();

  return (
    <aside className="space-y-8">
      <section className="bg-white">
        <h2 className="border-b border-[#eee7df] pb-3 text-lg font-semibold">Newsletter</h2>
        <p className="mt-4 text-sm leading-6 text-muted">Receba novidades do blog por e-mail, direto na sua caixa de entrada.</p>
        <div className="mt-4">
          <NewsletterForm />
        </div>
      </section>
      <section className="bg-white">
        <h2 className="mt-5 text-center text-xl font-semibold text-ink">{brand.author}</h2>
        {brand.profileImage ? (
          <Image src={brand.profileImage} alt={brand.author} width={960} height={1280} className="h-auto w-full transition-transform duration-700 hover:scale-[1.015]" />
        ) : null}
        <p className="mt-3 text-sm leading-6 text-muted">{brand.bio}</p>
      </section>
      {brand.instagram !== "#" ? (
        <section className="bg-white">
          <h2 className="border-b border-[#eee7df] pb-3 text-lg font-semibold">Instagram</h2>
          <Link href={brand.instagram} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary">
            <SocialIcon network="instagram" />
            Perfil do blog
          </Link>
          <InstagramGrid limit={9} />
        </section>
      ) : null}
      <section className="bg-white">
        <h2 className="border-b border-[#eee7df] pb-3 text-lg font-semibold">Categorias</h2>
        <div className="mt-4 grid gap-2">
          {categories.map((category) => (
            <Link key={category.id} href={`/categorias/${category.slug}`} className="text-sm font-semibold text-muted hover:text-primary">
              {category.name}
            </Link>
          ))}
        </div>
      </section>
      <section className="bg-white">
        <h2 className="border-b border-[#eee7df] pb-3 text-lg font-semibold">Entre em contato</h2>
        <p className="mt-4 text-sm leading-6 text-muted">
          Escreva para{" "}
          <a href={`mailto:${env.CONTACT_EMAIL}`} className="font-semibold text-primary hover:text-ink">
            {env.CONTACT_EMAIL}
          </a>
          .
        </p>
        <div className="mt-4">
          <ContactForm compact />
        </div>
      </section>
    </aside>
  );
}
