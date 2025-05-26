
"use client";

import { useState, type FormEvent, useEffect, type ChangeEvent, type FocusEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Save, XCircle, MapPin, Info, Briefcase, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

// Placeholder data - In a real app, these would come from Supabase
const placeholderTiposOrganizacao = [
  { value: "1", label: "Instituição (Exemplo ID 1)" },
  { value: "2", label: "Federação (Exemplo ID 2)" },
  { value: "3", label: "Cooperativa Principal (Exemplo ID 3)" },
  { value: "4", label: "Associação Principal (Exemplo ID 4)" },
  { value: "5", label: "Empresa Privada (Exemplo ID 5)" },
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
  if (cleanedCep.length !== 8) return null;

  console.log("NovaOrganizacaoPage: Chamando BrasilAPI para CEP:", cleanedCep);
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanedCep}`);
    if (!response.ok) {
      console.error(`NovaOrganizacaoPage: BrasilAPI CEP error: ${response.status} ${response.statusText}`);
      const errorData = await response.text();
      console.error(`NovaOrganizacaoPage: BrasilAPI CEP error body: ${errorData}`);
      return null;
    }
    const data: BrasilApiResponse = await response.json();
    console.log(`NovaOrganizacaoPage: BrasilAPI CEP response:`, data);
    return {
      street: data.street,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      cep: data.cep, 
    };
  } catch (error) {
    console.error("NovaOrganizacaoPage: Erro ao buscar endereço do CEP via BrasilAPI:", error);
    return null;
  }
}


export default function NovaOrganizacaoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);

  const [formData, setFormData] = useState({
    nomeOrganizacao: '',
    codigoEntidade: '',
    cnpj: '',
    tipoOrganizacaoId: '',
    telefone: '',
    email: '',
    dataCadastro: new Date().toISOString().split('T')[0],
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade: '',
    estado_uf: '',
  });

  const [tiposEntidadeOptions, setTiposEntidadeOptions] = useState(placeholderTiposOrganizacao);
  // In a real app:
  // useEffect(() => {
  //   const fetchTipos = async () => {
  //     if (!supabase) return;
  //     const { data, error } = await supabase.from('TiposEntidade').select('id_tipo_entidade, nome_tipo');
  //     if (error) { console.error("Erro ao buscar tipos de entidade:", error); }
  //     else { setTiposEntidadeOptions(data.map(t => ({ value: t.id_tipo_entidade.toString(), label: t.nome_tipo }))); }
  //   };
  //   fetchTipos();
  // }, []);


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
            cep: address.cep || cepValue, 
          }));
          toast({ title: "Endereço Encontrado!", description: "Campos de endereço preenchidos automaticamente." });
        } else {
          toast({ title: "CEP Não Encontrado", description: "Verifique o CEP ou preencha o endereço manualmente."});
        }
      } catch (error) {
        console.error("NovaOrganizacaoPage: Erro ao processar CEP:", error);
        toast({ title: "Erro ao Buscar CEP", description: "Não foi possível obter o endereço. Tente novamente.", variant: "destructive" });
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast({ title: "Erro de Configuração", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    // Diagnostic: Call get_user_role from client-side
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_role');
      if (rpcError) {
        console.error(`NovaOrganizacaoPage: Erro ao chamar RPC get_user_role:`, JSON.stringify(rpcError, null, 2));
        toast({ title: "Erro de Diagnóstico RPC", description: `Falha ao verificar o papel do usuário via RPC: ${rpcError.message}. Verifique o console.`, variant: "destructive", duration: 10000 });
        setIsLoading(false);
        return;
      }
      console.log(`NovaOrganizacaoPage: Resultado da RPC get_user_role (client-side):`, rpcData);
      const allowedRolesForCreation = ['admin', 'supervisor', 'operator']; 
      if (!rpcData || !allowedRolesForCreation.includes(rpcData as string)) {
         toast({ title: "Permissão Insuficiente (Diagnóstico)", description: `Seu papel atual detectado é '${rpcData || 'desconhecido'}'. A política RLS requer um dos seguintes papéis para esta operação: ${allowedRolesForCreation.join(', ')}.`, variant: "destructive", duration: 10000 });
         setIsLoading(false);
         return;
      }
    } catch (diagError: any) {
        console.error(`NovaOrganizacaoPage: Erro inesperado ao chamar RPC get_user_role:`, diagError);
        toast({ title: "Erro Crítico de Diagnóstico", description: `Erro ao verificar permissões: ${diagError.message}.`, variant: "destructive" });
        setIsLoading(false);
        return;
    }
    // End Diagnostic

    if (!formData.nomeOrganizacao || !formData.codigoEntidade || !formData.cnpj || !formData.tipoOrganizacaoId) {
      toast({ title: "Campos Obrigatórios", description: "Nome da Organização, Código da Entidade, CNPJ e Tipo de Organização são obrigatórios.", variant: "destructive" });
      setIsLoading(false); return;
    }
    
    try {
      const entidadePayload = {
        nome: formData.nomeOrganizacao,
        codigo_entidade: formData.codigoEntidade,
        cnpj: formData.cnpj,
        id_tipo_entidade: parseInt(formData.tipoOrganizacaoId, 10),
        telefone: formData.telefone || null,
        email: formData.email || null,
        data_cadastro: formData.dataCadastro ? new Date(formData.dataCadastro).toISOString() : new Date().toISOString(),
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cep: formData.cep || null,
        cidade: formData.cidade || null,
        estado_uf: formData.estado_uf || null,
      };
      console.log("NovaOrganizacaoPage: Payload para Entidades:", entidadePayload);

      const { data, error } = await supabase
        .from('Entidades')
        .insert([entidadePayload])
        .select()
        .single();

      if (error) {
        console.error('NovaOrganizacaoPage: Erro ao cadastrar Organização (Supabase):', JSON.stringify(error, null, 2), error);
        const defaultMessage = "Ocorreu um erro desconhecido ao salvar a organização. Verifique o console e as permissões RLS na tabela 'Entidades'.";
        toast({ title: "Erro ao Cadastrar Organização", description: error.message || defaultMessage, variant: "destructive", duration: 10000 });
        setIsLoading(false); 
        return;
      }
      
      toast({ title: "Organização Cadastrada!", description: `${data?.nome || 'A nova organização'} foi adicionada com sucesso.` });
      router.push('/admin/organizacoes'); 

    } catch (error: any) {
      console.error('NovaOrganizacaoPage: Erro inesperado no handleSubmit:', JSON.stringify(error, null, 2), error);
      toast({ title: "Erro ao Cadastrar", description: error.message || "Ocorreu um erro inesperado.", variant: "destructive" });
    } finally {
      // This might still run if navigation happens before this finally block executes fully.
      // Checking if component is mounted or a navigation flag could be more robust if issues persist.
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
            <Link href="/admin/organizacoes"><XCircle className="mr-2 h-4 w-4" /> Voltar para Lista</Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">Preencha os dados abaixo para adicionar uma nova organização.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="infoBasicas" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            <TabsTrigger value="infoBasicas"><Info className="mr-2 h-4 w-4" />Informações Básicas</TabsTrigger>
            <TabsTrigger value="endereco"><MapPin className="mr-2 h-4 w-4" />Endereço</TabsTrigger>
          </TabsList>

          <TabsContent value="infoBasicas">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Identificação e Contato</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="nomeOrganizacao">Nome da Organização <span className="text-destructive">*</span></Label><Input id="nomeOrganizacao" name="nomeOrganizacao" value={formData.nomeOrganizacao} onChange={handleChange} required disabled={isLoading} /></div>
                  <div className="space-y-2"><Label htmlFor="codigoEntidade">Código da Entidade <span className="text-destructive">*</span></Label><Input id="codigoEntidade" name="codigoEntidade" value={formData.codigoEntidade} onChange={handleChange} required disabled={isLoading} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="cnpj">CNPJ <span className="text-destructive">*</span></Label><Input id="cnpj" name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="XX.XXX.XXX/YYYY-ZZ" required disabled={isLoading} /></div>
                  <div className="space-y-2"><Label htmlFor="tipoOrganizacaoId">Tipo de Organização <span className="text-destructive">*</span></Label>
                    <Select name="tipoOrganizacaoId" value={formData.tipoOrganizacaoId} onValueChange={(v) => handleSelectChange('tipoOrganizacaoId', v)} required disabled={isLoading}><SelectTrigger id="tipoOrganizacaoId"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione o tipo" /></SelectTrigger><SelectContent>{tiposEntidadeOptions.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent></Select>
                  </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} disabled={isLoading} /></div>
                    <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={isLoading} /></div>
                </div>
                <div className="space-y-2 md:w-1/2 pr-3"><Label htmlFor="dataCadastro">Data de Cadastro</Label><Input id="dataCadastro" name="dataCadastro" type="date" value={formData.dataCadastro} onChange={handleChange} disabled={isLoading} /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endereco">
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Endereço da Organização</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex items-center gap-2">
                    <Input id="cep" name="cep" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} placeholder="00000-000" disabled={isLoading || isCepLoading} />
                     {isCepLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Digite o CEP para preenchimento automático do endereço.</p>
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
        </Tabs>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/organizacoes')} disabled={isLoading || isCepLoading}><XCircle className="mr-2 h-5 w-5" />Cancelar</Button>
          <Button type="submit" disabled={isLoading || isCepLoading}><Save className="mr-2 h-5 w-5" />{isLoading ? 'Salvando...' : 'Salvar Organização'}</Button>
        </CardFooter>
      </form>
    </div>
  );
}
    
/*
Supabase Integration Notes:
- This page assumes the 'Entidades' table has direct address columns (logradouro, numero, etc.)
- Ensure RLS policies on 'Entidades' and 'TiposEntidade' allow the logged-in user (admin/supervisor/operator)
  to perform INSERT operations on 'Entidades' and SELECT on 'TiposEntidade'.
- The 'user_id' and 'responsavel_cadastro' fields in 'Entidades' would typically be populated on the
  backend (e.g., database triggers with auth.uid() or via an Edge Function) to ensure data integrity.
- Dynamic select options for 'Tipos de Organização' should be fetched from Supabase.
- For a production app, consider using a Supabase Edge Function for creating organizations if it involves
  multiple related inserts or complex logic to ensure atomicity.
*/

/*
Example RLS policies that would be needed on public."Entidades":

CREATE POLICY "Allow admin/supervisor to manage all Entidades"
ON public."Entidades"
FOR ALL
USING (get_user_role() IN ('admin', 'supervisor'))
WITH CHECK (get_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "Allow operator to create Entidades"
ON public."Entidades"
FOR INSERT
WITH CHECK (get_user_role() = 'operator');

-- Similar SELECT/UPDATE/DELETE policies for 'operator' may be needed.
*/

    