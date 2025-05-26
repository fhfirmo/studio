
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
import { Building, Save, XCircle, MapPin, Info, Briefcase, Loader2, Search, Users, FileText, Contact, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';

interface TipoEntidadeOption {
  value: string;
  label: string;
}

interface QSAItemFromAPI {
  nome_socio: string;
  qualificacao_socio: string;
  data_entrada_sociedade?: string | null;
}

interface CNPJApiResponse {
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  data_inicio_atividade?: string;
  porte?: string;
  natureza_juridica?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  cnaes_secundarios?: { codigo: number; descricao: string }[];
  descricao_situacao_cadastral?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  ddd_telefone_1?: string;
  email?: string;
  qsa?: QSAItemFromAPI[];
}

interface BrasilApiCepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
}

const getValueOrDefault = (value: string | null | undefined, defaultValueIfNullOrEmpty: string = "sem informação"): string => {
    if (value === null || value === undefined || String(value).trim() === '') {
        return defaultValueIfNullOrEmpty;
    }
    return String(value).trim();
};


async function fetchOrganizacaoDataFromCNPJAPI(cleanedCnpj: string): Promise<CNPJApiResponse | null> {
  const apiUrl = `https://brasilapi.com.br/api/cnpj/v1/${cleanedCnpj}`;
  console.log("NovaOrganizacaoPage: Chamando API CNPJ para (cleaned):", cleanedCnpj);
  console.log("NovaOrganizacaoPage: URL da API CNPJ:", apiUrl);

  try {
    const response = await fetch(apiUrl);
    const rawTextResponse = await response.text();
    console.log(`NovaOrganizacaoPage: CNPJ API response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`NovaOrganizacaoPage: CNPJ API retornou erro. Status: ${response.status} Texto: ${response.statusText}. Corpo cru: ${rawTextResponse}`);
      return null;
    }
    
    console.log('NovaOrganizacaoPage: CNPJ API response data (raw text):', rawTextResponse);
    try {
      const data: CNPJApiResponse = JSON.parse(rawTextResponse);
      console.log('NovaOrganizacaoPage: CNPJ API response data (parsed JSON):', data);
      return data;
    } catch (jsonError: any) {
      console.error('NovaOrganizacaoPage: Erro ao processar JSON da API CNPJ:', jsonError.message, 'Raw text:', rawTextResponse);
      return null;
    }

  } catch (error: any) {
    console.error("NovaOrganizacaoPage: Erro ao buscar dados do CNPJ (fetch/network):", error.message, error);
    return null;
  }
}


async function fetchAddressFromCEP(cep: string): Promise<Partial<BrasilApiCepResponse> | null> {
  const cleanedCep = cep.replace(/\D/g, '');
  if (cleanedCep.length !== 8) return null;

  console.log(`NovaOrganizacaoPage: Chamando BrasilAPI para CEP:`, cleanedCep);
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanedCep}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`NovaOrganizacaoPage: BrasilAPI CEP error: ${response.status} ${response.statusText}. Body: ${errorText}`);
      return null;
    }
    const data: BrasilApiCepResponse = await response.json();
    return { street: data.street, neighborhood: data.neighborhood, city: data.city, state: data.state, cep: data.cep };
  } catch (error: any) {
    console.error(`NovaOrganizacaoPage: Erro ao buscar endereço do CEP:`, error.message);
    return null;
  }
}

const initialFormData = {
  cnpj: '',
  nome: '', 
  nome_fantasia: '',
  codigo_entidade: '',
  id_tipo_entidade: '',
  telefone: '',
  email: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado_uf: '',
  cep: '',
  endereco2_logradouro: '',
  endereco2_numero: '',
  endereco2_complemento: '',
  endereco2_bairro: '',
  endereco2_cidade: '',
  endereco2_estado_uf: '',
  endereco2_cep: '',
  nome_contato_responsavel: '',
  cargo_contato_responsavel: '',
  email_contato: '',
  telefone_contato: '',
  observacoes_contato: '',
  data_inicio_atividade: '',
  porte_empresa: '',
  natureza_juridica: '',
  cnae_principal: '',
  descricao_situacao_cadastral: '',
  observacoes: '',
};

export default function NovaOrganizacaoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCnpjLoading, setIsCnpjLoading] = useState(false);
  const [isCep1Loading, setIsCep1Loading] = useState(false);
  const [isCep2Loading, setIsCep2Loading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [tiposEntidadeOptions, setTiposEntidadeOptions] = useState<TipoEntidadeOption[]>([]);
  const [displayOnlyApiData, setDisplayOnlyApiData] = useState<{
    cnae_secundarios: { codigo: number; descricao: string }[],
    qsa: QSAItemFromAPI[]
  } | null>(null);

  useEffect(() => {
    const fetchTiposEntidade = async () => {
      if (!supabase) return;
      const { data, error } = await supabase.from('TiposEntidade').select('id_tipo_entidade, nome_tipo').order('nome_tipo');
      if (error) {
        console.error("Erro ao buscar tipos de entidade:", error);
        toast({ title: "Erro", description: "Não foi possível carregar os tipos de entidade.", variant: "destructive" });
      } else {
        setTiposEntidadeOptions(data.map(t => ({ value: t.id_tipo_entidade.toString(), label: t.nome_tipo })));
      }
    };
    fetchTiposEntidade();
  }, [toast]);

  const handleCnpjBlur = async (event: FocusEvent<HTMLInputElement>) => {
    const cnpjValue = event.target.value;
    const cleanedCnpjForAPI = cnpjValue.replace(/\D/g, '');
    console.log("NovaOrganizacaoPage: handleCnpjBlur triggered with CNPJ:", cnpjValue, "Cleaned:", cleanedCnpjForAPI);

    if (cleanedCnpjForAPI && cleanedCnpjForAPI.length === 14) {
      setIsCnpjLoading(true);
      const apiData = await fetchOrganizacaoDataFromCNPJAPI(cleanedCnpjForAPI);
      if (apiData) {
        setFormData(prev => ({
          ...prev,
          nome: apiData.razao_social || '',
          nome_fantasia: getValueOrDefault(apiData.nome_fantasia, prev.nome_fantasia),
          cnpj: apiData.cnpj || cleanedCnpjForAPI, // Use cleaned CNPJ from API if available
          data_inicio_atividade: getValueOrDefault(apiData.data_inicio_atividade, prev.data_inicio_atividade),
          porte_empresa: getValueOrDefault(apiData.porte, prev.porte_empresa),
          natureza_juridica: getValueOrDefault(apiData.natureza_juridica, prev.natureza_juridica),
          cnae_principal: getValueOrDefault(apiData.cnae_fiscal_descricao, prev.cnae_principal),
          descricao_situacao_cadastral: getValueOrDefault(apiData.descricao_situacao_cadastral, prev.descricao_situacao_cadastral),
          logradouro: apiData.logradouro || '',
          numero: apiData.numero || '',
          complemento: apiData.complemento || '',
          bairro: apiData.bairro || '',
          cidade: apiData.municipio || '',
          estado_uf: apiData.uf || '',
          cep: (apiData.cep || '').replace(/\D/g, ''),
          telefone: getValueOrDefault(apiData.ddd_telefone_1, prev.telefone),
          email: apiData.email?.toLowerCase() || '',
        }));
        setDisplayOnlyApiData({
          cnae_secundarios: apiData.cnaes_secundarios || [],
           qsa: (apiData.qsa || []).map(s => ({
            nome_socio: s.nome_socio,
            qualificacao_socio: s.qualificacao_socio,
            data_entrada_sociedade: s.data_entrada_sociedade || null
          })),
        });
        toast({ title: "Dados do CNPJ Encontrados!", description: "Campos preenchidos automaticamente pela BrasilAPI." });
      } else {
        toast({
          title: "CNPJ Não Encontrado ou Erro na API",
          description: "O CNPJ informado não foi encontrado na BrasilAPI ou ocorreu um erro. Verifique o número e tente novamente. Consulte o console para detalhes.",
          variant: "default",
          duration: 7000,
        });
      }
      setIsCnpjLoading(false);
    } else if (cnpjValue) {
        toast({ title: "CNPJ Inválido", description: "Por favor, insira um CNPJ com 14 dígitos.", variant: "default" });
    }
  };
  
  const handleCepBlur = async (event: FocusEvent<HTMLInputElement>, addressNumber: 1 | 2) => {
    const cepValue = event.target.value;
    const setIsLoadingCep = addressNumber === 1 ? setIsCep1Loading : setIsCep2Loading;
    const prefix = addressNumber === 1 ? '' : 'endereco2_';

    if (cepValue && cepValue.replace(/\D/g, '').length === 8) {
      setIsLoadingCep(true);
      try {
        const address = await fetchAddressFromCEP(cepValue); 
        if (address) {
          setFormData(prev => ({
            ...prev,
            [`${prefix}logradouro`]: address.street || prev[`${prefix}logradouro` as keyof typeof prev],
            [`${prefix}bairro`]: address.neighborhood || prev[`${prefix}bairro` as keyof typeof prev],
            [`${prefix}cidade`]: address.city || prev[`${prefix}cidade` as keyof typeof prev],
            [`${prefix}estado_uf`]: address.state || prev[`${prefix}estado_uf` as keyof typeof prev],
            [`${prefix}cep`]: (address.cep || cepValue).replace(/\D/g, ''),
          }));
          toast({ title: `Endereço ${addressNumber} Encontrado!`, description: "Campos de endereço preenchidos." });
        } else {
          toast({ title: `CEP ${addressNumber} Não Encontrado`, description: "Verifique ou preencha manualmente."});
        }
      } catch (error: any) {
        console.error(`Erro ao buscar CEP ${addressNumber}:`, error.message);
        toast({ title: `Erro ao Buscar CEP ${addressNumber}`, description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast({ title: "Erro de Configuração", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    // Client-side validation
    if (!formData.cnpj || !formData.nome || !formData.codigo_entidade || !formData.id_tipo_entidade) {
      toast({ title: "Campos Obrigatórios", description: "CNPJ, Nome da Organização (Razão Social), Código da Entidade e Tipo de Organização são obrigatórios.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    // Diagnostic: Call get_user_role from client-side
    try {
      console.log("NovaOrganizacaoPage: Verificando papel do usuário antes de submeter...");
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_role');
      if (rpcError) {
        console.error(`NovaOrganizacaoPage: Erro ao chamar RPC get_user_role:`, JSON.stringify(rpcError, null, 2));
        toast({ title: "Erro de Diagnóstico", description: `Falha ao verificar o papel do usuário via RPC: ${rpcError.message || 'Erro desconhecido'}. Verifique o console.`, variant: "destructive", duration: 7000 });
        setIsLoading(false);
        return;
      }
      console.log(`NovaOrganizacaoPage: Resultado da RPC get_user_role (client-side):`, rpcData);
      if (!['admin', 'supervisor', 'operator'].includes(rpcData)) {
         toast({ title: "Permissão Insuficiente (Diagnóstico)", description: `Seu papel atual detectado é '${rpcData}'. A política RLS requer 'admin', 'supervisor' ou 'operator' para esta operação. Verifique seu perfil e a função get_user_role.`, variant: "destructive", duration: 10000 });
         setIsLoading(false);
         return;
      }
      console.log("NovaOrganizacaoPage: Verificação de papel do usuário concluída. Prosseguindo com o cadastro...");
    } catch (diagError: any) {
      console.error("NovaOrganizacaoPage: Erro crítico durante o diagnóstico de RPC:", diagError.message);
      toast({ title: "Erro Crítico de Diagnóstico", description: "Falha ao verificar permissões.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    // End Diagnostic

    try {
      const entidadePayload = {
        nome: formData.nome,
        nome_fantasia: formData.nome_fantasia === "sem informação" ? null : formData.nome_fantasia.trim() || null,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        codigo_entidade: formData.codigo_entidade,
        id_tipo_entidade: parseInt(formData.id_tipo_entidade, 10),
        telefone: formData.telefone === "sem informação" ? null : formData.telefone.trim() || null,
        email: formData.email.trim() || null,
        data_inicio_atividade: formData.data_inicio_atividade === "sem informação" || !formData.data_inicio_atividade ? null : formData.data_inicio_atividade,
        porte_empresa: formData.porte_empresa === "sem informação" ? null : formData.porte_empresa.trim() || null,
        natureza_juridica: formData.natureza_juridica === "sem informação" ? null : formData.natureza_juridica.trim() || null,
        cnae_principal: formData.cnae_principal === "sem informação" ? null : (formData.cnae_principal.trim() || null),
        cnae_secundarios: displayOnlyApiData?.cnae_secundarios && displayOnlyApiData.cnae_secundarios.length > 0 ? displayOnlyApiData.cnae_secundarios : null,
        descricao_situacao_cadastral: formData.descricao_situacao_cadastral === "sem informação" ? null : formData.descricao_situacao_cadastral.trim() || null,
        logradouro: formData.logradouro.trim() || null,
        numero: formData.numero.trim() || null,
        complemento: formData.complemento.trim() || null,
        bairro: formData.bairro.trim() || null,
        cidade: formData.cidade.trim() || null,
        estado_uf: formData.estado_uf.trim() || null,
        cep: formData.cep.replace(/\D/g, '').substring(0, 8) || null,
        endereco2_logradouro: formData.endereco2_logradouro.trim() || null,
        endereco2_numero: formData.endereco2_numero.trim() || null,
        endereco2_complemento: formData.endereco2_complemento.trim() || null,
        endereco2_bairro: formData.endereco2_bairro.trim() || null,
        endereco2_cidade: formData.endereco2_cidade.trim() || null,
        endereco2_estado_uf: formData.endereco2_estado_uf.trim() || null,
        endereco2_cep: formData.endereco2_cep.replace(/\D/g, '').substring(0, 8) || null,
        nome_contato_responsavel: formData.nome_contato_responsavel.trim() || null,
        cargo_contato_responsavel: formData.cargo_contato_responsavel.trim() || null,
        email_contato: formData.email_contato.trim() || null,
        telefone_contato: formData.telefone_contato.trim() || null,
        observacoes_contato: formData.observacoes_contato.trim() || null,
        observacoes: formData.observacoes.trim() || null,
      };
      console.log("NovaOrganizacaoPage: Payload para Entidades:", entidadePayload);

      const { data: insertedEntidade, error: insertError } = await supabase
        .from('Entidades')
        .insert([entidadePayload])
        .select('id_entidade')
        .single();

      if (insertError) throw insertError;
      const newEntidadeId = insertedEntidade?.id_entidade;
      if (!newEntidadeId) throw new Error("Falha ao obter ID da nova entidade.");
      console.log("NovaOrganizacaoPage: Entidade inserida com ID:", newEntidadeId);

      if (displayOnlyApiData?.qsa && displayOnlyApiData.qsa.length > 0) {
        console.log("NovaOrganizacaoPage: Inserindo QSA para Entidade ID:", newEntidadeId);
        const qsaPayload = displayOnlyApiData.qsa.map(socio => ({
          id_entidade: newEntidadeId,
          nome_socio: socio.nome_socio,
          qualificacao_socio: socio.qualificacao_socio,
          data_entrada_sociedade: socio.data_entrada_sociedade || null,
        }));
        const { error: qsaError } = await supabase.from('QSA').insert(qsaPayload);
        if (qsaError) {
          console.warn("NovaOrganizacaoPage: Erro ao salvar QSA, mas entidade principal foi criada:", JSON.stringify(qsaError, null, 2));
          toast({ title: "Entidade Criada com Aviso", description: `A organização foi salva, mas houve um erro ao salvar os dados do QSA: ${qsaError.message}`, variant: "default" });
        } else {
          console.log("NovaOrganizacaoPage: QSA inserido com sucesso.");
        }
      }
      
      toast({ title: "Organização Cadastrada!", description: `${formData.nome || 'A nova organização'} foi adicionada.` });
      router.push('/admin/organizacoes');

    } catch (error: any) {
      console.error('NovaOrganizacaoPage: Erro ao cadastrar Organização:', JSON.stringify(error, null, 2), error);
      if (error.code === '22001') { // Specific error code for value too long
        toast({ title: "Erro ao Cadastrar", description: "Um dos campos de texto é muito longo para o banco de dados (Ex: CEP ou Código muito extenso). Verifique os dados e tente novamente.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao Cadastrar", description: error.message || "Ocorreu um erro. Verifique o console e as permissões RLS.", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <Building className="mr-3 h-8 w-8" /> Cadastro de Nova Organização
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/organizacoes"><XCircle className="mr-2 h-4 w-4" /> Voltar</Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">Informe o CNPJ para buscar dados ou preencha manualmente.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="informacoes" className="w-full">
           <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1 mb-6 text-xs flex-wrap">
            <TabsTrigger value="informacoes"><Info className="mr-1 h-3 w-3" />Informações</TabsTrigger>
            <TabsTrigger value="dadosFiscais"><FileText className="mr-1 h-3 w-3" />Dados Fiscais</TabsTrigger>
            <TabsTrigger value="enderecoPrincipal"><MapPin className="mr-1 h-3 w-3" />End. Principal</TabsTrigger>
            <TabsTrigger value="enderecoAdicional"><MapPin className="mr-1 h-3 w-3" />End. Adicional</TabsTrigger>
            <TabsTrigger value="contato"><Contact className="mr-1 h-3 w-3" />Contato</TabsTrigger>
            <TabsTrigger value="qsa"><Users className="mr-1 h-3 w-3" />QSA</TabsTrigger>
            <TabsTrigger value="observacoes"><UserCheck className="mr-1 h-3 w-3" />Obs.</TabsTrigger>
          </TabsList>

          <TabsContent value="informacoes">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Informações</CardTitle><CardDescription>Preencha ou ajuste os dados básicos da organização.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ <span className="text-destructive">*</span></Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="cnpj" 
                      name="cnpj" 
                      value={formData.cnpj} 
                      onChange={handleChange}
                      onBlur={handleCnpjBlur} 
                      placeholder="00.000.000/0000-00" 
                      required 
                      disabled={isLoading || isCnpjLoading} 
                    />
                    {isCnpjLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Digite o CNPJ e os campos serão preenchidos automaticamente se encontrado na BrasilAPI.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="nome">Nome da Organização (Razão Social) <span className="text-destructive">*</span></Label><Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required disabled={isLoading} /></div>
                  <div className="space-y-2"><Label htmlFor="nome_fantasia">Nome Fantasia</Label><Input id="nome_fantasia" name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} disabled={isLoading} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="codigo_entidade">Código da Entidade <span className="text-destructive">*</span></Label><Input id="codigo_entidade" name="codigo_entidade" value={formData.codigo_entidade} onChange={handleChange} required disabled={isLoading} /></div>
                  <div className="space-y-2"><Label htmlFor="id_tipo_entidade">Tipo <span className="text-destructive">*</span></Label>
                    <Select name="id_tipo_entidade" value={formData.id_tipo_entidade} onValueChange={(v) => handleSelectChange('id_tipo_entidade', v)} required disabled={isLoading}><SelectTrigger id="id_tipo_entidade"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{tiposEntidadeOptions.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent></Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2"><Label htmlFor="telefone">Telefone Principal</Label><Input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} disabled={isLoading} /></div>
                   <div className="space-y-2"><Label htmlFor="email">E-mail Principal</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@dominio.com" disabled={isLoading} /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dadosFiscais">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Dados Fiscais</CardTitle><CardDescription>Informações obtidas da API CNPJ ou cadastradas.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1"><Label htmlFor="data_inicio_atividade">Data Início Atividade</Label><Input id="data_inicio_atividade" value={formData.data_inicio_atividade} onChange={handleChange} name="data_inicio_atividade" type="date" disabled={isLoading} /></div>
                    <div className="space-y-1"><Label htmlFor="porte_empresa">Porte da Empresa</Label><Input id="porte_empresa" value={formData.porte_empresa} onChange={handleChange} name="porte_empresa" disabled={isLoading} /></div>
                    <div className="space-y-1"><Label htmlFor="natureza_juridica">Natureza Jurídica</Label><Input id="natureza_juridica" value={formData.natureza_juridica} onChange={handleChange} name="natureza_juridica" disabled={isLoading} /></div>
                    <div className="space-y-1 md:col-span-2 lg:col-span-3"><Label htmlFor="cnae_principal">CNAE Principal</Label><Input id="cnae_principal" value={formData.cnae_principal} onChange={handleChange} name="cnae_principal" disabled={isLoading} /></div>
                    <div className="space-y-1"><Label htmlFor="descricao_situacao_cadastral">Situação Cadastral</Label><Input id="descricao_situacao_cadastral" value={formData.descricao_situacao_cadastral} onChange={handleChange} name="descricao_situacao_cadastral" disabled={isLoading} /></div>
                </div>
                {displayOnlyApiData?.cnae_secundarios && displayOnlyApiData.cnae_secundarios.length > 0 && (
                    <div className="space-y-2">
                        <Label>CNAEs Secundários (informativo)</Label>
                        <div className="border rounded-md p-3 bg-muted/30 max-h-40 overflow-y-auto">
                            <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground">
                                {displayOnlyApiData.cnae_secundarios.map(cnae => <li key={cnae.codigo}>{cnae.codigo} - {cnae.descricao}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enderecoPrincipal">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Endereço Principal</CardTitle><CardDescription>Pode ser auto-preenchido pela API CNPJ. Ajuste se necessário ou use a busca por CEP.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex items-center gap-2">
                    <Input id="cep" name="cep" value={formData.cep} onChange={handleChange} onBlur={(e) => handleCepBlur(e, 1)} placeholder="00000-000" disabled={isLoading || isCep1Loading} />
                     {isCep1Loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="logradouro">Logradouro</Label><Input id="logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} disabled={isLoading} /></div>
                  <div className="space-y-2"><Label htmlFor="numero">Número</Label><Input id="numero" name="numero" value={formData.numero} onChange={handleChange} disabled={isLoading} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="complemento">Complemento</Label><Input id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} disabled={isLoading} /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
                  <div className="space-y-2"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} disabled={isLoading}/></div>
                  <div className="space-y-2"><Label htmlFor="cidade">Cidade</Label><Input id="cidade" name="cidade" value={formData.cidade} onChange={handleChange} disabled={isLoading}/></div>
                  <div className="space-y-2"><Label htmlFor="estado_uf">UF</Label><Input id="estado_uf" name="estado_uf" value={formData.estado_uf} onChange={handleChange} maxLength={2} placeholder="Ex: SP" disabled={isLoading}/></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enderecoAdicional">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Endereço Adicional/Correspondência (Opcional)</CardTitle><CardDescription>Use a busca por CEP para preenchimento automático.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                  <Label htmlFor="endereco2_cep">CEP (Endereço Adicional)</Label>
                  <div className="flex items-center gap-2">
                    <Input id="endereco2_cep" name="endereco2_cep" value={formData.endereco2_cep} onChange={handleChange} onBlur={(e) => handleCepBlur(e, 2)} placeholder="00000-000" disabled={isLoading || isCep2Loading} />
                     {isCep2Loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="endereco2_logradouro">Logradouro (Endereço Adicional)</Label><Input id="endereco2_logradouro" name="endereco2_logradouro" value={formData.endereco2_logradouro} onChange={handleChange} disabled={isLoading} /></div>
                  <div className="space-y-2"><Label htmlFor="endereco2_numero">Número (Endereço Adicional)</Label><Input id="endereco2_numero" name="endereco2_numero" value={formData.endereco2_numero} onChange={handleChange} disabled={isLoading} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="endereco2_complemento">Complemento (Endereço Adicional)</Label><Input id="endereco2_complemento" name="endereco2_complemento" value={formData.endereco2_complemento} onChange={handleChange} disabled={isLoading} /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
                  <div className="space-y-2"><Label htmlFor="endereco2_bairro">Bairro (Endereço Adicional)</Label><Input id="endereco2_bairro" name="endereco2_bairro" value={formData.endereco2_bairro} onChange={handleChange} disabled={isLoading}/></div>
                  <div className="space-y-2"><Label htmlFor="endereco2_cidade">Cidade (Endereço Adicional)</Label><Input id="endereco2_cidade" name="endereco2_cidade" value={formData.endereco2_cidade} onChange={handleChange} disabled={isLoading}/></div>
                  <div className="space-y-2"><Label htmlFor="endereco2_estado_uf">UF (Endereço Adicional)</Label><Input id="endereco2_estado_uf" name="endereco2_estado_uf" value={formData.endereco2_estado_uf} onChange={handleChange} maxLength={2} placeholder="Ex: SP" disabled={isLoading}/></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contato">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Informações de Contato (Manual)</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="nome_contato_responsavel">Nome do Contato</Label><Input id="nome_contato_responsavel" name="nome_contato_responsavel" value={formData.nome_contato_responsavel} onChange={handleChange} disabled={isLoading} /></div>
                    <div className="space-y-2"><Label htmlFor="cargo_contato_responsavel">Cargo do Contato</Label><Input id="cargo_contato_responsavel" name="cargo_contato_responsavel" value={formData.cargo_contato_responsavel} onChange={handleChange} disabled={isLoading} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="email_contato">E-mail de Contato</Label><Input id="email_contato" name="email_contato" type="email" value={formData.email_contato} onChange={handleChange} placeholder="contato@empresa.com" disabled={isLoading} /></div>
                    <div className="space-y-2"><Label htmlFor="telefone_contato">Telefone de Contato</Label><Input id="telefone_contato" name="telefone_contato" type="tel" value={formData.telefone_contato} onChange={handleChange} disabled={isLoading} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="observacoes_contato">Observações sobre Contato</Label><Textarea id="observacoes_contato" name="observacoes_contato" value={formData.observacoes_contato} onChange={handleChange} rows={3} disabled={isLoading} /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qsa">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Quadro de Sócios e Administradores (QSA)</CardTitle><CardDescription>Estes dados são obtidos pela API do CNPJ e são apenas para visualização aqui. Serão salvos na tabela QSA ao cadastrar a organização.</CardDescription></CardHeader>
              <CardContent>
                {isCnpjLoading && <p className="text-muted-foreground">Buscando dados do QSA...</p>}
                {!isCnpjLoading && displayOnlyApiData?.qsa && displayOnlyApiData.qsa.length > 0 ? (
                  <div className="overflow-x-auto max-h-80 border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50"><tr className="border-b"><th className="p-2 text-left font-medium">Nome Sócio/Administrador</th><th className="p-2 text-left font-medium">Qualificação</th><th className="p-2 text-left font-medium hidden sm:table-cell">Data Entrada</th></tr></thead>
                      <tbody>
                        {displayOnlyApiData.qsa.map((socio, index) => (
                          <tr key={index} className="border-b last:border-b-0 hover:bg-muted/20">
                            <td className="p-2">{socio.nome_socio}</td>
                            <td className="p-2">{socio.qualificacao_socio}</td>
                            <td className="p-2 hidden sm:table-cell">{socio.data_entrada_sociedade ? format(parseISO(socio.data_entrada_sociedade), 'dd/MM/yyyy') : <span className="italic text-muted-foreground">sem informação</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  !isCnpjLoading && <p className="text-muted-foreground">Nenhum QSA encontrado ou CNPJ não consultado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="observacoes">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Observações Gerais (Manual)</CardTitle></CardHeader>
              <CardContent><Textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} rows={4} disabled={isLoading} /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/organizacoes')} disabled={isLoading}><XCircle className="mr-2 h-5 w-5" />Cancelar</Button>
          <Button type="submit" disabled={isLoading || isCnpjLoading || isCep1Loading || isCep2Loading}><Save className="mr-2 h-5 w-5" />{isLoading ? 'Salvando...' : 'Salvar Organização'}</Button>
        </CardFooter>
      </form>
    </div>
  );
}
    
/*
Supabase Integration Notes:
- Tabela "Entidades" agora tem colunas diretas de endereço (logradouro, numero, etc.) e endereco2_...
- Novos campos: data_inicio_atividade, porte_empresa, natureza_juridica, cnae_principal, cnae_secundarios (JSONB), descricao_situacao_cadastral.
- Novos campos de contato: nome_contato_responsavel, cargo_contato_responsavel, email_contato, telefone_contato, observacoes_contato.
- Tabela "QSA" será populada com dados da API CNPJ, vinculada a "id_entidade".
- Frontend:
  - Ao digitar CNPJ, chamar API CNPJ (BrasilAPI).
  - Preencher campos do formulário com dados da API (nome, endereço principal, dados econômicos).
  - QSA da API é exibido. Ao salvar, precisa inserir em public."QSA" (idealmente em transação via Edge Function ou após o insert da Entidade).
  - Endereço 1 e 2 usam API de CEP (BrasilAPI).
  - Campos de contato são manuais.
  - Ao submeter, o payload para public."Entidades" incluirá todos os novos campos.
  - Validações de frontend para formatos de CEP, UF, email, telefone.
*/


    