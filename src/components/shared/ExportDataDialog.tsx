
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { DownloadCloud, Loader2, Eye, Edit3 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ExportableField {
  id: string;
  label: string;
}

interface ExportDataDialogProps {
  children?: React.ReactNode;
  dataTypeName?: string;
  exportableFields?: ExportableField[];
}

type ExportStep = 'options' | 'generatingPreview' | 'preview' | 'exportingFinal';

export function ExportDataDialog({
  children,
  dataTypeName = "Dados",
  exportableFields
}: ExportDataDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ExportStep>('options');
  
  const [selectedPreviewFormat, setSelectedPreviewFormat] = useState<'pdf' | 'excel' | 'csv'>('csv');
  const [selectedExportFormat, setSelectedExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  
  const [exportAll, setExportAll] = useState(true);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    if (isOpen) { // Reset state when dialog opens
      resetDialogStates();
    }
  }, [isOpen, exportableFields]);

  const resetDialogStates = () => {
    setCurrentStep('options');
    setSelectedPreviewFormat('csv'); // Default preview format
    setSelectedExportFormat('pdf'); // Default export format
    setFeedbackMessage('');
    setPreviewData(null);
    setPreviewContent(null);

    if (exportableFields && exportableFields.length > 0) {
      const initialSelectedFields: Record<string, boolean> = {};
      exportableFields.forEach(field => {
        initialSelectedFields[field.id] = true; // Default to all selected
      });
      setSelectedFields(initialSelectedFields);
      setExportAll(false);
    } else {
      setExportAll(true);
      setSelectedFields({});
    }
  };

  const handleFieldSelectionChange = (fieldId: string, checked: boolean) => {
    setSelectedFields(prev => ({ ...prev, [fieldId]: checked }));
  };

  const handleGeneratePreview = async (event: FormEvent) => {
    event.preventDefault();
    setCurrentStep('generatingPreview');
    setFeedbackMessage(`Gerando visualização de ${dataTypeName} como ${selectedPreviewFormat.toUpperCase()}...`);
    setPreviewData(null);
    setPreviewContent(null);

    let fieldsForPreview: string[] | 'all' = 'all';
    if (exportableFields && exportableFields.length > 0) {
        fieldsForPreview = Object.entries(selectedFields)
            .filter(([, isSelected]) => isSelected)
            .map(([fieldId]) => fieldId);
        if (fieldsForPreview.length === 0) {
            setFeedbackMessage('Por favor, selecione pelo menos um campo para visualizar.');
            setCurrentStep('options');
            return;
        }
    }

    // Placeholder for Supabase API call to fetch preview data
    // This API should return data suitable for the selectedPreviewFormat
    // e.g., JSON for Excel/CSV, or a message/URL for PDF.
    console.log(`Generating preview: Format - ${selectedPreviewFormat}, Fields - ${fieldsForPreview === 'all' ? 'All' : fieldsForPreview.join(', ')}`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

    // Simulate fetching preview data
    const success = Math.random() > 0.1;
    if (success) {
      if (selectedPreviewFormat === 'excel' || selectedPreviewFormat === 'csv') {
        // Generate sample table data
        const sampleData = Array.from({ length: 3 }, (_, i) => {
          const row: Record<string, any> = { id: i + 1 };
          if (fieldsForPreview === 'all') { // Generic fields if 'all'
            row['campo_1'] = `Valor ${i+1}-A`;
            row['campo_2'] = `Valor ${i+1}-B`;
          } else {
            fieldsForPreview.forEach(field => {
              const fieldLabel = exportableFields?.find(f => f.id === field)?.label || field;
              row[fieldLabel] = `${fieldLabel} Exemplo ${i + 1}`;
            });
          }
          return row;
        });
        setPreviewData(sampleData);
      } else { // PDF
        setPreviewContent(`Visualização de PDF para ${dataTypeName} seria exibida aqui. (Conteúdo de exemplo)`);
      }
      setFeedbackMessage(`Visualização como ${selectedPreviewFormat.toUpperCase()} gerada.`);
      setCurrentStep('preview');
    } else {
      setFeedbackMessage('Erro ao gerar visualização. Tente novamente.');
      setCurrentStep('options');
    }
  };

  const handleFinalExport = async (event: FormEvent) => {
    event.preventDefault();
    setCurrentStep('exportingFinal');
    setFeedbackMessage(`Exportando ${dataTypeName} como ${selectedExportFormat.toUpperCase()}...`);

    let fieldsToExport: string[] | 'all' = 'all';
     if (exportableFields && exportableFields.length > 0) {
        fieldsToExport = Object.entries(selectedFields)
            .filter(([, isSelected]) => isSelected)
            .map(([fieldId]) => fieldId);
    } // Note: fieldsToExport uses selectedFields from the initial options step.

    // Placeholder for Supabase API call for final export
    // Pass dataTypeName, selectedExportFormat, and fieldsToExport
    console.log(`Final export: Format - ${selectedExportFormat}, Fields - ${fieldsToExport === 'all' ? 'All' : fieldsToExport.join(', ')}`);
    await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate API call

    const success = Math.random() > 0.1;
    if (success) {
      setFeedbackMessage(`Exportação de ${dataTypeName} (${selectedExportFormat.toUpperCase()}) concluída! O download iniciaria agora.`);
      // Simulate file download
      // const blob = new Blob([`Conteúdo do arquivo ${selectedExportFormat.toUpperCase()} para ${dataTypeName}`], { type: 'text/plain' });
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `${dataTypeName}_export_${new Date().toISOString()}.${selectedExportFormat}`;
      // document.body.appendChild(a);
      // a.click();
      // document.body.removeChild(a);
      // URL.revokeObjectURL(url);
      // setTimeout(() => setIsOpen(false), 3000); // Optionally close dialog
    } else {
      setFeedbackMessage('Erro ao exportar dados. Por favor, tente novamente.');
    }
    setCurrentStep('preview'); // Return to preview step after export attempt
  };
  
  const handleGoBackToOptions = () => {
    setCurrentStep('options');
    setPreviewData(null);
    setPreviewContent(null);
    setFeedbackMessage('');
    // Keep selectedPreviewFormat and selectedFields as they were for user convenience
  };

  const getFieldLabelsForPreview = (): string[] => {
    if (!previewData || previewData.length === 0) return [];
    return Object.keys(previewData[0]);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialogStates(); 
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <DownloadCloud className="mr-2 h-4 w-4" />
            Exportar {dataTypeName}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
             <DownloadCloud className="mr-2 h-5 w-5" /> Exportar {dataTypeName}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'options' && 'Selecione o formato para visualização e os campos desejados.'}
            {currentStep === 'generatingPreview' && 'Aguarde enquanto a visualização é gerada.'}
            {currentStep === 'preview' && `Visualização prévia de ${dataTypeName}. Selecione o formato final para exportação.`}
            {currentStep === 'exportingFinal' && 'Aguarde enquanto o relatório final é exportado.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6 py-4">
          {(currentStep === 'options' || currentStep === 'generatingPreview') && (
            <form onSubmit={handleGeneratePreview} className="space-y-6">
              <div>
                <Label className="text-base font-medium">Formato da Visualização</Label>
                <RadioGroup
                  value={selectedPreviewFormat}
                  onValueChange={(value: 'pdf' | 'excel' | 'csv') => setSelectedPreviewFormat(value)}
                  className="mt-2 grid grid-cols-3 gap-4"
                  disabled={currentStep === 'generatingPreview'}
                >
                  {['pdf', 'excel', 'csv'].map((format) => (
                    <div key={`preview-${format}`}>
                      <RadioGroupItem value={format} id={`preview-format-${format}-${dataTypeName}`} className="peer sr-only" />
                      <Label
                        htmlFor={`preview-format-${format}-${dataTypeName}`}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm"
                      >
                        {format.toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {exportableFields && exportableFields.length > 0 ? (
                <div>
                  <Label className="text-base font-medium">Selecionar Campos</Label>
                  <div className="mt-2 space-y-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                    {exportableFields.map(field => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${field.id}-${dataTypeName}`}
                          checked={selectedFields[field.id] || false}
                          onCheckedChange={(checked) => handleFieldSelectionChange(field.id, checked as boolean)}
                          disabled={currentStep === 'generatingPreview'}
                        />
                        <Label htmlFor={`field-${field.id}-${dataTypeName}`} className="font-normal cursor-pointer text-sm">
                          {field.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`exportAll-${dataTypeName}`}
                    checked={exportAll}
                    onCheckedChange={(checked) => setExportAll(checked as boolean)}
                    disabled={currentStep === 'generatingPreview'}
                  />
                  <Label htmlFor={`exportAll-${dataTypeName}`} className="font-medium cursor-pointer text-sm">
                    Incluir todos os dados disponíveis
                  </Label>
                </div>
              )}
              
              <DialogFooter className="gap-2 sm:gap-0 pt-4 sticky bottom-0 bg-background pb-1">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={currentStep === 'generatingPreview'}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={currentStep === 'generatingPreview'}>
                  {currentStep === 'generatingPreview' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Gerar Visualização
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {currentStep === 'preview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Visualização Prévia ({selectedPreviewFormat.toUpperCase()})</h3>
                <div className="border rounded-md p-4 max-h-60 overflow-auto bg-muted/50">
                  {previewData && (selectedPreviewFormat === 'excel' || selectedPreviewFormat === 'csv') && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {getFieldLabelsForPreview().map(header => <TableHead key={header}>{header}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {getFieldLabelsForPreview().map(header => <TableCell key={`${rowIndex}-${header}`}>{String(row[header])}</TableCell>)}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {previewContent && selectedPreviewFormat === 'pdf' && (
                    <p className="text-sm text-muted-foreground">{previewContent}</p>
                  )}
                  {!previewData && !previewContent && (
                    <p className="text-sm text-muted-foreground">Nenhuma visualização disponível.</p>
                  )}
                </div>
              </div>
              
              <form onSubmit={handleFinalExport} className="space-y-6">
                 <div>
                    <Label className="text-base font-medium">Formato Final para Exportação</Label>
                    <RadioGroup
                    value={selectedExportFormat}
                    onValueChange={(value: 'pdf' | 'excel' | 'csv') => setSelectedExportFormat(value)}
                    className="mt-2 grid grid-cols-3 gap-4"
                    >
                    {['pdf', 'excel', 'csv'].map((format) => (
                        <div key={`export-${format}`}>
                        <RadioGroupItem value={format} id={`export-format-${format}-${dataTypeName}`} className="peer sr-only" />
                        <Label
                            htmlFor={`export-format-${format}-${dataTypeName}`}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-sm"
                        >
                            {format.toUpperCase()}
                        </Label>
                        </div>
                    ))}
                    </RadioGroup>
                </div>
                <DialogFooter className="gap-2 sm:gap-0 pt-4 sticky bottom-0 bg-background pb-1">
                    <Button type="button" variant="outline" onClick={handleGoBackToOptions}>
                        <Edit3 className="mr-2 h-4 w-4" /> Editar Opções
                    </Button>
                    <Button type="submit">
                        <DownloadCloud className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </DialogFooter>
              </form>
            </div>
          )}

          {(currentStep === 'exportingFinal') && (
             <div className="flex items-center justify-center py-8">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <p>Exportando relatório final...</p>
            </div>
          )}
        </div>

        {feedbackMessage && (
          <div 
            className={`p-3 rounded-md text-sm mt-4 border ${
              feedbackMessage.includes('Erro') || feedbackMessage.includes('Por favor')
              ? 'bg-destructive/10 text-destructive border-destructive/30' 
              : 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30'
            }`}
          >
            {feedbackMessage}
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

    
