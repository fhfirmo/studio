
// src/app/admin/organizacoes/[id]/page.tsx
// This page will display detailed information for a specific organization.
// Data will be fetched from Supabase, including related entities.

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, Edit3, Trash2, AlertTriangle, Info, MapPin, Users, Car, CalendarDays, Mail, Phone, Hash, Workflow } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Placeholder function to get organization data by ID
// In a real app, this would fetch from Supabase, including joins to related tables
async function getOrganizacaoDetails(organizacaoId: string) {
  console.log(`Fetching organization details for ID: ${organizacaoId} (placeholder)`);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Placeholder data
  if (organizacaoId === "org_001" || organizacaoId === "org_002" || organizacaoId === "org_003" || organizacaoId === "org_004" || organizacaoId === "org_005" ) {
    const baseId = parseInt(organizacaoId.slice(-1), 10);
    return {
      id: organizacaoId,
      nome: `Cooperativa Exemplo ${baseId}`,
      codigoEntidade: `COD-ENT-${organizacaoId.slice(-3)}`,
      cnpj: `11.222.333/000${baseId}-44`,
      // Simulate fetching related names
      tipoOrganizacao: { id: `tipo_${baseId}`, nome_tipo: "Cooperativa Principal" }, 
      telefone: `(1${baseId}) 91234-567${baseId%9}`,
      email: `contato@coopexemplo${baseId}.com`,
      dataCadastro: `2024-0${baseId}-10`,
      endereco: {
        logradouro: `Rua das Cooperativas ${baseId*10}`,
        numero: `${baseId*100}`,
        complemento: `Bloco ${String.fromCharCode(65 + baseId -1)}`,
        bairro: "Distrito Industrial",
        cep: `70000-00${baseId}`,
        // Simulate fetching related names
        municipio: { id: `mun_${baseId}`, nome_municipio: `Município Exemplo ${baseId}` },
        estado: { id: `uf_${baseId}`, sigla_estado: `UF${baseId}`, nome_estado: `Estado Exemplo ${baseId}` },
      },
      membros: [
        { id: `memb_00${baseId}1`, nome: `Associado Fulano ${baseId}`, tipo: "Pessoa Física", funcao: "Presidente", dataAssociacao: `2023-0${baseId}-01` },
        { id: `memb_00${baseId}2`, nome: `Empresa Membro Cicla ${baseId}`, tipo: "Pessoa Jurídica", funcao: "Conselheira", dataAssociacao: `2023-0${baseId+1}-15` },
      ],
      veiculos: [
        { id: `vei_00${baseId}A`, placa: `ORG-00${baseId}A`, modelo: `Caminhão Carga ${baseId}`, marca: "Marca X", ano: 2020 + baseId },
        { id: `vei_00${baseId}B`, placa: `ORG-00${baseId}B`, modelo: `Utilitário Leve ${baseId}`, marca: "Marca Y", ano: 2021 + baseId },
      ]
    };
  }
  return null; // Organization not found
}

interface OrganizacaoDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function OrganizacaoDetailsPage({ params }: OrganizacaoDetailsPageProps) {
  const organizacao = await getOrganizacaoDetails(params.id);

