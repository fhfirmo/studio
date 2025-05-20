
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Car, Edit3, Trash2, Search, Info, AlertTriangle, PlusCircle } from "lucide-react";
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  tipoEspecie: string;
  combustivel: string;
  nomeProprietario: string;
  tipoProprietario: 'Pessoa Física' | 'Organização' | 'N/A';
}

const initialVeiculos: Veiculo[] = [
  { id: "vei_001", placa: "ABC-1234", modelo: "Fiat Uno", marca: "Fiat", ano: 2020, tipoEspecie: "Passageiro", combustivel: "Flex", nomeProprietario: "João da Silva Sauro", tipoProprietario: "Pessoa Física" },
  { id: "vei_002", placa: "DEF-5678", modelo: "Volkswagen Gol", marca: "Volkswagen", ano: 2021, tipoEspecie: "Passageiro", combustivel: "Gasolina", nomeProprietario: "Cooperativa Alfa", tipoProprietario: "Organização" },
  { id: "vei_003", placa: "GHI-9012", modelo: "Chevrolet Onix", marca: "Chevrolet", ano: 2022, tipoEspecie: "Passageiro", combustivel: "Etanol", nomeProprietario: "Maria Oliveira Costa", tipoProprietario: "Pessoa Física" },
  { id: "vei_004", placa: "JKL-3456", modelo: "Hyundai HB20", marca: "Hyundai", ano: 2019, tipoEspecie: "Passageiro", combustivel: "Flex", nomeProprietario: "Associação Beta", tipoProprietario: "Organização" },
  { id: "vei_005", placa: "MNO-7890", modelo: "Ford Ka", marca: "Ford", ano: 2023, tipoEspecie: "Passageiro", combustivel: "Gasolina", nomeProprietario: "Carlos Pereira Lima", tipoProprietario: "Pessoa Física" },
];


