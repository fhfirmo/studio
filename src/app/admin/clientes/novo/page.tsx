
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Save, XCircle, Home, Info } from 'lucide-react';
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

export default function NovoClientePage() {
  const router = useRouter();
  // const { toast } = useToast(); // Uncomment for feedback messages
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
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
      // toast({ title: "Campos Obrigatórios", description: "Nome completo e E-mail são obrigatórios.", variant: "destructive" });
      console.error("Validação: Nome completo e E-mail são obrigatórios.");
      setIsLoading(false);
      return;
    }
    
    console.log('Form data to be submitted:', formData);

    // Placeholder for Supabase API call to create a new client
    // try {
    //   // const { data, error } = await supabase.from('clientes').insert([formData]).select();
    //   // if (error) throw error;
    //   // console.log('Client created successfully:', data);
    //   // toast({ title: "Cliente Cadastrado!", description: "O novo cliente foi adicionado com sucesso." });
    //   // router.push('/admin/dashboard'); // Or to client list page
    // } catch (error: any) {
    //   // console.error('Failed to create client:', error.message);
    //   // toast({ title: "Erro ao Cadastrar", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated client creation finished');
    // toast({ title: "Cliente Cadastrado! (Simulado)", description: "O novo cliente foi adicionado com sucesso." });
    setIsLoading(false);
    router.push('/admin/dashboard'); 
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <UserPlus className="mr-3 h-8 w-8" /> Cadastro de Novo Cliente
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/dashboard">
              <XCircle className="mr-2 h-4 w-4" /> Voltar ao Painel
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Preencha os dados abaixo para adicionar um novo cliente ao sistema.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="infoGerais" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
            <TabsTrigger value="infoGerais" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Informações Gerais
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
                     {/* Client-side validation message placeholder */}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@exemplo.com"
                      required
                    />
                    {/* Client-side validation message placeholder */}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="space-y-2">
                    <Label htmlFor="dataCadastro">Data de Cadastro</Label>
                    <Input
                      id="dataCadastro"
                      name="dataCadastro"
                      type="date"
                      value={formData.dataCadastro}
                      onChange={handleChange}
                    />
                  </div>
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
          <Button type="button" variant="outline" onClick={() => router.push('/admin/dashboard')} disabled={isLoading}>
            <XCircle className="mr-2 h-5 w-5" /> Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Cadastrando...' : 'Cadastrar Cliente'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}

    