
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building, Edit3, Trash2, Search, Info, AlertTriangle, PlusCircle } from "lucide-react";
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback

// Placeholder data - In a real app, this would come from Supabase
const initialOrganizacoes = [
  { id: "org_001", nome: "Cooperativa Alfa", tipoOrganizacao: "Cooperativa Principal", cnpj: "11.222.333/0001-44", telefone: "(11) 91234-5678" },
  { id: "org_002", nome: "Associação Beta", tipoOrganizacao: "Associação de Produtores", cnpj: "22.333.444/0001-55", telefone: "(22) 92345-6789" },
  { id: "org_003", nome: "Empresa Gama", tipoOrganizacao: "Empresa Privada", cnpj: "33.444.555/0001-66", telefone: "(33) 93456-7890" },
  { id: "org_004", nome: "Sindicato Delta", tipoOrganizacao: "Sindicato Regional", cnpj: "44.555.666/0001-77", telefone: "(44) 94567-8901" },
  { id: "org_005", nome: "ONG Epsilon", tipoOrganizacao: "Organização Não Governamental", cnpj: "55.666.777/0001-88", telefone: "(55) 95678-9012" },
];

interface Organizacao {
  id: string;
  nome: string;
  tipoOrganizacao: string; // This would be the 'nome_tipo' from public.TiposEntidade
  cnpj: string;
  telefone: string;
}

export default function GerenciamentoOrganizacoesPage() {
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>(initialOrganizacoes);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [organizacaoToDelete, setOrganizacaoToDelete] = useState<{ id: string; nome: string } | null>(null);
  // const { toast } = useToast(); // Uncomment for feedback

  // In a real app, organizations would be fetched from Supabase:
  // useEffect(() => {
  //   async function fetchOrganizacoes() {
  //     // const { data, error } = await supabase
  //     //   .from('Entidades') // Assuming your table is 'Entidades'
  //     //   .select(`
  //     //     id,
  //     //     nome_fantasia, // Assuming this is the organization name
  //     //     cnpj,
  //     //     telefone_comercial, // Assuming this is the phone
  //     //     TiposEntidade ( nome_tipo ) // Assuming 'TiposEntidade' is the related table and 'tipo_entidade_id' is the FK
  //     //   `);
  //     // if (error) { /* handle error, toast({ title: "Erro", description: "Não foi possível carregar organizações."}) */ }
  //     // else { 
  //     //   const formattedData = data.map(org => ({
  //     //     id: org.id,
  //     //     nome: org.nome_fantasia,
  //     //     tipoOrganizacao: org.TiposEntidade.nome_tipo,
  //     //     cnpj: org.cnpj,
  //     //     telefone: org.telefone_comercial,
  //     //   }));
  //     //   setOrganizacoes(formattedData || []); 
  //     // }
  //   }
  //   fetchOrganizacoes();
  // }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    console.log(`Searching for organizacao: ${searchTerm} (placeholder - Supabase query needed for 'Entidades' table)`);
    // const filteredOrganizacoes = initialOrganizacoes.filter(org => 
    //   org.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   org.cnpj.includes(searchTerm)
    // );
    // setOrganizacoes(filteredOrganizacoes);
    // if (filteredOrganizacoes.length === 0) {
    //   // toast({ title: "Nenhum Resultado", description: `Não foram encontradas organizações para "${searchTerm}".` });
    // }
  };

  const handleDeleteClick = (organizacao: Organizacao) => {
    setOrganizacaoToDelete({ id: organizacao.id, nome: organizacao.nome });
    setIsAlertOpen(true);
  };

  const confirmDeleteOrganizacao = async () => {
    if (!organizacaoToDelete) return;
    
    console.log(`Attempting to delete organizacao ID: ${organizacaoToDelete.id}, Nome: ${organizacaoToDelete.nome}`);
    // Placeholder for Supabase API call to delete organizacao
    // try {
    //   // const { error } = await supabase.from('Entidades').delete().eq('id', organizacaoToDelete.id); 
    //   // if (error) throw error;
    //   setOrganizacoes(prevOrganizacoes => prevOrganizacoes.filter(o => o.id !== organizacaoToDelete.id));
    //   // toast({ title: "Organização Excluída!", description: `A organização ${organizacaoToDelete.nome} foi excluída.` });
    // } catch (error: any) {
    //   console.error('Failed to delete organizacao:', error.message);
    //   // toast({ title: "Erro ao Excluir", description: `Falha ao excluir organização: ${error.message}`, variant: "destructive" });
    // } finally {
    //   setIsAlertOpen(false);
    //   setOrganizacaoToDelete(null);
    // }

    // Simulate API call and update UI
    await new Promise(resolve => setTimeout(resolve, 500));
    setOrganizacoes(prevOrganizacoes => prevOrganizacoes.filter(o => o.id !== organizacaoToDelete!.id));
    console.log(`Organização ${organizacaoToDelete.nome} (ID: ${organizacaoToDelete.id}) deleted (simulated).`);
    // toast({ title: "Organização Excluída! (Simulado)", description: `A organização ${organizacaoToDelete.nome} foi excluída.` });
    setIsAlertOpen(false);
    setOrganizacaoToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <Building className="mr-3 h-8 w-8" /> Listagem de Organizações
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, cadastre, edite e remova organizações do sistema.
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/admin/organizacoes/novo"> 
              <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Nova Organização
            </Link>
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Organizações</CardTitle>
          <CardDescription>Filtre organizações por nome ou CNPJ.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Pesquisar por nome ou CNPJ..."
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
          <CardTitle>Organizações Cadastradas</CardTitle>
          <CardDescription>
            Total de {organizacoes.length} organizações no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Nome da Organização</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">CNPJ</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                  <TableHead className="text-right w-[240px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizacoes.length > 0 ? (
                  organizacoes.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{org.id}</TableCell>
                      <TableCell className="font-semibold">{org.nome}</TableCell>
                      <TableCell className="hidden md:table-cell">{org.tipoOrganizacao}</TableCell>
                      <TableCell className="hidden lg:table-cell">{org.cnpj}</TableCell>
                      <TableCell className="hidden lg:table-cell">{org.telefone}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" asChild aria-label={`Detalhes da organização ${org.nome}`}>
                           <Link href={`/admin/organizacoes/${org.id}`}>
                            <Info className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Detalhes</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild aria-label={`Editar organização ${org.nome}`}>
                          <Link href={`/admin/organizacoes/${org.id}/editar`}>
                            <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(org)}
                          aria-label={`Excluir organização ${org.nome}`}
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      Nenhuma organização cadastrada no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {organizacaoToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão de Organização</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir a organização <strong>{organizacaoToDelete.nome}</strong> (ID: {organizacaoToDelete.id})? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setOrganizacaoToDelete(null); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteOrganizacao} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/*
        Supabase Integration Notes:
        - Organization list will be fetched from 'Entidades' table (or similar).
        - 'Tipo da Organização' will be fetched via a join with 'TiposEntidade' table (using foreign key like 'tipo_entidade_id').
        - Search functionality will query the Supabase 'Entidades' table.
        - "Cadastrar Nova Organização" button links to '/admin/organizacoes/novo'.
        - "Detalhes" button links to '/admin/organizacoes/[id]'.
        - "Editar" button links to '/admin/organizacoes/[id]/editar'.
        - "Excluir" button will trigger a Supabase API call (DELETE to 'Entidades' table) after confirmation.
      */}
    </div>
  );
}
