
"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent, type FocusEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { UserCog, Save, XCircle, HomeIcon, InfoIcon, AlertTriangle, Users, Briefcase, Link2, CalendarDays, ClipboardList, Edit3 as EditIcon, PlusCircle, MapPin, Loader2 } from 'lucide-react';
import { format, parseISO, isValid } from "date-fns";
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

// Placeholder para dados de CNH no formulário
interface CNHData {
  id_cnh?: string; // Optional for new CNH
  numero_registro: string;
  categoria: string;
  data_emissao: string; // YYYY-MM-DD
  data_validade: string; // YYYY-MM-DD
  primeira_habilitacao: string | null; // YYYY-MM-DD
  local_emissao_cidade: string | null;
  local_emissao_uf: string | null;
  observacoes_cnh: string | null;
}

const initialCnhFormData: CNHData = {
  numero_registro: '', categoria: '', data_emissao: '', data_validade: '',
  primeira_habilitacao: null, local_emissao_cidade: null, local_emissao_uf: null, observacoes_cnh: null,
};

const tiposRelacao = [
  { value: "associado", label: "Associado" },
  { value: "cooperado", label: "Cooperado" },
  { value: "funcionario", label: "Funcionário" },
  { value: "cliente_geral", label: "Cliente Geral" },
];

const organizacoesDisponiveis = [
  { value: "org_001", label: "Cooperativa Alfa" },
  { value: "org_002", label: "Associação Beta" },
  { value: "org_003", label: "Empresa Gama" },
];

interface PessoaFisicaDataFromDB {
  id: string;
  nomeCompleto: string;
  cpf: string;
  rg?: string | null;
  dataNascimento?: string | null; // YYYY-MM-DD
  email: string;
  telefone?: string | null;
  tipoRelacao?: string;
  organizacaoVinculadaId?: string | null; // Store ID
  // Endereço direto
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  estado_uf?: string | null;
  observacoes?: string | null;
  dataCadastro?: string; // YYYY-MM-DD or full timestamp
  cnh: CNHData | null;
}

