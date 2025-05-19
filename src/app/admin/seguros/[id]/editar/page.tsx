
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ShieldAlert, Save, XCircle, CalendarIcon, Car, AlertTriangle } from 'lucide-react';
import { format, parseISO } from "date-fns";
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback messages

// Placeholder for vehicle options - In a real app, this would come from Supabase
const placeholderVehicles = [
  { id: "vei_001", description: "Fiat Uno - ABC-1234" },
  { id: "vei_002", description: "VW Gol - DEF-5678" },
  { id: "vei_003", description: "Chevrolet Onix - GHI-9012" },
  { id: "vei_004", description: "Hyundai HB20 - JKL-3456" },
  { id: "vei_005", description: "Ford Ka - MNO-7890" },
];

// Placeholder function to fetch seguro data
async function getSeguroById(seguroId: string) {
  console.log(`Fetching seguro data for ID: ${seguroId} (placeholder)`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real app, fetch from Supabase
  if (seguroId === "seg_001" || seguroId === "seg_002" || seguroId === "seg_003" || seguroId === "seg_004" || seguroId === "seg_005" ) {
    return {
      id: seguroId,
      numeroApolice: `APOLICE-2024-${seguroId.slice(-3)}`,
      veiculoId: `vei_${seguroId.slice(-3)}`, // Ensure this matches an ID in placeholderVehicles
      dataInicio: `2024-0${parseInt(seguroId.slice(-1),10)%5+1}-15`,
      dataFim: `2025-0${parseInt(seguroId.slice(-1),10)%5+1}-14`,
      valorTotal: (1200 + parseInt(seguroId.slice(-1),10) * 50.75).toString(),
      coberturas: `Cobertura total contra roubo, furto e colisão para o veículo ${seguroId.slice(-3)}. Assistência 24h.`,
      observacoes: `Apólice renovada anualmente. Cliente ${seguroId.slice(-3)} possui bom histórico.`,
    };
  }
  return null; // Seguro not found
}

export default function EditarSeguroPage() {
  const router = useRouter();
  const params = useParams();
  const seguroId = params.id as string;
  // const { toast } = useToast(); // Uncomment for feedback messages

  const [isLoading, setIsLoading] = useState(false);
  const [seguroFound, setSeguroFound] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    numeroApolice: '',
    veiculoId: '',
    dataInicio: undefined as Date | undefined,
    dataFim: undefined as Date | undefined,
    valorTotal: '',
    coberturas: '',
    observacoes: '',
  });

  // Placeholder: Fetch vehicle options from Supabase in a real app
  // const [vehicleOptions, setVehicleOptions] = useState<{id: string, description: string}[]>(placeholderVehicles);
  // useEffect(() => {
  //   async function fetchVehicles() {
  //     // const { data, error } = await supabase.from('veiculos').select('id, placa, modelo');
  //     // if (error) { console.error('Error fetching vehicles', error); return; }
  //     // setVehicleOptions(data.map(v => ({ id: v.id, description: `${v.modelo} - ${v.placa}` })));
  //   }
  //   fetchVehicles();
  // }, []);

  useEffect(() => {
    if (seguroId) {
      setIsLoading(true);
      getSeguroById(seguroId)
        .then(seguroData => {
          if (seguroData) {
            setFormData({
              numeroApolice: seguroData.numeroApolice,
              veiculoId: seguroData.veiculoId,
              dataInicio: seguroData.dataInicio ? parseISO(seguroData.dataInicio) : undefined,
              dataFim: seguroData.dataFim ? parseISO(seguroData.dataFim) : undefined,
              valorTotal: seguroData.valorTotal.toString().replace('.', ','), // Format for display
              coberturas: seguroData.coberturas || '',
              observacoes: seguroData.observacoes || '',
            });
            setSeguroFound(true);
          } else {
            setSeguroFound(false);
            // toast({ title: "Erro", description: "Seguro não encontrado.", variant: "destructive" });
          }
        })
        .catch(err => {
          console.error("Failed to fetch seguro data:", err);
          setSeguroFound(false);
          // toast({ title: "Erro", description: "Falha ao carregar dados do seguro.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [seguroId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setFormData(prev => ({...prev, [name]: date }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // Client-side validation placeholder
    if (!formData.numeroApolice || !formData.veiculoId || !formData.dataInicio || !formData.dataFim || !formData.valorTotal) {
      // toast({ title: "Campos Obrigatórios", description: "Todos os campos com * são obrigatórios.", variant: "destructive" });
      console.error("Validação: Número da Apólice, Veículo, Datas de Início/Fim e Valor Total são obrigatórios.");
      setIsLoading(false);
      return;
    }
    if (formData.dataFim && formData.dataInicio && formData.dataFim <= formData.dataInicio) {
      // toast({ title: "Data Inválida", description: "A Data de Fim deve ser posterior à Data de Início.", variant: "destructive" });
      console.error("Validação: A Data de Fim deve ser posterior à Data de Início.");
      setIsLoading(false);
      return;
    }
    
    const updatePayload = {
      ...formData,
      valorTotal: parseFloat(formData.valorTotal.replace(',', '.')), // Convert to number
      dataInicio: formData.dataInicio ? format(formData.dataInicio, "yyyy-MM-dd") : null,
      dataFim: formData.dataFim ? format(formData.dataFim, "yyyy-MM-dd") : null,
    };
    console.log('Form data to be submitted for update:', updatePayload);

    // Placeholder for Supabase API call to update seguro data (PUT or PATCH)
    // try {
    //   // const { data, error } = await supabase.from('seguros').update(updatePayload).eq('id', seguroId).select();
    //   // if (error) throw error;
    //   // console.log('Seguro updated successfully:', data);
    //   // toast({ title: "Seguro Atualizado!", description: "Os dados do seguro foram salvos com sucesso." });
    //   // router.push('/admin/seguros');
    // } catch (error: any) {
    //   // console.error('Failed to update seguro:', error.message);
    //   // toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated seguro update finished');
    // toast({ title: "Seguro Atualizado! (Simulado)", description: "Os dados do seguro foram salvos com sucesso." });
    setIsLoading(false);
    router.push('/admin/seguros'); 
  };

  if (isLoading && seguroFound === null) {
    return <div className="container mx-auto px-4 py-8 md:py-12 text-center">Carregando dados do seguro...</div>;
  }

  if (seguroFound === false) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Seguro não encontrado</h1>
        <p className="text-muted-foreground mt-2">
          O seguro com o ID "{seguroId}" não foi encontrado ou não pôde ser carregado.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/seguros">Voltar para Lista de Seguros</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <ShieldAlert className="mr-3 h-8 w-8" /> Editar Seguro: {formData.numeroApolice}
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/seguros">
              <XCircle className="mr-2 h-4 w-4" /> Cancelar e Voltar
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Modifique os dados do seguro abaixo.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Informações da Apólice</CardTitle>
            <CardDescription>Detalhes do seguro, veículo e vigência.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numeroApolice">Número da Apólice <span className="text-destructive">*</span></Label>
                <Input
                  id="numeroApolice"
                  name="numeroApolice"
                  value={formData.numeroApolice}
                  onChange={handleChange}
                  placeholder="Ex: APOLICE-XYZ-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="veiculoId">Veículo <span className="text-destructive">*</span></Label>
                {/* Comment: Options for this select will be loaded dynamically from Supabase 'veiculos' table. Current vehicle associated with the seguro should be pre-selected. */}
                <Select name="veiculoId" value={formData.veiculoId} onValueChange={(value) => handleSelectChange('veiculoId', value)} required>
                  <SelectTrigger id="veiculoId" aria-label="Selecionar veículo">
                    <Car className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecione o veículo segurado" />
                  </SelectTrigger>
                  <SelectContent>
                    {placeholderVehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal ${!formData.dataInicio && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dataInicio ? format(formData.dataInicio, "dd/MM/yyyy") : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dataInicio}
                      onSelect={(date) => handleDateChange('dataInicio', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim">Data de Fim <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal ${!formData.dataFim && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dataFim ? format(formData.dataFim, "dd/MM/yyyy") : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dataFim}
                      onSelect={(date) => handleDateChange('dataFim', date)}
                      disabled={(date) => formData.dataInicio ? date <= formData.dataInicio : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                 {/* Comment: Add validation: Data de Fim must be after Data de Início */}
              </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="valorTotal">Valor Total (R$) <span className="text-destructive">*</span></Label>
                <Input
                  id="valorTotal"
                  name="valorTotal"
                  type="text" // Use text to allow for comma, will parse to float on submit
                  value={formData.valorTotal}
                  onChange={handleChange}
                  placeholder="Ex: 1250,75"
                  required
                />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="coberturas">Coberturas</Label>
              <Textarea
                id="coberturas"
                name="coberturas"
                value={formData.coberturas}
                onChange={handleChange}
                placeholder="Descreva as coberturas do seguro..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                placeholder="Digite aqui quaisquer observações relevantes sobre o seguro..."
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/seguros')} disabled={isLoading}>
              <XCircle className="mr-2 h-5 w-5" /> Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || seguroFound === false}>
              <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

    