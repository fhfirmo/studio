
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
import { UserCog, Save, XCircle, Home, Info, AlertTriangle, User } from 'lucide-react';
// import { useToast } from "@/hooks/use-toast"; // Uncomment if toasts are needed

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

// Placeholder function to fetch client data
async function getClientById(clientId: string) {
  console.log(`Fetching client data for ID: ${clientId} (placeholder)`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real app, fetch from Supabase
  if (clientId === "cli_001" || clientId === "cli_002" || clientId === "cli_003" || clientId === "cli_004" || clientId === "cli_005" || clientId === "1") { // Match existing placeholder IDs
    return {
      id: clientId,
      nomeCompleto: `Cliente Exemplo ${clientId.replace('cli_00', '')}`,
      email: `cliente${clientId.replace('cli_00', '')}@example.com`,
      cpf: `111.222.333-0${clientId.replace('cli_00', '')}`,
      telefone: `(11) 90000-000${clientId.replace('cli_00', '')}`,
      dataCadastro: `2024-0${clientId.replace('cli_00', '')}-10`,
      rua: 'Rua Exemplo',
      numero: '123',
      complemento: 'Apto 101',
      bairro: 'Bairro Modelo',
      cidade: 'Cidade Fictícia',
      estado: 'SP',
      cep: '01234-567',
      observacoes: `Observações sobre o cliente ${clientId}.`,
    };
  }
  return null; // Client not found
}

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  // const { toast } = useToast(); // Uncomment for feedback messages

  const [isLoading, setIsLoading] = useState(true);
  const [clientFound, setClientFound] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    cpf: '',
    telefone: '',
    dataCadastro: new Date().toISOString().split('T')[0],
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: '',
  });

  useEffect(() => {
    if (clientId) {
      setIsLoading(true);
      getClientById(clientId)
        .then(clientData => {
          if (clientData) {
            setFormData({
              nomeCompleto: clientData.nomeCompleto,
              email: clientData.email,
              cpf: clientData.cpf || '',
              telefone: clientData.telefone || '',
              dataCadastro: clientData.dataCadastro ? new Date(clientData.dataCadastro).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              rua: clientData.rua || '',
              numero: clientData.numero || '',
              complemento: clientData.complemento || '',
              bairro: clientData.bairro || '',
              cidade: clientData.cidade || '',
              estado: clientData.estado || '',
              cep: clientData.cep || '',
              observacoes: clientData.observacoes || '',
            });
            setClientFound(true);
          } else {
            setClientFound(false);
            // toast({ title: "Erro", description: "Cliente não encontrado.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Failed to fetch client data:", err);
          setClientFound(false);
          // toast({ title: "Erro", description: "Falha ao carregar dados do cliente.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [clientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // Client-side validation placeholder
    if (!formData.nomeCompleto || !formData.email) {
      console.error("Validação: Nome completo e E-mail são obrigatórios.");
      // toast({ title: "Campos Obrigatórios", description: "Nome completo e E-mail são obrigatórios.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    const updatePayload = { ...formData };
    // Email is typically not updated, or handled with caution due to auth implications if clients can log in.
    // For this admin edit, we might allow it, or keep it read-only as per earlier.
    // delete updatePayload.email; 

    console.log('Form data to be submitted for update:', updatePayload);

    // Placeholder for Supabase API call to update client data (PUT or PATCH)
    // try {
    //   // const { data, error } = await supabase.from('clientes').update(updatePayload).eq('id', clientId).select();
    //   // if (error) throw error;
    //   // console.log('Client updated successfully:', data);
    //   // toast({ title: "Cliente Atualizado!", description: "Os dados do cliente foram salvos com sucesso." });
    //   // router.push('/admin/clientes'); // Or to client detail page
    // } catch (error: any) {
    //   // console.error('Failed to update client:', error.message);
    //   // toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated client update finished');
    // toast({ title: "Cliente Atualizado! (Simulado)", description: "Os dados do cliente foram salvos com sucesso." });
    setIsLoading(false);
    router.push('/admin/clientes'); 
  };

  if (isLoading && clientFound === null) {
    return <div className="container mx-auto px-4 py-8 md:py-12 text-center">Carregando dados do cliente...</div>;
  }

  if (clientFound === false) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Cliente não encontrado</h1>
        <p className="text-muted-foreground mt-2">
          O cliente com o ID "{clientId}" não foi encontrado ou não pôde ser carregado.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/clientes">Voltar para Lista de Clientes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <UserCog className="mr-3 h-8 w-8" /> Editar Cliente: {formData.nomeCompleto}
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/clientes">
              <XCircle className="mr-2 h-4 w-4" /> Cancelar e Voltar
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Modifique os dados do cliente abaixo.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="infoGerais" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
            <TabsTrigger value="infoGerais" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Informações Gerais
            </TabsTrigger>
            <TabsTrigger value="endereco" className="flex items-center gap-2">
              <Home className="h-4 w-4" /> Endereço
            </TabsTrigger>
            <TabsTrigger value="outrasInfo" className="flex items-center gap-2">
              <Info className="h-4 w-4" /> Outras Informações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="infoGerais">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Dados Pessoais e Contato</CardTitle>
                <CardDescription>Informações básicas para identificação e comunicação com o cliente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nomeCompleto">Nome Completo <span className="text-destructive">*</span></Label>
                    <Input
                      id="nomeCompleto"
                      name="nomeCompleto"
                      value={formData.nomeCompleto}
                      onChange={handleChange}
                      placeholder="Nome completo do cliente"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange} // Typically readOnly, but allowing change as per flexible interpretation
                      // readOnly
                      // className="bg-muted/50 cursor-not-allowed"
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      type="tel"
                      value={formData.telefone}
                      onChange={handleChange}
                      placeholder="(XX) XXXXX-XXXX"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-1"> {/* Adjusted to not span full width */}
                    <Label htmlFor="dataCadastro">Data de Cadastro</Label>
                    <Input
                        id="dataCadastro"
                        name="dataCadastro"
                        type="date"
                        value={formData.dataCadastro}
                        onChange={handleChange}
                    />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endereco">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Endereço do Cliente</CardTitle>
                <CardDescription>Informações de localização do cliente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="rua">Rua</Label>
                    <Input id="rua" name="rua" value={formData.rua} onChange={handleChange} placeholder="Nome da rua, avenida, etc." />
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
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" name="cidade" value={formData.cidade} onChange={handleChange} placeholder="Nome da cidade" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select name="estado" value={formData.estado} onValueChange={(value) => handleSelectChange('estado', value)}>
                      <SelectTrigger id="estado">
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
                    <Label htmlFor="cep">CEP</Label>
                    <Input id="cep" name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outrasInfo">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Outras Informações</CardTitle>
                <CardDescription>Observações e detalhes adicionais sobre o cliente.</CardDescription>
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
          <Button type="submit" disabled={isLoading || clientFound === false}>
            <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}

    

    