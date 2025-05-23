
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Car, Edit3, Trash2, Search, Info, AlertTriangle, PlusCircle } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

interface VeiculoSupabase {
  id_veiculo: number;
  placa_atual: string;
  marca: string | null;
  ano_fabricacao: number | null;
  tipo_especie: string | null;
  combustivel: string | null;
  ModelosVeiculo: { nome_modelo: string } | null;
  PessoasFisicas: { nome_completo: string } | null;
  Entidades: { nome: string } | null;
}

interface VeiculoRow {
  id: number; // Corresponds to id_veiculo
  placa: string;
  modelo: string | null;
  marca: string | null;
  ano: number | null;
  tipoEspecie: string | null;
  combustivel: string | null;
  nomeProprietario: string | null;
  tipoProprietario: 'Pessoa Física' | 'Organização' | 'N/A';
}

const initialVeiculos: VeiculoRow[] = []; // Start with empty

export default function GerenciamentoVeiculosPage() {
  const [veiculos, setVeiculos] = useState<VeiculoRow[]>(initialVeiculos);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [veiculoToDelete, setVeiculoToDelete] = useState<{ id: number; placa: string; modelo: string | null } | null>(null);
  const { toast } = useToast();

  const fetchVeiculos = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Não foi possível conectar ao Supabase.", variant: "destructive" });
      setIsLoading(false);
      setVeiculos([]);
      return;
    }
    setIsLoading(true);
    
    let query = supabase
      .from('Veiculos')
      .select(`
        id_veiculo,
        placa_atual,
        marca,
        ano_fabricacao,
        tipo_especie,
        combustivel,
        ModelosVeiculo ( nome_modelo ), 
        PessoasFisicas ( nome_completo ),
        Entidades ( nome )
      `)
      .order('placa_atual', { ascending: true });

    if (searchTerm) {
      // Basic search: placa, model name (if available), owner name
      // More complex search might require a database function or view
      query = query.or(
        `placa_atual.ilike.%${searchTerm}%,` +
        `ModelosVeiculo.nome_modelo.ilike.%${searchTerm}%,` +
        `PessoasFisicas.nome_completo.ilike.%${searchTerm}%,` +
        `Entidades.nome.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar veículos:", error);
      toast({ title: "Erro ao Buscar Dados", description: error.message, variant: "destructive" });
      setVeiculos([]);
    } else {
      const formattedData: VeiculoRow[] = data.map((v: VeiculoSupabase) => ({
        id: v.id_veiculo,
        placa: v.placa_atual,
        modelo: v.ModelosVeiculo?.nome_modelo || 'N/A',
        marca: v.marca,
        ano: v.ano_fabricacao,
        tipoEspecie: v.tipo_especie,
        combustivel: v.combustivel,
        nomeProprietario: v.PessoasFisicas?.nome_completo || v.Entidades?.nome || 'N/A',
        tipoProprietario: v.PessoasFisicas ? 'Pessoa Física' : (v.Entidades ? 'Organização' : 'N/A'),
      }));
      setVeiculos(formattedData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVeiculos();
  }, []); // Fetch on mount

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchVeiculos(); // Re-fetch with current searchTerm
  };

  const handleDeleteClick = (veiculo: VeiculoRow) => {
    setVeiculoToDelete({ id: veiculo.id, placa: veiculo.placa, modelo: veiculo.modelo });
    setIsAlertOpen(true);
  };

  const confirmDeleteVeiculo = async () => {
    if (!veiculoToDelete || !supabase) return;
    
    const { error } = await supabase
      .from('Veiculos')
      .delete()
      .eq('id_veiculo', veiculoToDelete.id);

    if (error) {
      console.error('Falha ao excluir veículo:', error.message);
      toast({ title: "Erro ao Excluir", description: `Falha ao excluir veículo: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Veículo Excluído!", description: `O veículo ${veiculoToDelete.placa} - ${veiculoToDelete.modelo || ''} foi excluído.` });
      fetchVeiculos(); // Refresh the list
    }
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
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Pesquisar por Placa, Modelo, Marca ou Proprietário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" /> {isLoading ? 'Buscando...' : 'Buscar'}
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
                {isLoading ? (
                  <TableRow><TableCell colSpan={10} className="text-center h-24">Carregando...</TableCell></TableRow>
                ) : veiculos.length > 0 ? (
                  veiculos.map((veiculo) => (
                    <TableRow key={veiculo.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{veiculo.id}</TableCell>
                      <TableCell className="font-semibold">{veiculo.placa}</TableCell>
                      <TableCell>{veiculo.modelo || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{veiculo.marca || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{veiculo.ano || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{veiculo.tipoEspecie || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{veiculo.combustivel || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{veiculo.nomeProprietario || "N/A"}</TableCell>
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
                Tem certeza que deseja excluir o veículo <strong>{veiculoToDelete.placa} - {veiculoToDelete.modelo || ''}</strong> (ID: {veiculoToDelete.id})? Esta ação é irreversível.
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
    </div>
  );
}
    