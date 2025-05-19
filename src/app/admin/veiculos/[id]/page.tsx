
// src/app/admin/veiculos/[id]/page.tsx
// This page will display detailed information for a specific vehicle.
// Data will be fetched from Supabase using the vehicle ID from the URL.

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Car, Edit3, Trash2, AlertTriangle, Info, Gauge, Palette, Fingerprint, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Placeholder function to get vehicle data by ID
// In a real app, this would fetch from Supabase
async function getVehicleDetails(vehicleId: string) {
  console.log(`Fetching vehicle details for ID: ${vehicleId} (placeholder)`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Placeholder data - replace with actual Supabase fetch
  if (vehicleId === "vei_001" || vehicleId === "vei_002" || vehicleId === "vei_003" || vehicleId === "vei_004" || vehicleId === "vei_005") { // Match existing placeholder IDs
    return {
      id: vehicleId,
      placa: `ABC-12${vehicleId.slice(-2)}`,
      modelo: `Modelo Exemplo ${vehicleId.slice(-1)}`,
      marca: `Marca Exemplo ${vehicleId.slice(-1)}`,
      ano: 2020 + parseInt(vehicleId.slice(-1), 10) % 5,
      cor: "Preto",
      chassi: `CHASSI${vehicleId.toUpperCase()}XYZ`,
      quilometragem: 50000 + parseInt(vehicleId.slice(-1), 10) * 1000,
      dataCadastro: `2024-0${parseInt(vehicleId.slice(-1),10)%5+1}-10`,
      observacoes: `Observações sobre o veículo ${vehicleId}. Este veículo está em bom estado.`,
    };
  }
  return null; // Vehicle not found
}

interface VehicleDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function VehicleDetailsPage({ params }: VehicleDetailsPageProps) {
  const vehicle = await getVehicleDetails(params.id);

  if (!vehicle) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Veículo não encontrado</h1>
        <p className="text-muted-foreground mt-2">
          O veículo com o ID "{params.id}" não foi encontrado. Verifique o ID ou tente novamente.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/veiculos">Voltar para Lista de Veículos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <Car className="mr-3 h-8 w-8" /> Detalhes do Veículo: {vehicle.modelo} - {vehicle.placa}
        </h1>
        <p className="text-muted-foreground mt-1">
          Informações completas e histórico do veículo.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal de Informações */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Info className="mr-2 h-5 w-5 text-primary" /> Informações Gerais
              </CardTitle>
              <CardDescription>Dados básicos de identificação do veículo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Placa</Label>
                  <p className="text-foreground font-semibold">{vehicle.placa}</p>
                </div>
                <div>
                  <Label>Modelo</Label>
                  <p className="text-foreground font-semibold">{vehicle.modelo}</p>
                </div>
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Marca</Label>
                  <p className="text-foreground">{vehicle.marca}</p>
                </div>
                <div>
                  <Label>Ano</Label>
                  <p className="text-foreground">{vehicle.ano}</p>
                </div>
              </div>
              <Separator />
               <div>
                  <Label className="flex items-center"><Palette className="mr-2 h-4 w-4" /> Cor</Label>
                  <p className="text-foreground">{vehicle.cor || "Não informada"}</p>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Fingerprint className="mr-2 h-5 w-5 text-primary" /> Informações Adicionais
              </CardTitle>
              <CardDescription>Dados técnicos e de registro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Número do Chassi</Label>
                <p className="text-foreground">{vehicle.chassi || "Não informado"}</p>
              </div>
              <Separator />
              <div>
                <Label className="flex items-center"><Gauge className="mr-2 h-4 w-4" /> Quilometragem</Label>
                <p className="text-foreground">{vehicle.quilometragem ? `${vehicle.quilometragem.toLocaleString('pt-BR')} km` : "Não informada"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="mr-2 h-5 w-5 text-primary" /> Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{vehicle.observacoes || "Nenhuma observação."}</p>
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
                <Link href={`/admin/veiculos/${vehicle.id}/editar`}>
                  <Edit3 className="mr-2 h-4 w-4" /> Editar Veículo
                </Link>
              </Button>
              {/* Placeholder for delete modal trigger */}
              <Button className="w-full" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir Veículo
              </Button>
            </CardContent>
            <CardFooter>
                 <Button variant="link" asChild className="text-muted-foreground text-sm w-full justify-start p-0 h-auto">
                    <Link href="/admin/veiculos">
                        &larr; Voltar para Lista de Veículos
                    </Link>
                 </Button>
            </CardFooter>
          </Card>
          
          {/* Placeholder for other summary cards or related info */}
          <Card className="shadow-md bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Manutenção (Exemplo)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manutenções recentes ou histórico de serviços serão exibidos aqui.
              </p>
              <ul className="mt-3 space-y-1 text-xs list-disc list-inside text-muted-foreground">
                <li>Troca de óleo - 15/07/2024</li>
                <li>Revisão completa - 10/01/2024</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper Label component for consistent styling
const Label = ({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("text-sm font-medium text-muted-foreground block mb-1", className)} {...props}>
    {children}
  </span>
);
