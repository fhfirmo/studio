
"use client";

import { useState, useEffect, type FormEvent } from 'react';
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
import { Calendar } from "@/components/ui/calendar";
import { UserCog, Save, XCircle, HomeIcon, InfoIcon, AlertTriangle, Users, Briefcase, Link2, CalendarDays } from 'lucide-react';
import { format, parseISO } from "date-fns";
// import { useToast } from "@/hooks/use-toast";

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

const placeholderMunicipios: Record<string, {value: string, label: string}[]> = {
  SP: [{ value: "sao_paulo", label: "São Paulo" }, { value: "campinas", label: "Campinas" }],
  RJ: [{ value: "rio_de_janeiro", label: "Rio de Janeiro" }, { value: "niteroi", label: "Niterói" }],
  MG: [{ value: "belo_horizonte", label: "Belo Horizonte" }, { value: "uberlandia", label: "Uberlândia"}],
  BA: [{ value: "salvador", label: "Salvador" }, { value: "feira_de_santana", label: "Feira de Santana"}],
};

const tiposRelacao = [
  { value: "associado", label: "Associado" },
  { value: "cooperado", label: "Cooperado" },
  { value: "funcionario", label: "Funcionário" },
  { value: "cliente_geral", label: "Cliente Geral" },
];

const organizacoesDisponiveis = [
  { value: "org_001", label: "Cooperativa Alfa" },
  { value: "org_002", label: "Associação Beta" },
  { value: "org_003", label: "Empresa Gama" },
];

