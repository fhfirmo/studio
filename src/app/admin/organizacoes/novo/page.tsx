
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
import { Building, Save, XCircle, MapPin, Info, Briefcase, Loader2, Search, Users, DollarSign, FileText, Contact, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface TipoEntidadeOption {
  value: string;
  label: string;
}

interface QSAItem {
  nome_socio: string;
  qualificacao_socio: string;
  data_entrada_sociedade?: string | null;
}

// Placeholder for data structure from CNPJ API
interface CNPJApiResponse {
  nome: string;
  // email: string; // Typically not from CNPJ root, might be in QSA or specific contact
  // telefone: string; // Same as email
  cnpj: string;
  data_inicio_atividade: string; // YYYY-MM-DD
  porte_empresa: string;
  natureza_juridica: string;
  cnae_principal: string;
  cnae_secundarios: { codigo: string, descricao: string }[];
  descricao_situacao_cadastral: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado_uf: string;
  cep: string;
  qsa: QSAItem[];
}

// Placeholder for BrasilAPI (CEP for Endereco 2)
interface BrasilApiResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
}

// Placeholder function to simulate CNPJ API call
async function fetchOrganizacaoDataFromCNPJAPI(cnpj: string): Promise<CNPJApiResponse | null> {
  const cleanedCnpj = cnpj.replace(/\D/g, '');
  if (cleanedCnpj.length !== 14) {
    return null;
  }
  console.log("NovaOrganizacaoPage: Chamando API CNPJ para:", cleanedCnpj);
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

  // Example success response
  if (cleanedCnpj === "00000000000000" || cleanedCnpj.startsWith("1111")) { // Test CNPJ
    return {
      nome: "Empresa Exemplo API LTDA",
      cnpj: cnpj, // return formatted or cleaned as needed by form
      data_inicio_atividade: "2005-01-10",
      porte_empresa: "ME - Microempresa",
      natureza_juridica: "206-2 - Sociedade Empresária Limitada",
      cnae_principal: "6201501 - Desenvolvimento de programas de computador sob encomenda",
      cnae_secundarios: [{ codigo: "6204000", descricao: "Consultoria em tecnologia da informação" }],
      descricao_situacao_cadastral: "ATIVA",
      logradouro: "AV PRINCIPAL API",
      numero: "123",
      complemento: "SALA 101",
      bairro: "CENTRO API",
      cidade: "CIDADE API",
      estado_uf: "UF",
      cep: "12345000",
      qsa: [
        { nome_socio: "Socio Admin Um API", qualificacao_socio: "Sócio-Administrador", data_entrada_sociedade: "2005-01-10" },
        { nome_socio: "Socio Dois API", qualificacao_socio: "Sócio" },
      ],
    };
  }
  return null; // CNPJ not found
}