async function getPessoaFisicaById(id: string): Promise<PessoaFisicaDataFromDB | null> {
  console.log(`Fetching PessoaFisica data for ID: ${id} (placeholder - with direct address)`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const sampleCnh: CNHData | null = id === "pf_001" || id === "cli_001" || id === "1" ? {
    id_cnh: "cnh_001", numero_registro: "01234567890", categoria: "AB", data_emissao: "2022-08-15",
    data_validade: "2027-08-14", primeira_habilitacao: "2010-08-15", local_emissao_cidade: "Cidade Exemplo",
    local_emissao_uf: "EX", observacoes_cnh: "Nenhuma observação específica."
  } : null;

  if (id === "pf_001" || id === "cli_001" || id === "1" ) { 
    return {
      id: "pf_001", nomeCompleto: `João da Silva Sauro`, cpf: `123.456.789-00`, rg: `12.345.678-9`,
      dataNascimento: `1985-05-15`, email: `joao@exemplo.com`, telefone: `(11) 9876-5432`,
      tipoRelacao: "associado", organizacaoVinculadaId: "org_001", 
      logradouro: 'Rua Exemplo das Couves', numero: '123', complemento: 'Apto 101', 
      bairro: 'Bairro Modelo', cidade: 'São Paulo', estado_uf: 'SP', cep: '01234-567', 
      observacoes: `Obs sobre João.`, dataCadastro: '2024-01-15T10:00:00Z',
      cnh: sampleCnh,
    };
  }
  if (id === "pf_003") {
     return {
      id: "pf_003", nomeCompleto: "Carlos Pereira Lima", cpf: "111.222.333-44", rg: "33.444.555-6",
      dataNascimento: "1990-10-20", email: "carlos@exemplo.com", telefone: "(31) 9988-7766",
      tipoRelacao: "cliente_geral", organizacaoVinculadaId: "",
      logradouro: 'Avenida Principal', numero: '1500', complemento: 'Loja B', 
      bairro: 'Centro', cidade: 'Belo Horizonte', estado_uf: 'MG', cep: '30123-000',
      observacoes: `Carlos é cliente geral.`, dataCadastro: '2024-03-10T14:30:00Z',
      cnh: null,
    };
  }
  return null; 
}

// Placeholder for CEP API call
async function fetchAddressFromCEP(cep: string): Promise<any | null> {
  if (cep.replace(/\D/g, '').length !== 8) {
    // toast is not available here directly, handle in calling component
    return null;
  }
  console.log(`Simulating API call for CEP: ${cep}`);
  await new Promise(resolve => setTimeout(resolve, 700));
  if (cep.startsWith("01001")) {
    return { logradouro: "Avenida Paulista", bairro: "Bela Vista", cidade: "São Paulo", estado_uf: "SP", cep: "01001-000" };
  } else if (cep.startsWith("12345")) {
    return { logradouro: "Rua dos Testes", bairro: "Vila Nova", cidade: "Campinas", estado_uf: "SP", cep: "12345-678" };
  }
  return null;
}

export default function EditarPessoaFisicaPage() {
  const router = useRouter();
  const params = useParams();
  const pessoaFisicaId = params.id as string;
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [pessoaFisicaFound, setPessoaFisicaFound] = useState<boolean | null>(null);
  const [dataCadastroDisplay, setDataCadastroDisplay] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nomeCompleto: '', cpf: '', rg: '', dataNascimento: undefined as Date | undefined, email: '', 
    telefone: '', tipoRelacao: '', organizacaoVinculadaId: '', 
    logradouro: '', numero: '', complemento: '', bairro: '', cep: '', cidade: '', estado_uf: '', 
    observacoes: '',
  });
  
  const [isCnhModalOpen, setIsCnhModalOpen] = useState(false);
  const [cnhModalMode, setCnhModalMode] = useState<'create' | 'edit'>('create');
  const [cnhFormData, setCnhFormData] = useState<CNHData>(initialCnhFormData);
  const [currentDbCnh, setCurrentDbCnh] = useState<CNHData | null>(null);

  const isOrganizacaoRequired = formData.tipoRelacao !== '' && formData.tipoRelacao !== 'cliente_geral';

  useEffect(() => {
    if (pessoaFisicaId) {
      setIsLoading(true);
      getPessoaFisicaById(pessoaFisicaId)
        .then(data => {
          if (data) {
            setFormData({
              nomeCompleto: data.nomeCompleto || '', cpf: data.cpf || '', rg: data.rg || '',
              dataNascimento: data.dataNascimento && isValid(parseISO(data.dataNascimento)) ? parseISO(data.dataNascimento) : undefined,
              email: data.email || '', telefone: data.telefone || '', tipoRelacao: data.tipoRelacao || '',
              organizacaoVinculadaId: data.organizacaoVinculadaId || '',
              logradouro: data.logradouro || '', numero: data.numero || '', complemento: data.complemento || '',
              bairro: data.bairro || '', cep: data.cep || '', cidade: data.cidade || '', estado_uf: data.estado_uf || '',
              observacoes: data.observacoes || '',
            });
            if (data.dataCadastro) {
               setDataCadastroDisplay(format(parseISO(data.dataCadastro), "dd/MM/yyyy HH:mm"));
            }
            setCurrentDbCnh(data.cnh || null);
            setPessoaFisicaFound(true);
          } else { setPessoaFisicaFound(false); }
        })
        .catch(err => { console.error("Failed to fetch data:", err); setPessoaFisicaFound(false); })
        .finally(() => setIsLoading(false));
    }
  }, [pessoaFisicaId]);
  
  useEffect(() => {
    if (formData.tipoRelacao === 'cliente_geral' && formData.organizacaoVinculadaId) {
      setFormData(prev => ({ ...prev, organizacaoVinculadaId: '' }));
    }
  }, [formData.tipoRelacao, formData.organizacaoVinculadaId]);

  const handleCepBlur = async (event: FocusEvent<HTMLInputElement>) => {
    const cepValue = event.target.value;
    if (cepValue && cepValue.replace(/\D/g, '').length === 8) {
      setIsCepLoading(true);
      try {
        const address = await fetchAddressFromCEP(cepValue);
        if (address) {
          setFormData(prev => ({
            ...prev,
            logradouro: address.logradouro || '',
            bairro: address.bairro || '',
            cidade: address.cidade || '',
            estado_uf: address.estado_uf || '',
          }));
          toast({ title: "Endereço Encontrado!", description: "Campos de endereço preenchidos automaticamente." });
        } else {
          toast({ title: "CEP Não Encontrado", description: "Verifique o CEP ou preencha o endereço manualmente.", variant: "default" });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast({ title: "Erro ao Buscar CEP", description: "Não foi possível obter o endereço.", variant: "destructive" });
      } finally {
        setIsCepLoading(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData(prev => ({...prev, [name]: date }));
  };

  const handleOpenCnhModal = () => {
    if (currentDbCnh) {
      setCnhModalMode('edit');
      setCnhFormData({ ...initialCnhFormData, ...currentDbCnh });
    } else {
      setCnhModalMode('create');
      setCnhFormData(initialCnhFormData);
    }
    setIsCnhModalOpen(true);
  };
  const handleCnhFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCnhFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleCnhDateChange = (name: keyof CNHData, date: Date | undefined) => {
    setCnhFormData(prev => ({ ...prev, [name]: date ? format(date, "yyyy-MM-dd") : '' }));
  };
  const handleCnhSelectChange = (name: keyof CNHData, value: string) => {
     setCnhFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleCnhSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!cnhFormData.numero_registro || !cnhFormData.categoria || !cnhFormData.data_emissao || !cnhFormData.data_validade) {
      toast({ title: "CNH: Campos Obrigatórios", description: "Número, Categoria, Emissão e Validade são obrigatórios.", variant: "destructive" });
      return;
    }
    
    // Supabase: POST (create) or PUT/PATCH (edit) to public.CNHs
    // On success, update currentDbCnh state and close modal
    // For now, simulate by updating local state directly for UI reflection.
    const newCnhDataFromForm: CNHData = {
        id_cnh: cnhModalMode === 'edit' && currentDbCnh ? currentDbCnh.id_cnh : `cnh_temp_${Date.now()}`,
        ...cnhFormData,
        primeira_habilitacao: cnhFormData.primeira_habilitacao || null,
        local_emissao_cidade: cnhFormData.local_emissao_cidade || null,
        local_emissao_uf: cnhFormData.local_emissao_uf || null,
        observacoes_cnh: cnhFormData.observacoes_cnh || null,
    };

    // Simulating Supabase save and getting back the saved/updated CNH
    // In real app, you'd await Supabase call here.
    setCurrentDbCnh(newCnhDataFromForm); 
    setIsCnhModalOpen(false);
    toast({ title: "CNH Salva!", description: "Dados da CNH salvos." });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast({ title: "Erro de Configuração", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    if (!formData.nomeCompleto || !formData.cpf || !formData.email || !formData.tipoRelacao) {
      toast({ title: "Campos Obrigatórios", description: "Nome, CPF, E-mail e Tipo de Relação são obrigatórios.", variant: "destructive" });
      setIsLoading(false); return;
    }
    if (isOrganizacaoRequired && !formData.organizacaoVinculadaId) {
      toast({ title: "Campo Obrigatório", description: "Organização Vinculada é obrigatória.", variant: "destructive" });
      setIsLoading(false); return;
    }
    
    try {
      // Payload para PessoasFisicas agora inclui os campos de endereço
      const pessoaFisicaUpdatePayload = {
        nome_completo: formData.nomeCompleto,
        cpf: formData.cpf,
        rg: formData.rg || null,
        data_nascimento: formData.dataNascimento ? format(formData.dataNascimento, "yyyy-MM-dd") : null,
        // email: formData.email, // Email é usado como identificador e geralmente não é atualizado.
        telefone: formData.telefone || null,
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cep: formData.cep || null,
        cidade: formData.cidade || null,
        estado_uf: formData.estado_uf || null,
        tipo_relacao: formData.tipoRelacao, // Assegure que esta coluna existe em PessoasFisicas
        observacoes: formData.observacoes, // Assegure que esta coluna existe em PessoasFisicas
      };

      const { error: pfError } = await supabase
        .from('PessoasFisicas')
        .update(pessoaFisicaUpdatePayload)
        .eq('id_pessoa_fisica', pessoaFisicaId);

      if (pfError) throw pfError;

      // Lógica para MembrosEntidade (se tipoRelacao ou organizacaoVinculadaId mudou)
      // Esta parte é complexa: pode precisar deletar vínculo antigo e criar novo, ou atualizar.
      // Por simplicidade, vamos assumir que o vínculo principal é gerenciado aqui se tipoRelacao != 'cliente_geral'
      // Se for 'cliente_geral', e existia um vínculo, deveria ser removido.
      // Se mudou de 'cliente_geral' para outro, e uma organização foi selecionada, criar o vínculo.
      // Supabase: Verifique se já existe um MembrosEntidade para este id_pessoa_fisica.
      // Se formData.tipoRelacao === 'cliente_geral', DELETE de MembrosEntidade se existir.
      // Se formData.tipoRelacao !== 'cliente_geral' e formData.organizacaoVinculadaId:
      //    UPSERT em MembrosEntidade (id_entidade_pai, id_membro_pessoa_fisica, tipo_membro, funcao_no_membro)
      //    onde id_membro_pessoa_fisica = pessoaFisicaId.
      //    Isto requer buscar primeiro se existe um vínculo para decidir entre INSERT e UPDATE.
      //    Para este exemplo, vamos simplificar:
      if (formData.tipoRelacao !== 'cliente_geral' && formData.organizacaoVinculadaId) {
        // Simula um upsert. Em um caso real, buscaria primeiro.
        const { error: membroError } = await supabase
          .from('MembrosEntidade')
          .upsert({ 
            // id_membro_entidade: ???, // Precisa de um ID se for update ou definir constraint para upsert
            id_entidade_pai: parseInt(formData.organizacaoVinculadaId),
            id_membro_pessoa_fisica: parseInt(pessoaFisicaId), // Assumindo que pessoaFisicaId é numérico
            tipo_membro: 'Pessoa Fisica',
            funcao_no_membro: formData.tipoRelacao
          }, { onConflict: 'id_entidade_pai, id_membro_pessoa_fisica' }); // Ajuste o onConflict conforme sua PK/UNIQUE
         if (membroError) console.warn("Aviso ao atualizar MembrosEntidade (pode ser ignorado se o vínculo já existe e não mudou):", membroError.message);
      } else {
        // Se for cliente geral, ou não tiver organização, garantir que não há vínculo
        const { error: deleteMembroError } = await supabase
          .from('MembrosEntidade')
          .delete()
          .eq('id_membro_pessoa_fisica', parseInt(pessoaFisicaId)); // Assumindo que pessoaFisicaId é numérico
        if (deleteMembroError) console.warn("Aviso ao tentar remover vínculo de MembrosEntidade:", deleteMembroError.message);
      }

      // CNH data is saved via its own modal, so no direct update here unless the modal submits directly to the DB.
      // If currentDbCnh was modified by the modal and *not yet* saved to DB, you'd save it here.
      // For now, assume CNH modal saves directly.

      toast({ title: "Pessoa Física Atualizada!", description: "Os dados foram salvos com sucesso." });
      router.push('/admin/clientes'); 

    } catch (error: any) {
      console.error("Erro ao atualizar Pessoa Física:", error);
      toast({ title: "Erro ao Atualizar", description: `Falha ao salvar: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && pessoaFisicaFound === null) return <div className="container mx-auto p-8 text-center">Carregando...</div>;
  if (pessoaFisicaFound === false) return <div className="container mx-auto p-8 text-center"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><h1 className="text-2xl font-bold text-destructive">Pessoa Física não encontrada</h1><Button asChild className="mt-6"><Link href="/admin/clientes">Voltar</Link></Button></div>;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <UserCog className="mr-3 h-8 w-8" /> Editar Pessoa Física: {formData.nomeCompleto}
          </h1>
          <Button variant="outline" size="sm" asChild><Link href="/admin/clientes"><XCircle className="mr-2 h-4 w-4" /> Cancelar</Link></Button>
        </div>
        {dataCadastroDisplay && <p className="text-sm text-muted-foreground mt-1">Data de Cadastro: {dataCadastroDisplay}</p>}
      </header>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="infoPessoais" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
             <TabsTrigger value="infoPessoais"><Users className="mr-2 h-4 w-4" />Info Pessoais</TabsTrigger>
             <TabsTrigger value="vinculo"><Link2 className="mr-2 h-4 w-4" />Vínculo</TabsTrigger>
             <TabsTrigger value="endereco"><MapPin className="mr-2 h-4 w-4" />Endereço</TabsTrigger>
             <TabsTrigger value="cnh"><ClipboardList className="mr-2 h-4 w-4" />CNH</TabsTrigger>
             <TabsTrigger value="outrasInfo"><InfoIcon className="mr-2 h-4 w-4" />Outras Info</TabsTrigger>
          </TabsList>

          <TabsContent value="infoPessoais">
            <Card className="shadow-lg"><CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="nomeCompleto">Nome <span className="text-destructive">*</span></Label><Input id="nomeCompleto" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleChange} required /></div>
                  <div className="space-y-2"><Label htmlFor="cpf">CPF <span className="text-destructive">*</span></Label><Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" required /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="rg">RG</Label><Input id="rg" name="rg" value={formData.rg || ''} onChange={handleChange} placeholder="00.000.000-0" /></div>
                  <div className="space-y-2"><Label htmlFor="dataNascimento">Nascimento</Label>
                     <Popover><PopoverTrigger asChild><Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!formData.dataNascimento && "text-muted-foreground"}`}><CalendarDays className="mr-2 h-4 w-4" /> {formData.dataNascimento ? format(formData.dataNascimento, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={formData.dataNascimento} onSelect={(d) => handleDateChange('dataNascimento', d)} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
                  </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" required readOnly className="bg-muted/50 cursor-not-allowed" title="O e-mail é usado como identificador."/></div>
                  <div className="space-y-2"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" name="telefone" type="tel" value={formData.telefone || ''} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vinculo">
            <Card className="shadow-lg"><CardHeader><CardTitle>Vínculo e Relação</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2"><Label htmlFor="tipoRelacao">Tipo de Relação <span className="text-destructive">*</span></Label>
                    <Select name="tipoRelacao" value={formData.tipoRelacao} onValueChange={(value) => handleSelectChange('tipoRelacao', value)} required><SelectTrigger id="tipoRelacao"><Link2 className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{tiposRelacao.map(tipo => (<SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>))}</SelectContent></Select>
                  </div>
                  {isOrganizacaoRequired && (<div className="space-y-2"><Label htmlFor="organizacaoVinculadaId">Organização <span className="text-destructive">*</span></Label>
                        <Select name="organizacaoVinculadaId" value={formData.organizacaoVinculadaId || ''} onValueChange={(value) => handleSelectChange('organizacaoVinculadaId', value)} required={isOrganizacaoRequired}><SelectTrigger id="organizacaoVinculadaId"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{organizacoesDisponiveis.map(org => (<SelectItem key={org.value} value={org.value}>{org.label}</SelectItem>))}</SelectContent></Select>
                    </div>)}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="endereco">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex items-center gap-2">
                    <Input id="cep" name="cep" value={formData.cep || ''} onChange={handleChange} onBlur={handleCepBlur} placeholder="00000-000" />
                    {isCepLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </div>
                   <p className="text-xs text-muted-foreground">Digite o CEP e os campos de endereço serão preenchidos automaticamente.</p>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="logradouro">Logradouro</Label><Input id="logradouro" name="logradouro" value={formData.logradouro || ''} onChange={handleChange}/></div>
                  <div className="space-y-2"><Label htmlFor="numero">Número</Label><Input id="numero" name="numero" value={formData.numero || ''} onChange={handleChange}/></div>
                </div>
                <div className="space-y-2"><Label htmlFor="complemento">Complemento</Label><Input id="complemento" name="complemento" value={formData.complemento || ''} onChange={handleChange}/></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" name="bairro" value={formData.bairro || ''} onChange={handleChange}/></div>
                  <div className="space-y-2"><Label htmlFor="cidade">Cidade</Label><Input id="cidade" name="cidade" value={formData.cidade || ''} onChange={handleChange}/></div>
                  <div className="space-y-2"><Label htmlFor="estado_uf">UF</Label><Input id="estado_uf" name="estado_uf" value={formData.estado_uf || ''} onChange={handleChange} maxLength={2} placeholder="Ex: SP"/></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cnh">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Dados da CNH</CardTitle></div>
                <Button type="button" variant="outline" onClick={handleOpenCnhModal}>
                  {currentDbCnh ? <><EditIcon className="mr-2 h-4 w-4"/>Editar CNH</> : <><PlusCircle className="mr-2 h-4 w-4"/>Cadastrar CNH</>}
                </Button>
              </CardHeader>
              <CardContent>
                {currentDbCnh ? (
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <p><strong>Nº Registro:</strong> {currentDbCnh.numero_registro}</p>
                        <p><strong>Categoria:</strong> {currentDbCnh.categoria}</p>
                        <p><strong>Emissão:</strong> {formatDateForDisplay(currentDbCnh.data_emissao)}</p>
                        <p><strong>Validade:</strong> {formatDateForDisplay(currentDbCnh.data_validade)}</p>
                    </div>
                ) : (<p className="text-muted-foreground">Nenhuma CNH cadastrada.</p>)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outrasInfo">
            <Card className="shadow-lg"><CardHeader><CardTitle>Outras Informações</CardTitle></CardHeader>
              <CardContent className="space-y-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" name="observacoes" value={formData.observacoes || ''} onChange={handleChange} rows={6}/></CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/clientes')} disabled={isLoading || isCepLoading}><XCircle className="mr-2 h-5 w-5" /> Cancelar</Button>
          <Button type="submit" disabled={isLoading || isCepLoading || pessoaFisicaFound === false}><Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}</Button>
        </CardFooter>
      </form>

      <Dialog open={isCnhModalOpen} onOpenChange={setIsCnhModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{cnhModalMode === 'create' ? 'Cadastrar CNH' : 'Editar CNH'}</DialogTitle>
            <DialogDescription>Preencha os dados da CNH.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCnhSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div><Label htmlFor="cnh_numero_registro_modal">Nº Registro <span className="text-destructive">*</span></Label><Input id="cnh_numero_registro_modal" name="numero_registro" value={cnhFormData.numero_registro} onChange={handleCnhFormChange} required /></div>
            <div><Label htmlFor="cnh_categoria_modal">Categoria <span className="text-destructive">*</span></Label><Input id="cnh_categoria_modal" name="categoria" value={cnhFormData.categoria} onChange={handleCnhFormChange} required placeholder="Ex: AB, B"/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="cnh_data_emissao_modal">Emissão <span className="text-destructive">*</span></Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.data_emissao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.data_emissao ? formatDateForDisplay(cnhFormData.data_emissao) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.data_emissao ? parseISO(cnhFormData.data_emissao) : undefined} onSelect={(d) => handleCnhDateChange('data_emissao', d)} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
              </div>
              <div><Label htmlFor="cnh_data_validade_modal">Validade <span className="text-destructive">*</span></Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.data_validade && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.data_validade ? formatDateForDisplay(cnhFormData.data_validade) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.data_validade ? parseISO(cnhFormData.data_validade) : undefined} onSelect={(d) => handleCnhDateChange('data_validade', d)} captionLayout="dropdown-buttons" fromYear={new Date().getFullYear()} toYear={new Date().getFullYear() + 15} initialFocus /></PopoverContent></Popover>
              </div>
            </div>
            <div><Label htmlFor="cnh_primeira_habilitacao_modal">1ª Habilitação</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhFormData.primeira_habilitacao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhFormData.primeira_habilitacao ? formatDateForDisplay(cnhFormData.primeira_habilitacao) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhFormData.primeira_habilitacao ? parseISO(cnhFormData.primeira_habilitacao) : undefined} onSelect={(d) => handleCnhDateChange('primeira_habilitacao', d)} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="cnh_local_emissao_cidade_modal">Cidade Emissão</Label><Input id="cnh_local_emissao_cidade_modal" name="local_emissao_cidade" value={cnhFormData.local_emissao_cidade || ''} onChange={handleCnhFormChange} /></div>
              <div><Label htmlFor="cnh_local_emissao_uf_modal">UF Emissão</Label><Input id="cnh_local_emissao_uf_modal" name="local_emissao_uf" value={cnhFormData.local_emissao_uf || ''} onChange={handleCnhFormChange} maxLength={2} placeholder="Ex: SP"/></div>
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

/* Supabase Integration Notes:
- PessoasFisicas table now has direct address columns. Update logic should reflect this.
- Remove separate Enderecos table interactions.
- For `handleSubmit`:
  - The payload for PessoasFisicas update will include logradouro, numero, etc.
  - Logic for MembrosEntidade (linking/unlinking to organizations) needs to be robust.
  - CNH data is updated separately if its modal saves directly to DB or staged and saved with main form.
    This example stages CNH updates to `currentDbCnh` and assumes a separate save mechanism or save along with PessoasFisicas.
- CEP API integration is placeholder.
- `tipo_relacao` and `observacoes` are assumed to be direct columns on PessoasFisicas.
*/

/*
-- Example PessoasFisicas table modification (conceptual):
ALTER TABLE public."PessoasFisicas"
  DROP COLUMN IF EXISTS id_endereco, -- If it was an FK
  ADD COLUMN IF NOT EXISTS logradouro VARCHAR(100),
  ADD COLUMN IF NOT EXISTS numero VARCHAR(20),
  ADD COLUMN IF NOT EXISTS complemento VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bairro VARCHAR(50),
  ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
  ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
  ADD COLUMN IF NOT EXISTS estado_uf VARCHAR(2),
  ADD COLUMN IF NOT EXISTS tipo_relacao VARCHAR(50), -- Make sure this exists
  ADD COLUMN IF NOT EXISTS observacoes TEXT; -- Make sure this exists
*/

