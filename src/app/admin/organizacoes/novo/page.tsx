
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

const placeholderTiposOrganizacao = [
  { value: "1", label: "Instituição (ID 1)" }, // Assuming IDs are numeric
  { value: "2", label: "Federação (ID 2)" },
  { value: "3", label: "Cooperativa Principal (ID 3)" },
];

// Placeholder for CEP API call
async function fetchAddressFromCEP(cep: string): Promise<any | null> {
  if (cep.replace(/\D/g, '').length !== 8) {
    // toast({ title: "CEP Inválido", description: "Por favor, insira um CEP com 8 dígitos.", variant: "destructive" });
    return null;
  }
  console.log(`Simulating API call for CEP: ${cep}`);
  // toast({ title: "Buscando CEP...", description: `Consultando CEP: ${cep}`, duration: 1500 });
  await new Promise(resolve => setTimeout(resolve, 700));
  if (cep.startsWith("01001")) {
    return { logradouro: "Avenida Paulista", bairro: "Bela Vista", cidade: "São Paulo", estado_uf: "SP", cep: "01001-000" };
  } else if (cep.startsWith("70000")) {
     return { logradouro: "Via Principal do Setor", bairro: "Setor de Testes", cidade: "Brasília", estado_uf: "DF", cep: "70000-000" };
  }
  // toast({ title: "CEP Não Encontrado", description: "Não foi possível encontrar o endereço para este CEP.", variant: "default" });
  return null;
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
    tipoOrganizacaoId: '', // Changed from tipoOrganizacao to tipoOrganizacaoId
    telefone: '',
    email: '',
    dataCadastro: new Date().toISOString().split('T')[0],
    // Endereço direto
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade: '',
    estado_uf: '',
  });

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
      // Os campos de endereço agora fazem parte direta do payload de Entidades
      const entidadePayload = {
        nome: formData.nomeOrganizacao,
        codigo_entidade: formData.codigoEntidade,
        cnpj: formData.cnpj,
        id_tipo_entidade: parseInt(formData.tipoOrganizacaoId, 10), // Ensure it's an integer
        telefone: formData.telefone || null,
        email: formData.email || null,
        data_cadastro: formData.dataCadastro, // Supabase will handle default if not provided by client
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cep: formData.cep || null,
        cidade: formData.cidade || null,
        estado_uf: formData.estado_uf || null,
        // responsavel_cadastro: ??? // This needs to come from logged-in user or a specific field
        // user_id: ??? // This needs to come from logged-in user
      };

      const { data, error } = await supabase
        .from('Entidades')
        .insert([entidadePayload])
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: "Organização Cadastrada!", description: `${data?.nome || 'A nova organização'} foi adicionada.` });
      router.push('/admin/organizacoes');

    } catch (error: any) {
      console.error('Erro ao cadastrar Organização:', error);
      toast({ title: "Erro ao Cadastrar", description: error.message, variant: "destructive" });
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
            <Link href="/admin/organizacoes"><XCircle className="mr-2 h-4 w-4" /> Voltar para Lista</Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">Preencha os dados abaixo.</p>
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
                <div className="space-y-2 md:w-1/2 pr-3"><Label htmlFor="dataCadastro">Data Cadastro</Label><Input id="dataCadastro" name="dataCadastro" type="date" value={formData.dataCadastro} onChange={handleChange} /></div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Changed to 3 columns for Bairro, Cidade, UF */}
                  <div className="space-y-2"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label htmlFor="cidade">Cidade</Label><Input id="cidade" name="cidade" value={formData.cidade} onChange={handleChange} /></div>
                  <div className="space-y-2"><Label htmlFor="estado_uf">UF</Label><Input id="estado_uf" name="estado_uf" value={formData.estado_uf} onChange={handleChange} maxLength={2} placeholder="Ex: SP"/></div>
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

/* Supabase Integration Notes:
- Entidades table will now have direct address columns: logradouro, numero, complemento, bairro, cep, cidade, estado_uf.
- Remove any logic related to creating/updating a separate Enderecos table.
- When inserting Entidades, these address fields are part of the main payload.
- For CEP API: Implement the actual API call in fetchAddressFromCEP.
- Ensure RLS policies for Entidades allow writing these new address columns.
- `id_tipo_entidade` must be fetched dynamically for the select.
- `responsavel_cadastro` and `user_id` (for auditing) should be set on the backend or from the logged-in user session.
*/
/*
-- Example Entidades table modification (conceptual):
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
