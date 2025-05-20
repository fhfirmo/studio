
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Search, Eye, Trash2, Download, Upload, AlertTriangle, Edit3 } from "lucide-react"; // Added Edit3
// import { useToast } from "@/hooks/use-toast"; // Uncomment for feedback

// Placeholder data - In a real app, this would come from Supabase
const initialDocumentos = [
  { id: "doc_001", titulo: "Contrato Cliente Alfa", tipo: "Contrato", dataUpload: "2025-07-05", tamanho: "1.2 MB" },
  { id: "doc_002", titulo: "Laudo Veículo XYZ", tipo: "Laudo", dataUpload: "2025-07-10", tamanho: "800 KB" },
  { id: "doc_003", titulo: "Apólice Seguro 123", tipo: "Apólice", dataUpload: "2025-07-15", tamanho: "2.5 MB" },
  { id: "doc_004", titulo: "Proposta Comercial Beta", tipo: "Proposta", dataUpload: "2025-07-18", tamanho: "550 KB" },
  { id: "doc_005", titulo: "Termo de Confidencialidade Gama", tipo: "Termo", dataUpload: "2025-07-20", tamanho: "300 KB" },
];

interface Documento {
  id: string;
  titulo: string;
  tipo: string;
  dataUpload: string;
  tamanho: string;
}

