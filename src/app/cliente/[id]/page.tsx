
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label"; // Keep Label if used by InfoItem
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Keep for CNH modal
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Mail, Phone, MapPin, CalendarDays, Edit3, Trash2, AlertTriangle, Building, Info, Link2, HomeIcon, Briefcase, FileText, CarIcon as Car, Download, Eye, GripVertical, ClipboardList, CheckSquare, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { Input } from '@/components/ui/input'; // Keep for CNH modal
import { Textarea } from '@/components/ui/textarea'; // Keep for CNH modal
import { useToast } from "@/hooks/use-toast";


interface CNHData {
  id_cnh: string;
  numero_registro: string;
  categoria: string;
  data_emissao: string;
  data_validade: string;
  primeira_habilitacao: string | null;
  local_emissao_cidade: string | null;
  local_emissao_uf: string | null;
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

interface PessoaFisicaDetailed {
  id: string;
  nomeCompleto: string;
  cpf: string;
  rg: string | null;
  dataNascimento: string | null;
  email: string;
  telefone: string | null;
  dataCadastro: string;
  tipoRelacao: string;
  organizacaoVinculada: OrganizacaoVinculada | null;
  // Endereço direto
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cep: string | null;
  cidade: string | null;
  estado_uf: string | null;
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


async function getPessoaFisicaById(id: string): Promise<PessoaFisicaDetailed | null> {
  console.log(`Fetching PessoaFisica details for ID: ${id} (placeholder - with direct address)`);
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const sampleCnh: CNHData | null = id === "pf_001" || id === "1" || id === "cli_001" ? {
    id_cnh: "cnh_001", numero_registro: "01234567890", categoria: "AB", data_emissao: "2022-08-15",
    data_validade: "2027-08-14", primeira_habilitacao: "2010-08-15", local_emissao_cidade: "Cidade Exemplo",
    local_emissao_uf: "EX", observacoes_cnh: "Nenhuma observação."
  } : null;

  const sampleDocuments = [
    { id: "doc_pf1_001", titulo: "Contrato de Associação PF1", tipo: "Contrato", dataUpload: "2024-05-10", url:"#view-doc1", downloadUrl: "#download-doc1" },
  ];
  const sampleVehicles = [
    { id: "vei_pf1_001", placa: "PFA-0001", modelo: "Carro Principal", marca: "Marca X", ano: 2022, linkDetalhes: "/admin/veiculos/vei_pf1_001" },
  ];

  if (id === "pf_001" || id === "1" || id === "cli_001") {
    return {
      id: "pf_001", nomeCompleto: "João da Silva Sauro", cpf: "123.456.789-00", rg: "12.345.678-9",
      dataNascimento: "1985-05-15", email: "joao.sauro@example.com", telefone: "(11) 98765-4321",
      dataCadastro: "2024-01-15T10:00:00Z", tipoRelacao: "Associado",
      organizacaoVinculada: { id: "org_001", nome: "Cooperativa Alfa", tipoOrganizacao: "Cooperativa Principal", cnpj: "11.222.333/0001-44", linkDetalhes: "/admin/organizacoes/org_001" },
      logradouro: "Rua das Palmeiras", numero: "101", complemento: "Apto 10A", bairro: "Centro",
      cidade: "Cidade Exemplo", estado_uf: "EX", cep: "01001-001",
      documentos: sampleDocuments, veiculos: sampleVehicles,
      observacoes: "Cliente antigo e membro ativo da cooperativa.", status: "Ativo", cnh: sampleCnh,
    };
  }
  if (id === "pf_003") {
     return {
      id: "pf_003", nomeCompleto: "Carlos Pereira Lima", cpf: "111.222.333-44", rg: "33.444.555-6",
      dataNascimento: "1990-10-20", email: "carlos.lima@example.com", telefone: "(31) 99887-7665",
      dataCadastro: "2024-03-10T14:30:00Z", tipoRelacao: "Cliente Geral", organizacaoVinculada: null,
      logradouro: "Avenida Brasil", numero: "2000", complemento: "Casa 2", bairro: "Jardins",
      cidade: "Outra Cidade", estado_uf: "OT", cep: "12345-678",
      documentos: [], veiculos: [], observacoes: "Interessado em seguros veiculares.", status: "Ativo", cnh: null,
    };
  }
  return null;
}

const InfoItem = ({ label, value, icon: Icon, className }: { label: string, value: string | React.ReactNode | null | undefined, icon?: React.ElementType, className?: string }) => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null;
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

export default function PessoaFisicaDetailsPage() {
  const paramsHook = useParams();
  const pessoaFisicaId = paramsHook.id as string;
  const { toast } = useToast();
  const router = useRouter();

  const [pessoaFisica, setPessoaFisica] = useState<PessoaFisicaDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCnhModalOpen, setIsCnhModalOpen] = useState(false);
  const [cnhModalMode, setCnhModalMode] = useState<'create' | 'edit'>('create');
  const [cnhFormData, setCnhFormData] = useState<Omit<CNHData, 'id_cnh'>>(initialCnhModalFormData);
  const [currentCnhOnPage, setCurrentCnhOnPage] = useState<CNHData | null>(null);

