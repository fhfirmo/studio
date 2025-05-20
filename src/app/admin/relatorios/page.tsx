
"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Users, Car as CarIcon, ShieldCheck, FileText as FileTextIcon, TrendingUp, Building2, ChevronRight } from "lucide-react";

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  linkHref: string;
  linkText?: string;
}

function ReportCard({ title, description, icon: Icon, linkHref, linkText = "Gerar Relatório" }: ReportCardProps) {
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
        {/* Additional content for the card can go here if needed in the future */}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={linkHref}>
            <TrendingUp className="mr-2 h-4 w-4" /> {linkText}
            <ChevronRight className="ml-auto h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function RelatoriosPage() {
  const reportCategories: ReportCardProps[] = [
    {
      title: "Relatório de Pessoas Físicas",
      description: "Lista detalhada de todas as pessoas físicas cadastradas.",
      icon: Users,
      linkHref: "/admin/relatorios/pessoas-fisicas",
      linkText: "Acessar Relatório de Pessoas Físicas",
    },
    {
      title: "Relatório de Organizações",
      description: "Informações sobre as entidades e organizações no sistema.",
      icon: Building2,
      linkHref: "/admin/relatorios/organizacoes",
      linkText: "Acessar Relatório de Organizações",
    },
    {
      title: "Relatório de Veículos",
      description: "Visão geral dos veículos cadastrados e seus detalhes.",
      icon: CarIcon,
      linkHref: "/admin/relatorios/veiculos",
      linkText: "Acessar Relatório de Veículos",
    },
    {
      title: "Relatório de Seguros",
      description: "Análise das apólices de seguro registradas.",
      icon: ShieldCheck,
      linkHref: "/admin/relatorios/seguros",
      linkText: "Acessar Relatório de Seguros",
    },
    {
      title: "Relatório de Documentos",
      description: "Informações sobre os documentos armazenados no sistema.",
      icon: FileTextIcon,
      linkHref: "/admin/relatorios/documentos",
      linkText: "Acessar Relatório de Documentos",
    },
    {
      title: "Relatório de Membros por Organização",
      description: "Detalhes dos membros vinculados a cada organização.",
      icon: Users, // Using Users again, consider Network icon if available and distinct enough
      linkHref: "/admin/relatorios/membros-organizacao",
      linkText: "Acessar Relatório de Membros",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <TrendingUp className="mr-3 h-8 w-8" />
          Relatórios do Sistema
        </h1>
        <p className="text-muted-foreground mt-1">
          Selecione e gere relatórios sobre as informações cadastradas no sistema.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {reportCategories.map((category) => (
          <ReportCard
            key={category.title}
            title={category.title}
            description={category.description}
            icon={category.icon}
            linkHref={category.linkHref}
            linkText={category.linkText}
          />
        ))}
      </div>
      {/* 
        Supabase Integration Note:
        Each button/link above navigates to a specific report configuration/view page.
        Those individual report pages (e.g., /admin/relatorios/pessoas-fisicas) will
        handle their own data fetching, filtering options, and interaction with the 
        ExportDataDialog component or similar export mechanisms.
      */}
    </div>
  );
}
