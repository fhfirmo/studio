
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

interface CNHData {
  id_cnh?: string;
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

interface OrganizacaoOption {
  value: string;
  label: string;
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

interface PessoaFisicaDataFromDB {
  id_pessoa_fisica: string;
  nome_completo: string;
  cpf: string;
  rg?: string | null;
  data_nascimento?: string | null; // YYYY-MM-DD
  email: string;
  telefone?: string | null;
  tipo_relacao?: string;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  estado_uf?: string | null;
  observacoes?: string | null; 
  data_cadastro?: string; // YYYY-MM-DD or full timestamp
  MembrosEntidade?: { id_entidade_pai: number }[] | null;
  CNHs?: CNHData | null;
}


async function getPessoaFisicaById(id: string): Promise<PessoaFisicaDataFromDB | null> {
   if (!supabase) {
    console.error("Supabase client not initialized for getPessoaFisicaById");
    return null;
  }
  console.log(`Fetching PessoaFisica data for ID: ${id} from Supabase`);
  
  const { data: pfData, error: pfError } = await supabase
    .from('PessoasFisicas')
    .select(`
      *,
      MembrosEntidade ( id_entidade_pai ),
      CNHs ( * )
    `)
    .eq('id_pessoa_fisica', parseInt(id, 10)) 
    .maybeSingle();

  if (pfError) { 
    console.error("Error fetching PessoaFisica from Supabase:", pfError); 
    return null; 
  }
  if (!pfData) return null;

  const cnh = Array.isArray(pfData.CNHs) ? (pfData.CNHs[0] || null) : pfData.CNHs;
  return { ...pfData, CNHs: cnh } as PessoaFisicaDataFromDB;
}


interface BrasilApiResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
}

async function fetchAddressFromCEP(cep: string): Promise<Partial<BrasilApiResponse> | null> {
  const cleanedCep = cep.replace(/\D/g, '');
   if (cleanedCep.length !== 8) return null;
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanedCep}`);
    if (!response.ok) {
      console.error(`BrasilAPI CEP error: ${response.status} ${response.statusText}`);
      return null;
    }
    const data: BrasilApiResponse = await response.json();
    return { street: data.street, neighborhood: data.neighborhood, city: data.city, state: data.state, cep: data.cep };
  } catch (error) {
    console.error("Error fetching address from CEP:", error);
    return null;
  }
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
  const [organizacoesOptions, setOrganizacoesOptions] = useState<OrganizacaoOption[]>([]);
  const [isLoadingOrganizacoes, setIsLoadingOrganizacoes] = useState(true);


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
    const fetchInitialData = async () => {
        if (pessoaFisicaId) {
            setIsLoading(true);
            
            // Fetch PessoasFisicas data
            try {
                const data = await getPessoaFisicaById(pessoaFisicaId);
                if (data) {
                    setFormData({
                    nomeCompleto: data.nome_completo || '', 
                    cpf: data.cpf || '', 
                    rg: data.rg || '',
                    dataNascimento: data.data_nascimento && isValid(parseISO(data.data_nascimento)) ? parseISO(data.data_nascimento) : undefined,
                    email: data.email || '', 
                    telefone: data.telefone || '', 
                    tipoRelacao: data.tipo_relacao || '',
                    organizacaoVinculadaId: data.MembrosEntidade && data.MembrosEntidade.length > 0 ? data.MembrosEntidade[0].id_entidade_pai.toString() : '',
                    logradouro: data.logradouro || '', 
                    numero: data.numero || '', 
                    complemento: data.complemento || '',
                    bairro: data.bairro || '', 
                    cep: data.cep || '', 
                    cidade: data.cidade || '', 
                    estado_uf: data.estado_uf || '',
                    observacoes: data.observacoes || '', 
                    });
                    if (data.data_cadastro) {
                    setDataCadastroDisplay(format(parseISO(data.data_cadastro), "dd/MM/yyyy HH:mm"));
                    }
                    setCurrentDbCnh(data.CNHs || null);
                    setPessoaFisicaFound(true);
                } else { 
                    setPessoaFisicaFound(false);
                    toast({ title: "Pessoa Física não encontrada", variant: "destructive"});
                }
            } catch (err: any) {
                console.error("Failed to fetch data:", err); 
                setPessoaFisicaFound(false); 
                toast({ title: "Erro ao carregar dados", description: err.message, variant: "destructive"});
            }

            // Fetch Organizações for select
            if (supabase) {
                setIsLoadingOrganizacoes(true);
                const { data: orgsData, error: orgsError } = await supabase
                    .from('Entidades')
                    .select('id_entidade, nome')
                    .order('nome', { ascending: true });

                if (orgsError) {
                    console.error("Erro ao buscar organizações:", orgsError);
                    toast({ title: "Erro ao Carregar Organizações", description: orgsError.message, variant: "destructive" });
                    setOrganizacoesOptions([]);
                } else if (orgsData) {
                    setOrganizacoesOptions(
                    orgsData.map(org => ({
                        value: org.id_entidade.toString(),
                        label: org.nome,
                    }))
                    );
                }
                setIsLoadingOrganizacoes(false);
            }
            setIsLoading(false);
        }
    };
    fetchInitialData();
  }, [pessoaFisicaId, toast]);
  
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
            logradouro: address.street || '',
            bairro: address.neighborhood || '',
            cidade: address.city || '',
            estado_uf: address.state || '',
          }));
          toast({ title: "Endereço Encontrado!", description: "Campos de endereço preenchidos." });
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
    if (!supabase) {
      toast({ title: "Erro de Configuração", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      return;
    }
    if (!cnhFormData.numero_registro || !cnhFormData.categoria || !cnhFormData.data_emissao || !cnhFormData.data_validade) {
      toast({ title: "CNH: Campos Obrigatórios", description: "Número, Categoria, Emissão e Validade são obrigatórios.", variant: "destructive" });
      return;
    }
    
    const cnhPayload = {
        id_pessoa_fisica: parseInt(pessoaFisicaId),
        numero_registro: cnhFormData.numero_registro,
        categoria: cnhFormData.categoria,
        data_emissao: cnhFormData.data_emissao ? format(parseISO(cnhFormData.data_emissao), "yyyy-MM-dd") : null,
        data_validade: cnhFormData.data_validade ? format(parseISO(cnhFormData.data_validade), "yyyy-MM-dd") : null,
        primeira_habilitacao: cnhFormData.primeira_habilitacao ? format(parseISO(cnhFormData.primeira_habilitacao), "yyyy-MM-dd") : null,
        local_emissao_cidade: cnhFormData.local_emissao_cidade || null,
        local_emissao_uf: cnhFormData.local_emissao_uf || null, // Corrected field name
        observacoes_cnh: cnhFormData.observacoes_cnh || null,
    };

    try {
      let savedCnhData: CNHData;
      if (cnhModalMode === 'create') {
        const { data, error } = await supabase.from('CNHs').insert(cnhPayload).select().single();
        if (error) throw error;
        savedCnhData = data as CNHData;
        toast({ title: "CNH Cadastrada!", description: "Dados da CNH salvos com sucesso." });
      } else if (cnhModalMode === 'edit' && currentDbCnh?.id_cnh) {
        const { id_pessoa_fisica, ...updatePayload } = cnhPayload; // id_pessoa_fisica should not be in the update payload for CNHs table itself
        const { data, error } = await supabase.from('CNHs').update(updatePayload).eq('id_cnh', currentDbCnh.id_cnh).select().single();
        if (error) throw error;
        savedCnhData = data as CNHData;
        toast({ title: "CNH Atualizada!", description: "Dados da CNH atualizados com sucesso." });
      } else {
        throw new Error("Modo de operação da CNH inválido ou ID da CNH ausente para edição.");
      }
      setCurrentDbCnh(savedCnhData);
      setIsCnhModalOpen(false);
    } catch (error: any) {
      console.error("Erro ao salvar CNH:", error);
      toast({ title: "Erro ao Salvar CNH", description: error.message, variant: "destructive" });
    }
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
      toast({ title: "Campo Obrigatório", description: "Organização Vinculada é obrigatória para este tipo de relação.", variant: "destructive" });
      setIsLoading(false); return;
    }
    
    try {
      const pessoaFisicaUpdatePayload = {
        nome_completo: formData.nomeCompleto,
        cpf: formData.cpf,
        rg: formData.rg || null,
        data_nascimento: formData.dataNascimento ? format(formData.dataNascimento, "yyyy-MM-dd") : null,
        email: formData.email, // Assuming email is identifier and not changed here, or handled separately
        telefone: formData.telefone || null,
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cep: formData.cep || null,
        cidade: formData.cidade || null,
        estado_uf: formData.estado_uf || null,
        tipo_relacao: formData.tipoRelacao,
        observacoes: formData.observacoes,
      };

      const { error: pfError } = await supabase
        .from('PessoasFisicas')
        .update(pessoaFisicaUpdatePayload)
        .eq('id_pessoa_fisica', parseInt(pessoaFisicaId));

      if (pfError) throw pfError;
      console.log("Pessoa Física atualizada com sucesso.");
      
      const numericPessoaFisicaId = parseInt(pessoaFisicaId);

      if (formData.tipoRelacao !== 'cliente_geral' && formData.organizacaoVinculadaId) {
        const numericOrganizacaoId = parseInt(formData.organizacaoVinculadaId);
        const { error: membroError } = await supabase
          .from('MembrosEntidade')
          .upsert({ 
            id_entidade_pai: numericOrganizacaoId,
            id_membro_pessoa_fisica: numericPessoaFisicaId,
            tipo_membro: 'Pessoa Fisica',
            funcao_no_membro: formData.tipoRelacao 
          }, { 
            onConflict: 'id_entidade_pai,id_membro_pessoa_fisica' // Ensure this matches your unique constraint
          });
         if (membroError) {
            console.warn("Aviso/Erro ao atualizar MembrosEntidade:", membroError.message);
            // Potentially throw membroError if it's critical
         } else {
            console.log("Vínculo MembrosEntidade atualizado/inserido com sucesso.");
         }
      } else {
        // If tipoRelacao is 'cliente_geral' or no organizacaoVinculadaId, attempt to remove any existing link.
        const { error: deleteMembroError } = await supabase
          .from('MembrosEntidade')
          .delete()
          .eq('id_membro_pessoa_fisica', numericPessoaFisicaId);
        if (deleteMembroError) {
            console.warn("Aviso/Erro ao tentar remover vínculo de MembrosEntidade:", deleteMembroError.message);
        } else {
            console.log("Vínculo MembrosEntidade verificado/removido com sucesso (se existia).");
        }
      }

      toast({ title: "Pessoa Física Atualizada!", description: "Os dados foram salvos com sucesso." });
      router.push('/admin/clientes'); 

    } catch (error: any) {
      console.error("Erro ao atualizar Pessoa Física:", error);
      toast({ title: "Erro ao Atualizar", description: `Falha ao salvar: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  function formatDateForDisplay(dateString: string | null | undefined): string {
    if (!dateString) return "N/A";
    try {
        const date = parseISO(dateString);
        return isValid(date) ? format(date, "dd/MM/yyyy") : "Data inválida";
    } catch (e) { return "Data inválida"; }
  }

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
             <TabsTrigger value="vinculo"><Link2 className="mr-2 h-4 w-4" />Vínculo e Relação</TabsTrigger>
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
                  <div className="space-y-2"><Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" required readOnly className="bg-muted/50 cursor-not-allowed" title="O e-mail é usado como identificador e não pode ser alterado."/></div>
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
                        <Select 
                          name="organizacaoVinculadaId" 
                          value={formData.organizacaoVinculadaId || ''} 
                          onValueChange={(value) => handleSelectChange('organizacaoVinculadaId', value)} 
                          required={isOrganizacaoRequired}
                          disabled={isLoadingOrganizacoes}
                        >
                          <SelectTrigger id="organizacaoVinculadaId">
                            <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder={isLoadingOrganizacoes ? "Carregando..." : "Selecione"} />
                          </SelectTrigger>
                          <SelectContent>
                            {organizacoesOptions.length > 0 ? (
                              organizacoesOptions.map(org => (<SelectItem key={org.value} value={org.value}>{org.label}</SelectItem>))
                            ): (
                              <SelectItem value="none" disabled>Nenhuma organização encontrada</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
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
                        {currentDbCnh.primeira_habilitacao && <p><strong>1ª Habilitação:</strong> {formatDateForDisplay(currentDbCnh.primeira_habilitacao)}</p>}
                        {(currentDbCnh.local_emissao_cidade || currentDbCnh.local_emissao_uf) && <p><strong>Local Emissão:</strong> {`${currentDbCnh.local_emissao_cidade || ''} ${currentDbCnh.local_emissao_uf || ''}`.trim()}</p>}
                         {currentDbCnh.observacoes_cnh && <p className="sm:col-span-2"><strong>Observações CNH:</strong> {currentDbCnh.observacoes_cnh}</p>}
                    </div>
                ) : (<p className="text-muted-foreground">Nenhuma CNH cadastrada. Clique em "Cadastrar CNH" para incluir os dados.</p>)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outrasInfo">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Outras Informações</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" name="observacoes" value={formData.observacoes || ''} onChange={handleChange} rows={6}/>
              </CardContent>
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
              <div><Label htmlFor="cnh_local_emissao_uf_modal">UF Emissão</Label>
                 <Select name="local_emissao_uf" value={cnhFormData.local_emissao_uf || ''} onValueChange={(value) => handleCnhSelectChange('local_emissao_uf', value)}>
                    <SelectTrigger id="cnh_local_emissao_uf_modal"><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>{brazilianStates.map(state => (<SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>))}</SelectContent>
                </Select>
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

    