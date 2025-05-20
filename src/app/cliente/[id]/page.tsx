
// src/app/cliente/[id]/page.tsx
// This page will display detailed information for a specific client (Pessoa Física).
// Data will be fetched from Supabase using the client ID from the URL,
// including related entities like Endereco, MembrosEntidade, Arquivos, Veiculos.

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Mail, Phone, MapPin, CalendarDays, Edit3, Trash2, AlertTriangle, Building, Info, Link2, HomeIcon, Briefcase, FileText, CarIcon as Car, Download, Eye, GripVertical } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { SVGProps } from 'react';

// Placeholder function to get PessoaFisica data by ID
// In a real app, this would fetch from Supabase, including joins to related tables
async function getPessoaFisicaById(pessoaFisicaId: string) {
  console.log(`Fetching PessoaFisica details for ID: ${pessoaFisicaId} (placeholder)`);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const commonAddress = {
    logradouro: "Rua das Palmeiras",
    numero: "101",
    complemento: "Apto 10A",
    bairro: "Centro",
    municipio: { id: "mun_1", nome_municipio: "Cidade Exemplo" },
    estado: { id: "uf_1", sigla_estado: "EX", nome_estado: "Estado Exemplo" },
    cep: "01001-001",
  };

  const sampleDocuments = [
    { id: "doc_pf1_001", titulo: "Contrato de Associação PF1", tipo: "Contrato", dataUpload: "2024-05-10", url:"#view-doc1", downloadUrl: "#download-doc1" },
    { id: "doc_pf1_002", titulo: "RG Digitalizado PF1", tipo: "Documento Pessoal", dataUpload: "2024-05-11", url:"#view-doc2", downloadUrl: "#download-doc2" },
  ];

  const sampleVehicles = [
    { id: "vei_pf1_001", placa: "PFA-0001", modelo: "Carro Principal", marca: "Marca X", ano: 2022, linkDetalhes: "/admin/veiculos/vei_pf1_001" },
    { id: "vei_pf1_002", placa: "PFB-0002", modelo: "Moto Urbana", marca: "Marca Y", ano: 2023, linkDetalhes: "/admin/veiculos/vei_pf1_002" },
  ];

  if (pessoaFisicaId === "pf_001") { // Matches ID from list page
    return {
      id: "pf_001",
      nomeCompleto: "João da Silva Sauro",
      cpf: "123.456.789-00",
      rg: "12.345.678-9",
      dataNascimento: "1985-05-15",
      email: "joao.sauro@example.com",
      telefone: "(11) 98765-4321",
      dataCadastro: "2024-01-15",
      tipoRelacao: "Associado",
      organizacaoVinculada: {
        id: "org_001",
        nome: "Cooperativa Alfa",
        tipoOrganizacao: "Cooperativa Principal", 
        cnpj: "11.222.333/0001-44",
        linkDetalhes: "/admin/organizacoes/org_001"
      },
      endereco: commonAddress,
      documentos: sampleDocuments,
      veiculos: sampleVehicles,
      observacoes: "Cliente antigo e membro ativo da cooperativa. Participa de todos os eventos.",
      status: "Ativo", 
    };
  }
  if (pessoaFisicaId === "pf_003") { // Example of Cliente Geral
     return {
      id: "pf_003",
      nomeCompleto: "Carlos Pereira Lima",
      cpf: "111.222.333-44",
      rg: "33.444.555-6",
      dataNascimento: "1990-10-20",
      email: "carlos.lima@example.com",
      telefone: "(31) 99887-7665",
      dataCadastro: "2024-03-10",
      tipoRelacao: "Cliente Geral",
      organizacaoVinculada: null,
      endereco: { ...commonAddress, logradouro: "Avenida Brasil", numero: "2000", complemento: "Casa 2" },
      documentos: [{ id: "doc_pf3_001", titulo: "Comprovante Residência PF3", tipo: "Comprovante", dataUpload: "2024-06-01", url:"#", downloadUrl: "#" }],
      veiculos: [],
      observacoes: "Interessado em seguros veiculares.",
      status: "Ativo",
    };
  }
  // Fallback for other IDs from the list page
  const baseId = pessoaFisicaId.slice(-1);
  return {
      id: pessoaFisicaId,
      nomeCompleto: `Pessoa Exemplo ${baseId}`,
      cpf: `000.000.000-0${baseId}`,
      rg: `00.000.000-${baseId}`,
      dataNascimento: `199${baseId}-01-01`,
      email: `pessoa${baseId}@example.com`,
      telefone: `(XX) XXXXX-XXX${baseId}`,
      dataCadastro: new Date().toISOString().split('T')[0],
      tipoRelacao: "Cliente Geral",
      organizacaoVinculada: null,
      endereco: commonAddress,
      documentos: [],
      veiculos: [],
      observacoes: "Nenhuma observação adicional.",
      status: "Pendente",
  };
}

