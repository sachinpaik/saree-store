import { Container } from "@/components/layout/Container";
import { Sparkles, Shield, Heart } from "lucide-react";

const tiles = [
  {
    icon: Sparkles,
    title: "Craftsmanship",
    text: "Each piece is chosen for its weave, finish and traditional artistry.",
  },
  {
    icon: Shield,
    title: "Authenticity",
    text: "We work directly with weavers and verified sources for genuine Kanchipuram and silks.",
  },
  {
    icon: Heart,
    title: "Heritage",
    text: "Our collection honours time-tested techniques and enduring design.",
  },
];

export function BrandStory() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <Container>
        <div className="max-w-2xl mb-14">
          <h2 className="font-serif text-2xl md:text-3xl text-stone-900 tracking-wide mb-4">
            Our story
          </h2>
          <p className="text-stone-600 leading-relaxed">
            We offer a small, carefully chosen range of Kanchipuram and silk sarees. Every saree in our collection is selected for quality, authenticity and wearability—for occasions that matter.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {tiles.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col items-start">
              <div className="mb-4 p-2 text-stone-700">
                <Icon className="w-6 h-6" strokeWidth={1.25} aria-hidden />
              </div>
              <h3 className="font-medium text-stone-900 mb-2">{title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
