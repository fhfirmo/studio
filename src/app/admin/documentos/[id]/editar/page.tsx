
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileEdit, Save, XCircle, AlertTriangle, Link2, User, Building, Car, ShieldCheck, FileText, Loader2 } from 'lucide-react';
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

interface DocumentoDataFromDB {
  id_arquivo: string;
  nome_arquivo: string;
  tipo_documento: string;
  observacoes?: string | null;
  id_pessoa_fisica_associada?: number | null;
  id_entidade_associada?: number | null;
  id_veiculo?: number | null; 
  id_seguro?: number | null; 
  caminho_armazenamento?: string;
  data_upload?: string;
}

export default function EditarDocumentoPage() {
  const router = useRouter();
  const params = useParams();
  const documentoId = params.id as string;
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [docFound, setDocFound] = useState<boolean | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [originalUploadDate, setOriginalUploadDate] = useState<string | null>(null);
  
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
    if (!documentoId || !supabase) {
      setIsLoading(false);
      setDocFound(false);
      if (!documentoId) toast({ title: "Erro", description: "ID do documento não fornecido.", variant: "destructive" });
      return;
    }

    const fetchAllDropdownData = async () => {
      setIsLoadingPessoasFisicas(true);
      supabase.from('PessoasFisicas').select('id_pessoa_fisica, nome_completo, cpf').order('nome_completo')
        .then(({ data, error }) => {
          if (error) toast({ title: "Erro Pessoas Físicas", description: error.message, variant: "destructive" });
          else setPessoasFisicasOptions(data.map(pf => ({ id: pf.id_pessoa_fisica.toString(), nome: `${pf.nome_completo} (${pf.cpf})` })));
          setIsLoadingPessoasFisicas(false);
        });

      setIsLoadingOrganizacoes(true);
      supabase.from('Entidades').select('id_entidade, nome, cnpj').order('nome')
        .then(({ data, error }) => {
          if (error) toast({ title: "Erro Organizações", description: error.message, variant: "destructive" });
          else setOrganizacoesOptions(data.map(org => ({ id: org.id_entidade.toString(), nome: `${org.nome} (${org.cnpj})` })));
          setIsLoadingOrganizacoes(false);
        });
      
      setIsLoadingVeiculos(true);
      supabase.from('Veiculos').select('id_veiculo, placa_atual, marca, modelo').order('placa_atual')
        .then(({ data, error }) => {
          if (error) toast({ title: "Erro Veículos", description: error.message, variant: "destructive" });
          else setVeiculosOptions(data.map(v => ({ id: v.id_veiculo.toString(), nome: `${v.placa_atual} (${v.marca || ''} ${v.modelo || ''})`.trim() })));
          setIsLoadingVeiculos(false);
        });

      setIsLoadingSeguros(true);
      supabase.from('Seguros').select('id_seguro, numero_apolice, PessoasFisicas!Seguros_id_titular_pessoa_fisica_fkey(nome_completo), Entidades!Seguros_id_titular_entidade_fkey(nome)').order('numero_apolice')
        .then(({ data, error }) => {
          if (error) toast({ title: "Erro Seguros", description: error.message, variant: "destructive" });
          else setSegurosOptions(data.map(s => ({ 
            id: s.id_seguro.toString(), 
            nome: `${s.numero_apolice} (Titular: ${s.PessoasFisicas?.nome_completo || s.Entidades?.nome || 'N/A'})`
          })));
          setIsLoadingSeguros(false);
        });
    };

    const fetchDocumentData = async () => {
      setIsLoading(true);
      setDocFound(null);

      const { data: docData, error: docError } = await supabase
        .from('Arquivos')
        .select('*')
        .eq('id_arquivo', documentoId)
        .single<DocumentoDataFromDB>();

      if (docError || !docData) {
        console.error("Erro ao buscar documento:", docError);
        toast({ title: "Erro ao Carregar Documento", description: docError?.message || "Documento não encontrado.", variant: "destructive" });
        setDocFound(false);
      } else {
        setFormData({
          titulo: docData.nome_arquivo || '',
          tipoDocumento: docData.tipo_documento || '',
          observacoes: docData.observacoes || '',
          tipoAssociacao: 
            docData.id_pessoa_fisica_associada ? 'pessoa_fisica' :
            docData.id_entidade_associada ? 'organizacao' :
            docData.id_veiculo ? 'veiculo' :
            docData.id_seguro ? 'seguro' : 'nenhum',
          idAssociado: 
            (docData.id_pessoa_fisica_associada ||
            docData.id_entidade_associada ||
            docData.id_veiculo ||
            docData.id_seguro || '').toString(),
        });
        setOriginalFileName(docData.nome_arquivo || 'Nome não disponível');
        setOriginalUploadDate(docData.data_upload ? new Date(docData.data_upload).toLocaleDateString('pt-BR') : 'Data não disponível');
        setDocFound(true);
      }
      setIsLoading(false);
    };
    
    fetchAllDropdownData();
    fetchDocumentData();

  }, [documentoId, toast]);

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast({ title: "Erro de Configuração", description: "Cliente Supabase não inicializado.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    if (!formData.titulo || !formData.tipoDocumento) {
      toast({ title: "Campos Obrigatórios", description: "Título e Tipo de Documento são obrigatórios.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
     if (formData.tipoAssociacao !== 'nenhum' && !formData.idAssociado) {
      toast({ title: "Campo Obrigatório", description: "Selecione a entidade específica para associar ou marque 'Nenhum'.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const updatePayload = {
      nome_arquivo: formData.titulo,
      tipo_documento: formData.tipoDocumento,
      observacoes: formData.observacoes || null,
      id_pessoa_fisica_associada: formData.tipoAssociacao === 'pessoa_fisica' && formData.idAssociado ? parseInt(formData.idAssociado) : null,
      id_entidade_associada: formData.tipoAssociacao === 'organizacao' && formData.idAssociado ? parseInt(formData.idAssociado) : null,
      id_veiculo: formData.tipoAssociacao === 'veiculo' && formData.idAssociado ? parseInt(formData.idAssociado) : null,
      id_seguro: formData.tipoAssociacao === 'seguro' && formData.idAssociado ? parseInt(formData.idAssociado) : null,
    };
    console.log('Form data to be submitted for update (Documento):', updatePayload);

    const { error } = await supabase
        .from('Arquivos')
        .update(updatePayload)
        .eq('id_arquivo', documentoId);

    if (error) {
        console.error("Erro ao atualizar metadados do documento:", JSON.stringify(error, null, 2));
        toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Documento Atualizado!", description: "Os metadados do documento foram salvos com sucesso." });
        router.push('/admin/documentos'); 
    }
    setIsLoading(false);
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

  if (isLoading && docFound === null) {
    return <div className="container mx-auto px-4 py-8 md:py-12 text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /> Carregando dados do documento...</div>;
  }

  if (docFound === false) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Documento não encontrado</h1>
        <p className="text-muted-foreground mt-2">
          O documento com o ID "{documentoId}" não foi encontrado ou não pôde ser carregado.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/documentos">Voltar para Lista de Documentos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center">
            <FileEdit className="mr-3 h-8 w-8" /> Editar Documento
          </h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/documentos">
              <XCircle className="mr-2 h-4 w-4" /> Voltar para Lista
            </Link>
          </Button>
        </div>
         {originalFileName && (
          <p className="text-sm text-muted-foreground mt-1">
            Editando metadados para: <strong>{originalFileName}</strong> {originalUploadDate && `(Upload em: ${originalUploadDate})`}
          </p>
        )}
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Informações do Documento</CardTitle>
            <CardDescription>Atualize o título, tipo e observações do documento. O arquivo em si não pode ser alterado aqui.</CardDescription>
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
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleInputChange} placeholder="Adicione observações relevantes..." />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center"><Link2 className="mr-2 h-5 w-5" /> Associar Documento a</CardTitle>
            <CardDescription>Altere ou defina a entidade à qual este documento está vinculado.</CardDescription>
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
                } {formData.tipoAssociacao !== 'nenhum' && <span className="text-destructive">*</span>}
                </Label>
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
                        <SelectItem value="none" disabled>Nenhuma opção encontrada</SelectItem>
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
          <Button type="submit" disabled={isLoading || docFound === false}>
            <Save className="mr-2 h-5 w-5" /> {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}

// Supabase Integration Notes:
// - On page load (useEffect with documentoId):
//   - Fetch document metadata from public.Arquivos where id_arquivo = documentoId.
//   - This fetch should include id_pessoa_fisica_associada, id_entidade_associada, id_veiculo, id_seguro.
//   - Pre-fill formData.titulo, formData.tipoDocumento, formData.observacoes.
//   - Determine formData.tipoAssociacao based on which of the _associada fields is non-null.
//   - Set formData.idAssociado to the value of that non-null _associada field.
//   - Fetch options for PessoasFisicas, Organizacoes, Veiculos, Seguros dynamically for the association selects.
// - On submit (handleSubmit):
//   - Send a PUT/PATCH request to public.Arquivos for the current documentoId.
//   - Update: nome_arquivo (from formData.titulo), tipo_documento, observacoes.
//   - Association IDs: Based on formData.tipoAssociacao and formData.idAssociado, set the corresponding _associada field and NULLIFY the others.
//     Example: if tipoAssociacao is 'pessoa_fisica', set id_pessoa_fisica_associada = formData.idAssociado, and set
//              id_entidade_associada = NULL, id_veiculo = NULL, id_seguro = NULL.
// - The actual file in Supabase Storage is NOT re-uploaded or changed on this screen. Only metadata and associations.
// - Bucket name 'documentos-bucket' (Corrected)


    