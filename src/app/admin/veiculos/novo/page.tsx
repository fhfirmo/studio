
"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Car, Save, XCircle } from 'lucide-react';
// import { useToast } from "@/hooks/use-toast"; // Uncomment if toasts are needed

export default function NovoVeiculoPage() {
  const router = useRouter();
  // const { toast } = useToast(); // Uncomment for feedback messages
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    marca: '',
    ano: '', // Represented as string to allow placeholder, convert to number on submit
    cor: '',
    chassi: '',
    quilometragem: '', // Represented as string, convert to number on submit
    observacoes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // Client-side validation placeholder
    if (!formData.placa || !formData.modelo || !formData.marca || !formData.ano) {
      // toast({ title: "Campos Obrigatórios", description: "Placa, Modelo, Marca e Ano são obrigatórios.", variant: "destructive" });
      console.error("Validação: Placa, Modelo, Marca e Ano são obrigatórios.");
      setIsLoading(false);
      return;
    }
    
    // Further validation (e.g., year format, km as number) would go here
    const payload = {
      ...formData,
      ano: parseInt(formData.ano, 10),
      quilometragem: formData.quilometragem ? parseInt(formData.quilometragem, 10) : undefined,
    };
    console.log('Form data to be submitted:', payload);

    // Placeholder for Supabase API call to create a new vehicle
    // try {
    //   // const { data, error } = await supabase.from('veiculos').insert([payload]).select();
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

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated vehicle creation finished');
    // toast({ title: "Veículo Cadastrado! (Simulado)", description: "O novo veículo foi adicionado com sucesso." });
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
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Informações do Veículo</CardTitle>
            <CardDescription>Detalhes para identificação e registro do veículo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="placa">Placa <span className="text-destructive">*</span></Label>
                <Input
                  id="placa"
                  name="placa"
                  value={formData.placa}
                  onChange={handleChange}
                  placeholder="ABC-1234 ou ABC1D23"
                  required
                />
                 {/* Consider using a library like 'react-input-mask' for plate formatting */}
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo <span className="text-destructive">*</span></Label>
                <Input
                  id="modelo"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  placeholder="Ex: Uno, Gol, Onix"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca <span className="text-destructive">*</span></Label>
                <Input
                  id="marca"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  placeholder="Ex: Fiat, Volkswagen, Chevrolet"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ano">Ano <span className="text-destructive">*</span></Label>
                <Input
                  id="ano"
                  name="ano"
                  type="number"
                  value={formData.ano}
                  onChange={handleChange}
                  placeholder="AAAA"
                  min="1900" 
                  max={new Date().getFullYear() + 1} // Allow current year + 1
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <Input
                  id="cor"
                  name="cor"
                  value={formData.cor}
                  onChange={handleChange}
                  placeholder="Ex: Preto, Prata, Branco"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chassi">Número do Chassi</Label>
                <Input
                  id="chassi"
                  name="chassi"
                  value={formData.chassi}
                  onChange={handleChange}
                  placeholder="Número de identificação do veículo"
                />
              </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="quilometragem">Quilometragem</Label>
                <Input
                  id="quilometragem"
                  name="quilometragem"
                  type="number"
                  value={formData.quilometragem}
                  onChange={handleChange}
                  placeholder="Ex: 50000"
                  min="0"
                />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                placeholder="Digite aqui quaisquer observações relevantes sobre o veículo..."
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/veiculos')} disabled={isLoading}>
              <XCircle className="mr-2 h-5 w-5" /> Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Cadastrando...' : 'Cadastrar Veículo'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
