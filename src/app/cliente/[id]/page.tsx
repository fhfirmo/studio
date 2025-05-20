
// src/app/cliente/[id]/page.tsx
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, Mail, Phone, MapPin, CalendarDays, Edit3, Trash2, AlertTriangle, Building, Info, Link2, HomeIcon, Briefcase, FileText, CarIcon as Car, Download, Eye, GripVertical, ClipboardUser, CheckSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
// import { useToast } from "@/hooks/use-toast";

interface CNHData {
  id_cnh: string;
  numero_registro: string;
  categoria: string;
  data_emissao: string; // YYYY-MM-DD
  data_validade: string; // YYYY-MM-DD
  primeira_habilitacao: string | null; // YYYY-MM-DD
  local_emissao_cidade: string | null;
  local_emissao_uf: string | null; // e.g., "SP"
  observacoes_cnh: string | null;
}

interface OrganizacaoVinculada {
  id: string;
  nome: string;
  tipoOrganizacao: string;
  cnpj: string;
  linkDetalhes: string;
}

interface DocumentoAssociado {
  id: string;
  titulo: string;
  tipo: string;
  dataUpload: string;
  url: string;
  downloadUrl: string;
}

interface VeiculoAssociado {
  id: string;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  linkDetalhes: string;
}

interface PessoaFisica {
  id: string;
  nomeCompleto: string;
  cpf: string;
  rg: string | null;
  dataNascimento: string | null; // YYYY-MM-DD
  email: string;
  telefone: string | null;
  dataCadastro: string; // YYYY-MM-DD
  tipoRelacao: string;
  organizacaoVinculada: OrganizacaoVinculada | null;
  endereco: {
    logradouro: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    municipio: { id: string; nome_municipio: string } | null;
    estado: { id: string; sigla_estado: string; nome_estado: string } | null;
    cep: string | null;
  } | null;
  documentos: DocumentoAssociado[];
  veiculos: VeiculoAssociado[];
  observacoes: string | null;
  status: string;
  cnh: CNHData | null;
}

const brazilianStates = [
  { value: "AC", label: "Acre" }, { value: "AL", label: "Alagoas" }, { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" }, { value: "BA", label: "Bahia" }, { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" }, { value: "ES", label: "Espírito Santo" }, { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" }, { value: "MT", label: "Mato Grosso" }, { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" }, { value: "PA", label: "Pará" }, { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" }, { value: "PE", label: "Pernambuco" }, { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" }, { value: "RN", label: "Rio Grande do Norte" }, { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" }, { value: "RR", label: "Roraima" }, { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" }, { value: "SE", label: "Sergipe" }, { value: "TO", label: "Tocantins" }
];


async function getPessoaFisicaById(pessoaFisicaId: string): Promise<PessoaFisica | null> {
  console.log(`Fetching PessoaFisica details for ID: ${pessoaFisicaId} (placeholder)`);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const commonAddress = {
    logradouro: "Rua das Palmeiras", numero: "101", complemento: "Apto 10A", bairro: "Centro",
    municipio: { id: "mun_1", nome_municipio: "Cidade Exemplo" },
    estado: { id: "uf_1", sigla_estado: "EX", nome_estado: "Estado Exemplo" },
    cep: "01001-001",
  };

  const sampleDocuments = [
    { id: "doc_pf1_001", titulo: "Contrato de Associação PF1", tipo: "Contrato", dataUpload: "2024-05-10", url:"#view-doc1", downloadUrl: "#download-doc1" },
  ];
  const sampleVehicles = [
    { id: "vei_pf1_001", placa: "PFA-0001", modelo: "Carro Principal", marca: "Marca X", ano: 2022, linkDetalhes: "/admin/veiculos/vei_pf1_001" },
  ];
  const sampleCnh: CNHData = {
    id_cnh: "cnh_001", numero_registro: "01234567890", categoria: "AB", data_emissao: "2022-08-15",
    data_validade: "2027-08-14", primeira_habilitacao: "2010-08-15", local_emissao_cidade: "Cidade Exemplo",
    local_emissao_uf: "EX", observacoes_cnh: "Nenhuma observação."
  };

  if (pessoaFisicaId === "pf_001" || pessoaFisicaId === "1" || pessoaFisicaId === "cli_001") {
    return {
      id: "pf_001", nomeCompleto: "João da Silva Sauro", cpf: "123.456.789-00", rg: "12.345.678-9",
      dataNascimento: "1985-05-15", email: "joao.sauro@example.com", telefone: "(11) 98765-4321",
      dataCadastro: "2024-01-15", tipoRelacao: "Associado",
      organizacaoVinculada: { id: "org_001", nome: "Cooperativa Alfa", tipoOrganizacao: "Cooperativa Principal", cnpj: "11.222.333/0001-44", linkDetalhes: "/admin/organizacoes/org_001" },
      endereco: commonAddress, documentos: sampleDocuments, veiculos: sampleVehicles,
      observacoes: "Cliente antigo e membro ativo da cooperativa.", status: "Ativo", cnh: sampleCnh,
    };
  }
  if (pessoaFisicaId === "pf_003") {
     return {
      id: "pf_003", nomeCompleto: "Carlos Pereira Lima", cpf: "111.222.333-44", rg: "33.444.555-6",
      dataNascimento: "1990-10-20", email: "carlos.lima@example.com", telefone: "(31) 99887-7665",
      dataCadastro: "2024-03-10", tipoRelacao: "Cliente Geral", organizacaoVinculada: null,
      endereco: { ...commonAddress, logradouro: "Avenida Brasil", numero: "2000", complemento: "Casa 2" },
      documentos: [], veiculos: [], observacoes: "Interessado em seguros veiculares.", status: "Ativo", cnh: null,
    };
  }
  const baseId = pessoaFisicaId.slice(-1);
  return {
      id: pessoaFisicaId, nomeCompleto: `Pessoa Exemplo ${baseId}`, cpf: `000.000.000-0${baseId}`, rg: `00.000.000-${baseId}`,
      dataNascimento: `199${baseId}-01-01`, email: `pessoa${baseId}@example.com`, telefone: `(XX) XXXXX-XXX${baseId}`,
      dataCadastro: new Date().toISOString().split('T')[0], tipoRelacao: "Cliente Geral", organizacaoVinculada: null,
      endereco: commonAddress, documentos: [], veiculos: [], observacoes: "Nenhuma observação adicional.", status: "Pendente", cnh: null,
  };
}

