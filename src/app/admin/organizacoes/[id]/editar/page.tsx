
"use client";

import { useState, type FormEvent, useEffect, type ChangeEvent, type FocusEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Save, XCircle, MapPin, Info, Briefcase, AlertTriangle, Loader2, Search, Users, DollarSign, FileText, Contact, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from 'date-fns';

interface TipoEntidadeOption {
  value: string;
  label: string;
}

interface QSAItemFromAPI { 
  nome_socio: string;
  qualificacao_socio: string;
  data_entrada_sociedade?: string | null;
}

interface QSAItemFromDB { 
    id_qsa?: number;
    id_entidade: number;
    nome_socio: string;
    qualificacao_socio: string;
    data_entrada_sociedade?: string | null; 
    observacoes?: string | null;
}

interface CNPJApiResponse { 
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  data_inicio_atividade?: string;
  porte?: string;
  natureza_juridica?: string;
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

interface OrganizacaoDataFromDB { 
  id_entidade: number;
  nome: string; 
  nome_fantasia: string | null;
  codigo_entidade: string | null;
  cnpj: string;
  id_tipo_entidade: number;
  telefone: string | null;
  email: string | null;
  data_cadastro: string; 
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cep: string | null;
  cidade: string | null;
  estado_uf: string | null;
  endereco2_logradouro?: string | null;
  endereco2_numero?: string | null;
  endereco2_complemento?: string | null;
  endereco2_bairro?: string | null;
  endereco2_cidade?: string | null;
  endereco2_estado_uf?: string | null;
  endereco2_cep?: string | null;
  nome_contato_responsavel?: string | null;
  cargo_contato_responsavel?: string | null;
  email_contato?: string | null;
  telefone_contato?: string | null;
  observacoes_contato?: string | null;
  data_inicio_atividade?: string | null; 
  porte_empresa?: string | null;
  natureza_juridica?: string | null;
  cnae_principal?: string | null;
  cnae_secundarios?: { codigo: number, descricao: string }[] | null; 
  descricao_situacao_cadastral?: string | null;
  observacoes: string | null;
  QSA?: QSAItemFromDB[];
}

interface BrasilApiResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
}

const getValueOrDefault = (value: string | null | undefined, defaultValue: string = "sem informação"): string => {
    if (value === null || value === undefined || String(value).trim() === '') {
        return defaultValue;
    }
    return String(value).trim();
};

async function getOrganizacaoById(orgId: string): Promise<OrganizacaoDataFromDB | null> {
    if (!supabase) {
        console.error("EditarOrganizacaoPage: Supabase client not initialized.");
        return null;
    }
    const numericOrgId = parseInt(orgId, 10);
    if (isNaN(numericOrgId)) {
        console.error("EditarOrganizacaoPage: Invalid organization ID provided:", orgId);
        return null;
    }
    
    const { data: orgData, error: orgError } = await supabase
        .from('Entidades')
        .select(`*, QSA ( * ) `) 
        .eq('id_entidade', numericOrgId)
        .single<OrganizacaoDataFromDB>(); // Explicitly type the expected return

    if (orgError) {
        console.error("EditarOrganizacaoPage: Error fetching organization from Supabase:", JSON.stringify(orgError, null, 2));
        return null;
    }
    if (!orgData) {
        console.warn("EditarOrganizacaoPage: No organization data found for ID:", numericOrgId);
        return null;
    }
    return orgData;
}

async function fetchOrganizacaoDataFromCNPJAPI(cleanedCnpj: string): Promise<CNPJApiResponse | null> {
  const apiUrl = `https://brasilapi.com.br/api/cnpj/v1/${cleanedCnpj}`;
  console.log("EditarOrganizacaoPage: Chamando API CNPJ para (cleaned):", cleanedCnpj);
  console.log("EditarOrganizacaoPage: URL da API CNPJ:", apiUrl);
  try {
    const response = await fetch(apiUrl);
    const rawTextResponse = await response.text();
    console.log(`EditarOrganizacaoPage: CNPJ API response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`EditarOrganizacaoPage: CNPJ API retornou erro. Status: ${response.status} Texto: ${response.statusText}. Corpo: ${rawTextResponse}`);
      return null;
    }
     console.log('EditarOrganizacaoPage: CNPJ API response data (raw text):', rawTextResponse);
    try {
        const data: CNPJApiResponse = JSON.parse(rawTextResponse);
        console.log('EditarOrganizacaoPage: CNPJ API response data (parsed JSON):', data);
        return data;
    } catch (jsonError: any) {
        console.error('EditarOrganizacaoPage: Erro ao processar JSON da API CNPJ:', jsonError.message, 'Raw text:', rawTextResponse);
        return null;
    }
  } catch (error: any) {
    console.error("EditarOrganizacaoPage: Erro ao buscar dados do CNPJ (fetch/network):", error.message, error);
    return null;
  }
}

async function fetchAddressFromCEP(cep: string): Promise<Partial<BrasilApiResponse> | null> {
  const cleanedCep = cep.replace(/\D/g, '');
  if (cleanedCep.length !== 8) return null;
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanedCep}`);
    if (!response.ok) {
       const errorText = await response.text();
      console.error(`EditarOrganizacaoPage: BrasilAPI CEP error: ${response.status} ${response.statusText}. Body: ${errorText}`);
      return null;
    }
    const data: BrasilApiResponse = await response.json();
    return { street: data.street, neighborhood: data.neighborhood, city: data.city, state: data.state, cep: data.cep };
  } catch (error: any) {
    console.error(`EditarOrganizacaoPage: Erro ao buscar endereço do CEP:`, error.message);
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

export default function EditarOrganizacaoPage() {
  const router = useRouter();
  const params = useParams();
  const organizacaoId = params.id as string;
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false); // General loading state for form submission
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(true);
  const [isCnpjLoading, setIsCnpjLoading] = useState(false); 
  const [isCep1Loading, setIsCep1Loading] = useState(false);
  const [isCep2Loading, setIsCep2Loading] = useState(false);
  const [orgFound, setOrgFound] = useState<boolean | null>(null);
  const [dataCadastroDisplay, setDataCadastroDisplay] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [tiposEntidadeOptions, setTiposEntidadeOptions] = useState<TipoEntidadeOption[]>([]);
  const [displayOnlyApiData, setDisplayOnlyApiData] = useState<{
    cnae_secundarios: { codigo: number; descricao: string }[],
    qsa: (QSAItemFromAPI | QSAItemFromDB)[] 
  } | null>(null);

  useEffect(() => {
    const fetchInitialPageData = async () => {
        if (!organizacaoId || !supabase) {
            setIsLoading(false); setIsFetchingInitialData(false); setOrgFound(false);
            if (!organizacaoId) toast({ title: "Erro", description: "ID da organização não fornecido.", variant: "destructive" });
            return;
        }
        setIsFetchingInitialData(true);
        
        const { data: tiposData, error: tiposError } = await supabase.from('TiposEntidade').select('id_tipo_entidade, nome_tipo').order('nome_tipo');
        if (tiposError) {
            console.error("Erro ao buscar tipos de entidade:", tiposError);
            toast({ title: "Erro", description: "Não foi possível carregar os tipos de entidade.", variant: "destructive" });
        } else {
            setTiposEntidadeOptions(tiposData.map(t => ({ value: t.id_tipo_entidade.toString(), label: t.nome_tipo })));
        }

        const orgData = await getOrganizacaoById(organizacaoId);
        if (orgData) {
            setFormData({
                cnpj: orgData.cnpj || '',
                nome: orgData.nome || '',
                nome_fantasia: orgData.nome_fantasia || '',
                codigo_entidade: orgData.codigo_entidade || '',
                id_tipo_entidade: orgData.id_tipo_entidade?.toString() || '',
                telefone: orgData.telefone || '',
                email: orgData.email || '',
                logradouro: orgData.logradouro || '',
                numero: orgData.numero || '',
                complemento: orgData.complemento || '',
                bairro: orgData.bairro || '',
                cidade: orgData.cidade || '',
                estado_uf: orgData.estado_uf || '',
                cep: (orgData.cep || '').replace(/\D/g, ''),
                endereco2_logradouro: orgData.endereco2_logradouro || '',
                endereco2_numero: orgData.endereco2_numero || '',
                endereco2_complemento: orgData.endereco2_complemento || '',
                endereco2_bairro: orgData.endereco2_bairro || '',
                endereco2_cidade: orgData.endereco2_cidade || '',
                endereco2_estado_uf: orgData.endereco2_estado_uf || '',
                endereco2_cep: (orgData.endereco2_cep || '').replace(/\D/g, ''),
                nome_contato_responsavel: orgData.nome_contato_responsavel || '',
                cargo_contato_responsavel: orgData.cargo_contato_responsavel || '',
                email_contato: orgData.email_contato || '',
                telefone_contato: orgData.telefone_contato || '',
                observacoes_contato: orgData.observacoes_contato || '',
                data_inicio_atividade: orgData.data_inicio_atividade ? format(parseISO(orgData.data_inicio_atividade), 'yyyy-MM-dd') : '',
                porte_empresa: orgData.porte_empresa || '',
                natureza_juridica: orgData.natureza_juridica || '',
                cnae_principal: orgData.cnae_principal || '',
                descricao_situacao_cadastral: orgData.descricao_situacao_cadastral || '',
                observacoes: orgData.observacoes || '',
            });
            setDisplayOnlyApiData({
                cnae_secundarios: orgData.cnae_secundarios || [],
                qsa: orgData.QSA || [],
            });
            if (orgData.data_cadastro && isValid(parseISO(orgData.data_cadastro))) {
                setDataCadastroDisplay(format(parseISO(orgData.data_cadastro), "dd/MM/yyyy HH:mm"));
            }
            setOrgFound(true);
        } else {
            setOrgFound(false);
            toast({ title: "Erro", description: "Organização não encontrada.", variant: "destructive" });
        }
        setIsLoading(false); // General loading should be false after initial fetch attempt
        setIsFetchingInitialData(false);
    };
    fetchInitialPageData();
  }, [organizacaoId, toast]);

  const handleCnpjBlur = async (event: FocusEvent<HTMLInputElement>) => {
    const cnpjValue = event.target.value;
    const cleanedCnpjForAPI = cnpjValue.replace(/\D/g, '');

    // Only fetch if CNPJ changed significantly or was empty before
    if (cleanedCnpjForAPI && cleanedCnpjForAPI.length === 14) {
      setIsCnpjLoading(true);
      const apiData = await fetchOrganizacaoDataFromCNPJAPI(cleanedCnpjForAPI);
      if (apiData) {
        setFormData(prev => ({
          ...prev, 
          nome: apiData.razao_social || prev.nome,
          nome_fantasia: getValueOrDefault(apiData.nome_fantasia),
          cnpj: apiData.cnpj || cleanedCnpjForAPI,
          data_inicio_atividade: getValueOrDefault(apiData.data_inicio_atividade),
          porte_empresa: getValueOrDefault(apiData.porte),
          natureza_juridica: getValueOrDefault(apiData.natureza_juridica),
          cnae_principal: getValueOrDefault(apiData.cnae_fiscal_descricao),
          descricao_situacao_cadastral: getValueOrDefault(apiData.descricao_situacao_cadastral),
          logradouro: apiData.logradouro || prev.logradouro,
          numero: apiData.numero || prev.numero,
          complemento: apiData.complemento || prev.complemento,
          bairro: apiData.bairro || prev.bairro,
          cidade: apiData.municipio || prev.cidade,
          estado_uf: apiData.uf || prev.estado_uf,
          cep: (apiData.cep || prev.cep).replace(/\D/g, ''),
          telefone: getValueOrDefault(apiData.ddd_telefone_1, prev.telefone),
          email: getValueOrDefault(apiData.email?.toLowerCase(), prev.email),
        }));
        setDisplayOnlyApiData(prev => ({
            ...(prev ?? {cnae_secundarios: [], qsa: []}),
            cnae_secundarios: apiData.cnaes_secundarios || prev?.cnae_secundarios || [],
             qsa: (apiData.qsa || []).map(s => ({
                nome_socio: s.nome_socio,
                qualificacao_socio: s.qualificacao_socio,
                data_entrada_sociedade: s.data_entrada_sociedade || null
            })),
        }));
        toast({ title: "Dados do CNPJ Atualizados!", description: "Campos preenchidos pela BrasilAPI. Verifique e ajuste se necessário." });
      } else {
        toast({ title: "CNPJ Não Encontrado na API", description: "Verifique o número ou continue com os dados atuais.", variant: "default" });
      }
      setIsCnpjLoading(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !organizacaoId) {
      toast({ title: "Erro de Configuração", description: "Cliente Supabase ou ID da Organização não disponível.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    if (!formData.nome || !formData.codigo_entidade || !formData.cnpj || !formData.id_tipo_entidade) {
      toast({ title: "Campos Obrigatórios", description: "Nome, Código, CNPJ e Tipo são obrigatórios.", variant: "destructive" });
      setIsLoading(false); return;
    }
    
    try {
      const numericOrgId = parseInt(organizacaoId, 10);
      // Omit rpc call for brevity as it's similar to 'novo' page
      // const { data: rpcRoleData, error: rpcRoleError } = await supabase.rpc('get_user_role'); ...

      const entidadeUpdatePayload = {
        nome: formData.nome,
        nome_fantasia: formData.nome_fantasia === "sem informação" ? null : formData.nome_fantasia,
        codigo_entidade: formData.codigo_entidade,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        id_tipo_entidade: parseInt(formData.id_tipo_entidade, 10),
        telefone: formData.telefone === "sem informação" ? null : formData.telefone,
        email: formData.email === "sem informação" ? null : formData.email,
        data_inicio_atividade: formData.data_inicio_atividade === "sem informação" || !formData.data_inicio_atividade ? null : formData.data_inicio_atividade,
        porte_empresa: formData.porte_empresa === "sem informação" ? null : formData.porte_empresa,
        natureza_juridica: formData.natureza_juridica === "sem informação" ? null : formData.natureza_juridica,
        cnae_principal: formData.cnae_principal === "sem informação" ? null : formData.cnae_principal,
        cnae_secundarios: displayOnlyApiData?.cnae_secundarios && displayOnlyApiData.cnae_secundarios.length > 0 ? displayOnlyApiData.cnae_secundarios : null, 
        descricao_situacao_cadastral: formData.descricao_situacao_cadastral === "sem informação" ? null : formData.descricao_situacao_cadastral,
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado_uf: formData.estado_uf || null,
        cep: formData.cep.replace(/\D/g, '') || null,
        endereco2_logradouro: formData.endereco2_logradouro || null,
        endereco2_numero: formData.endereco2_numero || null,
        endereco2_complemento: formData.endereco2_complemento || null,
        endereco2_bairro: formData.endereco2_bairro || null,
        endereco2_cidade: formData.endereco2_cidade || null,
        endereco2_estado_uf: formData.endereco2_estado_uf || null,
        endereco2_cep: formData.endereco2_cep.replace(/\D/g, '') || null,
        nome_contato_responsavel: formData.nome_contato_responsavel || null,
        cargo_contato_responsavel: formData.cargo_contato_responsavel || null,
        email_contato: formData.email_contato || null,
        telefone_contato: formData.telefone_contato || null,
        observacoes_contato: formData.observacoes_contato || null,
        observacoes: formData.observacoes || null,
      };

      const { error: updateError } = await supabase
        .from('Entidades')
        .update(entidadeUpdatePayload)
        .eq('id_entidade', numericOrgId);

      if (updateError) throw updateError;
      
      // QSA Management on edit is complex.
      // If QSA data came from the API and is stored in displayOnlyApiData,
      // and your business logic dictates that API QSA data should replace DB QSA data:
      if (displayOnlyApiData?.qsa && displayOnlyApiData.qsa.length > 0) {
        // 1. Delete existing QSA for this id_entidade
        const { error: deleteQsaError } = await supabase
            .from('QSA')
            .delete()
            .eq('id_entidade', numericOrgId);
        if (deleteQsaError) console.warn("Aviso ao deletar QSA antigo:", deleteQsaError.message);

        // 2. Insert new QSA data
        const qsaPayload = displayOnlyApiData.qsa.map(socio => ({
            id_entidade: numericOrgId,
            nome_socio: socio.nome_socio,
            qualificacao_socio: socio.qualificacao_socio,
            data_entrada_sociedade: socio.data_entrada_sociedade || null,
            // observacoes: (socio as QSAItemFromDB).observacoes || null, // If you allow editing QSA observacoes
        }));
         const { error: insertQsaError } = await supabase.from('QSA').insert(qsaPayload);
         if (insertQsaError) console.warn("Aviso ao inserir novo QSA:", insertQsaError.message);
      }


      toast({ title: "Organização Atualizada!", description: "Os dados da organização foram salvos." });
      router.push(`/admin/organizacoes/${numericOrgId}`); 

    } catch (error: any) {
      console.error('EditarOrganizacaoPage: Erro ao atualizar Organização:', JSON.stringify(error, null, 2), error);
      toast({ title: "Erro ao Atualizar", description: error.message || "Ocorreu um erro. Verifique o console e as permissões RLS.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isFetchingInitialData) {
    return <div className="container mx-auto px-4 py-8 md:py-12 text-center">Carregando dados da organização...</div>;
  }

  if (orgFound === false) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Organização não encontrada</h1>
        <Button asChild className="mt-6"><Link href="/admin/organizacoes">Voltar para Lista</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <Building className="mr-3 h-8 w-8" /> Editar Organização: {formData.nome || "Carregando..."}
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/organizacoes/${organizacaoId}`}><XCircle className="mr-2 h-4 w-4" /> Cancelar</Link>
          </Button>
        </div>
        {dataCadastroDisplay && <p className="text-sm text-muted-foreground mt-1">Data de Cadastro Original: {dataCadastroDisplay}</p>}
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
              <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cnpj_field">CNPJ <span className="text-destructive">*</span></Label>
                  <Input 
                    id="cnpj_field" 
                    name="cnpj" 
                    value={formData.cnpj} 
                    onChange={handleChange}
                    onBlur={handleCnpjBlur}
                    placeholder="00.000.000/0000-00"
                    required 
                    disabled={isLoading || isCnpjLoading || isFetchingInitialData} 
                  />
                  {isCnpjLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />}
                   <p className="text-xs text-muted-foreground">Alterar o CNPJ e sair do campo pode re-buscar dados da BrasilAPI.</p>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="nome">Nome da Organização (Razão Social) <span className="text-destructive">*</span></Label><Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required disabled={isLoading || isFetchingInitialData} /></div>
                  <div className="space-y-2"><Label htmlFor="nome_fantasia">Nome Fantasia</Label><Input id="nome_fantasia" name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="codigo_entidade">Código da Entidade <span className="text-destructive">*</span></Label><Input id="codigo_entidade" name="codigo_entidade" value={formData.codigo_entidade} onChange={handleChange} required disabled={isLoading || isFetchingInitialData} /></div>
                  <div className="space-y-2"><Label htmlFor="id_tipo_entidade">Tipo <span className="text-destructive">*</span></Label>
                    <Select name="id_tipo_entidade" value={formData.id_tipo_entidade} onValueChange={(v) => handleSelectChange('id_tipo_entidade', v)} required disabled={isLoading || isFetchingInitialData}><SelectTrigger id="id_tipo_entidade"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{tiposEntidadeOptions.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent></Select>
                  </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2"><Label htmlFor="telefone">Telefone Principal</Label><Input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                   <div className="space-y-2"><Label htmlFor="email">E-mail Principal</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dadosFiscais">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Dados da Empresa</CardTitle><CardDescription>Informações obtidas da API CNPJ ou cadastradas.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1"><Label htmlFor="data_inicio_atividade">Data Início Atividade</Label><Input id="data_inicio_atividade" value={formData.data_inicio_atividade} onChange={handleChange} name="data_inicio_atividade" type="date" disabled={isLoading || isFetchingInitialData} /></div>
                    <div className="space-y-1"><Label htmlFor="porte_empresa">Porte da Empresa</Label><Input id="porte_empresa" value={formData.porte_empresa} onChange={handleChange} name="porte_empresa" disabled={isLoading || isFetchingInitialData} /></div>
                    <div className="space-y-1"><Label htmlFor="natureza_juridica">Natureza Jurídica</Label><Input id="natureza_juridica" value={formData.natureza_juridica} onChange={handleChange} name="natureza_juridica" disabled={isLoading || isFetchingInitialData} /></div>
                    <div className="space-y-1 md:col-span-2 lg:col-span-3"><Label htmlFor="cnae_principal">CNAE Principal</Label><Input id="cnae_principal" value={formData.cnae_principal} onChange={handleChange} name="cnae_principal" disabled={isLoading || isFetchingInitialData} /></div>
                    <div className="space-y-1"><Label htmlFor="descricao_situacao_cadastral">Situação Cadastral</Label><Input id="descricao_situacao_cadastral" value={formData.descricao_situacao_cadastral} onChange={handleChange} name="descricao_situacao_cadastral" disabled={isLoading || isFetchingInitialData} /></div>
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
              <CardHeader><CardTitle>Endereço Principal</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex items-center gap-2">
                    <Input id="cep" name="cep" value={formData.cep} onChange={handleChange} onBlur={(e) => handleCepBlur(e, 1)} placeholder="00000-000" disabled={isLoading || isCep1Loading || isFetchingInitialData} />
                     {isCep1Loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="logradouro">Logradouro</Label><Input id="logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                  <div className="space-y-2"><Label htmlFor="numero">Número</Label><Input id="numero" name="numero" value={formData.numero} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="complemento">Complemento</Label><Input id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
                  <div className="space-y-2"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} disabled={isLoading || isFetchingInitialData}/></div>
                  <div className="space-y-2"><Label htmlFor="cidade">Cidade</Label><Input id="cidade" name="cidade" value={formData.cidade} onChange={handleChange} disabled={isLoading || isFetchingInitialData}/></div>
                  <div className="space-y-2"><Label htmlFor="estado_uf">UF</Label><Input id="estado_uf" name="estado_uf" value={formData.estado_uf} onChange={handleChange} maxLength={2} placeholder="Ex: SP" disabled={isLoading || isFetchingInitialData}/></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enderecoAdicional">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Endereço Adicional/Correspondência</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                  <Label htmlFor="endereco2_cep">CEP (Endereço Adicional)</Label>
                  <div className="flex items-center gap-2">
                    <Input id="endereco2_cep" name="endereco2_cep" value={formData.endereco2_cep} onChange={handleChange} onBlur={(e) => handleCepBlur(e, 2)} placeholder="00000-000" disabled={isLoading || isCep2Loading || isFetchingInitialData} />
                     {isCep2Loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="endereco2_logradouro">Logradouro (Endereço Adicional)</Label><Input id="endereco2_logradouro" name="endereco2_logradouro" value={formData.endereco2_logradouro} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                  <div className="space-y-2"><Label htmlFor="endereco2_numero">Número (Endereço Adicional)</Label><Input id="endereco2_numero" name="endereco2_numero" value={formData.endereco2_numero} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="endereco2_complemento">Complemento (Endereço Adicional)</Label><Input id="endereco2_complemento" name="endereco2_complemento" value={formData.endereco2_complemento} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
                  <div className="space-y-2"><Label htmlFor="endereco2_bairro">Bairro (Endereço Adicional)</Label><Input id="endereco2_bairro" name="endereco2_bairro" value={formData.endereco2_bairro} onChange={handleChange} disabled={isLoading || isFetchingInitialData}/></div>
                  <div className="space-y-2"><Label htmlFor="endereco2_cidade">Cidade (Endereço Adicional)</Label><Input id="endereco2_cidade" name="endereco2_cidade" value={formData.endereco2_cidade} onChange={handleChange} disabled={isLoading || isFetchingInitialData}/></div>
                  <div className="space-y-2"><Label htmlFor="endereco2_estado_uf">UF (Endereço Adicional)</Label><Input id="endereco2_estado_uf" name="endereco2_estado_uf" value={formData.endereco2_estado_uf} onChange={handleChange} maxLength={2} placeholder="Ex: SP" disabled={isLoading || isFetchingInitialData}/></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contato">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Informações de Contato</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="nome_contato_responsavel">Nome do Contato</Label><Input id="nome_contato_responsavel" name="nome_contato_responsavel" value={formData.nome_contato_responsavel} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                    <div className="space-y-2"><Label htmlFor="cargo_contato_responsavel">Cargo do Contato</Label><Input id="cargo_contato_responsavel" name="cargo_contato_responsavel" value={formData.cargo_contato_responsavel} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="email_contato">E-mail de Contato</Label><Input id="email_contato" name="email_contato" type="email" value={formData.email_contato} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                    <div className="space-y-2"><Label htmlFor="telefone_contato">Telefone de Contato</Label><Input id="telefone_contato" name="telefone_contato" type="tel" value={formData.telefone_contato} onChange={handleChange} disabled={isLoading || isFetchingInitialData} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="observacoes_contato">Observações sobre Contato</Label><Textarea id="observacoes_contato" name="observacoes_contato" value={formData.observacoes_contato} onChange={handleChange} rows={3} disabled={isLoading || isFetchingInitialData} /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qsa">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Quadro de Sócios e Administradores (QSA)</CardTitle><CardDescription>Estes dados são carregados com a organização. A edição de QSA é um processo complexo e normalmente feito via sistema específico ou importação.</CardDescription></CardHeader>
              <CardContent>
                {!isFetchingInitialData && displayOnlyApiData?.qsa && displayOnlyApiData.qsa.length > 0 ? (
                  <div className="overflow-x-auto max-h-80 border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50"><tr className="border-b"><th className="p-2 text-left font-medium">Nome Sócio/Administrador</th><th className="p-2 text-left font-medium">Qualificação</th><th className="p-2 text-left font-medium hidden sm:table-cell">Data Entrada</th></tr></thead>
                      <tbody>
                        {displayOnlyApiData.qsa.map((socio, index) => (
                          <tr key={(socio as QSAItemFromDB).id_qsa || index} className="border-b last:border-b-0 hover:bg-muted/20">
                              <td className="p-2">{socio.nome_socio}</td>
                              <td className="p-2">{socio.qualificacao_socio}</td>
                              <td className="p-2 hidden sm:table-cell">{socio.data_entrada_sociedade && isValid(parseISO(socio.data_entrada_sociedade)) ? format(parseISO(socio.data_entrada_sociedade), 'dd/MM/yyyy') : <span className="italic text-muted-foreground">sem informação</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  !isFetchingInitialData && <p className="text-muted-foreground">Nenhum QSA encontrado.</p>
                )}
                 {isFetchingInitialData && <p className="text-muted-foreground">Carregando QSA...</p>}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="observacoes">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Observações Gerais</CardTitle></CardHeader>
              <CardContent><Textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} rows={4} disabled={isLoading || isFetchingInitialData} /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push(`/admin/organizacoes/${organizacaoId}`)} disabled={isLoading || isCnpjLoading || isCep1Loading || isCep2Loading || !orgFound}><XCircle className="mr-2 h-5 w-5" /> Cancelar</Button>
          <Button type="submit" disabled={isLoading || isCnpjLoading || isCep1Loading || isCep2Loading || !orgFound}><Save className="mr-2 h-5 w-5" />{isLoading ? 'Salvando...' : 'Salvar Alterações'}</Button>
        </CardFooter>
      </form>
    </div>
  );
}

/* Supabase Integration Notes:
- On page load: Fetch Entidade data by ID, including direct address fields, QSA, and all other new columns.
- Populate TiposEntidade select dynamically. Pre-select current tipoOrganizacaoId.
- On submit: Update public.Entidades with new data.
- QSA: Editing QSA is complex. Typically involves deleting all existing QSA for the entity and re-inserting the current set, or diffing. This should ideally be handled in a transaction or an Edge Function. For now, QSA is shown as loaded but not directly editable on this form.
- CEP API: Integrate real API for address fields.
- CNPJ field is typically read-only on edit. If re-fetch by CNPJ is needed, a separate button might be better.
*/
