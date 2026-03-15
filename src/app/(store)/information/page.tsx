import { Container } from "@/components/layout/Container";

export const metadata = {
  title: "Information",
  description: "About our sarees, authenticity, care and contact.",
};

const sections = [
  {
    id: "about",
    title: "About",
    body: "We curate a small selection of Kanchipuram and silk sarees for those who value quality and tradition. Each piece is chosen for its weave, finish and suitability for both everyday and occasion wear.",
  },
  {
    id: "authenticity",
    title: "Authenticity & Quality",
    body: "We source directly from weavers and verified suppliers. Our Kanchipuram sarees are genuine silk with zari work as described. We are happy to share more details on request before you decide.",
  },
  {
    id: "care",
    title: "Care Instructions",
    body: "Store in a cool, dry place, away from direct sunlight. Fold with a soft cloth between layers. Dry clean when needed. Avoid contact with perfumes or deodorants directly on the fabric.",
  },
  {
    id: "contact",
    title: "Contact",
    body: "For enquiries about a specific saree, custom orders or bulk requests, please reach out via the contact details we provide. We aim to respond within 1–2 business days.",
  },
];

export default function InformationPage() {
  return (
    <div className="py-10 md:py-14">
      <Container>
        <h1 className="font-serif text-2xl md:text-3xl text-stone-900 tracking-wide mb-10">
          Information
        </h1>
        <div className="space-y-12 max-w-2xl">
          {sections.map(({ id, title, body }) => (
            <section key={id} id={id}>
              <h2 className="font-medium text-stone-900 mb-3">{title}</h2>
              <p className="text-stone-600 text-sm leading-relaxed">{body}</p>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
