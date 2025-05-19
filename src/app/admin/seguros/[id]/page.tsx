
// src/app/admin/seguros/[id]/page.tsx
// This page will display detailed information for a specific insurance policy.
// Data will be fetched from Supabase using the insurance ID from the URL,
// including related vehicle data.

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Edit3, Trash2, AlertTriangle, Car, FileText, CalendarDays, DollarSign } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Placeholder function to get insurance data by ID
// In a real app, this would fetch from Supabase, including a join to the vehicles table
async function getSeguroDetails(seguroId: string) {
  console.log(`Fetching insurance details for ID: ${seguroId} (placeholder)`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Placeholder data - replace with actual Supabase fetch
  if (seguroId === "seg_001" || seguroId === "seg_002" || seguroId === "seg_003" || seguroId === "seg_004" || seguroId === "seg_005") { 
    return {
      id: seguroId,
      numeroApolice: `APOLICE-2024-${seguroId.slice(-3)}`,
      dataInicio: `2024-0${parseInt(seguroId.slice(-1),10)%5+1}-15`,
      dataFim: `2025-0${parseInt(seguroId.slice(-1),10)%5+1}-14`,
      valorTotal: 1200 + parseInt(seguroId.slice(-1),10) * 50.75,
      veiculo: { // Placeholder for related vehicle data
        id: `vei_${seguroId.slice(-3)}`,
        placa: `XYZ-12${seguroId.slice(-2)}`,
        modelo: `Modelo Veículo ${seguroId.slice(-1)}`,
      },
      coberturas: `Cobertura total contra roubo, furto e colisão para o veículo ${seguroId.slice(-3)}. Assistência 24h.`,
      observacoes: `Apólice renovada anualmente. Cliente possui bom histórico.`,
      dataCadastro: `2024-0${parseInt(seguroId.slice(-1),10)%5+1}-10`,
    };
  }
  return null; // Seguro not found
}

interface SeguroDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function SeguroDetailsPage({ params }: SeguroDetailsPageProps) {
  const seguro = await getSeguroDetails(params.id);

  if (!seguro) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Seguro não encontrado</h1>
        <p className="text-muted-foreground mt-2">
          O seguro com o ID "{params.id}" não foi encontrado. Verifique o ID ou tente novamente.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/seguros">Voltar para Lista de Seguros</Link>
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <ShieldCheck className="mr-3 h-8 w-8" /> Detalhes do Seguro: {seguro.numeroApolice}
        </h1>
        <p className="text-muted-foreground mt-1">
          Informações completas da apólice e veículo segurado.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal de Informações */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Informações da Apólice
              </CardTitle>
              <CardDescription>Dados principais do contrato de seguro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Número da Apólice</Label>
                  <p className="text-foreground font-semibold">{seguro.numeroApolice}</p>
                </div>
                <div>
                  <Label className="flex items-center"><DollarSign className="mr-2 h-4 w-4" /> Valor Total</Label>
                  <p className="text-foreground font-semibold">{formatCurrency(seguro.valorTotal)}</p>
                </div>
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Data de Início</Label>
                  <p className="text-foreground">{formatDate(seguro.dataInicio)}</p>
                </div>
                <div>
                  <Label className="flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Data de Fim</Label>
                  <p className="text-foreground">{formatDate(seguro.dataFim)}</p>
                </div>
              </div>
               <Separator />
                <div>
                  <Label className="flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Data de Cadastro</Label>
                  <p className="text-foreground">{formatDate(seguro.dataCadastro)}</p>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Car className="mr-2 h-5 w-5 text-primary" /> Veículo Segurado
              </CardTitle>
              <CardDescription>Detalhes do veículo coberto pela apólice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {seguro.veiculo ? (
                <>
                  <div>
                    <Label>Placa</Label>
                    <p className="text-foreground font-semibold">{seguro.veiculo.placa}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label>Modelo</Label>
                    <p className="text-foreground">{seguro.veiculo.modelo}</p>
                  </div>
                   {/* Placeholder to view full vehicle details */}
                  <Button variant="outline" size="sm" asChild className="mt-2">
                      <Link href={`/admin/veiculos/${seguro.veiculo.id}`}>
                        Ver Detalhes do Veículo
                      </Link>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">Informações do veículo não disponíveis.</p>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="mr-2 h-5 w-5 text-primary" /> Coberturas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{seguro.coberturas || "Nenhuma cobertura especificada."}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="mr-2 h-5 w-5 text-primary" /> Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{seguro.observacoes || "Nenhuma observação."}</p>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral de Ações e Resumo */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/admin/seguros/${seguro.id}/editar`}>
                  <Edit3 className="mr-2 h-4 w-4" /> Editar Seguro
                </Link>
              </Button>
              {/* Placeholder for delete modal trigger */}
              <Button className="w-full" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir Seguro
              </Button>
            </CardContent>
            <CardFooter>
                 <Button variant="link" asChild className="text-muted-foreground text-sm w-full justify-start p-0 h-auto">
                    <Link href="/admin/seguros">
                        &larr; Voltar para Lista de Seguros
                    </Link>
                 </Button>
            </CardFooter>
          </Card>
          
          {/* Placeholder for other summary cards or related info */}
          <Card className="shadow-md bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Sinistros (Exemplo)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nenhum sinistro registrado para esta apólice.
              </p>
              {/* Example of items:
              <ul className="mt-3 space-y-1 text-xs list-disc list-inside text-muted-foreground">
                <li>Sinistro #123 - 15/07/2024</li>
              </ul>
              */}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* 
        Supabase Integration Notes:
        - Fetch seguro details by ID from 'seguros' table.
        - Fetch related vehicle information from 'veiculos' table using a foreign key (e.g., 'veiculo_id' in 'seguros' table).
        - "Editar Seguro" button will link to `/admin/seguros/[id]/editar`.
        - "Excluir Seguro" button will trigger a delete operation via Supabase API.
      */}
    </div>
  );
}

// Helper Label component for consistent styling
const Label = ({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("text-sm font-medium text-muted-foreground block mb-1", className)} {...props}>
    {children}
  </span>
);