export default function GerenciamentoVeiculosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>(initialVeiculos);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [veiculoToDelete, setVeiculoToDelete] = useState<{ id: string; placa: string; modelo: string } | null>(null);
  // const { toast } = useToast(); // Uncomment for feedback

  // In a real app, veiculos would be fetched from Supabase:
  // useEffect(() => {
  //   async function fetchVeiculos() {
  //     // const { data, error } = await supabase
  //     //  .from('Veiculos')
  //     //  .select(`
  //     //    id, placa, marca, ano, tipo_especie, combustivel,
  //     //    ModelosVeiculo ( nome_modelo ), 
  //     //    PessoasFisicas ( nome_completo ),
  //     //    Entidades ( nome_fantasia ) 
  //     //  `);
  //     // if (error) { /* handle error */ }
  //     // else { 
  //     //   const formattedData = data.map(v => ({
  //     //     id: v.id,
  //     //     placa: v.placa,
  //     //     modelo: v.ModelosVeiculo.nome_modelo, // Assuming 'ModelosVeiculo' is related table for model name
  //     //     marca: v.marca,
  //     //     ano: v.ano,
  //     //     tipoEspecie: v.tipo_especie,
  //     //     combustivel: v.combustivel,
  //     //     nomeProprietario: v.PessoasFisicas?.nome_completo || v.Entidades?.nome_fantasia || 'N/A',
  //     //     tipoProprietario: v.id_proprietario_pessoa_fisica ? 'Pessoa Física' : (v.id_proprietario_entidade ? 'Organização' : 'N/A'),
  //     //   }));
  //     //   setVeiculos(formattedData || []); 
  //     // }
  //   }
  //   fetchVeiculos();
  // }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    console.log(`Searching for vehicle: ${searchTerm} (placeholder - Supabase query needed for 'Veiculos' table, joining with PessoasFisicas/Entidades for owner name)`);
    // const filteredVeiculos = initialVeiculos.filter(veiculo => 
    //   veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   veiculo.nomeProprietario.toLowerCase().includes(searchTerm.toLowerCase())
    // );
    // setVeiculos(filteredVeiculos);
    // if (filteredVeiculos.length === 0) {
    //   // toast({ title: "Nenhum Resultado", description: `Não foram encontrados veículos para "${searchTerm}".` });
    // }
  };

  const handleDeleteClick = (veiculo: Veiculo) => {
    setVeiculoToDelete({ id: veiculo.id, placa: veiculo.placa, modelo: veiculo.modelo });
    setIsAlertOpen(true);
  };

  const confirmDeleteVeiculo = async () => {
    if (!veiculoToDelete) return;
    
    console.log(`Attempting to delete vehicle ID: ${veiculoToDelete.id}, Placa: ${veiculoToDelete.placa}, Modelo: ${veiculoToDelete.modelo}`);
    // Placeholder for Supabase API call to delete veiculo
    // try {
    //   // const { error } = await supabase.from('Veiculos').delete().eq('id', veiculoToDelete.id); 
    //   // if (error) throw error;
    //   setVeiculos(prevVeiculos => prevVeiculos.filter(v => v.id !== veiculoToDelete.id));
    //   // toast({ title: "Veículo Excluído!", description: `O veículo ${veiculoToDelete.placa} - ${veiculoToDelete.modelo} foi excluído.` });
    // } catch (error: any) {
    //   console.error('Failed to delete vehicle:', error.message);
    //   // toast({ title: "Erro ao Excluir", description: `Falha ao excluir veículo: ${error.message}`, variant: "destructive" });
    // } finally {
    //   setIsAlertOpen(false);
    //   setVeiculoToDelete(null);
    // }

    // Simulate API call and update UI
    await new Promise(resolve => setTimeout(resolve, 500));
    setVeiculos(prevVeiculos => prevVeiculos.filter(v => v.id !== veiculoToDelete!.id));
    console.log(`Veículo ${veiculoToDelete.placa} - ${veiculoToDelete.modelo} (ID: ${veiculoToDelete.id}) deleted (simulated).`);
    // toast({ title: "Veículo Excluído! (Simulado)", description: `O veículo ${veiculoToDelete.placa} - ${veiculoToDelete.modelo} foi excluído.` });
    setIsAlertOpen(false);
    setVeiculoToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <Car className="mr-3 h-8 w-8" /> Listagem de Veículos
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova veículos do sistema.
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/admin/veiculos/novo"> 
              <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Novo Veículo
            </Link>
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Veículos</CardTitle>
          <CardDescription>Filtre veículos por placa, modelo, marca ou nome do proprietário.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Pesquisar por Placa, Modelo, Marca ou Proprietário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" /> Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Veículos Cadastrados</CardTitle>
          <CardDescription>
            Total de {veiculos.length} veículos no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="hidden md:table-cell">Marca</TableHead>
                  <TableHead className="hidden md:table-cell">Ano</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo/Espécie</TableHead>
                  <TableHead className="hidden lg:table-cell">Combustível</TableHead>
                  <TableHead className="hidden md:table-cell">Proprietário</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo Proprietário</TableHead>
                  <TableHead className="text-right w-[240px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {veiculos.length > 0 ? (
                  veiculos.map((veiculo) => (
                    <TableRow key={veiculo.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{veiculo.id}</TableCell>
                      <TableCell className="font-semibold">{veiculo.placa}</TableCell>
                      <TableCell>{veiculo.modelo}</TableCell>
                      <TableCell className="hidden md:table-cell">{veiculo.marca}</TableCell>
                      <TableCell className="hidden md:table-cell">{veiculo.ano}</TableCell>
                      <TableCell className="hidden lg:table-cell">{veiculo.tipoEspecie}</TableCell>
                      <TableCell className="hidden lg:table-cell">{veiculo.combustivel}</TableCell>
                      <TableCell className="hidden md:table-cell">{veiculo.nomeProprietario}</TableCell>
                      <TableCell className="hidden lg:table-cell">{veiculo.tipoProprietario}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" asChild aria-label={`Detalhes do veículo ${veiculo.placa}`}>
                           <Link href={`/admin/veiculos/${veiculo.id}`}>
                            <Info className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Detalhes</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild aria-label={`Editar veículo ${veiculo.placa}`}>
                          <Link href={`/admin/veiculos/${veiculo.id}/editar`}>
                            <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(veiculo)}
                          aria-label={`Excluir veículo ${veiculo.placa}`}
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center h-24 text-muted-foreground">
                      Nenhum veículo cadastrado no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {veiculoToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão de Veículo</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o veículo <strong>{veiculoToDelete.placa} - {veiculoToDelete.modelo}</strong> (ID: {veiculoToDelete.id})? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setVeiculoToDelete(null); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteVeiculo} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/*
        Supabase Integration Notes:
        - Vehicle list will be fetched from 'public.Veiculos'.
        - To display 'Modelo': Join with 'public.ModelosVeiculo' using 'id_modelo_veiculo' to get 'nome_modelo'.
        - To display 'Nome Proprietário' and 'Tipo Proprietário':
          - Conditionally JOIN with 'public.PessoasFisicas' on 'Veiculos.id_proprietario_pessoa_fisica' = 'PessoasFisicas.id'.
          - Conditionally JOIN with 'public.Entidades' on 'Veiculos.id_proprietario_entidade' = 'Entidades.id'.
          - Determine 'Tipo Proprietário' based on which FK is populated.
        - 'Tipo/Espécie' and 'Combustível' come directly from 'public.Veiculos'.
        - Search functionality will query 'public.Veiculos' and related tables for placa, modelo, marca, or owner's name.
        - "Cadastrar Novo Veículo" button links to '/admin/veiculos/novo'.
        - "Detalhes" button links to '/admin/veiculos/[id]'.
        - "Editar" button links to '/admin/veiculos/[id]/editar'.
        - "Excluir" button will trigger a Supabase API call (DELETE to 'public.Veiculos' table) after confirmation.
      */}
    </div>
  );
}

