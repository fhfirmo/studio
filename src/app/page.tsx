import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, Lightbulb, BarChartBig, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const services = [
  {
    icon: Briefcase,
    title: 'Consultoria Estratégica',
    description: 'Análise de mercado, planejamento estratégico e otimização de processos para impulsionar seu crescimento.',
    href: "/servicos/consultoria-estrategica"
  },
  {
    icon: Lightbulb,
    title: 'Mentoria Empresarial',
    description: 'Orientação personalizada para líderes e equipes, focada em desenvolvimento e alcance de metas.',
    href: "/servicos/mentoria-empresarial"
  },
  {
    icon: BarChartBig,
    title: 'Inteligência de Mercado',
    description: 'Coleta e análise de dados para insights valiosos, auxiliando na tomada de decisões assertivas.',
    href: "/servicos/inteligencia-de-mercado"
  },
];

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[calc(100vh-4rem)] min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center justify-center text-center text-white overflow-hidden">
        <Image
          src="https://placehold.co/1920x1080"
          alt="Profissionais de negócios colaborando"
          layout="fill"
          objectFit="cover"
          quality={80}
          className="z-0"
          data-ai-hint="business professional"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 to-accent/70 z-10"></div>
        <div className="relative z-20 container mx-auto px-4 py-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg leading-tight">
            INBM: Transformando Visões em Resultados
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-3xl mx-auto drop-shadow-md">
            Inteligência de Negócios e Mentoria Empresarial para alavancar o sucesso da sua organização.
          </p>
          <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Link href="/contato">
              Fale Conosco
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Quem Somos Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">Quem Somos</h2>
              <p className="text-lg text-foreground mb-4 leading-relaxed">
                A INBM é uma consultoria especializada em inteligência de negócios e mentoria empresarial. Nossa missão é capacitar organizações a atingirem seu pleno potencial através de estratégias inovadoras, insights baseados em dados e desenvolvimento de lideranças.
              </p>
              <p className="text-lg text-foreground mb-6 leading-relaxed">
                Com uma equipe de consultores experientes e uma abordagem personalizada, transformamos desafios em oportunidades e visões em resultados concretos.
              </p>
              <Button variant="outline" asChild>
                <Link href="/quem-somos">
                  Saiba Mais
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="order-1 md:order-2 rounded-lg overflow-hidden shadow-xl">
              <Image
                src="https://placehold.co/600x450"
                alt="Equipe INBM em reunião estratégica"
                width={600}
                height={450}
                className="w-full h-auto object-cover"
                data-ai-hint="team meeting"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Nossos Serviços Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-12">Nossos Serviços</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <CardHeader className="items-center text-center">
                  <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
                    <service.icon className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-semibold text-foreground">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center flex-grow">
                  <CardDescription className="text-md leading-relaxed text-muted-foreground">{service.description}</CardDescription>
                </CardContent>
                <div className="p-6 pt-0 mt-auto text-center">
                   <Button variant="link" asChild className="text-primary hover:text-primary/80">
                     <Link href={service.href}>
                       Ver Detalhes <ChevronRight className="ml-1 h-4 w-4" />
                     </Link>
                   </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Placeholder for other sections like Partners or Contact CTA if needed */}
       <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">Pronto para impulsionar seu negócio?</h2>
          <p className="text-lg text-foreground mb-8 max-w-2xl mx-auto">
            Entre em contato conosco hoje mesmo e descubra como a INBM pode ajudar sua empresa a alcançar novos patamares de sucesso.
          </p>
          <Button size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow">
            <Link href="/contato">
              Solicitar Consultoria
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
