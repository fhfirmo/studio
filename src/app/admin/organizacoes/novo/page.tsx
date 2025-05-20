
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Save, XCircle, MapPin, CalendarDays, Info, Briefcase } from 'lucide-react';
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback messages

// Placeholder data - In a real app, these would come from Supabase
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
const placeholderMunicipios = {
  SP: [{ value: "sao_paulo", label: "São Paulo" }, { value: "campinas", label: "Campinas" }],
  RJ: [{ value: "rio_de_janeiro", label: "Rio de Janeiro" }, { value: "niteroi", label: "Niterói" }],
  MG: [{ value: "belo_horizonte", label: "Belo Horizonte" }, { value: "uberlandia", label: "Uberlândia" }],
};

export default function NovaOrganizacaoPage() {
  const router = useRouter();
  // const { toast } = useToast(); // Uncomment for feedback messages
  const [isLoading, setIsLoading] = useState(false);
  const [currentMunicipios, setCurrentMunicipios] = useState<{value: string, label: string}[]>([]);

  const [formData, setFormData] = useState({
    nomeOrganizacao: '',
    codigoEntidade: '',
    cnpj: '',
    tipoOrganizacao: '',
    telefone: '',
    email: '',
    dataCadastro: new Date().toISOString().split('T')[0],
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    estado: '',
    municipio: '',
  });

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
      setFormData(prev => ({ ...prev, municipio: '' })); // Reset municipio
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // Client-side validation placeholder
    if (!formData.nomeOrganizacao || !formData.codigoEntidade || !formData.cnpj || !formData.tipoOrganizacao) {
      // toast({ title: "Campos Obrigatórios", description: "Nome da Organização, Código, CNPJ e Tipo são obrigatórios.", variant: "destructive" });
      console.error("Validação: Nome, Código, CNPJ e Tipo de Organização são obrigatórios.");
      setIsLoading(false);
      return;
    }
    
    console.log('Form data to be submitted:', formData);

    // Placeholder for Supabase API call
    // 1. Create Endereco record if address fields are filled, get endereco_id.
    // 2. Create Entidade record, linking tipo_entidade_id (fetched from TiposEntidade based on formData.tipoOrganizacao),
    //    municipio_id (fetched based on formData.municipio), estado_id, and the new endereco_id.
    // try {
    //   // let enderecoId = null;
    //   // if (formData.logradouro && formData.cep) { /* Create address, get ID */ }
    //   // const tipoEntidadeId = ... // Fetch from TiposEntidade
    //   // const municipioId = ... // Fetch from Municipios
    //   // const estadoId = ... // Fetch from Estados
    //   // const payload = { ...formData, endereco_id: enderecoId, tipo_entidade_id: tipoEntidadeId, ... };
    //   // const { data, error } = await supabase.from('Entidades').insert([payload]).select();
    //   // if (error) throw error;
    //   // console.log('Organization created successfully:', data);
    //   // toast({ title: "Organização Cadastrada!", description: "A nova organização foi adicionada com sucesso." });
    //   // router.push('/admin/organizacoes');
    // } catch (error: any) {
    //   // console.error('Failed to create organization:', error.message);
    //   // toast({ title: "Erro ao Cadastrar", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated organization creation finished');
    // toast({ title: "Organização Cadastrada! (Simulado)", description: "A nova organização foi adicionada com sucesso." });
    setIsLoading(false);
    router.push('/admin/organizacoes'); 
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <Building className="mr-3 h-8 w-8" /> Cadastro de Nova Organização
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/organizacoes">
              <XCircle className="mr-2 h-4 w-4" /> Voltar para Lista
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Preencha os dados abaixo para adicionar uma nova organização ao sistema.
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
                    {/* Comment: Consider using a library like 'react-input-mask' for CNPJ formatting */}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipoOrganizacao">Tipo de Organização <span className="text-destructive">*</span></Label>
                    {/* Comment: Options for this select will be loaded dynamically from Supabase 'TiposEntidade' table. */}
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
                <div className="space-y-2 md:w-1/2 pr-3"> {/* Adjusted width */}
                    <Label htmlFor="dataCadastro">Data de Cadastro</Label>
                    <Input id="dataCadastro" name="dataCadastro" type="date" value={formData.dataCadastro} onChange={handleChange} />
                    {/* Comment: This field might be auto-generated by the backend (Supabase default value or trigger) */}
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
                    {/* Comment: Consider using a library like 'react-input-mask' for CEP formatting */}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    {/* Comment: Options for this select will be loaded dynamically from Supabase 'Estados' table. */}
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
                    {/* Comment: Options for this select will be loaded dynamically from Supabase 'Municipios' table, filtered by selected state. */}
                    <Select name="municipio" value={formData.municipio} onValueChange={(value) => handleSelectChange('municipio', value)} disabled={!formData.estado || currentMunicipios.length === 0}>
                      <SelectTrigger id="municipio" aria-label="Selecionar município">
                        <SelectValue placeholder={formData.estado ? "Selecione o município" : "Selecione o estado primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {currentMunicipios.map(municipio => (
                          <SelectItem key={municipio.value} value={municipio.value}>{municipio.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Comment: Logic to filter municipalities based on selected state needs to be implemented. */}
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
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Organização'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}

    