
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Car, Save, XCircle, AlertTriangle } from 'lucide-react';
// import { useToast } from "@/hooks/use-toast"; // Uncomment if toasts are needed

// Placeholder function to fetch vehicle data
async function getVehicleById(vehicleId: string) {
  console.log(`Fetching vehicle data for ID: ${vehicleId} (placeholder)`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real app, fetch from Supabase
  if (vehicleId === "vei_001" || vehicleId === "vei_002" || vehicleId === "vei_003" || vehicleId === "vei_004" || vehicleId === "vei_005") { // Match existing placeholder IDs
    return {
      id: vehicleId,
      placa: `ABC-12${vehicleId.slice(-2)}`,
      modelo: `Modelo Exemplo ${vehicleId.slice(-1)}`,
      marca: `Marca Exemplo ${vehicleId.slice(-1)}`,
      ano: (2020 + parseInt(vehicleId.slice(-1), 10) % 5).toString(),
      cor: "Preto",
      chassi: `CHASSI${vehicleId.toUpperCase()}XYZ`,
      quilometragem: (50000 + parseInt(vehicleId.slice(-1), 10) * 1000).toString(),
      observacoes: `Observações sobre o veículo ${vehicleId}.`,
    };
  }
  return null; // Vehicle not found
}


export default function EditarVeiculoPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;
  // const { toast } = useToast(); // Uncomment for feedback messages

  const [isLoading, setIsLoading] = useState(false);
  const [vehicleFound, setVehicleFound] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    marca: '',
    ano: '',
    cor: '',
    chassi: '',
    quilometragem: '',
    observacoes: '',
  });

  useEffect(() => {
    if (vehicleId) {
      setIsLoading(true);
      getVehicleById(vehicleId)
        .then(vehicleData => {
          if (vehicleData) {
            setFormData({
              placa: vehicleData.placa,
              modelo: vehicleData.modelo,
              marca: vehicleData.marca,
              ano: vehicleData.ano.toString(),
              cor: vehicleData.cor || '',
              chassi: vehicleData.chassi || '',
              quilometragem: vehicleData.quilometragem ? vehicleData.quilometragem.toString() : '',
              observacoes: vehicleData.observacoes || '',
            });
            setVehicleFound(true);
          } else {
            setVehicleFound(false);
            // toast({ title: "Erro", description: "Veículo não encontrado.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Failed to fetch vehicle data:", err);
          setVehicleFound(false);
          // toast({ title: "Erro", description: "Falha ao carregar dados do veículo.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [vehicleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // Client-side validation placeholder
    if (!formData.placa || !formData.modelo || !formData.marca || !formData.ano) {
      console.error("Validação: Placa, Modelo, Marca e Ano são obrigatórios.");
      // toast({ title: "Campos Obrigatórios", description: "Placa, Modelo, Marca e Ano são obrigatórios.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    const updatePayload = {
      ...formData,
      ano: parseInt(formData.ano, 10),
      quilometragem: formData.quilometragem ? parseInt(formData.quilometragem, 10) : undefined,
    };
    console.log('Form data to be submitted for update:', updatePayload);

    // Placeholder for Supabase API call to update vehicle data (PUT or PATCH)
    // try {
    //   // const { data, error } = await supabase.from('veiculos').update(updatePayload).eq('id', vehicleId).select();
    //   // if (error) throw error;
    //   // console.log('Vehicle updated successfully:', data);
    //   // toast({ title: "Veículo Atualizado!", description: "Os dados do veículo foram salvos com sucesso." });
    //   // router.push('/admin/veiculos'); // Or to vehicle detail page
    // } catch (error: any) {
    //   // console.error('Failed to update vehicle:', error.message);
    //   // toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated vehicle update finished');
    // toast({ title: "Veículo Atualizado! (Simulado)", description: "Os dados do veículo foram salvos com sucesso." });
    setIsLoading(false);
    router.push('/admin/veiculos'); 
  };

  if (isLoading && vehicleFound === null) {
    return <div className="container mx-auto px-4 py-8 md:py-12 text-center">Carregando dados do veículo...</div>;
  }

  if (vehicleFound === false) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Veículo não encontrado</h1>
        <p className="text-muted-foreground mt-2">
          O veículo com o ID "{vehicleId}" não foi encontrado ou não pôde ser carregado.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/veiculos">Voltar para Lista de Veículos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <Car className="mr-3 h-8 w-8" /> Editar Veículo: {formData.modelo} - {formData.placa}
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/veiculos">
              <XCircle className="mr-2 h-4 w-4" /> Cancelar e Voltar
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Modifique os dados do veículo abaixo.
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
                  max={new Date().getFullYear() + 1}
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
            <Button type="submit" disabled={isLoading || vehicleFound === false}>
              <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
