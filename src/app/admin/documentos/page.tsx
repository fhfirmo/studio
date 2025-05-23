
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
  id_arquivo: string;
  nome_arquivo: string;
  tipo_documento: string | null;
  data_upload: string;
  tamanho_bytes: number;
  caminho_armazenamento: string;
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

// Updated initialDocumentos with more diverse examples for association
const initialDocumentosData: DocumentoRow[] = [
  { id: "doc_001", titulo: "Contrato João", tipo: "Contrato", dataUpload: "2024-01-01T10:00:00Z", tamanho: "500 KB", associadoA_nome: "João da Silva Sauro", associadoA_tipo: "Pessoa Física", storagePath: "contratos/joao_contrato.pdf" },
  { id: "doc_002", titulo: "Apólice ABC-1234", tipo: "Apólice", dataUpload: "2024-01-05T11:30:00Z", tamanho: "1.2 MB", associadoA_nome: "ABC-1234 (Onix)", associadoA_tipo: "Veículo", storagePath: "apolices/veiculo_abc1234.pdf" },
  { id: "doc_003", titulo: "CNPJ Cooperativa", tipo: "CNPJ", dataUpload: "2024-01-10T14:15:00Z", tamanho: "300 KB", associadoA_nome: "Cooperativa Alfa", associadoA_tipo: "Organização", storagePath: "documentos_org/coop_alfa_cnpj.jpg" },
  { id: "doc_004", titulo: "Proposta Seguro X", tipo: "Proposta", dataUpload: "2024-01-15T09:00:00Z", tamanho: "800 KB", associadoA_nome: "Apólice 98765", associadoA_tipo: "Seguro", storagePath: "propostas/seguro_x.pdf" },
  { id: "doc_005", titulo: "Manual do Sistema", tipo: "Manual", dataUpload: "2024-01-20T16:45:00Z", tamanho: "2.5 MB", associadoA_nome: null, associadoA_tipo: "Nenhum", storagePath: "manuais/sistema_v1.pdf" },
];


