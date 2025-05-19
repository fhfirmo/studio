
// src/app/cliente/[id]/page.tsx
// This page will display detailed information for a specific client.
// Data will be fetched from Supabase using the client ID from the URL.

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, CalendarDays, Edit3, Trash2, AlertTriangle, Building, Info } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils"; // Added import for cn

// Placeholder function to get client data by ID
// In a real app, this would fetch from Supabase
async function getClientDetails(clientId: string) {
  console.log(`Fetching client details for ID: ${clientId} (placeholder)`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Placeholder data - replace with actual Supabase fetch
  if (clientId === "1") {
    return {
      id: "1",
      name: "Cliente Alfa Detalhado",
      email: "alfa.detalhado@example.com",
      phone: "(11) 98765-4321",
      registrationDate: "2024-07-28",
      address: {
        street: "Rua das Palmeiras",
        number: "101",
        complement: "Apto 10",
        neighborhood: "Centro",
        city: "Cidade Exemplo",
        state: "EX",
        zip: "01001-001",
      },
      company: "Alfa Soluções Ltda.",
      notes: "Cliente VIP, contato preferencial por e-mail. Interessado em serviços de consultoria estratégica.",
      status: "Ativo",
    };
  }
  return { // Default placeholder if ID doesn't match
      id: clientId,
      name: `Cliente Exemplo ${clientId}`,
      email: `cliente${clientId}@example.com`,
      phone: "(XX) XXXXX-XXXX",
      registrationDate: new Date().toISOString().split('T')[0],
      address: {
        street: "Rua Placeholder",
        number: "000",
        complement: "",
        neighborhood: "Bairro Genérico",
        city: "Cidade Placeholder",
        state: "PS",
        zip: "00000-000",
      },
      company: "Empresa Fictícia S.A.",
      notes: "Nenhuma observação adicional.",
      status: "Pendente",
  };
}

interface ClientDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function ClientDetailsPage({ params }: ClientDetailsPageProps) {
  const client = await getClientDetails(params.id);

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Cliente não encontrado</h1>
        <p className="text-muted-foreground mt-2">
          O cliente com o ID "{params.id}" não foi encontrado. Verifique o ID ou tente novamente.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/dashboard">Voltar ao Painel</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <User className="mr-3 h-8 w-8" /> Detalhes do Cliente: {client.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Informações completas e histórico do cliente.
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
              <CardDescription>Dados básicos de contato e identificação.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                  <p className="text-foreground font-semibold">{client.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <p className={`font-semibold ${client.status === "Ativo" ? "text-green-600" : "text-amber-600"}`}>{client.status}</p>
                </div>
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center">
                    <Mail className="mr-2 h-4 w-4" /> E-mail
                  </Label>
                  <p className="text-foreground">{client.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center">
                    <Phone className="mr-2 h-4 w-4" /> Telefone
                  </Label>
                  <p className="text-foreground">{client.phone}</p>
                </div>
              </div>
              <Separator />
               <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center">
                    <Building className="mr-2 h-4 w-4" /> Empresa (se aplicável)
                  </Label>
                  <p className="text-foreground">{client.company || "Não informado"}</p>
                </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4" /> Data de Cadastro
                </Label>
                <p className="text-foreground">{new Date(client.registrationDate).toLocaleDateString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <MapPin className="mr-2 h-5 w-5 text-primary" /> Endereço
              </CardTitle>
              <CardDescription>Localização principal do cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Logradouro</Label>
                <p className="text-foreground">{client.address.street}, {client.address.number}</p>
              </div>
              {client.address.complement && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Complemento</Label>
                  <p className="text-foreground">{client.address.complement}</p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Bairro</Label>
                  <p className="text-foreground">{client.address.neighborhood}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">CEP</Label>
                  <p className="text-foreground">{client.address.zip}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Cidade</Label>
                  <p className="text-foreground">{client.address.city}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                  <p className="text-foreground">{client.address.state}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Info className="mr-2 h-5 w-5 text-primary" /> Outras Informações
              </CardTitle>
              <CardDescription>Observações e dados adicionais.</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
              <p className="text-foreground whitespace-pre-wrap">{client.notes || "Nenhuma observação."}</p>
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
              <Button className="w-full" variant="outline">
                <Edit3 className="mr-2 h-4 w-4" /> Editar Cliente
              </Button>
              {/* Placeholder for delete modal trigger */}
              <Button className="w-full" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir Cliente
              </Button>
            </CardContent>
            <CardFooter>
                 <Button variant="link" asChild className="text-muted-foreground text-sm w-full justify-start p-0 h-auto">
                    <Link href="/admin/dashboard">
                        &larr; Voltar para o Painel
                    </Link>
                 </Button>
            </CardFooter>
          </Card>
          
          {/* Placeholder for other summary cards or related info */}
          <Card className="shadow-md bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Histórico (Exemplo)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Interações recentes ou histórico de serviços serão exibidos aqui.
              </p>
              <ul className="mt-3 space-y-1 text-xs list-disc list-inside text-muted-foreground">
                <li>Reunião de alinhamento - 15/07/2024</li>
                <li>Proposta enviada - 10/07/2024</li>
                <li>Primeiro contato - 01/07/2024</li>
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
  <span className={cn("text-xs font-medium text-muted-foreground block mb-1", className)} {...props}>
    {children}
  </span>
);

    
