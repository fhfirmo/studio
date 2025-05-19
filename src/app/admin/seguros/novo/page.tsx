
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ShieldPlus, Save, XCircle, CalendarIcon, Car } from 'lucide-react';
import { format } from "date-fns";
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback messages

// Placeholder for vehicle options - In a real app, this would come from Supabase
const placeholderVehicles = [
  { id: "vei_001", description: "Fiat Uno - ABC-1234" },
  { id: "vei_002", description: "VW Gol - DEF-5678" },
  { id: "vei_003", description: "Chevrolet Onix - GHI-9012" },
];

export default function NovoSeguroPage() {
  const router = useRouter();
  // const { toast } = useToast(); // Uncomment for feedback messages
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    numeroApolice: '',
    veiculoId: '', // Store the ID of the selected vehicle
    dataInicio: undefined as Date | undefined,
    dataFim: undefined as Date | undefined,
    valorTotal: '', // Store as string to allow for currency input
    coberturas: '',
    observacoes: '',
  });

  // Placeholder: Fetch vehicles from Supabase
  // useEffect(() => {
  //   async function fetchVehicles() {
  //     // const { data, error } = await supabase.from('veiculos').select('id, placa, modelo');
  //     // if (error) { console.error('Error fetching vehicles', error); return; }
  //     // setVehicleOptions(data.map(v => ({ id: v.id, description: `${v.modelo} - ${v.placa}` })));
  //   }
  //   fetchVehicles();
  // }, []);

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
      // toast({ title: "Campos Obrigatórios", description: "Número da Apólice, Veículo, Datas de Início/Fim e Valor Total são obrigatórios.", variant: "destructive" });
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
    
    const payload = {
      ...formData,
      valorTotal: parseFloat(formData.valorTotal.replace(',', '.')), // Convert to number
      dataInicio: formData.dataInicio ? format(formData.dataInicio, "yyyy-MM-dd") : null,
      dataFim: formData.dataFim ? format(formData.dataFim, "yyyy-MM-dd") : null,
    };
    console.log('Form data to be submitted:', payload);

    // Placeholder for Supabase API call to create a new seguro
    // try {
    //   // const { data, error } = await supabase.from('seguros').insert([payload]).select();
    //   // if (error) throw error;
    //   // console.log('Seguro created successfully:', data);
    //   // toast({ title: "Seguro Cadastrado!", description: "O novo seguro foi adicionado com sucesso." });
    //   // router.push('/admin/seguros');
    // } catch (error: any) {
    //   // console.error('Failed to create seguro:', error.message);
    //   // toast({ title: "Erro ao Cadastrar", description: error.message, variant: "destructive" });
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Simulated seguro creation finished');
    // toast({ title: "Seguro Cadastrado! (Simulado)", description: "O novo seguro foi adicionado com sucesso." });
    setIsLoading(false);
    router.push('/admin/seguros'); 
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <ShieldPlus className="mr-3 h-8 w-8" /> Cadastro de Novo Seguro
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/seguros">
              <XCircle className="mr-2 h-4 w-4" /> Voltar para Lista de Seguros
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Preencha os dados abaixo para adicionar um novo seguro ao sistema.
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
                {/* Comment: Options for this select will be loaded dynamically from Supabase 'veiculos' table */}
                <Select name="veiculoId" value={formData.veiculoId} onValueChange={(value) => handleSelectChange('veiculoId', value)} required>
                  <SelectTrigger id="veiculoId" aria-label="Selecionar veículo">
                    <Car className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecione o veículo segurado" />
                  </SelectTrigger>
                  <SelectContent>
                    {placeholderVehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.description}</SelectItem>
                    ))}
                    {/* Add more options dynamically here */}
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
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Cadastrando...' : 'Cadastrar Seguro'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

    