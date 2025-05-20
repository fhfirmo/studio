
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
import { DownloadCloud, Loader2 } from 'lucide-react';

interface ExportableField {
  id: string;
  label: string;
}

interface ExportDataDialogProps {
  children?: React.ReactNode; // Make children optional for default trigger
  dataTypeName?: string; // e.g., "Clientes", "Veículos"
  exportableFields?: ExportableField[];
}

export function ExportDataDialog({
  children,
  dataTypeName = "Dados",
  exportableFields
}: ExportDataDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [exportAll, setExportAll] = useState(true);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (exportableFields && exportableFields.length > 0) {
      const initialSelectedFields: Record<string, boolean> = {};
      exportableFields.forEach(field => {
        initialSelectedFields[field.id] = true; // Default to all selected
      });
      setSelectedFields(initialSelectedFields);
      setExportAll(false); // When specific fields are available, "exportAll" is not the primary mode.
    } else {
      setExportAll(true);
      setSelectedFields({});
    }
  }, [exportableFields, isOpen]); // Re-initialize when dialog opens or fields change

  const handleFieldSelectionChange = (fieldId: string, checked: boolean) => {
    setSelectedFields(prev => ({ ...prev, [fieldId]: checked }));
  };

  const handleExport = async (event: FormEvent) => {
    event.preventDefault();
    setIsExporting(true);
    setFeedbackMessage('Processando exportação...');

    let fieldsToExport: string[] | 'all' = 'all';
    if (exportableFields && exportableFields.length > 0) {
        fieldsToExport = Object.entries(selectedFields)
            .filter(([, isSelected]) => isSelected)
            .map(([fieldId]) => fieldId);
        if (fieldsToExport.length === 0) {
            setFeedbackMessage('Por favor, selecione pelo menos um campo para exportar.');
            setIsExporting(false);
            return;
        }
    } else if (!exportAll) {
        // This case should ideally not be reached if UI is structured well, but as a fallback
        setFeedbackMessage('Nenhuma opção de exportação selecionada.');
        setIsExporting(false);
        return;
    }


    console.log(`Exporting ${dataTypeName}: Format - ${selectedFormat}, Fields - ${fieldsToExport === 'all' ? 'All' : fieldsToExport.join(', ')}`);

    // Placeholder for Supabase API call and file generation logic
    // 1. Verify selected format and selected fields or 'exportAll' option.
    // 2. Make an API call to a Supabase endpoint (e.g., an Edge Function):
    //    - Pass the dataTypeName (or specific table name), selectedFormat, and the list of fieldsToExport.
    //    - The backend (Supabase Function) would:
    //      - Fetch the required data from the database, selecting only the specified fields if provided.
    //      - Convert data to the selected format (PDF, Excel/CSV).
    //      - Potentially save the file to Supabase Storage and return a temporary download URL.
    //      - Or, stream the file directly back if feasible for smaller datasets.
    // 3. Frontend receives the file or URL and initiates download.
    // 4. Update feedbackMessage with success or error.

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

    const success = Math.random() > 0.2; // 80% chance of success
    if (success) {
      setFeedbackMessage(`Exportação de ${dataTypeName} (${selectedFormat.toUpperCase()}) concluída! O download iniciaria agora.`);
      // Example file download simulation:
      // const blob = new Blob([`Simulated file content for ${dataTypeName} with fields: ${fieldsToExport === 'all' ? 'All' : fieldsToExport.join(', ')}`], { type: 'text/plain' });
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `${dataTypeName}_export_${new Date().toISOString()}.${selectedFormat}`;
      // document.body.appendChild(a);
      // a.click();
      // document.body.removeChild(a);
      // URL.revokeObjectURL(url);
    } else {
      setFeedbackMessage('Erro ao exportar dados. Por favor, tente novamente.');
    }

    setIsExporting(false);
    // Optionally close dialog on success, or let user close it.
    // setTimeout(() => setIsOpen(false), 3000); // Example: close after 3s
  };

  const resetDialog = () => {
    setFeedbackMessage('');
    setIsExporting(false);
    // setSelectedFormat('pdf'); // Optionally reset format
    if (exportableFields && exportableFields.length > 0) {
      const initialSelectedFields: Record<string, boolean> = {};
      exportableFields.forEach(field => {
        initialSelectedFields[field.id] = true;
      });
      setSelectedFields(initialSelectedFields);
      setExportAll(false);
    } else {
      setExportAll(true);
      setSelectedFields({});
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog(); // Reset state when dialog closes
    }}>
      <DialogTrigger asChild>
        {children || ( // Use provided children (trigger) or default button
          <Button variant="outline">
            <DownloadCloud className="mr-2 h-4 w-4" />
            Exportar {dataTypeName}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
             <DownloadCloud className="mr-2 h-5 w-5" /> Exportar {dataTypeName}
          </DialogTitle>
          <DialogDescription>
            Selecione o formato e as opções para exportar os dados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleExport} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label className="text-base font-medium">Formato do Arquivo</Label>
            <RadioGroup
              value={selectedFormat}
              onValueChange={(value: 'pdf' | 'excel' | 'csv') => setSelectedFormat(value)}
              className="mt-2 grid grid-cols-3 gap-4"
            >
              {['pdf', 'excel', 'csv'].map((format) => (
                <div key={format}>
                  <RadioGroupItem value={format} id={`format-${format}-${dataTypeName}`} className="peer sr-only" />
                  <Label
                    htmlFor={`format-${format}-${dataTypeName}`}
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
              <Label className="text-base font-medium">Selecionar Campos para Exportar</Label>
              <div className="mt-2 space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {exportableFields.map(field => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`field-${field.id}-${dataTypeName}`}
                      checked={selectedFields[field.id] || false}
                      onCheckedChange={(checked) => handleFieldSelectionChange(field.id, checked as boolean)}
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
              />
              <Label htmlFor={`exportAll-${dataTypeName}`} className="font-medium cursor-pointer text-sm">
                Exportar todos os registros
              </Label>
            </div>
          )}
          

          {feedbackMessage && (
            <div 
              className={`p-3 rounded-md text-sm ${
                feedbackMessage.startsWith('Erro') || feedbackMessage.startsWith('Por favor')
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-green-500/10 text-green-700 dark:text-green-400'
              }`}
            >
              {feedbackMessage}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isExporting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Exportar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
