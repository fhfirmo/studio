
"use client";

import { useState, type FormEvent } from 'react';
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

interface ExportDataDialogProps {
  triggerButton?: React.ReactNode;
  dataTypeName?: string; // e.g., "Clientes", "Veículos"
}

export function ExportDataDialog({
  triggerButton,
  dataTypeName = "Dados"
}: ExportDataDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [exportAll, setExportAll] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (event: FormEvent) => {
    event.preventDefault();
    setIsExporting(true);
    setFeedbackMessage('Processando exportação...');

    console.log(`Exporting ${dataTypeName}: Format - ${selectedFormat}, Export All - ${exportAll}`);

    // Placeholder for Supabase API call and file generation logic
    // 1. Verify selected format and 'exportAll' option.
    // 2. Make an API call to a Supabase endpoint (e.g., an Edge Function):
    //    - Pass the dataTypeName (or specific table name), selectedFormat, and exportAll flag.
    //    - The backend (Supabase Function) would:
    //      - Fetch the required data from the database.
    //      - Convert data to the selected format (PDF, Excel/CSV).
    //      - Potentially save the file to Supabase Storage and return a temporary download URL.
    //      - Or, stream the file directly back if feasible for smaller datasets.
    // 3. Frontend receives the file or URL and initiates download.
    //    - If URL: create a temporary <a> tag and click it.
    //    - If file stream: handle the blob.
    // 4. Update feedbackMessage with success or error.

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

    // Simulate success/error
    const success = Math.random() > 0.2; // 80% chance of success
    if (success) {
      setFeedbackMessage(`Exportação de ${dataTypeName} (${selectedFormat.toUpperCase()}) concluída! O download iniciaria agora.`);
      // Example:
      // const blob = new Blob(["Simulated file content"], { type: 'text/plain' });
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `${dataTypeName}_export.${selectedFormat}`;
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
    // setExportAll(true); // Optionally reset checkbox
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline">
            <DownloadCloud className="mr-2 h-4 w-4" />
            Exportar {dataTypeName}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
             <DownloadCloud className="mr-2 h-5 w-5" /> Exportar {dataTypeName}
          </DialogTitle>
          <DialogDescription>
            Selecione o formato e as opções para exportar os dados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleExport} className="space-y-6 py-4">
          <div>
            <Label className="text-base font-medium">Formato do Arquivo</Label>
            <RadioGroup
              value={selectedFormat}
              onValueChange={(value: 'pdf' | 'excel' | 'csv') => setSelectedFormat(value)}
              className="mt-2 grid grid-cols-3 gap-4"
            >
              {['pdf', 'excel', 'csv'].map((format) => (
                <div key={format}>
                  <RadioGroupItem value={format} id={`format-${format}`} className="peer sr-only" />
                  <Label
                    htmlFor={`format-${format}`}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    {format.toUpperCase()}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="exportAll"
              checked={exportAll}
              onCheckedChange={(checked) => setExportAll(checked as boolean)}
            />
            <Label htmlFor="exportAll" className="font-medium cursor-pointer">
              Exportar todos os registros
            </Label>
          </div>
          {/* Placeholder for future field selection options */}
          {/* 
          <div>
            <Label className="text-base font-medium">Selecionar Campos (Em breve)</Label>
            <p className="text-sm text-muted-foreground">Futuramente, você poderá escolher quais campos exportar.</p>
          </div> 
          */}

          {feedbackMessage && (
            <div 
              className={`p-3 rounded-md text-sm ${
                feedbackMessage.startsWith('Erro') 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-green-500/10 text-green-700 dark:text-green-400'
              }`}
            >
              {feedbackMessage}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
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
