
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ExportDataDialog } from '@/components/shared/ExportDataDialog';
import { Users, Car, ShieldCheck, FileText, TrendingUp } from "lucide-react";

interface ReportCardProps {
  title: string;
  description: string;
  dataTypeName: string;
  icon: React.ElementType;
  buttonText: string;
}

function ReportCard({ title, description, dataTypeName, icon: Icon, buttonText }: ReportCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex items-center mb-3">
          <div className="p-3 bg-primary/10 rounded-full mr-4">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl md:text-2xl">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Additional content for the card can go here if needed in the future */}
      </CardContent>
      <CardFooter>
        {/* The ExportDataDialog component wraps the trigger button.
            The 'dataTypeName' prop configures the dialog for the specific data type.
            The actual export logic (calling Supabase API, etc.) is handled within ExportDataDialog.
        */}
        <ExportDataDialog dataTypeName={dataTypeName}>
          <Button className="w-full">
            <TrendingUp className="mr-2 h-4 w-4" /> {buttonText}
          </Button>
        </ExportDataDialog>
      </CardFooter>
    </Card>
  );
}

export default function RelatoriosPage() {
  const reportCategories = [
    {
      title: "Relatórios de Clientes",
      description: "Gerar relatórios e exportar dados dos clientes cadastrados.",
      dataTypeName: "Clientes",
      icon: Users,
      buttonText: "Gerar Relatório de Clientes",
    },
    {
      title: "Relatórios de Veículos",
      description: "Gerar relatórios e exportar dados dos veículos cadastrados.",
      dataTypeName: "Veículos",
      icon: Car,
      buttonText: "Gerar Relatório de Veículos",
    },
    {
      title: "Relatórios de Seguros",
      description: "Gerar relatórios e exportar dados dos seguros cadastrados.",
      dataTypeName: "Seguros",
      icon: ShieldCheck,
      buttonText: "Gerar Relatório de Seguros",
    },
    {
      title: "Relatórios de Documentos",
      description: "Gerar relatórios e exportar informações dos documentos.",
      dataTypeName: "Documentos",
      icon: FileText,
      buttonText: "Gerar Relatório de Documentos",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <TrendingUp className="mr-3 h-8 w-8" />
          Central de Relatórios
        </h1>
        <p className="text-muted-foreground mt-1">
          Selecione uma categoria para gerar e exportar relatórios.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">
        {reportCategories.map((category) => (
          <ReportCard
            key={category.dataTypeName}
            title={category.title}
            description={category.description}
            dataTypeName={category.dataTypeName}
            icon={category.icon}
            buttonText={category.buttonText}
          />
        ))}
      </div>
      {/* 
        Supabase Integration Note:
        The 'ExportDataDialog' component is responsible for handling the format selection
        and initiating the export process. When its "Exportar" button is clicked,
        it will (in a real implementation) make an API call to a Supabase endpoint
        (e.g., an Edge Function). This endpoint will receive the 'dataTypeName' (e.g., "Clientes")
        and the selected format, fetch the corresponding data from the database,
        convert it, and then provide it for download.
      */}
    </div>
  );
}