interface PessoaFisicaDetailsPageProps {
  params: {
    id: string;
  };
}

// Helper component for consistent key-value display
const InfoItem = ({ label, value, icon: Icon, className }: { label: string, value: string | React.ReactNode | null | undefined, icon?: React.ElementType, className?: string }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={cn("mb-3", className)}>
      <span className="text-sm font-medium text-muted-foreground flex items-center">
        {Icon && <Icon className="mr-2 h-4 w-4 flex-shrink-0 text-primary/80" />}
        {label}
      </span>
      <div className="text-foreground mt-0.5">{typeof value === 'string' ? <p>{value}</p> : value}</div>
    </div>
  );
};


export default async function PessoaFisicaDetailsPage({ params }: PessoaFisicaDetailsPageProps) {
  const pessoaFisica = await getPessoaFisicaById(params.id);

  if (!pessoaFisica) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Pessoa Física não encontrada</h1>
        <p className="text-muted-foreground mt-2">
          A pessoa física com o ID "{params.id}" não foi encontrada. Verifique o ID ou tente novamente.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/clientes">Voltar para Lista de Pessoas Físicas</Link>
        </Button>
      </div>
    );
  }
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
      return "Data inválida";
    }
  }

  const showOrganizacaoVinculada = pessoaFisica.organizacaoVinculada && pessoaFisica.tipoRelacao !== 'Cliente Geral';

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <User className="mr-3 h-8 w-8" /> Detalhes da Pessoa Física: {pessoaFisica.nomeCompleto}
        </h1>
        <p className="text-muted-foreground mt-1">
          Informações completas, vínculos e histórico da pessoa física.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal de Informações */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Info className="mr-2 h-5 w-5 text-primary" /> Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
              <InfoItem label="Nome Completo" value={pessoaFisica.nomeCompleto} icon={User} />
              <InfoItem label="CPF" value={pessoaFisica.cpf} icon={GripVertical} />
              <InfoItem label="RG" value={pessoaFisica.rg || "N/A"} icon={GripVertical} />
              <InfoItem label="Data de Nascimento" value={formatDate(pessoaFisica.dataNascimento)} icon={CalendarDays} />
              <InfoItem label="E-mail" value={pessoaFisica.email} icon={Mail} />
              <InfoItem label="Telefone" value={pessoaFisica.telefone || "N/A"} icon={Phone} />
              <InfoItem label="Data de Cadastro" value={formatDate(pessoaFisica.dataCadastro)} icon={CalendarDays} />
               <InfoItem label="Status" value={<span className={`font-semibold ${pessoaFisica.status === "Ativo" ? "text-green-600" : "text-amber-600"}`}>{pessoaFisica.status}</span>} />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Link2 className="mr-2 h-5 w-5 text-primary" /> Vínculo e Relação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoItem label="Tipo de Relação" value={pessoaFisica.tipoRelacao || "N/A"} icon={Briefcase} />
              {showOrganizacaoVinculada && pessoaFisica.organizacaoVinculada && (
                <>
                  <Separator className="my-4" />
                  <h3 className="text-md font-semibold text-foreground mb-2 flex items-center"><Building className="mr-2 h-5 w-5 text-primary/80"/> Organização Vinculada</h3>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 pl-2">
                    <InfoItem label="Nome da Organização" value={pessoaFisica.organizacaoVinculada.nome} />
                    <InfoItem label="Tipo" value={pessoaFisica.organizacaoVinculada.tipoOrganizacao} />
                    <InfoItem label="CNPJ" value={pessoaFisica.organizacaoVinculada.cnpj} />
                    <InfoItem 
                      label="Detalhes da Organização" 
                      value={
                        <Button variant="link" asChild className="p-0 h-auto text-primary">
                          <Link href={pessoaFisica.organizacaoVinculada.linkDetalhes || "#"}>
                            Ver detalhes
                          </Link>
                        </Button>
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {pessoaFisica.endereco && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <HomeIcon className="mr-2 h-5 w-5 text-primary" /> Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                <InfoItem label="Logradouro" value={`${pessoaFisica.endereco.logradouro || ""}${pessoaFisica.endereco.numero ? ', ' + pessoaFisica.endereco.numero : ''}`} />
                {pessoaFisica.endereco.complemento && <InfoItem label="Complemento" value={pessoaFisica.endereco.complemento} />}
                <InfoItem label="Bairro" value={pessoaFisica.endereco.bairro || "N/A"} />
                <InfoItem label="CEP" value={pessoaFisica.endereco.cep || "N/A"} />
                <InfoItem label="Município" value={pessoaFisica.endereco.municipio?.nome_municipio || "N/A"} />
                <InfoItem label="Estado" value={pessoaFisica.endereco.estado?.nome_estado || pessoaFisica.endereco.estado?.sigla_estado || "N/A"} />
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="mr-2 h-5 w-5 text-primary" /> Documentos Associados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pessoaFisica.documentos && pessoaFisica.documentos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                      <TableHead className="hidden md:table-cell">Data Upload</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pessoaFisica.documentos.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.titulo}</TableCell>
                        <TableCell className="hidden sm:table-cell">{doc.tipo}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(doc.dataUpload)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" asChild><Link href={doc.url} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4"/></Link></Button>
                          <Button variant="ghost" size="sm" asChild><Link href={doc.downloadUrl} download><Download className="h-4 w-4"/></Link></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum documento associado.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Car className="mr-2 h-5 w-5 text-primary" /> Veículos Associados
              </CardTitle>
            </CardHeader>
            <CardContent>
               {pessoaFisica.veiculos && pessoaFisica.veiculos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead className="hidden sm:table-cell">Marca</TableHead>
                      <TableHead className="hidden md:table-cell">Ano</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pessoaFisica.veiculos.map(veiculo => (
                      <TableRow key={veiculo.id}>
                        <TableCell className="font-medium">{veiculo.placa}</TableCell>
                        <TableCell>{veiculo.modelo}</TableCell>
                        <TableCell className="hidden sm:table-cell">{veiculo.marca}</TableCell>
                        <TableCell className="hidden md:table-cell">{veiculo.ano}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild><Link href={veiculo.linkDetalhes}>Detalhes</Link></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum veículo associado.</p>
              )}
            </CardContent>
          </Card>
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Info className="mr-2 h-5 w-5 text-primary" /> Observações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{pessoaFisica.observacoes || "Nenhuma observação."}</p>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral de Ações */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/admin/clientes/${pessoaFisica.id}/editar`}>
                  <Edit3 className="mr-2 h-4 w-4" /> Editar Pessoa Física
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button className="w-full" variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir Pessoa Física
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir a pessoa física <strong>{pessoaFisica.nomeCompleto}</strong>? Esta ação é irreversível.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => console.log(`Excluir Pessoa Física ID: ${pessoaFisica.id} (placeholder)`)}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        Confirmar Exclusão
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
            <CardFooter className="flex-col space-y-2">
                 <Button variant="outline" asChild className="w-full">
                    <Link href="/admin/clientes">
                        &larr; Voltar para Lista de Pessoas Físicas
                    </Link>
                 </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      {/* 
        Supabase Integration Notes:
        - Fetch PessoaFisica details by ID from 'public.PessoasFisicas'.
        - For 'Tipo de Relação', if it's an ID, fetch corresponding name. (If it's stored as string, then direct display)
        - For 'Organização Vinculada':
          - If PessoasFisicas has 'id_organizacao_vinculada' and 'tipo_relacao' indicates a direct link, use it to query 'public.Entidades'.
          - OR, query 'public.MembrosEntidade' where 'id_pessoa_fisica' = current_pf_id.
          - Then join with 'public.Entidades' to get nome_fantasia, cnpj.
          - Then join with 'public.TiposEntidade' to get nome_tipo for the organization.
        - For 'Endereço':
          - If 'PessoasFisicas' has 'id_endereco', fetch from 'public.Enderecos'.
          - Join/fetch from 'public.Municipios' and 'public.Estados' tables using their IDs for names.
        - For 'Documentos Associados':
          - Fetch from 'public.Arquivos' where 'id_pessoa_fisica_associada' = current_pf_id. (Assuming table and FK name)
        - For 'Veículos Associados':
          - Fetch from 'public.Veiculos' where 'id_proprietario_pessoa_fisica' = current_pf_id. (Assuming table and FK name)
        - "Editar Pessoa Física" button links to `/admin/clientes/[id]/editar`.
        - "Excluir Pessoa Física" button will trigger a delete operation via Supabase API (delete from PessoasFisicas, and handle related data like MembrosEntidade, Enderecos if cascade is not set up).
      */}
    </div>
  );
}