export default function GerenciamentoDocumentosPage() {
  const [documentos, setDocumentos] = useState<DocumentoRow[]>([]);
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
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const fetchDocumentos = async () => {
    if (!supabase) {
      toast({ title: "Erro de Conexão", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      setIsLoading(false); setDocumentos([]); return;
    }
    setIsLoading(true);
    console.log(`FetchDocumentos: Iniciando busca com termo: "${searchTerm}"`);
    
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
      // Simplified search: only on Arquivos direct columns for now to isolate the issue
      query = query.or(
        `nome_arquivo.ilike.%${searchTerm}%,` +
        `tipo_documento.ilike.%${searchTerm}%`
      );
      console.log("FetchDocumentos: Filtro OR aplicado para nome_arquivo e tipo_documento.");
    }

    const { data, error } = await query;

    if (error) {
      const errorMessage = error.message || `Erro desconhecido ao buscar documentos. Código: ${error.code || 'N/A'}. Detalhes no console.`;
      console.error("Erro ao buscar documentos - Detalhes Completos:", JSON.stringify(error, null, 2));
      console.error("Erro ao buscar documentos (objeto original):", error);
      toast({ title: "Erro ao Buscar Dados", description: errorMessage, variant: "destructive", duration: 10000 });
      setDocumentos([]);
    } else {
      console.log("FetchDocumentos: Dados recebidos do Supabase:", data);
      const formattedData: DocumentoRow[] = (data || []).map((doc: DocumentoSupabase) => {
        let associadoA_nome: string | null = null;
        let associadoA_tipo: DocumentoRow['associadoA_tipo'] = 'Nenhum';

        if (doc.PessoasFisicas) {
          associadoA_nome = doc.PessoasFisicas.nome_completo;
          associadoA_tipo = 'Pessoa Física';
        } else if (doc.Entidades) {
          associadoA_nome = doc.Entidades.nome;
          associadoA_tipo = 'Organização';
        } else if (doc.Veiculos) {
          associadoA_nome = `${doc.Veiculos.placa_atual || 'N/P'} (${doc.Veiculos.ModelosVeiculo?.nome_modelo || 'N/M'})`;
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
          tamanho: formatBytes(doc.tamanho_bytes || 0),
          associadoA_nome,
          associadoA_tipo,
          storagePath: doc.caminho_armazenamento,
        };
      });
      console.log("FetchDocumentos: Dados formatados:", formattedData);
      setDocumentos(formattedData);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchDocumentos();
  }, []); // Fetch on mount. To re-fetch on search, `handleSearchSubmit` should call `fetchDocumentos`.

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchDocumentos(); // Re-fetch with current searchTerm
  };

  const handleDeleteClick = (documento: DocumentoRow) => {
    setDocumentoToDelete({ id: documento.id, titulo: documento.titulo, storagePath: documento.storagePath });
    setIsAlertOpen(true);
  };

  const confirmDeleteDocumento = async () => {
    if (!documentoToDelete || !supabase) return;
    
    try {
      // 1. Delete file from Supabase Storage
      console.log(`Attempting to delete from Storage: bucket 'documentos_bucket', path '${documentoToDelete.storagePath}'`);
      const { error: storageError } = await supabase.storage
        .from('documentos_bucket') // Ensure this is your correct bucket name
        .remove([documentoToDelete.storagePath]);

      if (storageError) {
        // Don't stop if storage deletion fails, but notify user. The DB record might still be deletable.
        console.error('Falha ao excluir arquivo do Storage:', storageError.message);
        toast({ title: "Aviso: Erro no Storage", description: `Falha ao remover do armazenamento: ${storageError.message}. Tentando excluir registro do BD.`, variant: "destructive", duration: 7000 });
      } else {
        console.log("Arquivo excluído do Storage com sucesso:", documentoToDelete.storagePath);
      }

      // 2. Delete record from database
      console.log(`Attempting to delete from DB: table 'Arquivos', id '${documentoToDelete.id}'`);
      const { error: dbError } = await supabase
        .from('Arquivos')
        .delete()
        .eq('id_arquivo', documentoToDelete.id);

      if (dbError) {
        throw dbError; // Throw to be caught by the outer catch block
      }

      toast({ title: "Documento Excluído!", description: `O documento ${documentoToDelete.titulo} foi excluído com sucesso.` });
      fetchDocumentos(); 
    
    } catch (error: any) {
        const message = error.message || "Ocorreu um erro ao excluir o documento.";
        console.error('Falha ao excluir documento (geral):', message, error);
        toast({ title: "Erro ao Excluir", description: message, variant: "destructive" });
    } finally {
        setIsAlertOpen(false);
        setDocumentoToDelete(null);
    }
  };

  const handleDownload = async (documento: DocumentoRow) => {
    if (!supabase) return;
    console.log(`Attempting download: bucket 'documentos_bucket', path '${documento.storagePath}'`);
    try {
        const { data, error } = await supabase.storage
        .from('documentos_bucket') // Ensure this is your correct bucket name
        .download(documento.storagePath);

        if (error) throw error;

        if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = documento.titulo; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Download Iniciado", description: `Baixando ${documento.titulo}...` });
        }
    } catch (error: any) {
        console.error("Erro no download:", error);
        toast({ title: "Erro no Download", description: error.message || "Não foi possível baixar o arquivo.", variant: "destructive" });
    }
  };

  const handleView = async (documento: DocumentoRow) => {
     if (!supabase) return;
     console.log(`Attempting view: bucket 'documentos_bucket', path '${documento.storagePath}'`);
     try {
        const { data } = supabase.storage
        .from('documentos_bucket') // Ensure this is your correct bucket name
        .getPublicUrl(documento.storagePath);

        if (data?.publicUrl) {
            console.log("Public URL for view:", data.publicUrl);
            window.open(data.publicUrl, '_blank');
        } else {
            // Fallback or if public URLs are not enabled / file type not suitable for direct view
            toast({ title: "Visualização Indisponível", description: "Preview não disponível para este arquivo ou URL pública não configurada. Tente o download.", variant: "default" });
            // Optionally, attempt download as a fallback
            // handleDownload(documento); 
        }
     } catch (error: any) {
        console.error("Erro ao obter URL pública:", error);
        toast({ title: "Erro ao Visualizar", description: error.message || "Não foi possível obter o link para visualização.", variant: "destructive" });
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
              placeholder="Pesquisar por Título ou Tipo..."
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
                  <TableHead className="text-right min-w-[280px] sm:min-w-[320px]">Ações</TableHead> 
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
      {/* 
        Supabase Integration Notes:
        - Fetch from public."Arquivos" table.
        - JOINs needed for associated entities:
          - public."PessoasFisicas" ON Arquivos.id_pessoa_fisica_associada = PessoasFisicas.id_pessoa_fisica
          - public."Entidades" ON Arquivos.id_entidade_associada = Entidades.id_entidade
          - public."Veiculos" ON Arquivos.id_veiculo = Veiculos.id_veiculo (JOIN ModelosVeiculo for model name)
          - public."Seguros" ON Arquivos.id_seguro = Seguros.id_seguro
        - Search: Backend search should be implemented on 'nome_arquivo', 'tipo_documento'. Searching on related entity names requires more complex queries or a dedicated search view/function.
        - View/Download: Use Supabase Storage methods to get public URLs or download files.
        - Delete: Must delete from Supabase Storage AND from the 'Arquivos' database table.
      */}
    </div>
  );
}

    
