
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Save, XCircle, MapPin, CalendarDays, Info, Briefcase, AlertTriangle } from 'lucide-react';
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback messages

const placeholderTiposOrganizacao = [
  { value: "instituicao", label: "Instituição" },
  { value: "federacao", label: "Federação" },
  { value: "cooperativa_principal", label: "Cooperativa Principal" },
  { value: "associacao_principal", label: "Associação Principal" },
  { value: "empresa_privada", label: "Empresa Privada" },
  { value: "outro", label: "Outro" },
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

// Placeholder for municipalities - In a real app, this would be dynamic based on selected state
const placeholderMunicipios: Record<string, {value: string, label: string}[]> = {
  SP: [{ value: "sao_paulo", label: "São Paulo" }, { value: "campinas", label: "Campinas" }],
  RJ: [{ value: "rio_de_janeiro", label: "Rio de Janeiro" }, { value: "niteroi", label: "Niterói" }],
  MG: [{ value: "belo_horizonte", label: "Belo Horizonte" }, { value: "uberlandia", label: "Uberlândia" }],
};

// Placeholder function to fetch organization data by ID
async function getOrganizacaoById(orgId: string) {
  console.log(`Fetching organization data for ID: ${orgId} (placeholder)`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real app, fetch from Supabase 'Entidades' table and related 'Enderecos'
  // Also fetch TipoOrganizacao.nome_tipo, Estado.nome_estado, Municipio.nome_municipio
  if (orgId === "org_001" || orgId === "org_002" || orgId === "org_003" || orgId === "org_004" || orgId === "org_005") {
    const baseId = parseInt(orgId.slice(-1), 10);
    return {
      id: orgId,
      nomeOrganizacao: `Cooperativa Exemplo ${baseId}`,
      codigoEntidade: `COD-ENT-${orgId.slice(-3)}`,
      cnpj: `11.222.333/000${baseId}-44`,
      tipoOrganizacao: placeholderTiposOrganizacao[baseId % placeholderTiposOrganizacao.length].value, // e.g., "cooperativa_principal"
      telefone: `(1${baseId}) 91234-567${baseId % 9}`,
      email: `contato@coopexemplo${baseId}.com`,
      dataCadastro: `2024-0${baseId}-10`, // Usually not editable, display only
      logradouro: `Rua das Cooperativas ${baseId * 10}`,
      numero: `${baseId * 100}`,
      complemento: `Bloco ${String.fromCharCode(65 + baseId - 1)}`,
      bairro: "Distrito Industrial",
      cep: `70000-00${baseId}`,
      estado: brazilianStates[baseId % brazilianStates.length].value, // e.g., SP
      municipio: placeholderMunicipios[brazilianStates[baseId % brazilianStates.length].value]?.[0]?.value || '', // e.g., "sao_paulo"
    };
  }
  return null; // Organization not found
}


export default function EditarOrganizacaoPage() {
  const router = useRouter();
  const params = useParams();
  const organizacaoId = params.id as string;
  // const { toast } = useToast(); // Uncomment for feedback messages
  
  const [isLoading, setIsLoading] = useState(false);
  const [orgFound, setOrgFound] = useState<boolean | null>(null);
  const [currentMunicipios, setCurrentMunicipios] = useState<{value: string, label: string}[]>([]);

  const [formData, setFormData] = useState({
    nomeOrganizacao: '',
    codigoEntidade: '',
    cnpj: '',
    tipoOrganizacao: '',
    telefone: '',
    email: '',
    dataCadastro: '', // Will be set from fetched data, typically not editable
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    estado: '',
    municipio: '',
  });

  useEffect(() => {
    if (organizacaoId) {
      setIsLoading(true);
      getOrganizacaoById(organizacaoId)
        .then(orgData => {
          if (orgData) {
            setFormData({
              nomeOrganizacao: orgData.nomeOrganizacao,
              codigoEntidade: orgData.codigoEntidade,
              cnpj: orgData.cnpj,
              tipoOrganizacao: orgData.tipoOrganizacao,
              telefone: orgData.telefone || '',
              email: orgData.email || '',
              dataCadastro: orgData.dataCadastro, // Display only
              logradouro: orgData.logradouro || '',
              numero: orgData.numero || '',
              complemento: orgData.complemento || '',
              bairro: orgData.bairro || '',
              cep: orgData.cep || '',
              estado: orgData.estado,
              municipio: orgData.municipio,
            });
            // @ts-ignore
            setCurrentMunicipios(placeholderMunicipios[orgData.estado] || []);
            setOrgFound(true);
          } else {
            setOrgFound(false);
            // toast({ title: "Erro", description: "Organização não encontrada.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Failed to fetch organization data:", err);
          setOrgFound(false);
          // toast({ title: "Erro", description: "Falha ao carregar dados da organização.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [organizacaoId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'estado') {
      // Simulate fetching municipalities based on state
      // @ts-ignore
      setCurrentMunicipios(placeholderMunicipios[value] || []);
      setFormData(prev => ({ ...prev, municipio: '' })); // Reset municipio if state changes
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // Client-side validation placeholder
    if (!formData.nomeOrganizacao || !formData.codigoEntidade || !formData.cnpj || !formData.tipoOrganizacao) {
      // toast({ title: "Campos Obrigatórios", description: "Nome, Código, CNPJ e Tipo são obrigatórios.", variant: "destructive" });
      console.error("Validação: Nome, Código, CNPJ e Tipo de Organização são obrigatórios.");
      setIsLoading(false);
      return;
    }
    
    // Exclude dataCadastro from the payload if it's not meant to be updated
    const { dataCadastro, ...updatePayload } = formData;
    console.log('Form data to be submitted for update:', updatePayload);

    // Placeholder for Supabase API call to update organization data (PUT or PATCH)
    // 1. Update Entidade record, possibly fetching/updating tipo_entidade_id, municipio_id, estado_id.
    // 2. Update Endereco record if address fields changed.
    // try {
    //   // const { data, error } = await supabase.from('Entidades').update(updatePayload).eq('id', organizacaoId).select();
    //   // if (error) throw error;
    //   // console.log('Organization updated successfully:', data);
    //   // toast({ title: "Organização Atualizada!", description: "Os dados da organização foram salvos com sucesso." });
    //   // router.push(`/admin/organizacoes/${organizacaoId}`); // Or back to list
    // } catch (error: any) {
    //   // console.error('Failed to update organization:', error.message);
    //   // toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated organization update finished');
    // toast({ title: "Organização Atualizada! (Simulado)", description: "Os dados da organização foram salvos com sucesso." });
    setIsLoading(false);
    router.push(`/admin/organizacoes`); 
  };
  
  if (isLoading && orgFound === null) {
    return <div className="container mx-auto px-4 py-8 md:py-12 text-center">Carregando dados da organização...</div>;
  }

  if (orgFound === false) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Organização não encontrada</h1>
        <p className="text-muted-foreground mt-2">
          A organização com o ID "{organizacaoId}" não foi encontrada ou não pôde ser carregada.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/organizacoes">Voltar para Lista de Organizações</Link>
        </Button>
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
            <Link href="/admin/organizacoes">
              <XCircle className="mr-2 h-4 w-4" /> Cancelar e Voltar
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Modifique os dados da organização abaixo.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="infoBasicas" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            <TabsTrigger value="infoBasicas" className="flex items-center gap-2">
              <Info className="h-4 w-4" /> Informações Básicas
            </TabsTrigger>
            <TabsTrigger value="endereco" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Endereço
            </TabsTrigger>
          </TabsList>

          <TabsContent value="infoBasicas">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Identificação e Contato</CardTitle>
                <CardDescription>Dados principais para registro e comunicação com a organização.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nomeOrganizacao">Nome da Organização <span className="text-destructive">*</span></Label>
                    <Input id="nomeOrganizacao" name="nomeOrganizacao" value={formData.nomeOrganizacao} onChange={handleChange} placeholder="Nome completo da organização" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigoEntidade">Código da Entidade <span className="text-destructive">*</span></Label>
                    <Input id="codigoEntidade" name="codigoEntidade" value={formData.codigoEntidade} onChange={handleChange} placeholder="Código único" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ <span className="text-destructive">*</span></Label>
                    <Input id="cnpj" name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="XX.XXX.XXX/YYYY-ZZ" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipoOrganizacao">Tipo de Organização <span className="text-destructive">*</span></Label>
                    <Select name="tipoOrganizacao" value={formData.tipoOrganizacao} onValueChange={(value) => handleSelectChange('tipoOrganizacao', value)} required>
                      <SelectTrigger id="tipoOrganizacao" aria-label="Selecionar tipo da organização">
                        <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {placeholderTiposOrganizacao.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="contato@organizacao.com" />
                    </div>
                </div>
                <div className="space-y-2 md:w-1/2 pr-3">
                    <Label htmlFor="dataCadastro">Data de Cadastro</Label>
                    <Input id="dataCadastro" name="dataCadastro" type="date" value={formData.dataCadastro} readOnly className="bg-muted/50 cursor-not-allowed" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endereco">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Endereço da Organização</CardTitle>
                <CardDescription>Informações de localização da sede ou filial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input id="logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} placeholder="Rua, Avenida, etc." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input id="numero" name="numero" value={formData.numero} onChange={handleChange} placeholder="Ex: 123" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Sala, Bloco, Andar, etc." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} placeholder="Nome do bairro" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input id="cep" name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select name="estado" value={formData.estado} onValueChange={(value) => handleSelectChange('estado', value)}>
                      <SelectTrigger id="estado" aria-label="Selecionar estado">
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map(state => (
                          <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="municipio">Município</Label>
                    <Select name="municipio" value={formData.municipio} onValueChange={(value) => handleSelectChange('municipio', value)} disabled={!formData.estado || currentMunicipios.length === 0}>
                      <SelectTrigger id="municipio" aria-label="Selecionar município">
                        <SelectValue placeholder={formData.estado && currentMunicipios.length > 0 ? "Selecione o município" : "Selecione o estado primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {currentMunicipios.map(municipio => (
                          <SelectItem key={municipio.value} value={municipio.value}>{municipio.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/organizacoes')} disabled={isLoading}>
            <XCircle className="mr-2 h-5 w-5" /> Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || orgFound === false}>
            <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}


    