async function fetchAddressFromCEP(cep: string, addressPrefix: 'endereco2_' | '' = ''): Promise<Partial<BrasilApiResponse> | null> {
  const cleanedCep = cep.replace(/\D/g, '');
  if (cleanedCep.length !== 8) return null;

  console.log(`NovaOrganizacaoPage: Chamando BrasilAPI para CEP (${addressPrefix}):`, cleanedCep);
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanedCep}`);
    if (!response.ok) {
      console.error(`NovaOrganizacaoPage: BrasilAPI CEP error (${addressPrefix}): ${response.status} ${response.statusText}`);
      return null;
    }
    const data: BrasilApiResponse = await response.json();
    return { street: data.street, neighborhood: data.neighborhood, city: data.city, state: data.state, cep: data.cep };
  } catch (error) {
    console.error(`NovaOrganizacaoPage: Erro ao buscar endereço do CEP (${addressPrefix}):`, error);
    return null;
  }
}

const initialFormData = {
  cnpj: '',
  nome: '', // Will be auto-filled
  codigo_entidade: '',
  id_tipo_entidade: '',
  telefone: '', // From API or manual
  email: '',    // From API or manual

  // Address 1 (from CNPJ API, potentially editable)
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado_uf: '',
  cep: '',

  // Address 2 (Manual + CEP API)
  endereco2_logradouro: '',
  endereco2_numero: '',
  endereco2_complemento: '',
  endereco2_bairro: '',
  endereco2_cidade: '',
  endereco2_estado_uf: '',
  endereco2_cep: '',

  // Contact Info (Manual)
  nome_contato_responsavel: '',
  cargo_contato_responsavel: '',
  email_contato: '',
  telefone_contato: '',
  observacoes_contato: '',

  // Economic/Tax Info (from CNPJ API - display only or for record)
  data_inicio_atividade: '',
  porte_empresa: '',
  natureza_juridica: '',
  cnae_principal: '',
  descricao_situacao_cadastral: '',
  // cnae_secundarios will be stored in displayOnlyApiData

  observacoes: '', // General observations for the Entidade
  // data_cadastro is handled by DB
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
    cnae_secundarios: { codigo: string, descricao: string }[],
    qsa: QSAItem[]
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
    if (cnpjValue && cnpjValue.replace(/\D/g, '').length === 14) {
      setIsCnpjLoading(true);
      try {
        // Replace with your actual CNPJ API call logic
        const apiData = await fetchOrganizacaoDataFromCNPJAPI(cnpjValue); 
        if (apiData) {
          setFormData(prev => ({
            ...prev,
            nome: apiData.nome,
            cnpj: apiData.cnpj, 
            data_inicio_atividade: apiData.data_inicio_atividade,
            porte_empresa: apiData.porte_empresa,
            natureza_juridica: apiData.natureza_juridica,
            cnae_principal: apiData.cnae_principal,
            descricao_situacao_cadastral: apiData.descricao_situacao_cadastral,
            logradouro: apiData.logradouro,
            numero: apiData.numero,
            complemento: apiData.complemento,
            bairro: apiData.bairro,
            cidade: apiData.cidade,
            estado_uf: apiData.estado_uf,
            cep: apiData.cep.replace(/\D/g, ''),
          }));
          setDisplayOnlyApiData({
            cnae_secundarios: apiData.cnae_secundarios,
            qsa: apiData.qsa,
          });
          toast({ title: "Dados do CNPJ Encontrados!", description: "Campos preenchidos automaticamente." });
        } else {
          toast({ title: "CNPJ Não Encontrado", description: "Verifique o CNPJ ou preencha os dados manualmente.", variant: "default" });
        }
      } catch (error) {
        console.error("Erro ao buscar dados do CNPJ:", error);
        toast({ title: "Erro na API CNPJ", description: "Não foi possível obter os dados da empresa.", variant: "destructive" });
      } finally {
        setIsCnpjLoading(false);
      }
    }
  };
  
  const handleCepBlur = async (event: FocusEvent<HTMLInputElement>, addressNumber: 1 | 2) => {
    const cepValue = event.target.value;
    const setIsLoadingCep = addressNumber === 1 ? setIsCep1Loading : setIsCep2Loading;
    const prefix = addressNumber === 1 ? '' : 'endereco2_';

    if (cepValue && cepValue.replace(/\D/g, '').length === 8) {
      setIsLoadingCep(true);
      try {
        const address = await fetchAddressFromCEP(cepValue); // Using the existing BrasilAPI function
        if (address) {
          setFormData(prev => ({
            ...prev,
            [`${prefix}logradouro`]: address.street || '',
            [`${prefix}bairro`]: address.neighborhood || '',
            [`${prefix}cidade`]: address.city || '',
            [`${prefix}estado_uf`]: address.state || '',
            // Keep existing CEP if API doesn't return one, or use API's one
            [`${prefix}cep`]: address.cep?.replace(/\D/g, '') || cepValue.replace(/\D/g, ''), 
          }));
          toast({ title: `Endereço ${addressNumber} Encontrado!`, description: "Campos de endereço preenchidos." });
        } else {
          toast({ title: `CEP ${addressNumber} Não Encontrado`, description: "Verifique ou preencha manualmente."});
        }
      } catch (error) {
        console.error(`Erro ao buscar CEP ${addressNumber}:`, error);
        toast({ title: `Erro ao Buscar CEP ${addressNumber}`, variant: "destructive" });
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

    // Client-side validation (placeholder)
    // TODO: Implement comprehensive validation using Zod/RHF
    if (!formData.cnpj || !formData.nome || !formData.codigo_entidade || !formData.id_tipo_entidade) {
      toast({ title: "Campos Obrigatórios", description: "CNPJ, Nome, Código da Entidade e Tipo de Organização são obrigatórios.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const { data: rpcRoleData, error: rpcRoleError } = await supabase.rpc('get_user_role');
      if (rpcRoleError || !['admin', 'supervisor', 'operator'].includes(rpcRoleData)) {
          toast({ title: "Permissão Negada", description: "Você não tem permissão para criar organizações.", variant: "destructive" });
          setIsLoading(false); return;
      }

      const entidadePayload = {
        // From form / API
        nome: formData.nome,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        codigo_entidade: formData.codigo_entidade,
        id_tipo_entidade: parseInt(formData.id_tipo_entidade, 10),
        telefone: formData.telefone || null,
        email: formData.email || null,
        data_inicio_atividade: formData.data_inicio_atividade || null,
        porte_empresa: formData.porte_empresa || null,
        natureza_juridica: formData.natureza_juridica || null,
        cnae_principal: formData.cnae_principal || null,
        cnae_secundarios: displayOnlyApiData?.cnae_secundarios || null,
        descricao_situacao_cadastral: formData.descricao_situacao_cadastral || null,
        
        // Address 1
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado_uf: formData.estado_uf || null,
        cep: formData.cep.replace(/\D/g, '') || null,

        // Address 2
        endereco2_logradouro: formData.endereco2_logradouro || null,
        endereco2_numero: formData.endereco2_numero || null,
        endereco2_complemento: formData.endereco2_complemento || null,
        endereco2_bairro: formData.endereco2_bairro || null,
        endereco2_cidade: formData.endereco2_cidade || null,
        endereco2_estado_uf: formData.endereco2_estado_uf || null,
        endereco2_cep: formData.endereco2_cep.replace(/\D/g, '') || null,

        // Contact Info
        nome_contato_responsavel: formData.nome_contato_responsavel || null,
        cargo_contato_responsavel: formData.cargo_contato_responsavel || null,
        email_contato: formData.email_contato || null,
        telefone_contato: formData.telefone_contato || null,
        observacoes_contato: formData.observacoes_contato || null,
        
        observacoes: formData.observacoes || null,
      };
      console.log("NovaOrganizacaoPage: Payload para Entidades:", entidadePayload);

      const { data: insertedEntidade, error: insertError } = await supabase
        .from('Entidades')
        .insert([entidadePayload])
        .select('id_entidade') // Select only the ID or necessary fields
        .single();

      if (insertError) throw insertError;

      if (displayOnlyApiData?.qsa && displayOnlyApiData.qsa.length > 0 && insertedEntidade?.id_entidade) {
        const qsaPayload = displayOnlyApiData.qsa.map(socio => ({
          id_entidade: insertedEntidade.id_entidade,
          nome_socio: socio.nome_socio,
          qualificacao_socio: socio.qualificacao_socio,
          data_entrada_sociedade: socio.data_entrada_sociedade || null,
        }));
        const { error: qsaError } = await supabase.from('QSA').insert(qsaPayload);
        if (qsaError) {
          console.warn("Erro ao salvar QSA, mas entidade principal foi criada:", qsaError);
          toast({ title: "Entidade Criada com Aviso", description: "A organização foi salva, mas houve um erro ao salvar os dados do QSA.", variant: "default" });
        }
      }
      
      toast({ title: "Organização Cadastrada!", description: `${formData.nome || 'A nova organização'} foi adicionada.` });
      router.push('/admin/organizacoes');

    } catch (error: any) {
      console.error('NovaOrganizacaoPage: Erro ao cadastrar Organização:', JSON.stringify(error, null, 2), error);
      const defaultMessage = "Ocorreu um erro. Verifique o console e as permissões RLS.";
      toast({ title: "Erro ao Cadastrar", description: error.message || defaultMessage, variant: "destructive", duration: 10000 });
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
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center"><Search className="mr-2 h-5 w-5 text-primary" /> Buscar por CNPJ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="cnpj_busca">CNPJ <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="cnpj_busca" 
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
              <p className="text-xs text-muted-foreground">Digite o CNPJ e os campos serão preenchidos automaticamente se encontrado.</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="infoBasicas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1 mb-6 text-xs">
            <TabsTrigger value="infoBasicas"><Info className="mr-1 h-3 w-3" />Básicas</TabsTrigger>
            <TabsTrigger value="dadosApi"><FileText className="mr-1 h-3 w-3" />Dados API</TabsTrigger>
            <TabsTrigger value="enderecoPrincipal"><MapPin className="mr-1 h-3 w-3" />End. Principal</TabsTrigger>
            <TabsTrigger value="enderecoAdicional"><MapPin className="mr-1 h-3 w-3" />End. Adicional</TabsTrigger>
            <TabsTrigger value="contato"><Contact className="mr-1 h-3 w-3" />Contato</TabsTrigger>
            <TabsTrigger value="qsa"><Users className="mr-1 h-3 w-3" />QSA</TabsTrigger>
            <TabsTrigger value="observacoes"><UserCheck className="mr-1 h-3 w-3" />Obs.</TabsTrigger>
          </TabsList>

          <TabsContent value="infoBasicas">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Identificação (Pós-Busca CNPJ)</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="nome">Nome da Organização <span className="text-destructive">*</span></Label><Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required disabled={isLoading} /></div>
                  <div className="space-y-2"><Label htmlFor="codigo_entidade">Código da Entidade <span className="text-destructive">*</span></Label><Input id="codigo_entidade" name="codigo_entidade" value={formData.codigo_entidade} onChange={handleChange} required disabled={isLoading} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="id_tipo_entidade">Tipo <span className="text-destructive">*</span></Label>
                    <Select name="id_tipo_entidade" value={formData.id_tipo_entidade} onValueChange={(v) => handleSelectChange('id_tipo_entidade', v)} required disabled={isLoading}><SelectTrigger id="id_tipo_entidade"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{tiposEntidadeOptions.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent></Select>
                  </div>
                   <div className="space-y-2"><Label htmlFor="telefone">Telefone Principal</Label><Input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} disabled={isLoading} /></div>
                </div>
                 <div className="space-y-2"><Label htmlFor="email">E-mail Principal</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={isLoading} /></div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dadosApi">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Dados da Empresa (Retorno API CNPJ)</CardTitle><CardDescription>Estas informações são obtidas automaticamente. Alguns campos podem ser ajustados nas outras abas.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1"><Label>Data Início Atividade</Label><Input value={formData.data_inicio_atividade || 'N/A'} onChange={handleChange} name="data_inicio_atividade" type="date" disabled={isLoading} /></div>
                    <div className="space-y-1"><Label>Porte da Empresa</Label><Input value={formData.porte_empresa || 'N/A'} onChange={handleChange} name="porte_empresa" disabled={isLoading} /></div>
                    <div className="space-y-1"><Label>Natureza Jurídica</Label><Input value={formData.natureza_juridica || 'N/A'} onChange={handleChange} name="natureza_juridica" disabled={isLoading} /></div>
                    <div className="space-y-1 md:col-span-2 lg:col-span-3"><Label>CNAE Principal</Label><Input value={formData.cnae_principal || 'N/A'} onChange={handleChange} name="cnae_principal" disabled={isLoading} /></div>
                    <div className="space-y-1"><Label>Situação Cadastral</Label><Input value={formData.descricao_situacao_cadastral || 'N/A'} onChange={handleChange} name="descricao_situacao_cadastral" disabled={isLoading} /></div>
                </div>
                {displayOnlyApiData?.cnae_secundarios && displayOnlyApiData.cnae_secundarios.length > 0 && (
                    <div className="space-y-2">
                        <Label>CNAEs Secundários (informativo)</Label>
                        <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md max-h-40 overflow-y-auto">
                            {displayOnlyApiData.cnae_secundarios.map(cnae => <li key={cnae.codigo}>{cnae.codigo} - {cnae.descricao}</li>)}
                        </ul>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enderecoPrincipal">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Endereço Principal</CardTitle><CardDescription>Pode ser auto-preenchido pela API CNPJ ou API de CEP. Ajuste se necessário.</CardDescription></CardHeader>
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
              <CardHeader><CardTitle>Endereço Adicional/Correspondência (Manual)</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                  <Label htmlFor="endereco2_cep">CEP (Endereço 2)</Label>
                  <div className="flex items-center gap-2">
                    <Input id="endereco2_cep" name="endereco2_cep" value={formData.endereco2_cep} onChange={handleChange} onBlur={(e) => handleCepBlur(e, 2)} placeholder="00000-000" disabled={isLoading || isCep2Loading} />
                     {isCep2Loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="endereco2_logradouro">Logradouro (Endereço 2)</Label><Input id="endereco2_logradouro" name="endereco2_logradouro" value={formData.endereco2_logradouro} onChange={handleChange} disabled={isLoading} /></div>
                  <div className="space-y-2"><Label htmlFor="endereco2_numero">Número (Endereço 2)</Label><Input id="endereco2_numero" name="endereco2_numero" value={formData.endereco2_numero} onChange={handleChange} disabled={isLoading} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="endereco2_complemento">Complemento (Endereço 2)</Label><Input id="endereco2_complemento" name="endereco2_complemento" value={formData.endereco2_complemento} onChange={handleChange} disabled={isLoading} /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
                  <div className="space-y-2"><Label htmlFor="endereco2_bairro">Bairro (Endereço 2)</Label><Input id="endereco2_bairro" name="endereco2_bairro" value={formData.endereco2_bairro} onChange={handleChange} disabled={isLoading}/></div>
                  <div className="space-y-2"><Label htmlFor="endereco2_cidade">Cidade (Endereço 2)</Label><Input id="endereco2_cidade" name="endereco2_cidade" value={formData.endereco2_cidade} onChange={handleChange} disabled={isLoading}/></div>
                  <div className="space-y-2"><Label htmlFor="endereco2_estado_uf">UF (Endereço 2)</Label><Input id="endereco2_estado_uf" name="endereco2_estado_uf" value={formData.endereco2_estado_uf} onChange={handleChange} maxLength={2} placeholder="Ex: SP" disabled={isLoading}/></div>
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
                    <div className="space-y-2"><Label htmlFor="email_contato">E-mail de Contato</Label><Input id="email_contato" name="email_contato" type="email" value={formData.email_contato} onChange={handleChange} disabled={isLoading} /></div>
                    <div className="space-y-2"><Label htmlFor="telefone_contato">Telefone de Contato</Label><Input id="telefone_contato" name="telefone_contato" type="tel" value={formData.telefone_contato} onChange={handleChange} disabled={isLoading} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="observacoes_contato">Observações sobre Contato</Label><Textarea id="observacoes_contato" name="observacoes_contato" value={formData.observacoes_contato} onChange={handleChange} rows={3} disabled={isLoading} /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qsa">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Quadro de Sócios e Administradores (QSA - API)</CardTitle><CardDescription>Estes dados são obtidos pela API do CNPJ e são apenas para visualização aqui.</CardDescription></CardHeader>
              <CardContent>
                {isCnpjLoading && <p className="text-muted-foreground">Buscando dados do QSA...</p>}
                {!isCnpjLoading && displayOnlyApiData?.qsa && displayOnlyApiData.qsa.length > 0 ? (
                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b"><th className="p-2 text-left font-medium">Nome Sócio/Administrador</th><th className="p-2 text-left font-medium">Qualificação</th><th className="p-2 text-left font-medium">Data Entrada</th></tr></thead>
                      <tbody>
                        {displayOnlyApiData.qsa.map((socio, index) => (
                          <tr key={index} className="border-b"><td className="p-2">{socio.nome_socio}</td><td className="p-2">{socio.qualificacao_socio}</td><td className="p-2">{socio.data_entrada_sociedade || 'N/A'}</td></tr>
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
  - Ao digitar CNPJ, chamar API CNPJ (placeholder `fetchOrganizacaoDataFromCNPJAPI`).
  - Preencher campos do formulário com dados da API (nome, endereço principal, dados econômicos).
  - QSA da API é exibido. Ao salvar, precisa inserir em public."QSA" (idealmente em transação via Edge Function ou após o insert da Entidade).
  - Endereço 2 usa API de CEP (BrasilAPI).
  - Campos de contato são manuais.
  - Ao submeter, o payload para public."Entidades" incluirá todos os novos campos.
  - Validações de frontend para formatos de CEP, UF, email, telefone (usar Zod/RHF).
*/
      
    