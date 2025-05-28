
"use client";

import { useState, type FormEvent, type ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Save, XCircle, FileText, Link2, User, Building, Car, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";

const documentTypes = [
  { value: "contrato", label: "Contrato" },
  { value: "laudo", label: "Laudo" },
  { value: "apolice", label: "Apólice" },
  { value: "proposta", label: "Proposta Comercial" },
  { value: "termo", label: "Termo (Confidencialidade, etc.)" },
  { value: "documento_pessoal", label: "Documento Pessoal (RG, CNH, etc.)" },
  { value: "comprovante", label: "Comprovante (Residência, Pagamento, etc.)" },
  { value: "manual", label: "Manual" },
  { value: "outro", label: "Outro" },
];

interface GenericOption { id: string; nome: string; [key: string]: any; }
type TipoAssociacao = "nenhum" | "pessoa_fisica" | "organizacao" | "veiculo" | "seguro";

export default function NovoDocumentoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    titulo: '',
    tipoDocumento: '',
    observacoes: '',
    tipoAssociacao: 'nenhum' as TipoAssociacao,
    idAssociado: '',
  });

  const [pessoasFisicasOptions, setPessoasFisicasOptions] = useState<GenericOption[]>([]);
  const [organizacoesOptions, setOrganizacoesOptions] = useState<GenericOption[]>([]);
  const [veiculosOptions, setVeiculosOptions] = useState<GenericOption[]>([]);
  const [segurosOptions, setSegurosOptions] = useState<GenericOption[]>([]);

  const [isLoadingPessoasFisicas, setIsLoadingPessoasFisicas] = useState(false);
  const [isLoadingOrganizacoes, setIsLoadingOrganizacoes] = useState(false);
  const [isLoadingVeiculos, setIsLoadingVeiculos] = useState(false);
  const [isLoadingSeguros, setIsLoadingSeguros] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    setIsLoadingPessoasFisicas(true);
    supabase.from('PessoasFisicas').select('id_pessoa_fisica, nome_completo, cpf').order('nome_completo')
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao buscar Pessoas Físicas:", error);
          toast({ title: "Erro ao Carregar Pessoas Físicas", description: error.message, variant: "destructive" });
        } else {
          setPessoasFisicasOptions((data || []).map(pf => ({ id: pf.id_pessoa_fisica.toString(), nome: `${pf.nome_completo} (${pf.cpf})` })));
        }
        setIsLoadingPessoasFisicas(false);
      });

    setIsLoadingOrganizacoes(true);
    supabase.from('Entidades').select('id_entidade, nome, cnpj').order('nome')
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao buscar Organizações:", error);
          toast({ title: "Erro ao Carregar Organizações", description: error.message, variant: "destructive" });
        } else {
          setOrganizacoesOptions((data || []).map(org => ({ id: org.id_entidade.toString(), nome: `${org.nome} (${org.cnpj})` })));
        }
        setIsLoadingOrganizacoes(false);
      });

    setIsLoadingVeiculos(true);
    supabase.from('Veiculos').select('id_veiculo, placa_atual, marca, modelo').order('placa_atual')
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao buscar Veículos:", error);
          toast({ title: "Erro ao Carregar Veículos", description: error.message, variant: "destructive" });
        } else {
          setVeiculosOptions((data || []).map(v => ({ id: v.id_veiculo.toString(), nome: `${v.placa_atual} (${v.marca || ''} ${v.modelo || ''})`.trim() })));
        }
        setIsLoadingVeiculos(false);
      });

    setIsLoadingSeguros(true);
    supabase.from('Seguros').select('id_seguro, numero_apolice, PessoasFisicas!Seguros_id_titular_pessoa_fisica_fkey(nome_completo), Entidades!Seguros_id_titular_entidade_fkey(nome)').order('numero_apolice')
      .then(({ data, error }) => {
        if (error) {
          console.error("Erro ao buscar Seguros:", error);
          toast({ title: "Erro ao Carregar Seguros", description: error.message, variant: "destructive" });
        } else {
          setSegurosOptions((data || []).map(s => ({ 
            id: s.id_seguro.toString(), 
            nome: `${s.numero_apolice} (Titular: ${s.PessoasFisicas?.nome_completo || s.Entidades?.nome || 'N/A'})`
          })));
        }
        setIsLoadingSeguros(false);
      });

  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'tipoAssociacao') {
      setFormData(prev => ({ ...prev, tipoAssociacao: value as TipoAssociacao, idAssociado: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      if (!formData.titulo) {
        setFormData(prev => ({ ...prev, titulo: file.name.replace(/\.[^/.]+$/, "") }));
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !formData.titulo || !formData.tipoDocumento) {
      toast({ title: "Campos Obrigatórios", description: "Arquivo, Título e Tipo de Documento são obrigatórios.", variant: "destructive" });
      return;
    }
    if (formData.tipoAssociacao !== 'nenhum' && !formData.idAssociado) {
      toast({ title: "Campo Obrigatório", description: "Selecione a entidade específica para associar ou marque 'Nenhum'.", variant: "destructive" });
      return;
    }
    if (!supabase) {
      toast({ title: "Erro de Configuração", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setUploadProgress(0); // Reset progress

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`; // More unique filename
      const filePath = `documentos/${fileName}`; // Folder 'documentos'

      console.log(`NovoDocumentoPage: Iniciando upload para Supabase Storage. Path: ${filePath}`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documentos_bucket') // Ensure this bucket exists in your Supabase project
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          // onUploadProgress: (progress) => { // This part of Supabase v2 might not directly give progress for .upload
          //   if (progress.totalBytes) {
          //     setUploadProgress(Math.round((progress.loadedBytes / progress.totalBytes) * 100));
          //   }
          // }
        });

      if (uploadError) {
        console.error("NovoDocumentoPage: Erro no upload para Supabase Storage:", JSON.stringify(uploadError, null, 2), uploadError);
        throw uploadError; // Re-throw to be caught by the outer catch
      }

      console.log("NovoDocumentoPage: Upload para Supabase Storage bem-sucedido:", uploadData);
      setUploadProgress(100); // Simulate 100% on successful upload

      const { data: authUserResponse, error: authUserError } = await supabase.auth.getUser();
      if (authUserError) {
        console.warn("NovoDocumentoPage: Erro ao buscar usuário autenticado:", authUserError.message);
      }
      const userIdUpload = authUserResponse?.user?.id;

      const arquivoPayload = {
        nome_arquivo: formData.titulo,
        caminho_armazenamento: uploadData.path,
        tipo_mime: selectedFile.type,
        tamanho_bytes: selectedFile.size,
        tipo_documento: formData.tipoDocumento,
        id_pessoa_fisica_associada: formData.tipoAssociacao === 'pessoa_fisica' && formData.idAssociado ? parseInt(formData.idAssociado) : null,
        id_entidade_associada: formData.tipoAssociacao === 'organizacao' && formData.idAssociado ? parseInt(formData.idAssociado) : null,
        id_veiculo: formData.tipoAssociacao === 'veiculo' && formData.idAssociado ? parseInt(formData.idAssociado) : null,
        id_seguro: formData.tipoAssociacao === 'seguro' && formData.idAssociado ? parseInt(formData.idAssociado) : null,
        user_id_upload: userIdUpload || null,
        observacoes: formData.observacoes || null, // Added observacoes
      };
      
      console.log('NovoDocumentoPage: Payload para tabela "Arquivos":', arquivoPayload);
      const { error: dbError } = await supabase.from('Arquivos').insert(arquivoPayload);

      if (dbError) {
        console.error("NovoDocumentoPage: Erro ao salvar metadados no DB:", JSON.stringify(dbError, null, 2), dbError);
        // Attempt to delete the uploaded file if DB insert fails
        console.log("NovoDocumentoPage: Tentando deletar arquivo do Storage devido a erro no DB:", filePath);
        await supabase.storage.from('documentos_bucket').remove([filePath]);
        throw dbError; // Re-throw to be caught by the outer catch
      }

      toast({ title: "Documento Enviado!", description: "O documento foi salvo com sucesso." });
      router.push('/admin/documentos'); 

    } catch (error: any) {
      console.error('NovoDocumentoPage: Falha no envio do documento:', error);
      // Check for specific "Bucket not found" error
      if (error.message && error.message.toLowerCase().includes('bucket not found')) {
        toast({
          title: "Erro de Configuração do Storage",
          description: `O bucket 'documentos_bucket' não foi encontrado no Supabase. Verifique se ele existe e se as políticas de acesso estão corretas.`,
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({ title: "Erro ao Enviar Documento", description: error.message || "Ocorreu um erro inesperado.", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getDynamicOptions = () => {
    switch (formData.tipoAssociacao) {
      case 'pessoa_fisica': return { options: pessoasFisicasOptions, isLoading: isLoadingPessoasFisicas };
      case 'organizacao': return { options: organizacoesOptions, isLoading: isLoadingOrganizacoes };
      case 'veiculo': return { options: veiculosOptions, isLoading: isLoadingVeiculos };
      case 'seguro': return { options: segurosOptions, isLoading: isLoadingSeguros };
      default: return { options: [], isLoading: false };
    }
  };

  const dynamicSelectData = getDynamicOptions();

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <UploadCloud className="mr-3 h-8 w-8" /> Upload de Novo Documento
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/documentos">
              <XCircle className="mr-2 h-4 w-4" /> Voltar para Lista
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Selecione um arquivo e forneça os detalhes para adicioná-lo ao sistema.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Informações do Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Documento <span className="text-destructive">*</span></Label>
                <Input id="titulo" name="titulo" value={formData.titulo} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoDocumento">Tipo do Documento <span className="text-destructive">*</span></Label>
                <Select name="tipoDocumento" value={formData.tipoDocumento} onValueChange={(value) => handleSelectChange('tipoDocumento', value)} required>
                  <SelectTrigger id="tipoDocumento"><FileText className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(docType => <SelectItem key={docType.value} value={docType.value}>{docType.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="fileUpload">Arquivo <span className="text-destructive">*</span></Label>
                <Input id="fileUpload" name="fileUpload" type="file" onChange={handleFileChange} required className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                {selectedFile && <p className="text-sm text-muted-foreground mt-1">Selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleInputChange} placeholder="Adicione observações relevantes..." />
            </div>
            {isLoading && uploadProgress > 0 && uploadProgress < 100 && ( // Show progress only during actual upload if progress tracking is available
                <div className="space-y-1">
                    <Label>Progresso do Upload: {uploadProgress}%</Label>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-150" style={{ width: `${uploadProgress}%`}}></div>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center"><Link2 className="mr-2 h-5 w-5" /> Associar Documento a (Opcional)</CardTitle>
            <CardDescription>Vincule este documento a uma entidade existente no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tipoAssociacao">Tipo de Entidade</Label>
              <Select name="tipoAssociacao" value={formData.tipoAssociacao} onValueChange={(value) => handleSelectChange('tipoAssociacao', value as TipoAssociacao)}>
                <SelectTrigger id="tipoAssociacao"><SelectValue placeholder="Selecione um tipo para associar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  <SelectItem value="pessoa_fisica"><User className="mr-2 h-4 w-4 inline-block" /> Pessoa Física</SelectItem>
                  <SelectItem value="organizacao"><Building className="mr-2 h-4 w-4 inline-block" /> Organização</SelectItem>
                  <SelectItem value="veiculo"><Car className="mr-2 h-4 w-4 inline-block" /> Veículo</SelectItem>
                  <SelectItem value="seguro"><ShieldCheck className="mr-2 h-4 w-4 inline-block" /> Seguro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipoAssociacao !== 'nenhum' && (
              <div className="space-y-2">
                <Label htmlFor="idAssociado">Selecionar {
                  formData.tipoAssociacao === 'pessoa_fisica' ? 'Pessoa Física' :
                  formData.tipoAssociacao === 'organizacao' ? 'Organização' :
                  formData.tipoAssociacao === 'veiculo' ? 'Veículo' :
                  formData.tipoAssociacao === 'seguro' ? 'Seguro' : 'Entidade'
                } <span className="text-destructive">*</span></Label>
                <Select 
                  name="idAssociado" 
                  value={formData.idAssociado} 
                  onValueChange={(value) => handleSelectChange('idAssociado', value)} 
                  required={formData.tipoAssociacao !== 'nenhum'}
                  disabled={dynamicSelectData.isLoading}
                >
                  <SelectTrigger id="idAssociado">
                    <SelectValue placeholder={dynamicSelectData.isLoading ? "Carregando..." : "Selecione a entidade específica"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dynamicSelectData.isLoading ? (
                      <SelectItem value="loading" disabled>Carregando opções...</SelectItem>
                    ) : dynamicSelectData.options.length > 0 ? (
                      dynamicSelectData.options.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.nome}</SelectItem>)
                    ) : (
                      <SelectItem value="none" disabled>Nenhuma opção encontrada para "{formData.tipoAssociacao}"</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
        
        <CardFooter className="flex justify-end gap-4 mt-8 p-0">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/documentos')} disabled={isLoading}>
            <XCircle className="mr-2 h-5 w-5" /> Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || !selectedFile}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
             {isLoading ? 'Enviando...' : 'Enviar Arquivo'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}
    
// Supabase Integration Notes:
// - Storage Bucket: Ensure 'documentos_bucket' exists in your Supabase Storage.
// - Storage Policies: Set up policies on 'documentos_bucket' to allow uploads (INSERT) for authenticated users.
// - Arquivos Table RLS: Ensure RLS on public."Arquivos" allows INSERT for the user performing the upload.
// - User ID for Upload: Fetches current user's ID via supabase.auth.getUser() to store in user_id_upload.
// - Atomic Operations: Ideally, file upload to Storage and metadata insert to "Arquivos" table should be atomic.
//   If DB insert fails after file upload, the file should be deleted from Storage.
//   This is best handled via a Supabase Edge Function. The current client-side attempt to delete is a fallback.
// - Progress Bar: Supabase JS v2 client's .upload() method doesn't directly offer an onUploadProgress callback in the same way
//   older versions or other libraries might. For true progress, you might need to use XHR or a library that wraps it,
//   or if Supabase JS client offers a different mechanism (like resumable uploads with progress) explore that.
//   For now, setUploadProgress(100) is a simple simulation on success.