interface PessoaFisicaDetailsPageProps {
  params: { id: string };
}

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

const initialCnhFormData: Omit<CNHData, 'id_cnh'> = {
  numero_registro: '', categoria: '', data_emissao: '', data_validade: '',
  primeira_habilitacao: null, local_emissao_cidade: null, local_emissao_uf: null, observacoes_cnh: null
};

export default function PessoaFisicaDetailsPage({ params }: PessoaFisicaDetailsPageProps) {
  // const { toast } = useToast();
  const [pessoaFisica, setPessoaFisica] = useState<PessoaFisica | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCnhModalOpen, setIsCnhModalOpen] = useState(false);
  const [cnhModalMode, setCnhModalMode] = useState<'create' | 'edit'>('create');
  const [cnhFormData, setCnhFormData] = useState<Omit<CNHData, 'id_cnh'>>(initialCnhFormData);
  const [currentCnhOnPage, setCurrentCnhOnPage] = useState<CNHData | null>(null); // To update UI after modal save

  useEffect(() => {
    if (params.id) {
      setIsLoading(true);
      getPessoaFisicaById(params.id)
        .then(data => {
          setPessoaFisica(data);
          setCurrentCnhOnPage(data?.cnh || null);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [params.id]);

  const formatDate = (dateString: string | null | undefined, outputFormat = "dd/MM/yyyy") => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, outputFormat) : "Data inválida";
    } catch (e) { return "Data inválida"; }
  };

  const handleOpenCnhModal = (mode: 'create' | 'edit') => {
    setCnhModalMode(mode);
    if (mode === 'edit' && currentCnhOnPage) {
      setCnhFormData({
        numero_registro: currentCnhOnPage.numero_registro,
        categoria: currentCnhOnPage.categoria,
        data_emissao: currentCnhOnPage.data_emissao, // Keep as YYYY-MM-DD string for input
        data_validade: currentCnhOnPage.data_validade, // Keep as YYYY-MM-DD string
        primeira_habilitacao: currentCnhOnPage.primeira_habilitacao,
        local_emissao_cidade: currentCnhOnPage.local_emissao_cidade,
        local_emissao_uf: currentCnhOnPage.local_emissao_uf,
        observacoes_cnh: currentCnhOnPage.observacoes_cnh,
      });
    } else {
      setCnhFormData(initialCnhFormData);
    }
    setIsCnhModalOpen(true);
  };
  
  const handleCnhFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCnhFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCnhDateChange = (name: keyof Omit<CNHData, 'id_cnh'>, date: Date | undefined) => {
    setCnhFormData(prev => ({ ...prev, [name]: date ? format(date, "yyyy-MM-dd") : '' }));
  };

  const handleCnhSelectChange = (name: keyof Omit<CNHData, 'id_cnh'>, value: string) => {
     setCnhFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCnhSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!cnhFormData.numero_registro || !cnhFormData.categoria || !cnhFormData.data_emissao || !cnhFormData.data_validade) {
      // toast({ title: "Campos da CNH Obrigatórios", description: "Número, Categoria, Emissão e Validade são obrigatórios.", variant: "destructive" });
      console.error("Validação CNH: Campos obrigatórios não preenchidos.");
      return;
    }
    // Supabase: if cnhModalMode === 'create', POST to public.CNHs with cnhFormData + id_pessoa_fisica.
    // Supabase: if cnhModalMode === 'edit', PUT/PATCH to public.CNHs with cnhFormData for currentCnhOnPage.id_cnh.
    console.log("Submitting CNH Data:", { id_pessoa_fisica: pessoaFisica?.id, ...cnhFormData });
    // toast({ title: "CNH Salva! (Simulado)", description: `Dados da CNH para ${pessoaFisica?.nomeCompleto} salvos.` });
    
    // Simulate update
    const newCnhData: CNHData = {
        id_cnh: currentCnhOnPage?.id_cnh || `cnh_new_${Date.now()}`,
        ...cnhFormData,
         primeira_habilitacao: cnhFormData.primeira_habilitacao || null,
         local_emissao_cidade: cnhFormData.local_emissao_cidade || null,
         local_emissao_uf: cnhFormData.local_emissao_uf || null,
         observacoes_cnh: cnhFormData.observacoes_cnh || null,
    };
    setCurrentCnhOnPage(newCnhData); 
    if (pessoaFisica) {
        setPessoaFisica({...pessoaFisica, cnh: newCnhData });
    }
    setIsCnhModalOpen(false);
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-12 text-center">Carregando dados...</div>;
  }
  if (!pessoaFisica) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Pessoa Física não encontrada</h1>
        <Button asChild className="mt-6"><Link href="/admin/clientes">Voltar</Link></Button>
      </div>
    );
  }

  const showOrganizacaoVinculada = pessoaFisica.organizacaoVinculada && pessoaFisica.tipoRelacao !== 'Cliente Geral';

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <User className="mr-3 h-8 w-8" /> Detalhes da Pessoa Física: {pessoaFisica.nomeCompleto}
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Informações Pessoais Card */}
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Info className="mr-2 h-5 w-5 text-primary" /> Informações Pessoais</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
              <InfoItem label="Nome Completo" value={pessoaFisica.nomeCompleto} icon={User} />
              <InfoItem label="CPF" value={pessoaFisica.cpf} icon={GripVertical} />
              <InfoItem label="RG" value={pessoaFisica.rg || "N/A"} icon={GripVertical} />
              <InfoItem label="Data de Nascimento" value={formatDate(pessoaFisica.dataNascimento)} icon={CalendarDays} />
              <InfoItem label="E-mail" value={pessoaFisica.email} icon={Mail} />
              <InfoItem label="Telefone" value={pessoaFisica.telefone || "N/A"} icon={Phone} />
              <InfoItem label="Data de Cadastro" value={formatDate(pessoaFisica.dataCadastro)} icon={CalendarDays} />
              <InfoItem label="Status" value={<span className={`font-semibold ${pessoaFisica.status === "Ativo" ? "text-green-600" : "text-amber-600"}`}>{pessoaFisica.status}</span>} icon={CheckSquare} />
            </CardContent>
          </Card>

          {/* Dados da CNH Card */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center text-xl"><ClipboardUser className="mr-2 h-5 w-5 text-primary" /> Dados da CNH</CardTitle>
                {currentCnhOnPage ? (
                    <Button variant="outline" size="sm" onClick={() => handleOpenCnhModal('edit')}><Edit3 className="mr-2 h-4 w-4"/>Editar CNH</Button>
                ) : (
                    <Button variant="default" size="sm" onClick={() => handleOpenCnhModal('create')}><PlusCircle className="mr-2 h-4 w-4"/>Cadastrar CNH</Button>
                )}
            </CardHeader>
            <CardContent>
                {currentCnhOnPage ? (
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                        <InfoItem label="Nº Registro" value={currentCnhOnPage.numero_registro} />
                        <InfoItem label="Categoria" value={currentCnhOnPage.categoria} />
                        <InfoItem label="Data de Emissão" value={formatDate(currentCnhOnPage.data_emissao)} />
                        <InfoItem label="Data de Validade" value={formatDate(currentCnhOnPage.data_validade)} />
                        <InfoItem label="Primeira Habilitação" value={formatDate(currentCnhOnPage.primeira_habilitacao)} />
                        <InfoItem label="Local Emissão" value={`${currentCnhOnPage.local_emissao_cidade || 'N/A'} - ${currentCnhOnPage.local_emissao_uf || 'N/A'}`} />
                        <InfoItem label="Observações CNH" value={currentCnhOnPage.observacoes_cnh} className="sm:col-span-2"/>
                    </div>
                ) : (
                    <p className="text-muted-foreground">Nenhuma CNH cadastrada para esta pessoa.</p>
                )}
            </CardContent>
          </Card>

          {/* Vínculo e Relação Card */}
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Link2 className="mr-2 h-5 w-5 text-primary" /> Vínculo e Relação</CardTitle></CardHeader>
            <CardContent>
              <InfoItem label="Tipo de Relação" value={pessoaFisica.tipoRelacao || "N/A"} icon={Briefcase} />
              {showOrganizacaoVinculada && pessoaFisica.organizacaoVinculada && (
                <>
                  <Separator className="my-4" />
                  <h3 className="text-md font-semibold text-foreground mb-2 flex items-center"><Building className="mr-2 h-5 w-5 text-primary/80"/> Organização Vinculada</h3>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 pl-2">
                    <InfoItem label="Nome" value={pessoaFisica.organizacaoVinculada.nome} />
                    <InfoItem label="Tipo" value={pessoaFisica.organizacaoVinculada.tipoOrganizacao} />
                    <InfoItem label="CNPJ" value={pessoaFisica.organizacaoVinculada.cnpj} />
                    <InfoItem label="Detalhes" value={<Button variant="link" asChild className="p-0 h-auto text-primary"><Link href={pessoaFisica.organizacaoVinculada.linkDetalhes || "#"}>Ver detalhes</Link></Button>} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Endereço Card */}
          {pessoaFisica.endereco && (
            <Card className="shadow-lg">
              <CardHeader><CardTitle className="flex items-center text-xl"><HomeIcon className="mr-2 h-5 w-5 text-primary" /> Endereço</CardTitle></CardHeader>
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

          {/* Documentos Associados Card */}
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><FileText className="mr-2 h-5 w-5 text-primary" /> Documentos Associados</CardTitle></CardHeader>
            <CardContent>
              {pessoaFisica.documentos && pessoaFisica.documentos.length > 0 ? (
                <Table><TableHeader><TableRow><TableHead>Título</TableHead><TableHead className="hidden sm:table-cell">Tipo</TableHead><TableHead className="hidden md:table-cell">Data Upload</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>{pessoaFisica.documentos.map(doc => (<TableRow key={doc.id}><TableCell className="font-medium">{doc.titulo}</TableCell><TableCell className="hidden sm:table-cell">{doc.tipo}</TableCell><TableCell className="hidden md:table-cell">{formatDate(doc.dataUpload)}</TableCell><TableCell className="text-right space-x-2"><Button variant="ghost" size="sm" asChild><Link href={doc.url} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4"/></Link></Button><Button variant="ghost" size="sm" asChild><Link href={doc.downloadUrl} download><Download className="h-4 w-4"/></Link></Button></TableCell></TableRow>))}</TableBody>
                </Table>
              ) : (<p className="text-muted-foreground text-center py-4">Nenhum documento associado.</p>)}
            </CardContent>
          </Card>

          {/* Veículos Associados Card */}
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Car className="mr-2 h-5 w-5 text-primary" /> Veículos Associados</CardTitle></CardHeader>
            <CardContent>
               {pessoaFisica.veiculos && pessoaFisica.veiculos.length > 0 ? (
                <Table><TableHeader><TableRow><TableHead>Placa</TableHead><TableHead>Modelo</TableHead><TableHead className="hidden sm:table-cell">Marca</TableHead><TableHead className="hidden md:table-cell">Ano</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>{pessoaFisica.veiculos.map(veiculo => (<TableRow key={veiculo.id}><TableCell className="font-medium">{veiculo.placa}</TableCell><TableCell>{veiculo.modelo}</TableCell><TableCell className="hidden sm:table-cell">{veiculo.marca}</TableCell><TableCell className="hidden md:table-cell">{veiculo.ano}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" asChild><Link href={veiculo.linkDetalhes}>Detalhes</Link></Button></TableCell></TableRow>))}</TableBody>
                </Table>
              ) : (<p className="text-muted-foreground text-center py-4">Nenhum veículo associado.</p>)}
            </CardContent>
          </Card>
          
          {/* Observações Gerais Card */}
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Info className="mr-2 h-5 w-5 text-primary" /> Observações Gerais</CardTitle></CardHeader>
            <CardContent><p className="text-foreground whitespace-pre-wrap">{pessoaFisica.observacoes || "Nenhuma observação."}</p></CardContent>
          </Card>
        </div>

        {/* Coluna Lateral de Ações */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-lg">Ações</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild><Link href={`/admin/clientes/${pessoaFisica.id}/editar`}><Edit3 className="mr-2 h-4 w-4" /> Editar Pessoa Física</Link></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button className="w-full" variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir Pessoa Física</Button></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir a pessoa física <strong>{pessoaFisica.nomeCompleto}</strong>? Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => console.log(`Excluir Pessoa Física ID: ${pessoaFisica.id} (placeholder)`)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Confirmar Exclusão</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
            <CardFooter className="flex-col space-y-2"><Button variant="outline" asChild className="w-full"><Link href="/admin/clientes">&larr; Voltar para Lista</Link></Button></CardFooter>
          </Card>
        </div>
      </div>

      {/* CNH Management Modal */}
      <Dialog open={isCnhModalOpen} onOpenChange={setIsCnhModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{cnhModalMode === 'create' ? 'Cadastrar Nova CNH' : 'Editar CNH'}</DialogTitle>
            <DialogDescription>Preencha os dados da Carteira Nacional de Habilitação.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCnhSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div><Label htmlFor="cnh_numero_registro">Número de Registro <span className="text-destructive">*</span></Label><Input id="cnh_numero_registro" name="numero_registro" value={cnhFormData.numero_registro} onChange={handleCnhFormChange} required /></div>
            <div><Label htmlFor="cnh_categoria">Categoria <span className="text-destructive">*</span></Label><Input id="cnh_categoria" name="categoria" value={cnhFormData.categoria} onChange={handleCnhFormChange} required placeholder="Ex: AB, B, C"/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="cnh_data_emissao">Data de Emissão <span className="text-destructive">*</span></Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.data_emissao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.data_emissao ? formatDate(cnhFormData.data_emissao) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.data_emissao ? parseISO(cnhFormData.data_emissao) : undefined} onSelect={(d) => handleCnhDateChange('data_emissao', d)} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
              </div>
              <div><Label htmlFor="cnh_data_validade">Data de Validade <span className="text-destructive">*</span></Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.data_validade && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.data_validade ? formatDate(cnhFormData.data_validade) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.data_validade ? parseISO(cnhFormData.data_validade) : undefined} onSelect={(d) => handleCnhDateChange('data_validade', d)} captionLayout="dropdown-buttons" fromYear={new Date().getFullYear()} toYear={new Date().getFullYear() + 15} initialFocus /></PopoverContent></Popover>
              </div>
            </div>
            <div><Label htmlFor="cnh_primeira_habilitacao">Primeira Habilitação</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.primeira_habilitacao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.primeira_habilitacao ? formatDate(cnhFormData.primeira_habilitacao) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.primeira_habilitacao ? parseISO(cnhFormData.primeira_habilitacao) : undefined} onSelect={(d) => handleCnhDateChange('primeira_habilitacao', d)} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="cnh_local_emissao_cidade">Cidade de Emissão</Label><Input id="cnh_local_emissao_cidade" name="local_emissao_cidade" value={cnhFormData.local_emissao_cidade || ''} onChange={handleCnhFormChange} /></div>
              <div><Label htmlFor="cnh_local_emissao_uf">UF de Emissão</Label>
                <Select name="local_emissao_uf" value={cnhFormData.local_emissao_uf || ''} onValueChange={(value) => handleCnhSelectChange('local_emissao_uf', value)}><SelectTrigger id="cnh_local_emissao_uf"><SelectValue placeholder="Selecione UF" /></SelectTrigger><SelectContent>{brazilianStates.map(state => (<SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>))}</SelectContent></Select>
              </div>
            </div>
            <div><Label htmlFor="cnh_observacoes_cnh">Observações da CNH</Label><Textarea id="cnh_observacoes_cnh" name="observacoes_cnh" value={cnhFormData.observacoes_cnh || ''} onChange={handleCnhFormChange} rows={3} /></div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">{cnhModalMode === 'create' ? 'Salvar CNH' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* 
        Supabase Integration Notes:
        - Fetch PessoaFisica details by ID.
        - JOINs: TiposEntidade, Entidades (via MembrosEntidade or direct FK), Enderecos, Municipios, Estados.
        - Separate fetches or subqueries for Documentos (Arquivos) and Veiculos.
        - Fetch CNH from public.CNHs where id_pessoa_fisica = current_pf_id.
        - CNH Modal: POST/PUT to public.CNHs.
      */}
    </div>
  );
}
