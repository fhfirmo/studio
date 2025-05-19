import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, Eye } from 'lucide-react';

export default function QuemSomosPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <section className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Sobre a INBM</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Conheça a nossa história, missão, visão e os valores que nos guiam na jornada de transformação de negócios.
        </p>
      </section>

      <section className="mb-12 md:mb-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="rounded-lg overflow-hidden shadow-xl">
            <Image
              src="https://placehold.co/700x500"
              alt="Equipe INBM discutindo estratégias"
              width={700}
              height={500}
              className="w-full h-auto object-cover"
              data-ai-hint="office discussion"
            />
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-foreground mb-6">Nossa História</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Fundada com a paixão por impulsionar o crescimento e a inovação, a INBM nasceu da percepção de que muitas empresas, apesar de seu potencial, enfrentavam desafios significativos na navegação do complexo cenário de negócios atual. Reunimos uma equipe de especialistas multidisciplinares com vasta experiência em diversas indústrias, todos compartilhando o compromisso de fornecer soluções estratégicas e personalizadas.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Desde o início, nosso foco tem sido construir parcerias de longo prazo com nossos clientes, trabalhando lado a lado para entender suas necessidades únicas e desenvolver estratégias que gerem impacto real e sustentável.
            </p>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-12 md:mb-16">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-3 inline-block">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold">Nossa Missão</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground leading-relaxed">
            Capacitar organizações a atingirem seu pleno potencial através de inteligência de negócios, estratégias inovadoras e mentoria empresarial de excelência, promovendo crescimento sustentável e impacto positivo.
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-3 inline-block">
              <Eye className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold">Nossa Visão</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground leading-relaxed">
            Ser a consultoria de referência em inteligência de negócios e mentoria empresarial, reconhecida pela transformação positiva que geramos em nossos clientes e pela nossa contribuição para um ecossistema de negócios mais forte e inovador.
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-3 inline-block">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold">Nossos Valores</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground leading-relaxed">
            Compromisso com o cliente, Excelência, Integridade, Inovação, Colaboração e Desenvolvimento Contínuo. Estes são os pilares que sustentam todas as nossas ações e decisões.
          </CardContent>
        </Card>
      </section>

      <section className="text-center">
        <h2 className="text-3xl font-semibold text-foreground mb-6">Conheça Nossa Equipe</h2>
        <p className="text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
          Nossa força reside na expertise e dedicação de nossos profissionais. (Conteúdo da equipe será adicionado aqui).
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 shadow-md">
              <Image
                src={`https://placehold.co/200x200`}
                alt={`Membro da equipe ${i}`}
                width={150}
                height={150}
                className="rounded-full mx-auto mb-4 border-4 border-primary/20"
                data-ai-hint="person portrait"
              />
              <h3 className="text-xl font-semibold text-foreground">Nome do Membro {i}</h3>
              <p className="text-primary">Cargo</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