  useEffect(() => {
    if (pessoaFisicaId) {
      setIsLoading(true);
      getPessoaFisicaById(pessoaFisicaId)
        .then(data => {
          setPessoaFisica(data);
          setCurrentCnhOnPage(data?.cnh || null);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [pessoaFisicaId]);

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
        data_emissao: currentCnhOnPage.data_emissao,
        data_validade: currentCnhOnPage.data_validade,
        primeira_habilitacao: currentCnhOnPage.primeira_habilitacao,
        local_emissao_cidade: currentCnhOnPage.local_emissao_cidade,
        local_emissao_uf: currentCnhOnPage.local_emissao_uf,
        observacoes_cnh: currentCnhOnPage.observacoes_cnh,
      });
    } else {
      setCnhFormData(initialCnhModalFormData);
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
      toast({ title: "Campos da CNH Obrigatórios", description: "Número, Categoria, Emissão e Validade são obrigatórios.", variant: "destructive" });
      return;
    }
    
    const cnhPayload = {
      ...cnhFormData,
      id_pessoa_fisica: parseInt(pessoaFisicaId) // Certifique-se que pessoaFisicaId é numérico ou ajuste
    };

    try {
      let savedCnhData: CNHData;
      if (cnhModalMode === 'create') {
        const { data, error } = await supabase.from('CNHs').insert(cnhPayload).select().single();
        if (error) throw error;
        savedCnhData = data as CNHData;
      } else if (cnhModalMode === 'edit' && currentCnhOnPage?.id_cnh) {
        // @ts-ignore - id_pessoa_fisica não precisa ser atualizado
        const { id_pessoa_fisica, ...updatePayload } = cnhPayload; 
        const { data, error } = await supabase.from('CNHs').update(updatePayload).eq('id_cnh', currentCnhOnPage.id_cnh).select().single();
        if (error) throw error;
        savedCnhData = data as CNHData;
      } else {
        throw new Error("Modo de operação da CNH inválido ou ID da CNH ausente.");
      }
      
      setCurrentCnhOnPage(savedCnhData);
      if (pessoaFisica) {
          setPessoaFisica({...pessoaFisica, cnh: savedCnhData });
      }
      setIsCnhModalOpen(false);
      toast({ title: "CNH Salva!", description: `Dados da CNH para ${pessoaFisica?.nomeCompleto} salvos com sucesso.` });

    } catch (error: any) {
        console.error("Erro ao salvar CNH:", error);
        toast({ title: "Erro ao Salvar CNH", description: error.message, variant: "destructive" });
    }
  };
  
