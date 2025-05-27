
"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Settings, Building2, ShieldHalf, Library, CheckSquare, ChevronRight } from "lucide-react"; // Removed CarIcon

interface ConfigCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  linkHref: string;
  linkText?: string;
}

function ConfigCard({ title, description, icon: Icon, linkHref, linkText = "Gerenciar" }: ConfigCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl md:text-2xl mb-1">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Content can be added here if needed in the future */}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={linkHref}>
            {linkText} <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ConfiguracoesPage() {
  const configItems: ConfigCardProps[] = [
    {
      title: "Tipos de Entidade",
      description: "Defina os tipos de organizações no sistema (ex: Cooperativa, Associação).",
      icon: Building2,
      linkHref: "/admin/configuracoes/tipos-entidade",
      linkText: "Gerenciar Tipos de Entidade"
    },
    // Modelos de Veículo REMOVED
    {
      title: "Seguradoras",
      description: "Cadastre e gerencie as companhias seguradoras parceiras.",
      icon: Library,
      linkHref: "/admin/configuracoes/seguradoras",
      linkText: "Gerenciar Seguradoras"
    },
    {
      title: "Coberturas de Seguro",
      description: "Defina os tipos de coberturas disponíveis para apólices.",
      icon: ShieldHalf,
      linkHref: "/admin/configuracoes/coberturas",
      linkText: "Gerenciar Coberturas"
    },
    {
      title: "Assistências de Seguro",
      description: "Gerencie os serviços de assistência oferecidos nos seguros.",
      icon: CheckSquare,
      linkHref: "/admin/configuracoes/assistencias",
      linkText: "Gerenciar Assistências"
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <Settings className="mr-3 h-8 w-8" />
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as tabelas de apoio e configurações gerais do sistema.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {configItems.map((item) => (
          <ConfigCard
            key={item.title}
            title={item.title}
            description={item.description}
            icon={item.icon}
            linkHref={item.linkHref}
            linkText={item.linkText}
          />
        ))}
      </div>
    </div>
  );
}

    