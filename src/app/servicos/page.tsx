import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Lightbulb, BarChartBig, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const detailedServices = [
  {
    slug: "consultoria-estrategica",
    icon: Briefcase,
    title: 'Consultoria Estratégica Detalhada',
    shortDescription: 'Análise de mercado, planejamento estratégico e otimização de processos.',
    longDescription: 'Nossa consultoria estratégica vai além do básico. Mergulhamos profundamente no seu negócio, analisamos o cenário competitivo, identificamos oportunidades de crescimento e gargalos operacionais. Desenvolvemos planos de ação customizados e auxiliamos na implementação para garantir que sua empresa não apenas sobreviva, mas prospere no mercado.',
    features: ['Análise SWOT completa', 'Desenvolvimento de KPIs', 'Planejamento de expansão', 'Otimização de custos e processos'],
    image: "https://placehold.co/700x450",
    imageHint: "strategy session"
  },
  {
    slug: "mentoria-empresarial",
    icon: Lightbulb,
    title: 'Mentoria Empresarial Personalizada',
    shortDescription: 'Orientação personalizada para líderes e equipes.',
    longDescription: 'Oferecemos programas de mentoria para líderes e equipes, focados no desenvolvimento de habilidades essenciais, superação de desafios e alcance de metas ambiciosas. Nossos mentores experientes fornecem insights práticos, feedback construtivo e suporte contínuo para catalisar o crescimento profissional e organizacional.',
    features: ['Desenvolvimento de liderança', 'Gestão de equipes de alta performance', 'Resolução de conflitos', 'Planejamento de carreira executiva'],
    image: "https://placehold.co/700x450",
    imageHint: "mentorship guidance"
  },
  {
    slug: "inteligencia-de-mercado",
    icon: BarChartBig,
    title: 'Inteligência de Mercado Avançada',
    shortDescription: 'Coleta e análise de dados para insights valiosos.',
    longDescription: 'Transformamos dados brutos em inteligência acionável. Utilizamos ferramentas e metodologias avançadas para coletar, analisar e interpretar informações de mercado, concorrência e comportamento do consumidor. Com nossos relatórios e dashboards, você terá a clareza necessária para tomar decisões estratégicas mais assertivas e informadas.',
    features: ['Pesquisa de mercado qualitativa e quantitativa', 'Análise competitiva', 'Monitoramento de tendências', 'Segmentação de clientes'],
    image: "https://placehold.co/700x450",
    imageHint: "data analytics"
  },
];

export default function ServicosPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <section className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Nossos Serviços</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Descubra como nossas soluções especializadas em consultoria, mentoria e inteligência de mercado podem transformar o seu negócio.
        </p>
      </section>

      {detailedServices.map((service, index) => (
        <section key={service.slug} className={`py-12 md:py-16 ${index % 2 === 1 ? 'bg-muted/30' : 'bg-background'}`}>
          <div className="container mx-auto px-4">
            <div className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
              <div className={`rounded-lg overflow-hidden shadow-xl ${index % 2 === 1 ? 'md:order-1' : 'md:order-2'}`}>
                <Image
                  src={service.image}
                  alt={`Imagem para ${service.title}`}
                  width={700}
                  height={450}
                  className="w-full h-auto object-cover"
                  data-ai-hint={service.imageHint}
                />
              </div>
              <div className={`${index % 2 === 1 ? 'md:order-2' : 'md:order-1'}`}>
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full mr-4">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-semibold text-foreground">{service.title}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">{service.longDescription}</p>
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-foreground">
                      <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild>
                  <Link href={`/servicos/${service.slug}`}>
                    Saber Mais sobre {service.title.split(" ")[0]}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ))}
      
      <section className="py-12 md:py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">Pronto para começar?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Entre em contato para uma consulta inicial e descubra como podemos adaptar nossos serviços às suas necessidades específicas.
        </p>
        <Button size="lg" asChild>
          <Link href="/contato">Agendar Consulta</Link>
        </Button>
      </section>
    </div>
  );
}