  // Placeholder para exclusão
  const handleDeletePessoaFisica = async () => {
    if (!pessoaFisica) return;
    console.log(`Excluir Pessoa Física ID: ${pessoaFisica.id} (placeholder)`);
    // Supabase: DELETE FROM public.PessoasFisicas WHERE id_pessoa_fisica = pessoaFisica.id;
    // (Considerar ON DELETE CASCADE para CNHs, MembrosEntidade, etc., ou tratar exclusões relacionadas)
    toast({title: "Exclusão (Simulada)", description: `Pessoa física ${pessoaFisica.nomeCompleto} seria excluída.`});
    router.push('/admin/clientes'); // Redirect after simulated delete
  }


  if (isLoading) {
    return <div className="container mx-auto px-4 py-12 text-center">Carregando dados...</div>;
  }
  if (!pessoaFisica) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Pessoa Física não encontrada</h1>
        <Button asChild className="mt-6"><Link href="/admin/clientes">Voltar para Lista</Link></Button>
      </div>
    );
  }

  const showOrganizacaoVinculada = pessoaFisica.organizacaoVinculada && pessoaFisica.tipoRelacao !== 'Cliente Geral';
  const fullAddress = [
    pessoaFisica.logradouro,
    pessoaFisica.numero,
    pessoaFisica.complemento,
    pessoaFisica.bairro,
    pessoaFisica.cidade ? `${pessoaFisica.cidade} - ${pessoaFisica.estado_uf || ''}` : '',
    pessoaFisica.cep,
  ].filter(Boolean).join(', ');


  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
          <User className="mr-3 h-8 w-8" /> Detalhes da Pessoa Física: {pessoaFisica.nomeCompleto}
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Info className="mr-2 h-5 w-5 text-primary" /> Informações Pessoais</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
              <InfoItem label="Nome Completo" value={pessoaFisica.nomeCompleto} icon={User} />
              <InfoItem label="CPF" value={pessoaFisica.cpf} icon={GripVertical} />
              <InfoItem label="RG" value={pessoaFisica.rg || "N/A"} icon={GripVertical} />
              <InfoItem label="Data de Nascimento" value={formatDate(pessoaFisica.dataNascimento)} icon={CalendarDays} />
              <InfoItem label="E-mail" value={pessoaFisica.email} icon={Mail} />
              <InfoItem label="Telefone" value={pessoaFisica.telefone || "N/A"} icon={Phone} />
              <InfoItem label="Data de Cadastro" value={formatDate(pessoaFisica.dataCadastro, "dd/MM/yyyy HH:mm")} icon={CalendarDays} />
              <InfoItem label="Status" value={<span className={`font-semibold ${pessoaFisica.status === "Ativo" ? "text-green-600" : "text-amber-600"}`}>{pessoaFisica.status}</span>} icon={CheckSquare} />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center text-xl"><ClipboardList className="mr-2 h-5 w-5 text-primary" /> Dados da CNH</CardTitle>
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
                ) : ( <p className="text-muted-foreground">Nenhuma CNH cadastrada para esta pessoa.</p> )}
            </CardContent>
          </Card>

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
          
          {(pessoaFisica.logradouro || pessoaFisica.cidade) && (
            <Card className="shadow-lg">
              <CardHeader><CardTitle className="flex items-center text-xl"><MapPin className="mr-2 h-5 w-5 text-primary" /> Endereço</CardTitle></CardHeader>
              <CardContent>
                 <InfoItem label="Endereço Completo" value={fullAddress} />
              </CardContent>
            </Card>
          )}

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
          
          <Card className="shadow-lg">
            <CardHeader><CardTitle className="flex items-center text-xl"><Info className="mr-2 h-5 w-5 text-primary" /> Observações Gerais</CardTitle></CardHeader>
            <CardContent><p className="text-foreground whitespace-pre-wrap">{pessoaFisica.observacoes || "Nenhuma observação."}</p></CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-lg">Ações</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild><Link href={`/admin/clientes/${pessoaFisica.id}/editar`}><Edit3 className="mr-2 h-4 w-4" /> Editar Pessoa Física</Link></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button className="w-full" variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir Pessoa Física</Button></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir a pessoa física <strong>{pessoaFisica.nomeCompleto}</strong>? Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeletePessoaFisica} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Confirmar Exclusão</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
            <CardFooter className="flex-col space-y-2"><Button variant="outline" asChild className="w-full"><Link href="/admin/clientes">&larr; Voltar para Lista</Link></Button></CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={isCnhModalOpen} onOpenChange={setIsCnhModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{cnhModalMode === 'create' ? 'Cadastrar Nova CNH' : 'Editar CNH'}</DialogTitle>
            <DialogDescription>Preencha os dados da CNH.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCnhSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div><Label htmlFor="cnh_numero_registro_modal">Nº Registro <span className="text-destructive">*</span></Label><Input id="cnh_numero_registro_modal" name="numero_registro" value={cnhFormData.numero_registro} onChange={handleCnhFormChange} required /></div>
            <div><Label htmlFor="cnh_categoria_modal">Categoria <span className="text-destructive">*</span></Label><Input id="cnh_categoria_modal" name="categoria" value={cnhFormData.categoria} onChange={handleCnhFormChange} required placeholder="Ex: AB, B"/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="cnh_data_emissao_modal">Emissão <span className="text-destructive">*</span></Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.data_emissao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.data_emissao ? formatDate(cnhFormData.data_emissao) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.data_emissao ? parseISO(cnhFormData.data_emissao) : undefined} onSelect={(d) => handleCnhDateChange('data_emissao', d)} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
              </div>
              <div><Label htmlFor="cnh_data_validade_modal">Validade <span className="text-destructive">*</span></Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.data_validade && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.data_validade ? formatDate(cnhFormData.data_validade) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.data_validade ? parseISO(cnhFormData.data_validade) : undefined} onSelect={(d) => handleCnhDateChange('data_validade', d)} captionLayout="dropdown-buttons" fromYear={new Date().getFullYear()} toYear={new Date().getFullYear() + 15} initialFocus /></PopoverContent></Popover>
              </div>
            </div>
            <div><Label htmlFor="cnh_primeira_habilitacao_modal">1ª Habilitação</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.primeira_habilitacao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.primeira_habilitacao ? formatDate(cnhFormData.primeira_habilitacao) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.primeira_habilitacao ? parseISO(cnhFormData.primeira_habilitacao) : undefined} onSelect={(d) => handleCnhDateChange('primeira_habilitacao', d)} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="cnh_local_emissao_cidade_modal">Cidade Emissão</Label><Input id="cnh_local_emissao_cidade_modal" name="local_emissao_cidade" value={cnhFormData.local_emissao_cidade || ''} onChange={handleCnhFormChange} /></div>
              <div><Label htmlFor="cnh_local_emissao_uf_modal">UF Emissão</Label>
                <Select name="local_emissao_uf" value={cnhFormData.local_emissao_uf || ''} onValueChange={(value) => handleCnhSelectChange('local_emissao_uf', value)}><SelectTrigger id="cnh_local_emissao_uf_modal"><SelectValue placeholder="Selecione UF" /></SelectTrigger><SelectContent>{brazilianStates.map(state => (<SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>))}</SelectContent></Select>
              </div>
            </div>
            <div><Label htmlFor="cnh_observacoes_cnh_modal">Observações CNH</Label><Textarea id="cnh_observacoes_cnh_modal" name="observacoes_cnh" value={cnhFormData.observacoes_cnh || ''} onChange={handleCnhFormChange} rows={3} /></div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">{cnhModalMode === 'create' ? 'Salvar CNH' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Supabase Integration Notes (Refactored Address):
- Fetch PessoaFisica details by ID from public.PessoasFisicas. Address fields are now direct.
- JOINs: TiposEntidade (for organizacaoVinculada.tipoOrganizacao), Entidades (via MembrosEntidade or direct FK for organizacaoVinculada.nome, etc).
- Separate fetches or subqueries for Documentos (Arquivos) and Veiculos associated with this PessoaFisica.
- CNH: Fetch from public.CNHs where id_pessoa_fisica = current_pf_id.
- CNH Modal: POST/PUT to public.CNHs.
- Delete: Ensure ON DELETE CASCADE is set for CNHs and other related records, or handle deletions in a transaction/Edge Function.
*/

