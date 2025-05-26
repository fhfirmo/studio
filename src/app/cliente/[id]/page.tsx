
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label as InfoItemLabel } from "@/components/ui/label"; // Renamed to avoid conflict if Label is needed elsewhere
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Mail, Phone, MapPin, CalendarDays, Edit3, Trash2, AlertTriangle, Building, Info, Link2, HomeIcon, Briefcase, FileText, CarIcon as Car, Download, Eye, GripVertical, ClipboardList, CheckSquare, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { Input } from '@/components/ui/input'; 
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';


interface CNHData {
  id_cnh?: string; // Optional for creation
  numero_registro: string;
  categoria: string;
  data_emissao: string; // YYYY-MM-DD
  data_validade: string; // YYYY-MM-DD
  primeira_habilitacao: string | null; // YYYY-MM-DD
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
  tipoRelacao: string; // Now direct from PessoasFisicas
  organizacaoVinculada: OrganizacaoVinculada | null; // Derived from MembrosEntidade
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
  // This function should now fetch from Supabase
  if (!supabase) {
    console.error("Supabase client not initialized for getPessoaFisicaById (Details Page)");
    return null;
  }
  console.log(`Fetching PessoaFisica details for ID: ${id} from Supabase (Details Page)`);
  
  const { data: pfData, error: pfError } = await supabase
    .from('PessoasFisicas')
    .select(`
      id_pessoa_fisica,
      nome_completo,
      cpf,
      rg,
      data_nascimento,
      email,
      telefone,
      tipo_relacao, 
      logradouro,
      numero,
      complemento,
      bairro,
      cep,
      cidade,
      estado_uf,
      observacoes,
      data_cadastro,
      CNHs ( * ),
      MembrosEntidade (
        Entidades!MembrosEntidade_id_entidade_pai_fkey (
          id_entidade,
          nome,
          cnpj,
          TiposEntidade ( nome_tipo )
        )
      ),
      Veiculos (
        id_veiculo,
        placa_atual,
        marca,
        ano_fabricacao,
        ModelosVeiculo ( nome_modelo )
      ),
      Arquivos (
        id_arquivo,
        nome_arquivo,
        tipo_documento,
        data_upload,
        caminho_armazenamento
      )
    `)
    .eq('id_pessoa_fisica', parseInt(id, 10))
    .maybeSingle();

  if (pfError) { 
    console.error("Error fetching PessoaFisica details from Supabase:", pfError); 
    return null; 
  }
  if (!pfData) return null;
  
  const orgVinculada = pfData.MembrosEntidade && pfData.MembrosEntidade.length > 0 && pfData.MembrosEntidade[0]['Entidades!MembrosEntidade_id_entidade_pai_fkey']
    ? {
        id: pfData.MembrosEntidade[0]['Entidades!MembrosEntidade_id_entidade_pai_fkey'].id_entidade.toString(),
        nome: pfData.MembrosEntidade[0]['Entidades!MembrosEntidade_id_entidade_pai_fkey'].nome,
        tipoOrganizacao: pfData.MembrosEntidade[0]['Entidades!MembrosEntidade_id_entidade_pai_fkey'].TiposEntidade?.nome_tipo || 'N/A',
        cnpj: pfData.MembrosEntidade[0]['Entidades!MembrosEntidade_id_entidade_pai_fkey'].cnpj,
        linkDetalhes: `/admin/organizacoes/${pfData.MembrosEntidade[0]['Entidades!MembrosEntidade_id_entidade_pai_fkey'].id_entidade}`
      }
    : null;

  const documentosAssociados = (pfData.Arquivos || []).map(doc => ({
    id: doc.id_arquivo,
    titulo: doc.nome_arquivo,
    tipo: doc.tipo_documento || 'N/A',
    dataUpload: doc.data_upload,
    url: supabase.storage.from('documentos_bucket').getPublicUrl(doc.caminho_armazenamento).data.publicUrl, // Adjust bucket name
    downloadUrl: doc.caminho_armazenamento // For download handler
  }));

  const veiculosAssociados = (pfData.Veiculos || []).map(vei => ({
    id: vei.id_veiculo.toString(),
    placa: vei.placa_atual,
    modelo: vei.ModelosVeiculo?.nome_modelo || 'N/A',
    marca: vei.marca || 'N/A',
    ano: vei.ano_fabricacao || 0,
    linkDetalhes: `/admin/veiculos/${vei.id_veiculo}`
  }));
  
  const cnh = Array.isArray(pfData.CNHs) ? (pfData.CNHs[0] || null) : pfData.CNHs;