  if (!organizacao) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Organização não encontrada</h1>
        <p className="text-muted-foreground mt-2">
          A organização com o ID "{params.id}" não foi encontrada. Verifique o ID ou tente novamente.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/organizacoes">Voltar para Lista de Organizações</Link>
        </Button>
      </div>
    );
  }
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <Building className="mr-3 h-8 w-8" /> Detalhes da Organização: {organizacao.nome}
        </h1>
        <p className="text-muted-foreground mt-1">
          Informações completas e entidades relacionadas à organização.
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
              <CardDescription>Dados básicos de identificação da organização.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                <div><ItemLabel icon={Building} text="Nome da Organização" /><ItemValue value={organizacao.nome} /></div>
                <div><ItemLabel icon={Hash} text="Código da Entidade" /><ItemValue value={organizacao.codigoEntidade} /></div>
                <div><ItemLabel icon={Hash} text="CNPJ" /><ItemValue value={organizacao.cnpj} /></div>
                <div><ItemLabel icon={Workflow} text="Tipo de Organização" /><ItemValue value={organizacao.tipoOrganizacao?.nome_tipo || "N/A"} /></div>
                <div><ItemLabel icon={Phone} text="Telefone" /><ItemValue value={organizacao.telefone || "N/A"} /></div>
                <div><ItemLabel icon={Mail} text="E-mail" /><ItemValue value={organizacao.email || "N/A"} /></div>
                <div><ItemLabel icon={CalendarDays} text="Data de Cadastro" /><ItemValue value={formatDate(organizacao.dataCadastro)} /></div>
              </div>
            </CardContent>
          </Card>

          {organizacao.endereco && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <MapPin className="mr-2 h-5 w-5 text-primary" /> Endereço
                </CardTitle>
                <CardDescription>Localização principal da organização.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div><ItemLabel text="Logradouro" /><ItemValue value={`${organizacao.endereco.logradouro || ""}, ${organizacao.endereco.numero || ""}`} /></div>
                  {organizacao.endereco.complemento && <div><ItemLabel text="Complemento" /><ItemValue value={organizacao.endereco.complemento} /></div>}
                  <div><ItemLabel text="Bairro" /><ItemValue value={organizacao.endereco.bairro || "N/A"} /></div>
                  <div><ItemLabel text="CEP" /><ItemValue value={organizacao.endereco.cep || "N/A"} /></div>
                  <div><ItemLabel text="Município" /><ItemValue value={organizacao.endereco.municipio?.nome_municipio || "N/A"} /></div>
                  <div><ItemLabel text="Estado" /><ItemValue value={organizacao.endereco.estado?.nome_estado || organizacao.endereco.estado?.sigla_estado || "N/A"} /></div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Users className="mr-2 h-5 w-5 text-primary" /> Membros da Organização
              </CardTitle>
              <CardDescription>Pessoas físicas ou jurídicas associadas.</CardDescription>
            </CardHeader>
            <CardContent>
              {organizacao.membros && organizacao.membros.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Membro</TableHead>
                        <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead className="hidden md:table-cell text-right">Data de Associação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizacao.membros.map(membro => (
                        <TableRow key={membro.id}>
                          <TableCell className="font-medium">{membro.nome}</TableCell>
                          <TableCell className="hidden sm:table-cell">{membro.tipo}</TableCell>
                          <TableCell>{membro.funcao}</TableCell>
                          <TableCell className="hidden md:table-cell text-right">{formatDate(membro.dataAssociacao)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum membro associado a esta organização.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Car className="mr-2 h-5 w-5 text-primary" /> Veículos Associados
              </CardTitle>
              <CardDescription>Veículos de propriedade desta organização.</CardDescription>
            </CardHeader>
            <CardContent>
              {organizacao.veiculos && organizacao.veiculos.length > 0 ? (
                 <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead className="hidden sm:table-cell">Marca</TableHead>
                        <TableHead className="hidden md:table-cell text-right">Ano</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizacao.veiculos.map(veiculo => (
                        <TableRow key={veiculo.id}>
                          <TableCell className="font-medium">{veiculo.placa}</TableCell>
                          <TableCell>{veiculo.modelo}</TableCell>
                          <TableCell className="hidden sm:table-cell">{veiculo.marca}</TableCell>
                          <TableCell className="hidden md:table-cell text-right">{veiculo.ano}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum veículo associado a esta organização.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral de Ações */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/admin/organizacoes/${organizacao.id}/editar`}>
                  <Edit3 className="mr-2 h-4 w-4" /> Editar Organização
                </Link>
              </Button>
              {/* Placeholder for delete modal trigger */}
              <Button className="w-full" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir Organização
              </Button>
            </CardContent>
            <CardFooter>
                 <Button variant="link" asChild className="text-muted-foreground text-sm w-full justify-start p-0 h-auto">
                    <Link href="/admin/organizacoes">
                        &larr; Voltar para Lista de Organizações
                    </Link>
                 </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      {/* 
        Supabase Integration Notes:
        - Fetch organization details by ID from 'Entidades' table.
        - For 'Tipo de Organização', join/fetch from 'TiposEntidade' table using 'tipo_entidade_id'.
        - For 'Endereço':
          - If 'endereco_id' is stored in 'Entidades', fetch from 'Enderecos' table.
          - For 'Município' and 'Estado' names, join/fetch from 'Municipios' and 'Estados' tables respectively using their IDs.
        - For 'Membros da Organização':
          - Fetch from 'MembrosEntidade' table filtering by 'entidade_principal_id' or 'entidade_membro_id' (depending on relation type).
          - Join with 'PessoasFisicas' or 'Entidades' to get member names and types.
        - For 'Veículos Associados':
          - Fetch from 'Veiculos' table, likely filtering by an 'entidade_proprietaria_id' column.
        - "Editar Organização" button will link to `/admin/organizacoes/[id]/editar`.
        - "Excluir Organização" button will trigger a delete operation via Supabase API.
      */}
    </div>
  );
}

// Helper Label component for consistent styling
const ItemLabel = ({ className, children, text, icon: Icon }: { className?: string; children?: React.ReactNode; text: string; icon?: React.ElementType }) => (
  <span className={cn("text-sm font-medium text-muted-foreground flex items-center mb-1", className)}>
    {Icon && <Icon className="mr-2 h-4 w-4 flex-shrink-0" />}
    {text || children}
  </span>
);

const ItemValue = ({ className, value }: { className?: string; value: string | number | undefined | null }) => (
  <p className={cn("text-foreground text-sm", className)}>{value || "N/A"}</p>
);



    