export default function GerenciamentoDocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>(initialDocumentos);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [documentoToDelete, setDocumentoToDelete] = useState<{ id: string; titulo: string } | null>(null);
  // const { toast } = useToast(); // Uncomment for feedback

  // In a real app, documentos would be fetched from Supabase:
  // useEffect(() => {
  //   async function fetchDocumentos() {
  //     // const { data, error } = await supabase.from('Arquivos').select('*'); // Example metadata table
  //     // if (error) { /* handle error, toast({ title: "Erro", description: "Não foi possível carregar documentos."}) */ }
  //     // else { setDocumentos(data || []); } // Format data as needed for display
  //   }
  //   fetchDocumentos();
  // }, []);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    console.log(`Searching for documento: ${searchTerm} (placeholder - Supabase query needed for 'Arquivos' table)`);
    // const filteredDocumentos = initialDocumentos.filter(doc => 
    //   doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //   doc.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    // );
    // setDocumentos(filteredDocumentos);
    // if (filteredDocumentos.length === 0) {
    //   // toast({ title: "Nenhum Resultado", description: `Não foram encontrados documentos para "${searchTerm}".` });
    // }
  };

  const handleDeleteClick = (documento: Documento) => {
    setDocumentoToDelete({ id: documento.id, titulo: documento.titulo });
    setIsAlertOpen(true);
  };

  const confirmDeleteDocumento = async () => {
    if (!documentoToDelete) return;
    
    console.log(`Attempting to delete documento ID: ${documentoToDelete.id}, Titulo: ${documentoToDelete.titulo}`);
    // Placeholder for Supabase API call to delete documento (metadata from 'Arquivos' and file from Storage)
    // try {
    //   // 1. Delete file from Supabase Storage
    //   // const { error: storageError } = await supabase.storage.from('documentos_bucket').remove([`path_to_file/${documentoToDelete.id}`]); // Replace with actual path logic
    //   // if (storageError) throw storageError;

    //   // 2. Delete metadata from Supabase database
    //   // const { error: dbError } = await supabase.from('Arquivos').delete().eq('id', documentoToDelete.id);
    //   // if (dbError) throw dbError;

    //   setDocumentos(prevDocumentos => prevDocumentos.filter(d => d.id !== documentoToDelete.id));
    //   // toast({ title: "Documento Excluído!", description: `O documento ${documentoToDelete.titulo} foi excluído.` });
    // } catch (error: any) {
    //   console.error('Failed to delete documento:', error.message);
    //   // toast({ title: "Erro ao Excluir", description: `Falha ao excluir documento: ${error.message}`, variant: "destructive" });
    // } finally {
    //   setIsAlertOpen(false);
    //   setDocumentoToDelete(null);
    // }

    // Simulate API call and update UI
    await new Promise(resolve => setTimeout(resolve, 500));
    setDocumentos(prevDocumentos => prevDocumentos.filter(d => d.id !== documentoToDelete!.id));
    console.log(`Documento ${documentoToDelete.titulo} (ID: ${documentoToDelete.id}) deleted (simulated).`);
    // toast({ title: "Documento Excluído! (Simulado)", description: `O documento ${documentoToDelete.titulo} foi excluído.` });
    setIsAlertOpen(false);
    setDocumentoToDelete(null);
  };

  const handleDownload = (documento: Documento) => {
    console.log(`Downloading documento: ${documento.titulo} (ID: ${documento.id})`);
    // Placeholder for Supabase Storage download logic
    // 1. Get a signed URL or public URL for the file from Supabase Storage.
    //    const { data, error } = await supabase.storage
    //      .from('documentos_bucket') 
    //      .download(`path_to_your_file/${documento.id}`); // or use path stored in 'documento' object
    // 2. If successful, trigger download.
    // toast({ title: "Download Iniciado (Simulado)", description: `O download de ${documento.titulo} começaria agora.`});
  }

  const handleView = (documento: Documento) => {
    console.log(`Viewing documento: ${documento.titulo} (ID: ${documento.id})`);
    // Placeholder for Supabase Storage view logic
    // 1. Get a public URL for the file from Supabase Storage.
    //    const { data } = supabase.storage
    //      .from('documentos_bucket') 
    //      .getPublicUrl(`path_to_your_file/${documento.id}`); 
    // 2. Open the URL in a new tab.
    // toast({ title: "Visualizando Documento (Simulado)", description: `Abrindo ${documento.titulo} em nova aba...`});
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
              <FileText className="mr-3 h-8 w-8" /> Listagem de Documentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, gerencie e faça upload de documentos do sistema.
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/admin/documentos/novo"> 
              <Upload className="mr-2 h-5 w-5" /> Upload de Novo Documento
            </Link>
          </Button>
        </div>
      </header>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Pesquisar Documentos</CardTitle>
          <CardDescription>Filtre documentos por título ou tipo.</CardDescription>
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
          <CardTitle>Documentos Cadastrados</CardTitle>
          <CardDescription>
            Total de {documentos.length} documentos no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Data de Upload</TableHead>
                  <TableHead className="hidden lg:table-cell">Tamanho</TableHead>
                  <TableHead className="text-right w-[320px]">Ações</TableHead> 
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.length > 0 ? (
                  documentos.map((documento) => (
                    <TableRow key={documento.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{documento.id}</TableCell>
                      <TableCell className="font-semibold">{documento.titulo}</TableCell>
                      <TableCell className="hidden md:table-cell">{documento.tipo}</TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDate(documento.dataUpload)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{documento.tamanho}</TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(documento)} aria-label={`Visualizar documento ${documento.titulo}`}>
                          <Eye className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Visualizar</span>
                        </Button>
                        <Button variant="outline" size="sm" asChild aria-label={`Editar documento ${documento.titulo}`}>
                          <Link href={`/admin/documentos/${documento.id}/editar`}>
                            <Edit3 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Editar</span>
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(documento)} aria-label={`Download do documento ${documento.titulo}`}>
                          <Download className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Download</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(documento)}
                          aria-label={`Excluir documento ${documento.titulo}`}
                        >
                          <Trash2 className="h-4 w-4" /> <span className="ml-1 sm:ml-2 hidden sm:inline">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                      Nenhum documento cadastrado no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {documentoToDelete && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                <AlertDialogTitle>Confirmar Exclusão de Documento</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="pt-2">
                Tem certeza que deseja excluir o documento <strong>{documentoToDelete.titulo}</strong> (ID: {documentoToDelete.id})? Esta ação é irreversível e o arquivo será removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsAlertOpen(false); setDocumentoToDelete(null); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteDocumento} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/*
        Supabase Integration Notes:
        - Document list will be fetched from a Supabase table (e.g., 'Arquivos') containing metadata about files stored in Supabase Storage.
        - Search functionality will query the Supabase metadata table.
        - "Upload de Novo Documento" button links to '/admin/documentos/novo'.
        - "Visualizar" button: Will obtain a public or signed URL from Supabase Storage and open it.
        - "Editar" button links to '/admin/documentos/[id]/editar'. This page will allow editing metadata and associations.
        - "Download" button: Will obtain a download URL from Supabase Storage and trigger a browser download.
        - "Excluir" button will trigger a Supabase API call to delete the file from Storage and its metadata from 'Arquivos' after confirmation.
      */}
    </div>
  );
}

    