  return {
    id: pfData.id_pessoa_fisica.toString(),
    nomeCompleto: pfData.nome_completo,
    cpf: pfData.cpf,
    rg: pfData.rg,
    dataNascimento: pfData.data_nascimento,
    email: pfData.email || '',
    telefone: pfData.telefone,
    dataCadastro: pfData.data_cadastro,
    tipoRelacao: pfData.tipo_relacao || 'N/A',
    organizacaoVinculada: orgVinculada,
    logradouro: pfData.logradouro,
    numero: pfData.numero,
    complemento: pfData.complemento,
    bairro: pfData.bairro,
    cep: pfData.cep,
    cidade: pfData.cidade, // Assuming these are now direct, or you need to join/fetch Municipio/Estado names
    estado_uf: pfData.estado_uf,
    documentos: documentosAssociados,
    veiculos: veiculosAssociados,
    observacoes: pfData.observacoes,
    status: "Ativo", // Placeholder for status
    cnh: cnh ? { ...cnh, id_cnh: cnh.id_cnh?.toString() } : null,
  };
}


const InfoItem = ({ label, value, icon: Icon, className }: { label: string, value: string | React.ReactNode | null | undefined, icon?: React.ElementType, className?: string }) => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '' && value !== "N/A")) return null;
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
  // currentCnhOnPage stores the CNH currently displayed (fetched from DB or after save)
  const [currentCnhOnPage, setCurrentCnhOnPage] = useState<CNHData | null>(null); 

  useEffect(() => {
    if (pessoaFisicaId) {
      setIsLoading(true);
      getPessoaFisicaById(pessoaFisicaId)
        .then(data => {
          setPessoaFisica(data);
          setCurrentCnhOnPage(data?.cnh || null); // Initialize currentCnhOnPage
        })
        .catch(error => {
            console.error("Erro ao buscar detalhes da pessoa física:", error);
            toast({title: "Erro ao Carregar", description: "Não foi possível carregar os detalhes da pessoa física.", variant: "destructive"});
        })
        .finally(() => setIsLoading(false));
    }
  }, [pessoaFisicaId, toast]); // Added toast to dependencies

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
    if (!supabase || !pessoaFisica) {
      toast({ title: "Erro de Configuração", description: "Cliente Supabase ou dados da pessoa física não disponíveis.", variant: "destructive" });
      return;
    }
    if (!cnhFormData.numero_registro || !cnhFormData.categoria || !cnhFormData.data_emissao || !cnhFormData.data_validade) {
      toast({ title: "Campos da CNH Obrigatórios", description: "Número, Categoria, Emissão e Validade são obrigatórios.", variant: "destructive" });
      return;
    }
    
    const numericPessoaFisicaId = parseInt(pessoaFisica.id);
    if (isNaN(numericPessoaFisicaId)) {
      toast({ title: "Erro Interno", description: "ID da pessoa física inválido.", variant: "destructive" });
      return;
    }

    const cnhPayload = {
      ...cnhFormData,
      id_pessoa_fisica: numericPessoaFisicaId 
    };

    try {
      let savedCnhData: CNHData;
      if (cnhModalMode === 'create') {
        const { data, error } = await supabase.from('CNHs').insert(cnhPayload).select().single();
        if (error) throw error;
        savedCnhData = data as CNHData;
      } else if (cnhModalMode === 'edit' && currentCnhOnPage?.id_cnh) {
        // @ts-ignore - id_pessoa_fisica não precisa ser atualizado no update da CNH
        const { id_pessoa_fisica, ...updatePayload } = cnhPayload; 
        const { data, error } = await supabase.from('CNHs').update(updatePayload).eq('id_cnh', currentCnhOnPage.id_cnh).select().single();
        if (error) throw error;
        savedCnhData = data as CNHData;
      } else {
        throw new Error("Modo de operação da CNH inválido ou ID da CNH ausente.");
      }
      
      setCurrentCnhOnPage(savedCnhData);
      setPessoaFisica(prevPf => prevPf ? {...prevPf, cnh: savedCnhData } : null);
      setIsCnhModalOpen(false);
      toast({ title: "CNH Salva!", description: `Dados da CNH para ${pessoaFisica?.nomeCompleto} salvos com sucesso.` });

    } catch (error: any) {
        console.error("Erro ao salvar CNH:", error);
        toast({ title: "Erro ao Salvar CNH", description: error.message, variant: "destructive" });
    }
  };
  
  const handleDeletePessoaFisica = async () => {
    if (!pessoaFisica || !supabase) return;
    console.log(`Excluir Pessoa Física ID: ${pessoaFisica.id}`);
    try {
      const { error } = await supabase.from('PessoasFisicas').delete().eq('id_pessoa_fisica', pessoaFisica.id);
      if (error) throw error;
      toast({title: "Pessoa Física Excluída", description: `${pessoaFisica.nomeCompleto} foi excluído(a) com sucesso.`});
      router.push('/admin/clientes');
    } catch (error: any) {
      toast({title: "Erro ao Excluir", description: error.message, variant: "destructive"});
    }
  };


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
  ].filter(Boolean).join(', ') || "N/A";


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
            <div><InfoItemLabel htmlFor="cnh_numero_registro_modal">Nº Registro <span className="text-destructive">*</span></InfoItemLabel><Input id="cnh_numero_registro_modal" name="numero_registro" value={cnhFormData.numero_registro} onChange={handleCnhFormChange} required /></div>
            <div><InfoItemLabel htmlFor="cnh_categoria_modal">Categoria <span className="text-destructive">*</span></InfoItemLabel><Input id="cnh_categoria_modal" name="categoria" value={cnhFormData.categoria} onChange={handleCnhFormChange} required placeholder="Ex: AB, B"/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><InfoItemLabel htmlFor="cnh_data_emissao_modal">Emissão <span className="text-destructive">*</span></InfoItemLabel>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.data_emissao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.data_emissao ? formatDate(cnhFormData.data_emissao) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.data_emissao ? parseISO(cnhFormData.data_emissao) : undefined} onSelect={(d) => handleCnhDateChange('data_emissao', d)} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
              </div>
              <div><InfoItemLabel htmlFor="cnh_data_validade_modal">Validade <span className="text-destructive">*</span></InfoItemLabel>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.data_validade && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.data_validade ? formatDate(cnhFormData.data_validade) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.data_validade ? parseISO(cnhFormData.data_validade) : undefined} onSelect={(d) => handleCnhDateChange('data_validade', d)} captionLayout="dropdown-buttons" fromYear={new Date().getFullYear()} toYear={new Date().getFullYear() + 15} initialFocus /></PopoverContent></Popover>
              </div>
            </div>
            <div><InfoItemLabel htmlFor="cnh_primeira_habilitacao_modal">1ª Habilitação</InfoItemLabel>
              <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.primeira_habilitacao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.primeira_habilitacao ? formatDate(cnhFormData.primeira_habilitacao) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.primeira_habilitacao ? parseISO(cnhFormData.primeira_habilitacao) : undefined} onSelect={(d) => handleCnhDateChange('primeira_habilitacao', d)} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><InfoItemLabel htmlFor="cnh_local_emissao_cidade_modal">Cidade Emissão</InfoItemLabel><Input id="cnh_local_emissao_cidade_modal" name="local_emissao_cidade" value={cnhFormData.local_emissao_cidade || ''} onChange={handleCnhFormChange} /></div>
              <div><InfoItemLabel htmlFor="cnh_local_emissao_uf_modal">UF Emissão</InfoItemLabel>
                <Select name="local_emissao_uf" value={cnhFormData.local_emissao_uf || ''} onValueChange={(value) => handleCnhSelectChange('local_emissao_uf', value)}><SelectTrigger id="cnh_local_emissao_uf_modal"><SelectValue placeholder="Selecione UF" /></SelectTrigger><SelectContent>{brazilianStates.map(state => (<SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>))}</SelectContent></Select>
              </div>
            </div>
            <div><InfoItemLabel htmlFor="cnh_observacoes_cnh_modal">Observações CNH</InfoItemLabel><Textarea id="cnh_observacoes_cnh_modal" name="observacoes_cnh" value={cnhFormData.observacoes_cnh || ''} onChange={handleCnhFormChange} rows={3} /></div>
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

/* Supabase Integration Notes:
- `getPessoaFisicaById`: Fetch PessoaFisica by ID. JOIN with MembrosEntidade and then Entidades (and TiposEntidade) to get organization details. JOIN CNHs. Fetch related Arquivos and Veiculos.
- CNH Modal: Create/Update public.CNHs associated with the current PessoaFisica.
- Delete PessoaFisica: Ensure ON DELETE CASCADE is set for CNHs, MembrosEntidade, Veiculos (proprietario_pessoa_fisica), Seguros (titular_pessoa_fisica), Arquivos (pessoa_fisica_associada) or handle these deletions in a transaction/Edge Function.
*/

    
  