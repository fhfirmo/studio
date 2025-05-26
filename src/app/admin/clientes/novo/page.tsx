
"use client";

import { useState, type FormEvent, useEffect, type ChangeEvent, type FocusEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { UserPlus, Save, XCircle, InfoIcon, Users, Briefcase, Link2, CalendarDays, ClipboardList, Edit3 as EditIcon, PlusCircle, MapPin, Loader2 } from 'lucide-react';
import { format, parseISO, isValid } from "date-fns";
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

// Interface for CNH Data collected in the modal (without id_cnh, as it's for creation within PF form)
interface CNHDataForForm {
  numero_registro: string;
  categoria: string;
  data_emissao: string; // YYYY-MM-DD
  data_validade: string; // YYYY-MM-DD
  primeira_habilitacao: string | null; // YYYY-MM-DD
  local_emissao_cidade: string | null;
  local_emissao_uf: string | null;
  observacoes_cnh: string | null;
}

const initialCnhModalFormData: CNHDataForForm = {
  numero_registro: '', categoria: '', data_emissao: '', data_validade: '',
  primeira_habilitacao: null, local_emissao_cidade: null, local_emissao_uf: null, observacoes_cnh: null,
};

const tiposRelacao = [
  { value: "associado", label: "Associado" },
  { value: "cooperado", label: "Cooperado" },
  { value: "funcionario", label: "Funcionário" },
  { value: "cliente_geral", label: "Cliente Geral" },
];

const organizacoesDisponiveis = [ // Placeholder - Fetch from Supabase
  { value: "1", label: "Cooperativa Alfa (Exemplo ID 1)" },
  { value: "2", label: "Associação Beta (Exemplo ID 2)" },
  { value: "3", label: "Empresa Gama (Exemplo ID 3)" },
];

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
  if (cleanedCep.length !== 8) {
    // This check is usually done before calling, but good to have defensively
    return null;
  }
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanedCep}`);
    if (!response.ok) {
      console.error(`BrasilAPI CEP error: ${response.status} ${response.statusText}`);
      return null;
    }
    const data: BrasilApiResponse = await response.json();
    return {
      street: data.street,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      cep: data.cep, // API returns formatted CEP
    };
  } catch (error) {
    console.error("Error fetching address from CEP:", error);
    return null;
  }
}

export default function NovaPessoaFisicaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    cpf: '',
    rg: '',
    dataNascimento: undefined as Date | undefined,
    email: '',
    telefone: '',
    tipoRelacao: '',
    organizacaoVinculadaId: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade: '',
    estado_uf: '',
    observacoes: '',
    cnh: null as CNHDataForForm | null, // Staged CNH data
  });

  const [isCnhModalOpen, setIsCnhModalOpen] = useState(false);
  const [cnhModalMode, setCnhModalMode] = useState<'create' | 'edit'>('create');
  const [cnhModalFormData, setCnhModalFormData] = useState<CNHDataForForm>(initialCnhModalFormData);

  const isOrganizacaoRequired = formData.tipoRelacao !== '' && formData.tipoRelacao !== 'cliente_geral';

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
            // Optionally update CEP if API returns a formatted one, or keep user's input
            // cep: address.cep || cepValue, 
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
    if (formData.cnh) { // If CNH data is already staged
      setCnhModalMode('edit');
      setCnhModalFormData({ ...formData.cnh });
    } else {
      setCnhModalMode('create');
      setCnhModalFormData(initialCnhModalFormData);
    }
    setIsCnhModalOpen(true);
  };

  const handleCnhFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCnhModalFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCnhDateChange = (name: keyof CNHDataForForm, date: Date | undefined) => {
    setCnhModalFormData(prev => ({ ...prev, [name]: date ? format(date, "yyyy-MM-dd") : '' }));
  };

  const handleCnhSelectChange = (name: keyof CNHDataForForm, value: string) => {
     setCnhModalFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCnhSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!cnhModalFormData.numero_registro || !cnhModalFormData.categoria || !cnhModalFormData.data_emissao || !cnhModalFormData.data_validade) {
      toast({ title: "CNH: Campos Obrigatórios", description: "Número, Categoria, Emissão e Validade são obrigatórios.", variant: "destructive" });
      return;
    }
    // Stage the CNH data into the main form's state
    setFormData(prev => ({ ...prev, cnh: { ...cnhModalFormData } }));
    setIsCnhModalOpen(false);
    toast({ title: "Dados da CNH Adicionados!", description: "As informações da CNH foram preparadas e serão salvas com o formulário principal." });
  };
  
  function formatDateForDisplay(dateString: string | null | undefined): string {
    if (!dateString) return "N/A";
    try {
        const date = parseISO(dateString);
        return isValid(date) ? format(date, "dd/MM/yyyy") : "Data inválida";
    } catch (e) { return "Data inválida"; }
  }

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
      // Payload for PessoasFisicas (includes direct address fields)
      const pessoaFisicaPayload = {
        nome_completo: formData.nomeCompleto,
        cpf: formData.cpf,
        rg: formData.rg || null,
        data_nascimento: formData.dataNascimento ? format(formData.dataNascimento, "yyyy-MM-dd") : null,
        email: formData.email,
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
        // id_endereco is no longer used.
      };

      console.log("Cadastrando Pessoa Física com payload:", pessoaFisicaPayload);
      const { data: pessoaFisicaData, error: pessoaFisicaError } = await supabase
        .from('PessoasFisicas')
        .insert(pessoaFisicaPayload)
        .select('id_pessoa_fisica')
        .single();

      if (pessoaFisicaError) throw pessoaFisicaError;
      const newPessoaFisicaId = pessoaFisicaData?.id_pessoa_fisica;

      if (!newPessoaFisicaId) {
        throw new Error("Falha ao obter ID da nova pessoa física.");
      }
      console.log("Pessoa Física cadastrada com ID:", newPessoaFisicaId);

      // If CNH data was staged, insert it into public.CNHs
      if (formData.cnh) {
        console.log("Cadastrando CNH para Pessoa Física ID:", newPessoaFisicaId, "Payload CNH:", formData.cnh);
        const cnhPayload = {
          id_pessoa_fisica: newPessoaFisicaId,
          numero_registro: formData.cnh.numero_registro,
          categoria: formData.cnh.categoria,
          data_emissao: formData.cnh.data_emissao ? format(parseISO(formData.cnh.data_emissao), "yyyy-MM-dd") : null,
          data_validade: formData.cnh.data_validade ? format(parseISO(formData.cnh.data_validade), "yyyy-MM-dd") : null,
          primeira_habilitacao: formData.cnh.primeira_habilitacao ? format(parseISO(formData.cnh.primeira_habilitacao), "yyyy-MM-dd") : null,
          local_emissao_cidade: formData.cnh.local_emissao_cidade || null,
          local_emissao_estado_uf: formData.cnh.local_emissao_uf || null, // Corrected field name
          observacoes_cnh: formData.cnh.observacoes_cnh || null,
        };
        const { error: cnhError } = await supabase.from('CNHs').insert(cnhPayload);
        if (cnhError) throw cnhError;
        console.log("CNH cadastrada com sucesso.");
      }

      // If linked to an organization, insert into public.MembrosEntidade
      if (isOrganizacaoRequired && formData.organizacaoVinculadaId) {
        console.log("Cadastrando vínculo em MembrosEntidade. PessoaFisicaID:", newPessoaFisicaId, "OrganizacaoID:", formData.organizacaoVinculadaId);
        const membroEntidadePayload = {
          id_entidade_pai: parseInt(formData.organizacaoVinculadaId, 10),
          id_membro_pessoa_fisica: newPessoaFisicaId,
          tipo_membro: 'Pessoa Fisica', // Matches your CHECK constraint
          funcao_no_membro: formData.tipoRelacao, // Using tipoRelacao as funcao_no_membro
          // data_associacao defaults to CURRENT_DATE in DB
        };
        const { error: membroError } = await supabase.from('MembrosEntidade').insert(membroEntidadePayload);
        if (membroError) throw membroError;
        console.log("Vínculo MembrosEntidade cadastrado com sucesso.");
      }
      
      toast({ title: "Pessoa Física Cadastrada!", description: `${formData.nomeCompleto} foi adicionado com sucesso.` });
      router.push('/admin/clientes');

    } catch (error: any) {
      console.error('Erro ao cadastrar Pessoa Física:', error);
      toast({ title: "Erro ao Cadastrar", description: `Falha ao cadastrar: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <UserPlus className="mr-3 h-8 w-8" /> Cadastro de Nova Pessoa Física
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/clientes"><XCircle className="mr-2 h-4 w-4" /> Voltar para Lista</Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">Preencha os dados abaixo.</p>
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
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="nomeCompleto">Nome Completo <span className="text-destructive">*</span></Label><Input id="nomeCompleto" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleChange} required /></div>
                  <div className="space-y-2"><Label htmlFor="cpf">CPF <span className="text-destructive">*</span></Label><Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" required /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="rg">RG</Label><Input id="rg" name="rg" value={formData.rg} onChange={handleChange} placeholder="00.000.000-0" /></div>
                  <div className="space-y-2"><Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!formData.dataNascimento && "text-muted-foreground"}`}><CalendarDays className="mr-2 h-4 w-4" />{formData.dataNascimento ? format(formData.dataNascimento, "dd/MM/yyyy") : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={formData.dataNascimento} onSelect={(d) => handleDateChange('dataNascimento', d)} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" required /></div>
                  <div className="space-y-2"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vinculo">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Vínculo e Relação</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2"><Label htmlFor="tipoRelacao">Tipo de Relação <span className="text-destructive">*</span></Label>
                    <Select name="tipoRelacao" value={formData.tipoRelacao} onValueChange={(value) => handleSelectChange('tipoRelacao', value)} required><SelectTrigger id="tipoRelacao"><Link2 className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{tiposRelacao.map(tipo => (<SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>))}</SelectContent></Select>
                  </div>
                  {isOrganizacaoRequired && (
                    <div className="space-y-2"><Label htmlFor="organizacaoVinculadaId">Organização Vinculada <span className="text-destructive">*</span></Label>
                        {/* Supabase: Options for this select should be loaded from public.Entidades */}
                        <Select name="organizacaoVinculadaId" value={formData.organizacaoVinculadaId} onValueChange={(value) => handleSelectChange('organizacaoVinculadaId', value)} required={isOrganizacaoRequired}><SelectTrigger id="organizacaoVinculadaId"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{organizacoesDisponiveis.map(org => (<SelectItem key={org.value} value={org.value}>{org.label}</SelectItem>))}</SelectContent></Select>
                    </div>
                  )}
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
                    <Input id="cep" name="cep" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} placeholder="00000-000" />
                    {isCepLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Digite o CEP e os campos de endereço serão preenchidos automaticamente.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="logradouro">Logradouro</Label><Input id="logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label htmlFor="numero">Número</Label><Input id="numero" name="numero" value={formData.numero} onChange={handleChange}/></div>
                </div>
                <div className="space-y-2"><Label htmlFor="complemento">Complemento</Label><Input id="complemento" name="complemento" value={formData.complemento} onChange={handleChange}/></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" name="bairro" value={formData.bairro} onChange={handleChange}/></div>
                  <div className="space-y-2"><Label htmlFor="cidade">Cidade</Label><Input id="cidade" name="cidade" value={formData.cidade} onChange={handleChange}/></div>
                  <div className="space-y-2"><Label htmlFor="estado_uf">UF</Label><Input id="estado_uf" name="estado_uf" value={formData.estado_uf} onChange={handleChange} maxLength={2} placeholder="Ex: SP"/></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cnh">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Dados da CNH (Opcional)</CardTitle></div>
                <Button type="button" variant="outline" onClick={handleOpenCnhModal}>
                  {formData.cnh ? <><EditIcon className="mr-2 h-4 w-4"/>Editar CNH Informada</> : <><PlusCircle className="mr-2 h-4 w-4"/>Adicionar CNH</>}
                </Button>
              </CardHeader>
              <CardContent>
                {formData.cnh ? (
                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <p><strong>Nº Registro:</strong> {formData.cnh.numero_registro}</p>
                        <p><strong>Categoria:</strong> {formData.cnh.categoria}</p>
                        <p><strong>Emissão:</strong> {formatDateForDisplay(formData.cnh.data_emissao)}</p>
                        <p><strong>Validade:</strong> {formatDateForDisplay(formData.cnh.data_validade)}</p>
                    </div>
                ) : (<p className="text-muted-foreground">Nenhuma CNH informada. Clique em "Adicionar CNH" para incluir os dados.</p>)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outrasInfo">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Outras Informações</CardTitle></CardHeader>
              <CardContent className="space-y-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} rows={6}/></CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/clientes')} disabled={isLoading}><XCircle className="mr-2 h-5 w-5" />Cancelar</Button>
          <Button type="submit" disabled={isLoading || isCepLoading}><Save className="mr-2 h-5 w-5" />{isLoading ? 'Cadastrando...' : 'Cadastrar Pessoa Física'}</Button>
        </CardFooter>
      </form>

      {/* CNH Modal */}
      <Dialog open={isCnhModalOpen} onOpenChange={setIsCnhModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{cnhModalMode === 'create' ? 'Adicionar CNH' : 'Editar CNH'}</DialogTitle>
            <DialogDescription>Preencha os dados da CNH.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCnhSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div><Label htmlFor="cnh_numero_registro_modal">Nº Registro <span className="text-destructive">*</span></Label><Input id="cnh_numero_registro_modal" name="numero_registro" value={cnhModalFormData.numero_registro} onChange={handleCnhFormChange} required /></div>
            <div><Label htmlFor="cnh_categoria_modal">Categoria <span className="text-destructive">*</span></Label><Input id="cnh_categoria_modal" name="categoria" value={cnhModalFormData.categoria} onChange={handleCnhFormChange} required placeholder="Ex: AB, B"/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="cnh_data_emissao_modal">Emissão <span className="text-destructive">*</span></Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhModalFormData.data_emissao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhModalFormData.data_emissao ? formatDateForDisplay(cnhModalFormData.data_emissao) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhModalFormData.data_emissao ? parseISO(cnhModalFormData.data_emissao) : undefined} onSelect={(d) => handleCnhDateChange('data_emissao', d)} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
              </div>
              <div><Label htmlFor="cnh_data_validade_modal">Validade <span className="text-destructive">*</span></Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhModalFormData.data_validade && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhModalFormData.data_validade ? formatDateForDisplay(cnhModalFormData.data_validade) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhModalFormData.data_validade ? parseISO(cnhModalFormData.data_validade) : undefined} onSelect={(d) => handleCnhDateChange('data_validade', d)} captionLayout="dropdown-buttons" fromYear={new Date().getFullYear()} toYear={new Date().getFullYear() + 15} initialFocus /></PopoverContent></Popover>
              </div>
            </div>
            <div><Label htmlFor="cnh_primeira_habilitacao_modal">1ª Habilitação</Label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !cnhModalFormData.primeira_habilitacao && "text-muted-foreground")}><CalendarDays className="mr-2 h-4 w-4" />{cnhModalFormData.primeira_habilitacao ? formatDateForDisplay(cnhModalFormData.primeira_habilitacao) : <span>Selecione</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={cnhModalFormData.primeira_habilitacao ? parseISO(cnhModalFormData.primeira_habilitacao) : undefined} onSelect={(d) => handleCnhDateChange('primeira_habilitacao', d)} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} initialFocus /></PopoverContent></Popover>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="cnh_local_emissao_cidade_modal">Cidade Emissão</Label><Input id="cnh_local_emissao_cidade_modal" name="local_emissao_cidade" value={cnhModalFormData.local_emissao_cidade || ''} onChange={handleCnhFormChange} /></div>
              <div><Label htmlFor="cnh_local_emissao_uf_modal">UF Emissão</Label>
                <Select name="local_emissao_uf" value={cnhModalFormData.local_emissao_uf || ''} onValueChange={(value) => handleCnhSelectChange('local_emissao_uf', value)}>
                  <SelectTrigger id="cnh_local_emissao_uf_modal"><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{brazilianStates.map(state => (<SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label htmlFor="cnh_observacoes_cnh_modal">Observações CNH</Label><Textarea id="cnh_observacoes_cnh_modal" name="observacoes_cnh" value={cnhModalFormData.observacoes_cnh || ''} onChange={handleCnhFormChange} rows={3} /></div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">{cnhModalMode === 'create' ? 'Adicionar CNH ao Formulário' : 'Atualizar CNH no Formulário'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Supabase Integration Notes:
- When submitting the main form (handleSubmit):
  1. Insert into PessoasFisicas.
  2. Get the new id_pessoa_fisica.
  3. If formData.cnh exists, insert into CNHs using the new id_pessoa_fisica.
  4. If isOrganizacaoRequired and formData.organizacaoVinculadaId exists, insert into MembrosEntidade.
  - This sequence should ideally be a transaction (e.g., using a Supabase Edge Function).
- Dynamic selects (Organizações Vinculadas) need to fetch data from Supabase.
- RLS policies on all tables must permit these inserts for the logged-in user role.
- Ensure `local_emissao_estado_uf` in CNH payload matches DB column name.
*/
    

    