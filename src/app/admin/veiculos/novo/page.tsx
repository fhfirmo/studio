
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Save, XCircle, User, Building } from 'lucide-react';
// import { useToast } from "@/hooks/use-toast";

// Placeholder data - In a real app, these would come from Supabase
const placeholderModelosVeiculo = [
  { id: "mod_001", nome: "Fiat Uno Mille" },
  { id: "mod_002", nome: "Volkswagen Gol G5" },
  { id: "mod_003", nome: "Chevrolet Onix Plus" },
  { id: "mod_004", nome: "Toyota Hilux SW4" },
];

const placeholderPessoasFisicas = [
  { id: "pf_001", nomeCompleto: "João da Silva Sauro", cpf: "123.456.789-00" },
  { id: "pf_002", nomeCompleto: "Maria Oliveira Costa", cpf: "987.654.321-99" },
];

const placeholderOrganizacoes = [
  { id: "org_001", nome: "Cooperativa Alfa", cnpj: "11.222.333/0001-44" },
  { id: "org_002", nome: "Associação Beta", cnpj: "22.333.444/0001-55" },
];


export default function NovoVeiculoPage() {
  const router = useRouter();
  // const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tipoProprietario, setTipoProprietario] = useState<'pessoa_fisica' | 'organizacao' | ''>('');

  const [formData, setFormData] = useState({
    placa: '',
    modeloId: '', // Changed from modelo to modeloId
    marca: '',
    ano: '',
    cor: '',
    chassi: '',
    quilometragem: '',
    observacoes: '',
    proprietarioId: '',
  });

  const handleTipoProprietarioChange = (value: 'pessoa_fisica' | 'organizacao' | '') => {
    setTipoProprietario(value);
    setFormData(prev => ({ ...prev, proprietarioId: '' })); // Reset proprietarioId when type changes
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
    setIsLoading(true);

    // Client-side validation placeholder
    if (!formData.placa || !formData.modeloId || !formData.marca || !formData.ano || !tipoProprietario || !formData.proprietarioId) {
      // toast({ title: "Campos Obrigatórios", description: "Placa, Modelo, Marca, Ano, Tipo de Proprietário e Proprietário são obrigatórios.", variant: "destructive" });
      console.error("Validação: Placa, Modelo, Marca, Ano, Tipo de Proprietário e Proprietário são obrigatórios.");
      setIsLoading(false);
      return;
    }
    
    const payload: any = {
      placa: formData.placa,
      id_modelo_veiculo: formData.modeloId, // Supabase: FK to public.ModelosVeiculo
      marca: formData.marca,
      ano: parseInt(formData.ano, 10),
      cor: formData.cor,
      chassi: formData.chassi,
      quilometragem: formData.quilometragem ? parseInt(formData.quilometragem, 10) : null,
      observacoes: formData.observacoes,
      id_proprietario_pessoa_fisica: null,
      id_proprietario_entidade: null,
    };

    if (tipoProprietario === 'pessoa_fisica') {
      payload.id_proprietario_pessoa_fisica = formData.proprietarioId;
    } else if (tipoProprietario === 'organizacao') {
      payload.id_proprietario_entidade = formData.proprietarioId;
    }
    
    console.log('Form data to be submitted (Veículo):', payload);

    // Placeholder for Supabase API call to create a new vehicle in public.Veiculos
    // Send id_proprietario_pessoa_fisica OR id_proprietario_entidade based on tipoProprietario.
    // Send id_modelo_veiculo.
    // try {
    //   // const { data, error } = await supabase.from('Veiculos').insert([payload]).select();
    //   // if (error) throw error;
    //   // console.log('Vehicle created successfully:', data);
    //   // toast({ title: "Veículo Cadastrado!", description: "O novo veículo foi adicionado com sucesso." });
    //   // router.push('/admin/veiculos');
    // } catch (error: any) {
    //   // console.error('Failed to create vehicle:', error.message);
    //   // toast({ title: "Erro ao Cadastrar", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsLoading(false);
    // }

    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated vehicle creation finished');
    setIsLoading(false);
    router.push('/admin/veiculos'); 
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <Car className="mr-3 h-8 w-8" /> Cadastro de Novo Veículo
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/veiculos">
              <XCircle className="mr-2 h-4 w-4" /> Voltar para Lista de Veículos
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Preencha os dados abaixo para adicionar um novo veículo ao sistema.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Dados do Veículo</CardTitle>
            <CardDescription>Informações de identificação e características.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="placa">Placa <span className="text-destructive">*</span></Label>
                <Input id="placa" name="placa" value={formData.placa} onChange={handleChange} placeholder="ABC-1234 ou ABC1D23" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modeloId">Modelo <span className="text-destructive">*</span></Label>
                {/* Supabase: Options for this select should be loaded from public.ModelosVeiculo */}
                <Select name="modeloId" value={formData.modeloId} onValueChange={(value) => handleSelectChange('modeloId', value)} required>
                  <SelectTrigger id="modeloId"><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
                  <SelectContent>
                    {placeholderModelosVeiculo.map(modelo => (
                      <SelectItem key={modelo.id} value={modelo.id}>{modelo.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca <span className="text-destructive">*</span></Label>
                <Input id="marca" name="marca" value={formData.marca} onChange={handleChange} placeholder="Ex: Fiat, Volkswagen" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ano">Ano <span className="text-destructive">*</span></Label>
                <Input id="ano" name="ano" type="number" value={formData.ano} onChange={handleChange} placeholder="AAAA" min="1900" max={new Date().getFullYear() + 1} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <Input id="cor" name="cor" value={formData.cor} onChange={handleChange} placeholder="Ex: Preto, Prata" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chassi">Número do Chassi</Label>
                <Input id="chassi" name="chassi" value={formData.chassi} onChange={handleChange} placeholder="Número de identificação" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quilometragem">Quilometragem</Label>
              <Input id="quilometragem" name="quilometragem" type="number" value={formData.quilometragem} onChange={handleChange} placeholder="Ex: 50000" min="0" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Dados do Proprietário</CardTitle>
            <CardDescription>Selecione o tipo e o proprietário do veículo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tipoProprietario">Tipo de Proprietário <span className="text-destructive">*</span></Label>
              <Select name="tipoProprietario" value={tipoProprietario} onValueChange={(value: 'pessoa_fisica' | 'organizacao' | '') => handleTipoProprietarioChange(value)} required>
                <SelectTrigger id="tipoProprietario"><SelectValue placeholder="Selecione o tipo de proprietário" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoa_fisica"><User className="mr-2 h-4 w-4 inline-block" /> Pessoa Física</SelectItem>
                  <SelectItem value="organizacao"><Building className="mr-2 h-4 w-4 inline-block" /> Organização</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipoProprietario && (
              <div className="space-y-2">
                <Label htmlFor="proprietarioId">Proprietário <span className="text-destructive">*</span></Label>
                {/* Supabase: Options for this select should be loaded from public.PessoasFisicas or public.Entidades based on tipoProprietario */}
                <Select name="proprietarioId" value={formData.proprietarioId} onValueChange={(value) => handleSelectChange('proprietarioId', value)} required>
                  <SelectTrigger id="proprietarioId">
                     <SelectValue placeholder={`Selecione ${tipoProprietario === 'pessoa_fisica' ? 'a Pessoa Física' : 'a Organização'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoProprietario === 'pessoa_fisica' && placeholderPessoasFisicas.map(pf => (
                      <SelectItem key={pf.id} value={pf.id}>{pf.nomeCompleto} ({pf.cpf})</SelectItem>
                    ))}
                    {tipoProprietario === 'organizacao' && placeholderOrganizacoes.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.nome} ({org.cnpj})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Outras Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} placeholder="Observações relevantes sobre o veículo..." rows={4} />
          </CardContent>
        </Card>

        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/veiculos')} disabled={isLoading}>
            <XCircle className="mr-2 h-5 w-5" /> Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Cadastrando...' : 'Cadastrar Veículo'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}
