
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Car, Edit3, Trash2, Search, Info, AlertTriangle, PlusCircle } from "lucide-react"; // Changed UserPlus to PlusCircle for semantic consistency
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback

// Placeholder data - In a real app, this would come from Supabase
const initialVeiculos = [
  { id: "vei_001", placa: "ABC-1234", modelo: "Fiat Uno", marca: "Fiat", ano: 2020, dataCadastro: "2024-01-10" },
  { id: "vei_002", placa: "DEF-5678", modelo: "Volkswagen Gol", marca: "Volkswagen", ano: 2021, dataCadastro: "2024-02-15" },
  { id: "vei_003", placa: "GHI-9012", modelo: "Chevrolet Onix", marca: "Chevrolet", ano: 2022, dataCadastro: "2024-03-20" },
  { id: "vei_004", placa: "JKL-3456", modelo: "Hyundai HB20", marca: "Hyundai", ano: 2019, dataCadastro: "2024-04-05" },
  { id: "vei_005", placa: "MNO-7890", modelo: "Ford Ka", marca: "Ford", ano: 2023, dataCadastro: "2024-05-25" },
];

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  dataCadastro: string; // Added for consistency, can be hidden if not needed in table
}

export default function GerenciamentoVeiculosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>(initialVeiculos);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [veiculoToDelete, setVeiculoToDelete] = useState<{ id: string; placa: string; modelo: string } | null>(null);
  // const { toast } = useToast(); // Uncomment for feedback

  // In a real app, veiculos would be fetched from Supabase:
  // useEffect(() => {
  //   async function fetchVeiculos() {
  //     // const { data, error } = await supabase.from('veiculos').select('*'); // Replace 'veiculos' with your table name
  //     // if (error) { /* handle error, toast({ title: "Erro", description: "Não foi possível carregar veículos."}) */ }
  //     // else { setVeiculos(data || []); }
  //   }
  //   fetchVeiculos();
  // }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    console.log(`Searching for vehicle: ${searchTerm} (placeholder - Supabase query needed for 'veiculos' table)`);
    // const filteredVeiculos = initialVeiculos.filter(veiculo => 
    //   veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase())
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
    
    console.log(`Attempting to delete vehicle ID: ${veiculoToDelete.id}, Placa: ${veiculoToDelete.placa}`);
    // Placeholder for Supabase API call to delete veiculo
    // try {
    //   // const { error } = await supabase.from('veiculos').delete().eq('id', veiculoToDelete.id); // Replace 'veiculos'
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
          <CardDescription>Filtre veículos por placa, modelo ou marca.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Digite para pesquisar..."
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
                  <TableHead className="hidden lg:table-cell">Ano</TableHead>
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
                      <TableCell className="hidden lg:table-cell">{veiculo.ano}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" asChild aria-label={`Detalhes do veículo ${veiculo.placa}`}>
                           <Link href={`/admin/veiculos/${veiculo.id}`}> {/* Placeholder link for future details page */}
                            <Info className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Detalhes</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild aria-label={`Editar veículo ${veiculo.placa}`}>
                          <Link href={`/admin/veiculos/${veiculo.id}/editar`}> {/* Placeholder link for future edit page */}
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
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
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
        - Vehicle list will be fetched from a Supabase table (e.g., 'veiculos').
        - Search functionality will query the Supabase 'veiculos' table by placa, modelo, or marca.
        - "Cadastrar Novo Veículo" button links to '/admin/veiculos/novo'.
        - "Detalhes" button links to '/admin/veiculos/[id]'.
        - "Editar" button links to '/admin/veiculos/[id]/editar'.
        - "Excluir" button will trigger a Supabase API call (DELETE to 'veiculos' table) after confirmation.
      */}
    </div>
  );
}

