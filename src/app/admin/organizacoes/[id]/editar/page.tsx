
"use client";

import { useState, type FormEvent, useEffect, type ChangeEvent, type FocusEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Save, XCircle, MapPin, Info, Briefcase, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from 'date-fns';


const placeholderTiposOrganizacao = [
  { value: "1", label: "Instituição (ID 1)" },
  { value: "2", label: "Federação (ID 2)" },
  { value: "3", label: "Cooperativa Principal (ID 3)" },
];

interface OrganizacaoDataFromDB {
  id: string;
  nomeOrganizacao: string;
  codigoEntidade: string;
  cnpj: string;
  tipoOrganizacaoId: string; // Stores ID
  telefone?: string | null;
  email?: string | null;
  dataCadastro: string; // YYYY-MM-DD or full timestamp
  // Endereço direto
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  estado_uf?: string | null;
}


async function getOrganizacaoById(orgId: string): Promise<OrganizacaoDataFromDB | null> {
  console.log(`Fetching organization data for ID: ${orgId} (placeholder - with direct address)`);
  await new Promise(resolve => setTimeout(resolve, 500));

  if (orgId === "org_001" || orgId === "1") { // Assuming '1' might be an ID
    return {
      id: orgId,
      nomeOrganizacao: `Cooperativa Exemplo 1`,
      codigoEntidade: `COD-ENT-001`,
      cnpj: `11.222.333/0001-44`,
      tipoOrganizacaoId: "3", // "Cooperativa Principal"
      telefone: `(11) 91234-5671`,
      email: `contato@coopexemplo1.com`,
      dataCadastro: `2024-01-10T10:00:00Z`,
      logradouro: `Rua das Cooperativas 10`,
      numero: `100`,
      complemento: `Bloco A`,
      bairro: "Distrito Industrial",
      cep: `70000-001`,
      cidade: "Cidade Exemplo",
      estado_uf: "EX",
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
  } else if (cep.startsWith("70000")) {
     return { logradouro: "Via Principal do Setor", bairro: "Setor de Testes", cidade: "Brasília", estado_uf: "DF", cep: "70000-000" };
  }
  return null;
}


export default function EditarOrganizacaoPage() {
  const router = useRouter();
  const params = useParams();
  const organizacaoId = params.id as string;
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [orgFound, setOrgFound] = useState<boolean | null>(null);
  const [dataCadastroDisplay, setDataCadastroDisplay] = useState<string | null>(null);


  const [formData, setFormData] = useState({
    nomeOrganizacao: '',
    codigoEntidade: '',
    cnpj: '',
    tipoOrganizacaoId: '',
    telefone: '',
    email: '',
    // Endereço direto
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade: '',
    estado_uf: '',
  });

  useEffect(() => {
    if (organizacaoId) {
      setIsLoading(true);
      // Supabase: Fetch from public.Entidades where id_entidade = organizacaoId
      // Include direct address fields (logradouro, numero, cep, cidade, estado_uf, etc.)
      getOrganizacaoById(organizacaoId)
        .then(orgData => {
          if (orgData) {
            setFormData({
              nomeOrganizacao: orgData.nomeOrganizacao,
              codigoEntidade: orgData.codigoEntidade,
              cnpj: orgData.cnpj,
              tipoOrganizacaoId: orgData.tipoOrganizacaoId,
              telefone: orgData.telefone || '',
              email: orgData.email || '',
              logradouro: orgData.logradouro || '',
              numero: orgData.numero || '',
              complemento: orgData.complemento || '',
              bairro: orgData.bairro || '',
              cep: orgData.cep || '',
              cidade: orgData.cidade || '',
              estado_uf: orgData.estado_uf || '',
            });
            setDataCadastroDisplay(format(parseISO(orgData.dataCadastro), "dd/MM/yyyy HH:mm"));
            setOrgFound(true);
          } else {
            setOrgFound(false);
            toast({ title: "Erro", description: "Organização não encontrada.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Failed to fetch organization data:", err);
          setOrgFound(false);
          toast({ title: "Erro", description: "Falha ao carregar dados da organização.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [organizacaoId, toast]);

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
          toast({ title: "Endereço Encontrado!", description: "Campos de endereço preenchidos." });
        } else {
          toast({ title: "CEP Não Encontrado", description: "Verifique ou preencha manualmente."});
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast({ title: "Erro ao Buscar CEP", variant: "destructive" });
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

    if (!formData.nomeOrganizacao || !formData.codigoEntidade || !formData.cnpj || !formData.tipoOrganizacaoId) {
      toast({ title: "Campos Obrigatórios", description: "Nome, Código, CNPJ e Tipo são obrigatórios.", variant: "destructive" });
      setIsLoading(false); return;
    }
    
    try {
      const entidadeUpdatePayload = {
        nome: formData.nomeOrganizacao,
        codigo_entidade: formData.codigoEntidade,
        cnpj: formData.cnpj,
        id_tipo_entidade: parseInt(formData.tipoOrganizacaoId, 10),
        telefone: formData.telefone || null,
        email: formData.email || null,
        // Endereço direto
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cep: formData.cep || null,
        cidade: formData.cidade || null,
        estado_uf: formData.estado_uf || null,
        // responsavel_cadastro e user_id não são atualizados aqui geralmente
      };

      const { error } = await supabase
        .from('Entidades')
        .update(entidadeUpdatePayload)
        .eq('id_entidade', parseInt(organizacaoId)); // Ensure organizacaoId is parsed if it's a number in DB

      if (error) throw error;
      
      toast({ title: "Organização Atualizada!", description: "Os dados da organização foram salvos." });
      router.push(`/admin/organizacoes`); 

    } catch (error: any) {
      console.error('Erro ao atualizar Organização:', error);
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && orgFound === null) {
    return <div className="container mx-auto px-4 py-8 md:py-12 text-center">Carregando...</div>;
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
            <Building className="mr-3 h-8 w-8" /> Editar Organização: {formData.nomeOrganizacao}
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/organizacoes"><XCircle className="mr-2 h-4 w-4" /> Cancelar</Link>
          </Button>
        </div>
        {dataCadastroDisplay && <p className="text-sm text-muted-foreground mt-1">Data de Cadastro: {dataCadastroDisplay}</p>}
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
                  <div className="space-y-2"><Label htmlFor="nomeOrganizacao">Nome <span className="text-destructive">*</span></Label><Input id="nomeOrganizacao" name="nomeOrganizacao" value={formData.nomeOrganizacao} onChange={handleChange} required /></div>
                  <div className="space-y-2"><Label htmlFor="codigoEntidade">Código <span className="text-destructive">*</span></Label><Input id="codigoEntidade" name="codigoEntidade" value={formData.codigoEntidade} onChange={handleChange} required /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label htmlFor="cnpj">CNPJ <span className="text-destructive">*</span></Label><Input id="cnpj" name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="XX.XXX.XXX/YYYY-ZZ" required /></div>
                  <div className="space-y-2"><Label htmlFor="tipoOrganizacaoId">Tipo <span className="text-destructive">*</span></Label>
                    <Select name="tipoOrganizacaoId" value={formData.tipoOrganizacaoId} onValueChange={(v) => handleSelectChange('tipoOrganizacaoId', v)} required><SelectTrigger id="tipoOrganizacaoId"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{placeholderTiposOrganizacao.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent></Select>
                  </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} /></div>
                </div>
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
                    <Input id="cep" name="cep" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} placeholder="00000-000" />
                     {isCepLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Digite o CEP para preenchimento automático do endereço.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2"><Label htmlFor="logradouro">Logradouro</Label><Input id="logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label htmlFor="numero">Número</Label><Input id="numero" name="numero" value={formData.numero} onChange={handleChange} /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="complemento">Complemento</Label><Input id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} /></div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label htmlFor="cidade">Cidade</Label><Input id="cidade" name="cidade" value={formData.cidade} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label htmlFor="estado_uf">UF</Label><Input id="estado_uf" name="estado_uf" value={formData.estado_uf} onChange={handleChange} maxLength={2} placeholder="Ex: SP"/></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/organizacoes')} disabled={isLoading || isCepLoading || !orgFound}><XCircle className="mr-2 h-5 w-5" /> Cancelar</Button>
          <Button type="submit" disabled={isLoading || isCepLoading || !orgFound}><Save className="mr-2 h-5 w-5" />{isLoading ? 'Salvando...' : 'Salvar Alterações'}</Button>
        </CardFooter>
      </form>
    </div>
  );
}

/* Supabase Integration Notes:
- On page load: Fetch Entidade data by ID, including direct address fields.
- Populate TiposEntidade select dynamically. Pre-select current tipoOrganizacaoId.
- On submit: Update public.Entidades with new data, including direct address fields.
- CEP API: Integrate real API.
*/
/*
-- Ensure public."Entidades" has direct address columns if this approach is taken:
ALTER TABLE public."Entidades"
  DROP COLUMN IF EXISTS id_endereco, -- If it was an FK
  ADD COLUMN IF NOT EXISTS logradouro VARCHAR(100),
  ADD COLUMN IF NOT EXISTS numero VARCHAR(20),
  ADD COLUMN IF NOT EXISTS complemento VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bairro VARCHAR(50),
  ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
  ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
  ADD COLUMN IF NOT EXISTS estado_uf VARCHAR(2);
*/

