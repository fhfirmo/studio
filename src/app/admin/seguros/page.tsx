
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShieldCheck, Edit3, Trash2, Search, Info, AlertTriangle, PlusCircle } from "lucide-react";
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback

// Placeholder data - In a real app, this would come from Supabase
const initialSeguros = [
  { id: "seg_001", numeroApolice: "APOLICE-2024-001", veiculo: "Fiat Uno - ABC-1234", dataInicio: "2024-01-15", dataFim: "2025-01-14", valorTotal: 1250.75 },
  { id: "seg_002", numeroApolice: "APOLICE-2024-002", veiculo: "VW Gol - DEF-5678", dataInicio: "2024-03-01", dataFim: "2025-02-28", valorTotal: 1480.00 },
  { id: "seg_003", numeroApolice: "APOLICE-2024-003", veiculo: "Chevrolet Onix - GHI-9012", dataInicio: "2024-05-20", dataFim: "2025-05-19", valorTotal: 1320.50 },
  { id: "seg_004", numeroApolice: "APOLICE-2024-004", veiculo: "Hyundai HB20 - JKL-3456", dataInicio: "2023-12-10", dataFim: "2024-12-09", valorTotal: 1100.00 },
  { id: "seg_005", numeroApolice: "APOLICE-2024-005", veiculo: "Ford Ka - MNO-7890", dataInicio: "2024-07-01", dataFim: "2025-06-30", valorTotal: 995.90 },
];

interface Seguro {
  id: string;
  numeroApolice: string;
  veiculo: string; // Could be an object with more vehicle details in a real app
  dataInicio: string;
  dataFim: string;
  valorTotal: number;
}

export default function GerenciamentoSegurosPage() {
  const [seguros, setSeguros] = useState<Seguro[]>(initialSeguros);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [seguroToDelete, setSeguroToDelete] = useState<{ id: string; numeroApolice: string } | null>(null);
  // const { toast } = useToast(); // Uncomment for feedback

  // In a real app, seguros would be fetched from Supabase:
  // useEffect(() => {
  //   async function fetchSeguros() {
  //     // const { data, error } = await supabase.from('seguros').select('*, veiculos (placa, modelo)'); // Example join
  //     // if (error) { /* handle error, toast({ title: "Erro", description: "Não foi possível carregar seguros."}) */ }
  //     // else { setSeguros(data || []); }
  //   }
  //   fetchSeguros();
  // }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    console.log(`Searching for seguro: ${searchTerm} (placeholder - Supabase query needed for 'seguros' table)`);
    // const filteredSeguros = initialSeguros.filter(seguro => 
    //   seguro.numeroApolice.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   seguro.veiculo.toLowerCase().includes(searchTerm.toLowerCase())
    // );
    // setSeguros(filteredSeguros);
    // if (filteredSeguros.length === 0) {
    //   // toast({ title: "Nenhum Resultado", description: `Não foram encontrados seguros para "${searchTerm}".` });
    // }
  };

  const handleDeleteClick = (seguro: Seguro) => {
    setSeguroToDelete({ id: seguro.id, numeroApolice: seguro.numeroApolice });
    setIsAlertOpen(true);
  };

  const confirmDeleteSeguro = async () => {
    if (!seguroToDelete) return;
    
    console.log(`Attempting to delete seguro ID: ${seguroToDelete.id}, Apólice: ${seguroToDelete.numeroApolice}`);
    // Placeholder for Supabase API call to delete seguro
    // try {
    //   // const { error } = await supabase.from('seguros').delete().eq('id', seguroToDelete.id);
    //   // if (error) throw error;
    //   setSeguros(prevSeguros => prevSeguros.filter(s => s.id !== seguroToDelete.id));
    //   // toast({ title: "Seguro Excluído!", description: `O seguro ${seguroToDelete.numeroApolice} foi excluído.` });
    // } catch (error: any) {
    //   console.error('Failed to delete seguro:', error.message);
    //   // toast({ title: "Erro ao Excluir", description: `Falha ao excluir seguro: ${error.message}`, variant: "destructive" });
    // } finally {
    //   setIsAlertOpen(false);
    //   setSeguroToDelete(null);
    // }

    // Simulate API call and update UI
    await new Promise(resolve => setTimeout(resolve, 500));
    setSeguros(prevSeguros => prevSeguros.filter(s => s.id !== seguroToDelete!.id));
    console.log(`Seguro ${seguroToDelete.numeroApolice} (ID: ${seguroToDelete.id}) deleted (simulated).`);
    // toast({ title: "Seguro Excluído! (Simulado)", description: `O seguro ${seguroToDelete.numeroApolice} foi excluído.` });
    setIsAlertOpen(false);
    setSeguroToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <ShieldCheck className="mr-3 h-8 w-8" /> Listagem de Seguros
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova seguros do sistema.
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/admin/seguros/novo"> 
              <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Novo Seguro
            </Link>
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Seguros</CardTitle>
          <CardDescription>Filtre seguros por número da apólice ou placa do veículo.</CardDescription>
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
          <CardTitle>Seguros Cadastrados</CardTitle>
          <CardDescription>
            Total de {seguros.length} seguros no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nº Apólice</TableHead>
                  <TableHead>Veículo (Placa)</TableHead>
                  <TableHead className="hidden md:table-cell">Data Início</TableHead>
                  <TableHead className="hidden md:table-cell">Data Fim</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Valor Total</TableHead>
                  <TableHead className="text-right w-[240px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seguros.length > 0 ? (
                  seguros.map((seguro) => (
                    <TableRow key={seguro.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{seguro.id}</TableCell>
                      <TableCell className="font-semibold">{seguro.numeroApolice}</TableCell>
                      <TableCell>{seguro.veiculo}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(seguro.dataInicio)}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(seguro.dataFim)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-right">{formatCurrency(seguro.valorTotal)}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" asChild aria-label={`Detalhes do seguro ${seguro.numeroApolice}`}>
                           <Link href={`/admin/seguros/${seguro.id}`}>
                            <Info className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Detalhes</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild aria-label={`Editar seguro ${seguro.numeroApolice}`}>
                          <Link href={`/admin/seguros/${seguro.id}/editar`}>
                            <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(seguro)}
                          aria-label={`Excluir seguro ${seguro.numeroApolice}`}
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      Nenhum seguro cadastrado no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {seguroToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão de Seguro</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o seguro com apólice <strong>{seguroToDelete.numeroApolice}</strong> (ID: {seguroToDelete.id})? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setSeguroToDelete(null); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteSeguro} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/*
        Supabase Integration Notes:
        - Insurance list will be fetched from a Supabase table (e.g., 'seguros'), potentially with a join to 'veiculos' to get vehicle details.
        - Search functionality will query the Supabase 'seguros' table by policy number or vehicle plate.
        - "Cadastrar Novo Seguro" button links to '/admin/seguros/novo'.
        - "Detalhes" button links to '/admin/seguros/[id]', passing the insurance ID.
        - "Editar" button links to '/admin/seguros/[id]/editar', passing the insurance ID. This page needs to be created.
        - "Excluir" button will trigger a Supabase API call (DELETE to 'seguros' table) after confirmation.
      */}
    </div>
  );
}

    

    