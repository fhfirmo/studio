
"use client";

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Search, Eye, Trash2, Download, Upload, AlertTriangle, Edit3 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from 'date-fns';

interface DocumentoSupabase {
  id_arquivo: string; // Assuming UUID
  nome_arquivo: string;
  tipo_documento: string | null;
  data_upload: string;
  tamanho_bytes: number;
  caminho_armazenamento: string; // For download/view
  PessoasFisicas?: { nome_completo: string } | null;
  Entidades?: { nome: string } | null;
  Veiculos?: { placa_atual: string, ModelosVeiculo?: { nome_modelo: string } | null } | null;
  Seguros?: { numero_apolice: string } | null;
}

interface DocumentoRow {
  id: string;
  titulo: string;
  tipo: string | null;
  dataUpload: string;
  tamanho: string;
  associadoA_nome: string | null;
  associadoA_tipo: 'Pessoa Física' | 'Organização' | 'Veículo' | 'Seguro' | 'Nenhum';
  storagePath: string;
}

const initialDocumentos: DocumentoRow[] = []; // Start empty

export default function GerenciamentoDocumentosPage() {
  const [documentos, setDocumentos] = useState<DocumentoRow[]>(initialDocumentos);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [documentoToDelete, setDocumentoToDelete] = useState<{ id: string; titulo: string; storagePath: string } | null>(null);
  const { toast } = useToast();

  const formatDateForDisplay = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "dd/MM/yyyy HH:mm") : "Data inválida";
    } catch (e) { return "Data inválida"; }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const fetchDocumentos = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Não foi possível conectar ao Supabase.", variant: "destructive" });
      setIsLoading(false); setDocumentos([]); return;
    }
    setIsLoading(true);
    
    let query = supabase
      .from('Arquivos')
      .select(`
        id_arquivo,
        nome_arquivo,
        tipo_documento,
        data_upload,
        tamanho_bytes,
        caminho_armazenamento,
        PessoasFisicas ( nome_completo ),
        Entidades ( nome ),
        Veiculos ( placa_atual, ModelosVeiculo ( nome_modelo ) ),
        Seguros ( numero_apolice )
      `)
      .order('data_upload', { ascending: false });

    if (searchTerm) {
      query = query.or(
        `nome_arquivo.ilike.%${searchTerm}%,` +
        `tipo_documento.ilike.%${searchTerm}%,` +
        `PessoasFisicas.nome_completo.ilike.%${searchTerm}%,` +
        `Entidades.nome.ilike.%${searchTerm}%,` +
        `Veiculos.placa_atual.ilike.%${searchTerm}%,` +
        `Seguros.numero_apolice.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar documentos:", error);
      toast({ title: "Erro ao Buscar Dados", description: error.message, variant: "destructive" });
      setDocumentos([]);
    } else {
      const formattedData: DocumentoRow[] = data.map((doc: DocumentoSupabase) => {
        let associadoA_nome: string | null = null;
        let associadoA_tipo: DocumentoRow['associadoA_tipo'] = 'Nenhum';

        if (doc.PessoasFisicas) {
          associadoA_nome = doc.PessoasFisicas.nome_completo;
          associadoA_tipo = 'Pessoa Física';
        } else if (doc.Entidades) {
          associadoA_nome = doc.Entidades.nome;
          associadoA_tipo = 'Organização';
        } else if (doc.Veiculos) {
          associadoA_nome = `${doc.Veiculos.placa_atual} (${doc.Veiculos.ModelosVeiculo?.nome_modelo || 'N/A'})`;
          associadoA_tipo = 'Veículo';
        } else if (doc.Seguros) {
          associadoA_nome = doc.Seguros.numero_apolice;
          associadoA_tipo = 'Seguro';
        }

        return {
          id: doc.id_arquivo,
          titulo: doc.nome_arquivo,
          tipo: doc.tipo_documento,
          dataUpload: formatDateForDisplay(doc.data_upload),
          tamanho: formatBytes(doc.tamanho_bytes),
          associadoA_nome,
          associadoA_tipo,
          storagePath: doc.caminho_armazenamento,
        };
      });
      setDocumentos(formattedData);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchDocumentos();
  }, []);

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchDocumentos();
  };

  const handleDeleteClick = (documento: DocumentoRow) => {
    setDocumentoToDelete({ id: documento.id, titulo: documento.titulo, storagePath: documento.storagePath });
    setIsAlertOpen(true);
  };

  const confirmDeleteDocumento = async () => {
    if (!documentoToDelete || !supabase) return;
    
    // 1. Delete file from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('documentos_bucket') // Replace with your actual bucket name
      .remove([documentoToDelete.storagePath]);

    if (storageError) {
      console.error('Falha ao excluir arquivo do Storage:', storageError.message);
      toast({ title: "Erro ao Excluir Arquivo", description: `Falha ao remover do armazenamento: ${storageError.message}`, variant: "destructive" });
      // Decide if you want to proceed with DB deletion if storage deletion fails
      // setIsAlertOpen(false);
      // setDocumentoToDelete(null);
      // return;
    } else {
      console.log("Arquivo excluído do Storage:", documentoToDelete.storagePath);
    }

    // 2. Delete record from database
    const { error: dbError } = await supabase
      .from('Arquivos')
      .delete()
      .eq('id_arquivo', documentoToDelete.id);

    if (dbError) {
      console.error('Falha ao excluir registro do documento:', dbError.message);
      toast({ title: "Erro ao Excluir Registro", description: `Falha ao excluir do banco de dados: ${dbError.message}`, variant: "destructive" });
    } else {
      toast({ title: "Documento Excluído!", description: `O documento ${documentoToDelete.titulo} foi excluído com sucesso.` });
      fetchDocumentos(); 
    }
    setIsAlertOpen(false);
    setDocumentoToDelete(null);
  };

  const handleDownload = async (documento: DocumentoRow) => {
    if (!supabase) return;
    const { data, error } = await supabase.storage
      .from('documentos_bucket') // Replace with your actual bucket name
      .download(documento.storagePath);

    if (error) {
      toast({ title: "Erro no Download", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = documento.titulo; // Use the document's title as the filename
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Download Iniciado", description: `Baixando ${documento.titulo}...` });
    }
  };

  const handleView = async (documento: DocumentoRow) => {
     if (!supabase) return;
    // For PDFs and images, you can get a public URL or signed URL
    const { data } = supabase.storage
      .from('documentos_bucket') // Replace with your actual bucket name
      .getPublicUrl(documento.storagePath);

    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    } else {
      // For other types, or if public URLs are not enabled, initiate download
      // Or show a message "Preview not available, please download."
      toast({ title: "Visualização", description: "Abrindo documento... (Se não abrir, tente o download)", variant: "default" });
      handleDownload(documento); 
    }
  };

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
          <CardDescription>Filtre documentos por título, tipo ou entidade associada.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Pesquisar por Título, Tipo, Associado..."
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
                  <TableHead className="w-[60px] hidden sm:table-cell">ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo Doc.</TableHead>
                  <TableHead className="hidden lg:table-cell">Upload</TableHead>
                  <TableHead className="hidden lg:table-cell">Tamanho</TableHead>
                  <TableHead className="hidden md:table-cell">Associado a</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo Associação</TableHead>
                  <TableHead className="text-right w-[320px]">Ações</TableHead> 
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center h-24">Carregando...</TableCell></TableRow>
                ) : documentos.length > 0 ? (
                  documentos.map((documento) => (
                    <TableRow key={documento.id}>
                      <TableCell className="font-medium text-xs hidden sm:table-cell">{documento.id.substring(0,8)}...</TableCell>
                      <TableCell className="font-semibold">{documento.titulo}</TableCell>
                      <TableCell className="hidden md:table-cell">{documento.tipo || "N/A"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{documento.dataUpload}</TableCell>
                      <TableCell className="hidden lg:table-cell">{documento.tamanho}</TableCell>
                      <TableCell className="hidden md:table-cell">{documento.associadoA_nome || "N/A"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            documento.associadoA_tipo === 'Nenhum' ? 'bg-muted text-muted-foreground' : 
                            documento.associadoA_tipo === 'Pessoa Física' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                            documento.associadoA_tipo === 'Organização' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                            documento.associadoA_tipo === 'Veículo' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            documento.associadoA_tipo === 'Seguro' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                           {documento.associadoA_tipo}
                        </span>
                      </TableCell>
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
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
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
                Tem certeza que deseja excluir o documento <strong>{documentoToDelete.titulo}</strong> (ID: {documentoToDelete.id.substring(0,8)}...)? Esta ação é irreversível e o arquivo será removido do armazenamento e do banco de dados.
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
    </div>
  );
}
    