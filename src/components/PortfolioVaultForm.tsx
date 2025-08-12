
"use client";

import { useState, useRef, forwardRef, useImperativeHandle, type ChangeEvent } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, PlusCircle, Trash2, UploadCloud } from 'lucide-react';

export interface PortfolioVaultHandle {
  getValues: () => {
    files: File[];
    portfolioUrls: string[];
  };
}

export const PortfolioVaultForm = forwardRef<PortfolioVaultHandle, {}>((props, ref) => {
  const [files, setFiles] = useState<File[]>([]);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([""]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const hasCv = files.some(f => f.name.toLowerCase().includes('cv') || f.name.toLowerCase().includes('resume'));
      if (hasCv && newFiles.some(f => f.name.toLowerCase().includes('cv') || f.name.toLowerCase().includes('resume'))) {
        toast({
          title: "CV already uploaded",
          description: "You have already uploaded a CV. To replace it, please remove the existing one first.",
          variant: "destructive"
        });
        return;
      }
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };
  
  const handlePortfolioUrlChange = (index: number, value: string) => {
    const newUrls = [...portfolioUrls];
    newUrls[index] = value;
    setPortfolioUrls(newUrls);
  };

  const addPortfolioUrlInput = () => {
    setPortfolioUrls([...portfolioUrls, ""]);
  };
  
  const removePortfolioUrlInput = (index: number) => {
    setPortfolioUrls(portfolioUrls.filter((_, i) => i !== index));
  };

  useImperativeHandle(ref, () => ({
    getValues: () => ({
      files,
      portfolioUrls,
    }),
  }));

  return (
    <div className="space-y-4">
      <div
        className="relative flex flex-col items-center justify-center w-full p-4 transition-colors border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/80 hover:bg-primary/5"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="w-10 h-10 text-muted-foreground" />
        <p className="font-semibold text-primary">Click to upload files</p>
        <p className="text-xs text-muted-foreground">PDF, DOCX, TXT. Ensure one file is your CV.</p>
        <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
        />
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
            <Label className="text-gray-800">Uploaded Files:</Label>
            <ul className="space-y-2">
            {files.map((file, index) => (
                <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between p-2 text-sm rounded-md bg-secondary">
                <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    {(file.name.toLowerCase().includes('cv') || file.name.toLowerCase().includes('resume')) && <Badge variant="outline">CV</Badge>}
                </div>
                <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0" onClick={() => handleRemoveFile(index)} aria-label={`Remove ${file.name}`}>
                    <Trash2 className="w-4 h-4" />
                </Button>
                </li>
            ))}
            </ul>
        </div>
      )}
      <div className="space-y-2">
        <Label className="text-gray-800">Portfolio / Document URLs</Label>
        {portfolioUrls.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
            <Input 
                type="url" 
                placeholder="https://docs.google.com/document/d/..." 
                value={url} 
                onChange={(e) => handlePortfolioUrlChange(index, e.target.value)} 
            />
            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => removePortfolioUrlInput(index)} aria-label="Remove URL">
                <Trash2 className="w-4 h-4" />
            </Button>
            </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addPortfolioUrlInput}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add URL
        </Button>
      </div>
    </div>
  );
});

PortfolioVaultForm.displayName = 'PortfolioVaultForm';