async function getPessoaFisicaById(id: string) {
  console.log(`Fetching PessoaFisica data for ID: ${id} (placeholder)`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulating fetching data for a specific ID, including related data.
  if (id === "pf_001" || id === "cli_001" || id === "1" ) { 
    return {
      id: "pf_001", // Consistent ID
      nomeCompleto: `João da Silva Sauro`,
      cpf: `123.456.789-00`,
      rg: `12.345.678-9`,
      dataNascimento: `1985-05-15`, // YYYY-MM-DD format
      email: `joao@exemplo.com`,
      telefone: `(11) 9876-5432`,
      tipoRelacao: "associado", // Matches value in tiposRelacao
      organizacaoVinculadaId: "org_001", // Matches value in organizacoesDisponiveis
      logradouro: 'Rua Exemplo das Couves',
      numero: '123',
      complemento: 'Apto 101',
      bairro: 'Bairro Modelo',
      municipio: 'sao_paulo', 
      estado: 'SP', // Matches value in brazilianStates
      cep: '01234-567',
      observacoes: `Observações sobre João da Silva Sauro. Este é um cliente de longa data e muito participativo.`,
      dataCadastro: '2024-01-15', // YYYY-MM-DD format
    };
  }
  if (id === "pf_003") { // Example for Cliente Geral
     return {
      id: "pf_003",
      nomeCompleto: "Carlos Pereira Lima",
      cpf: "111.222.333-44",
      rg: "33.444.555-6",
      dataNascimento: "1990-10-20",
      email: "carlos@exemplo.com",
      telefone: "(31) 9988-7766",
      tipoRelacao: "cliente_geral",
      organizacaoVinculadaId: "", // Should be empty for cliente_geral
      logradouro: 'Avenida Principal',
      numero: '1500',
      complemento: 'Loja B',
      bairro: 'Centro',
      municipio: 'belo_horizonte',
      estado: 'MG',
      cep: '30123-000',
      observacoes: `Carlos é um cliente geral interessado em consultoria.`,
      dataCadastro: '2024-03-10',
    };
  }
  console.warn(`PessoaFisica with ID ${id} not found in mock data.`);
  return null; 
}


export default function EditarPessoaFisicaPage() {
  const router = useRouter();
  const params = useParams();
  const pessoaFisicaId = params.id as string;
  // const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [pessoaFisicaFound, setPessoaFisicaFound] = useState<boolean | null>(null);
  const [currentMunicipios, setCurrentMunicipios] = useState<{value: string, label: string}[]>([]);
  const [dataCadastroDisplay, setDataCadastroDisplay] = useState<string | null>(null);

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
    estado: '',
    municipio: '',
    observacoes: '',
  });
  
  const isOrganizacaoRequired = formData.tipoRelacao !== '' && formData.tipoRelacao !== 'cliente_geral';

  useEffect(() => {
    if (pessoaFisicaId) {
      setIsLoading(true);
      getPessoaFisicaById(pessoaFisicaId)
        .then(data => {
          if (data) {
            setFormData({
              nomeCompleto: data.nomeCompleto || '',
              cpf: data.cpf || '',
              rg: data.rg || '',
              dataNascimento: data.dataNascimento ? parseISO(data.dataNascimento) : undefined,
              email: data.email || '',
              telefone: data.telefone || '',
              tipoRelacao: data.tipoRelacao || '',
              organizacaoVinculadaId: data.organizacaoVinculadaId || '',
              logradouro: data.logradouro || '',
              numero: data.numero || '',
              complemento: data.complemento || '',
              bairro: data.bairro || '',
              cep: data.cep || '',
              estado: data.estado || '',
              municipio: data.municipio || '', // Municipio will be set here
              observacoes: data.observacoes || '',
            });
            // This ensures municipios are loaded based on the fetched estado
            if (data.estado) {
                // @ts-ignore
                setCurrentMunicipios(placeholderMunicipios[data.estado] || []);
            }
            if (data.dataCadastro) {
              try {
                setDataCadastroDisplay(format(parseISO(data.dataCadastro), "dd/MM/yyyy"));
              } catch (e) {
                console.error("Error formatting dataCadastro:", e);
                setDataCadastroDisplay("Data inválida");
              }
            }
            setPessoaFisicaFound(true);
          } else {
            setPessoaFisicaFound(false);
            // toast({ title: "Erro", description: "Pessoa Física não encontrada.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Failed to fetch data:", err);
          setPessoaFisicaFound(false);
          // toast({ title: "Erro", description: "Falha ao carregar dados.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [pessoaFisicaId]);
  
  useEffect(() => {
    if (formData.estado) {
      // @ts-ignore
      setCurrentMunicipios(placeholderMunicipios[formData.estado] || []);
      // Do not reset municipio here if it was pre-filled and the state matches,
      // only if the state changes due to user interaction (handled in handleSelectChange)
    } else {
      setCurrentMunicipios([]);
    }

    // Ensure organizacaoVinculadaId is cleared if tipoRelacao is 'cliente_geral'
    // This should run after initial data load and also on subsequent changes to tipoRelacao
    if (formData.tipoRelacao === 'cliente_geral' && formData.organizacaoVinculadaId) {
      setFormData(prev => ({ ...prev, organizacaoVinculadaId: '' }));
    }
  }, [formData.estado, formData.tipoRelacao, formData.organizacaoVinculadaId]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'estado') { 
        // When user actively changes state, reset municipio
        setFormData(prev => ({ ...prev, municipio: '' }));
    }
  };
  
  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData(prev => ({...prev, [name]: date }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // Basic Client-side validation placeholder
    if (!formData.nomeCompleto || !formData.cpf || !formData.email || !formData.tipoRelacao) {
      console.error("Validação: Nome, CPF, E-mail e Tipo de Relação são obrigatórios.");
      // toast({ title: "Campos Obrigatórios", description: "Nome, CPF, E-mail e Tipo de Relação são obrigatórios.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    if (isOrganizacaoRequired && !formData.organizacaoVinculadaId) {
      console.error("Validação: Organização Vinculada é obrigatória para este tipo de relação.");
      // toast({ title: "Campo Obrigatório", description: "Organização Vinculada é obrigatória para este tipo de relação.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    const updatePayload = {
      ...formData,
      dataNascimento: formData.dataNascimento ? format(formData.dataNascimento, "yyyy-MM-dd") : null,
      // id_endereco will be handled by backend logic (update or create new)
      // id_organizacao, tipo_relacao are already in formData
    };
    console.log('Form data to be submitted for update (Pessoa Física):', updatePayload);
    // Supabase:
    // 1. Determine if address changed significantly to warrant new Endereco record or update existing.
    // 2. Prepare PessoasFisicas payload (id_endereco, tipo_relacao, id_organizacao_vinculada etc.)
    // 3. PATCH to /rest/v1/PessoasFisicas?id=eq.{pessoaFisicaId}
    // 4. Handle MembrosEntidade linkage if organizacaoVinculadaId or tipoRelacao changed.
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    console.log('Simulated pessoa física update finished');
    // toast({ title: "Pessoa Física Atualizada!", description: "Os dados foram salvos com sucesso." });
    setIsLoading(false);
    router.push('/admin/clientes'); 
  };

  if (isLoading && pessoaFisicaFound === null) {
    return <div className="container mx-auto px-4 py-8 md:py-12 text-center">Carregando dados...</div>;
  }

  if (pessoaFisicaFound === false) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Pessoa Física não encontrada</h1>
        <p className="text-muted-foreground mt-2">
          Os dados para o ID "{pessoaFisicaId}" não foram encontrados.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/clientes">Voltar para Lista</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <UserCog className="mr-3 h-8 w-8" /> Editar Pessoa Física: {formData.nomeCompleto}
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/clientes">
              <XCircle className="mr-2 h-4 w-4" /> Cancelar e Voltar
            </Link>
          </Button>
        </div>
        {dataCadastroDisplay && <p className="text-sm text-muted-foreground mt-1">Data de Cadastro: {dataCadastroDisplay}</p>}
      </header>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="infoPessoais" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
             <TabsTrigger value="infoPessoais" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Informações Pessoais
            </TabsTrigger>
            <TabsTrigger value="vinculo" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" /> Vínculo e Relação
            </TabsTrigger>
            <TabsTrigger value="endereco" className="flex items-center gap-2">
              <HomeIcon className="h-4 w-4" /> Endereço
            </TabsTrigger>
            <TabsTrigger value="outrasInfo" className="flex items-center gap-2">
              <InfoIcon className="h-4 w-4" /> Outras Informações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="infoPessoais">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>Informações básicas de identificação.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nomeCompleto">Nome Completo <span className="text-destructive">*</span></Label>
                    <Input id="nomeCompleto" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF <span className="text-destructive">*</span></Label>
                    <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input id="rg" name="rg" value={formData.rg} onChange={handleChange} placeholder="00.000.000-0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal ${!formData.dataNascimento && "text-muted-foreground"}`}
                            >
                            <CalendarDays className="mr-2 h-4 w-4" /> 
                            {formData.dataNascimento ? format(formData.dataNascimento, "dd/MM/yyyy") : <span>Selecione a data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={formData.dataNascimento}
                            onSelect={(date) => handleDateChange('dataNascimento', date)}
                            captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                  </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" required 
                    readOnly // Email is often an identifier and not directly editable
                    className="bg-muted/50 cursor-not-allowed" 
                    title="O e-mail é usado como identificador e não pode ser alterado diretamente nesta tela."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" name="telefone" type="tel" value={formData.telefone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vinculo">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Vínculo e Relação com Entidades</CardTitle>
                <CardDescription>Defina o tipo de relação e a organização vinculada, se aplicável.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="tipoRelacao">Tipo de Relação <span className="text-destructive">*</span></Label>
                    {/* Supabase: Options for this select should be loaded from public.TiposRelacaoPessoa ou similar */}
                    <Select name="tipoRelacao" value={formData.tipoRelacao} onValueChange={(value) => handleSelectChange('tipoRelacao', value)} required>
                      <SelectTrigger id="tipoRelacao" aria-label="Selecionar tipo de relação">
                        <Link2 className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Selecione o tipo de relação" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposRelacao.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isOrganizacaoRequired && (
                    <div className="space-y-2">
                        <Label htmlFor="organizacaoVinculadaId">Organização Vinculada <span className="text-destructive">*</span></Label>
                        {/* Supabase: Options for this select should be loaded from public.Entidades */}
                        <Select name="organizacaoVinculadaId" value={formData.organizacaoVinculadaId} onValueChange={(value) => handleSelectChange('organizacaoVinculadaId', value)} required={isOrganizacaoRequired}>
                        <SelectTrigger id="organizacaoVinculadaId" aria-label="Selecionar organização vinculada">
                            <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Selecione a organização" />
                        </SelectTrigger>
                        <SelectContent>
                            {organizacoesDisponiveis.map(org => (
                            <SelectItem key={org.value} value={org.value}>{org.label}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="endereco">
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>Informações de localização da pessoa física.</CardDescription>
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
                  <Input id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Apto, Bloco, Casa, etc." />
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
                    {/* Supabase: Options for this select should be loaded from public.Estados */}
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
                     {/* Supabase: Options for this select should be loaded from public.Municipios, filtered by formData.estado */}
                    <Select name="municipio" value={formData.municipio} onValueChange={(value) => handleSelectChange('municipio', value)} disabled={!formData.estado || currentMunicipios.length === 0}>
                      <SelectTrigger id="municipio" aria-label="Selecionar município">
                        <SelectValue placeholder={formData.estado && currentMunicipios.length > 0 ? "Selecione o município" : (formData.estado ? "Carregando municípios..." : "Selecione o estado primeiro")} />
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

          <TabsContent value="outrasInfo">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Outras Informações</CardTitle>
                <CardDescription>Observações e detalhes adicionais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  placeholder="Digite aqui quaisquer observações relevantes..."
                  rows={6}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/clientes')} disabled={isLoading}>
            <XCircle className="mr-2 h-5 w-5" /> Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || pessoaFisicaFound === false}>
            <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}

