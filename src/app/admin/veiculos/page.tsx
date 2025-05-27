
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
  marca: string;
  modelo: string;
  ano_fabricacao: number | null;
  tipo_especie: string | null;
  combustivel: string | null;
  codigo_renavam: string | null;
  chassi?: string | null;
  PessoasFisicas?: { nome_completo: string } | null; // For owner if Pessoa Fisica
  Entidades?: { nome: string } | null;          // For owner if Entidade
}

interface VeiculoRow {
  id: number;
  placa_atual: string;
  marca: string;
  modelo: string;
  ano_fabricacao: number | null;
  tipo_especie: string | null;
  combustivel: string | null;
  codigo_renavam: string | null;
  nome_proprietario: string | null;
  tipo_proprietario: 'Pessoa Física' | 'Organização' | 'N/A';
}

export default function GerenciamentoVeiculosPage() {
  const [veiculos, setVeiculos] = useState<VeiculoRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [veiculoToDelete, setVeiculoToDelete] = useState<{ id: number; placa: string; modelo: string | null } | null>(null);
  const { toast } = useToast();

  const fetchVeiculos = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setIsLoading(false); setVeiculos([]); return;
    }
    setIsLoading(true);
    console.log(`GerenciamentoVeiculosPage: Iniciando busca com termo: "${searchTerm}"`);

    // Diagnostic: Get user role
    try {
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role');
      if (roleError) {
        console.error("GerenciamentoVeiculosPage: Erro ao chamar RPC get_user_role:", JSON.stringify(roleError, null, 2));
      } else {
        console.log("GerenciamentoVeiculosPage: Papel do usuário (antes da query de Veiculos):", roleData);
      }
    } catch(e) {
      console.error("GerenciamentoVeiculosPage: Exceção ao chamar RPC get_user_role:", e);
    }
    
    let query = supabase
      .from('Veiculos')
      .select(`
        id_veiculo,
        placa_atual,
        marca,
        modelo,
        ano_fabricacao,
        tipo_especie,
        combustivel,
        codigo_renavam,
        chassi,
        PessoasFisicas ( nome_completo ), 
        Entidades ( nome )
      `)
      .order('placa_atual', { ascending: true });

    if (searchTerm) {
      const LIKESearchTerm = `%${searchTerm}%`;
      query = query.or(
        `placa_atual.ilike.${LIKESearchTerm},` +
        `marca.ilike.${LIKESearchTerm},` + 
        `modelo.ilike.${LIKESearchTerm},` +
        `chassi.ilike.${LIKESearchTerm},` + 
        `codigo_renavam.ilike.${LIKESearchTerm}`
        // Note: Searching on related owner name client-side after fetch for now, or use a DB view/function for server-side search on owner.
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar veículos - Detalhes Completos:", JSON.stringify(error, null, 2));
      toast({ 
        title: "Erro ao Buscar Dados", 
        description: error.message || `Erro desconhecido ao buscar veículos. Verifique o console e as RLS. Código: ${error.code || 'N/A'}`, 
        variant: "destructive",
        duration: 10000 
      });
      setVeiculos([]);
    } else {
      console.log("GerenciamentoVeiculosPage: Dados brutos de veículos recebidos do Supabase:", data);
      const formattedData: VeiculoRow[] = (data || []).map((v: VeiculoSupabase) => {
        let nomeProprietario: string | null = null;
        let tipoProprietario: VeiculoRow['tipo_proprietario'] = 'N/A';

        if (v.PessoasFisicas) {
          nomeProprietario = v.PessoasFisicas.nome_completo;
          tipoProprietario = 'Pessoa Física';
        } else if (v.Entidades) {
          nomeProprietario = v.Entidades.nome;
          tipoProprietario = 'Organização';
        }
        
        return {
          id: v.id_veiculo,
          placa_atual: v.placa_atual,
          marca: v.marca,
          modelo: v.modelo,
          ano_fabricacao: v.ano_fabricacao,
          tipo_especie: v.tipo_especie,
          combustivel: v.combustivel,
          codigo_renavam: v.codigo_renavam,
          nome_proprietario: nomeProprietario,
          tipo_proprietario: tipoProprietario,
        };
      });
      console.log("GerenciamentoVeiculosPage: Dados formatados para a tabela:", formattedData);
      setVeiculos(formattedData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVeiculos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchVeiculos(); 
  };

  const handleDeleteClick = (veiculo: VeiculoRow) => {
    setVeiculoToDelete({ id: veiculo.id, placa: veiculo.placa_atual, modelo: veiculo.modelo });
    setIsAlertOpen(true);
  };

  const confirmDeleteVeiculo = async () => {
    if (!veiculoToDelete || !supabase) return;
    
    setIsLoading(true);
    
    // 1. Delete related VeiculoMotoristas entries
    const { error: motoristasError } = await supabase
      .from('VeiculoMotoristas')
      .delete()
      .eq('id_veiculo', veiculoToDelete.id);

    if (motoristasError) {
      console.error('Falha ao excluir motoristas vinculados:', JSON.stringify(motoristasError, null, 2));
      toast({ title: "Erro ao Excluir Vínculos", description: `Falha ao remover motoristas do veículo: ${motoristasError.message || 'Erro desconhecido'}.`, variant: "destructive" });
      // Decide if you want to stop or proceed with vehicle deletion
    }
    
    // 2. Delete the Veiculo itself
    const { error } = await supabase
      .from('Veiculos')
      .delete()
      .eq('id_veiculo', veiculoToDelete.id);

    if (error) {
      console.error('Falha ao excluir veículo:', JSON.stringify(error, null, 2));
      toast({ title: "Erro ao Excluir", description: `Falha ao excluir veículo: ${error.message || 'Erro desconhecido'}. Verifique RLS e dependências.`, variant: "destructive" });
    } else {
      toast({ title: "Veículo Excluído!", description: `O veículo ${veiculoToDelete.placa} - ${veiculoToDelete.modelo || ''} foi excluído.` });
      fetchVeiculos(); 
    }
    setIsLoading(false);
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
          <CardDescription>Filtre por Placa, Marca, Modelo, Chassi, Renavam ou Proprietário.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Pesquisar..."
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
                  <TableHead className="w-[60px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="hidden md:table-cell">Ano Fab.</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo/Espécie</TableHead>
                  <TableHead className="hidden lg:table-cell">Combustível</TableHead>
                  <TableHead className="hidden lg:table-cell">Renavam</TableHead>
                  <TableHead className="hidden md:table-cell">Proprietário</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo Proprietário</TableHead>
                  <TableHead className="text-right w-[240px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && veiculos.length === 0 && !searchTerm ? (
                  <TableRow><TableCell colSpan={10} className="text-center h-24">Carregando veículos...</TableCell></TableRow>
                ) : !isLoading && veiculos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center h-24 text-muted-foreground">
                      {searchTerm ? `Nenhum veículo encontrado para "${searchTerm}".` : "Nenhum veículo cadastrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  veiculos.map((veiculo) => (
                    <TableRow key={veiculo.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{veiculo.id}</TableCell>
                      <TableCell className="font-semibold">{veiculo.placa_atual}</TableCell>
                      <TableCell>{veiculo.marca}</TableCell>
                      <TableCell>{veiculo.modelo}</TableCell>
                      <TableCell className="hidden md:table-cell">{veiculo.ano_fabricacao || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{veiculo.tipo_especie || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{veiculo.combustivel || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{veiculo.codigo_renavam || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">{veiculo.nome_proprietario}</TableCell>
                      <TableCell className="hidden lg:table-cell">{veiculo.tipo_proprietario}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" asChild aria-label={`Detalhes do veículo ${veiculo.placa_atual}`}>
                           <Link href={`/admin/veiculos/${veiculo.id}`}>
                            <Info className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Detalhes</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild aria-label={`Editar veículo ${veiculo.placa_atual}`}>
                          <Link href={`/admin/veiculos/${veiculo.id}/editar`}>
                            <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(veiculo)}
                          aria-label={`Excluir veículo ${veiculo.placa_atual}`}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
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
                Tem certeza que deseja excluir o veículo <strong>{veiculoToDelete.placa} - {veiculoToDelete.modelo || ''}</strong> (ID: {veiculoToDelete.id})? Esta ação é irreversível e também removerá os motoristas vinculados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setVeiculoToDelete(null); }} disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteVeiculo} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isLoading}>
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
    
/* Supabase Integration Notes:
- `fetchVeiculos`: 
  - Query 'Veiculos'. 
  - Selects direct columns like placa_atual, marca, modelo, ano_fabricacao, tipo_especie, combustivel, codigo_renavam, chassi.
  - Fetches related owner name using: PessoasFisicas ( nome_completo ) and Entidades ( nome ). Supabase infers relationships from FKs id_proprietario_pessoa_fisica and id_proprietario_entidade.
- Search: Filters by placa_atual, marca, modelo, chassi, codigo_renavam on the 'Veiculos' table.
- Delete Veiculo: 
  - First, explicitly delete related records in `VeiculoMotoristas` (ON DELETE CASCADE on `VeiculoMotoristas.id_veiculo` would also work).
  - Then, delete the record from `Veiculos`.
- RLS: Ensure the logged-in user (admin/supervisor/operator) has SELECT permissions on `Veiculos`, `PessoasFisicas`, and `Entidades`. Ensure DELETE permissions are also set up for `Veiculos` and `VeiculoMotoristas`.
*/

    
