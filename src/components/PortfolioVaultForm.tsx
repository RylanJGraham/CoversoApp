
"use client";

import { useState, useRef, forwardRef, useImperativeHandle, type ChangeEvent } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, PlusCircle, Trash2, UploadCloud, Lock } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';


export interface PortfolioVaultHandle {
  getValues: () => {
    files: File[];
    portfolioUrls: string[];
  };
}

interface PortfolioVaultFormProps {
    isPayingUser: boolean;
}

export const PortfolioVaultForm = forwardRef<PortfolioVaultHandle, PortfolioVaultFormProps>(({ isPayingUser }, ref) => {
  const [files, setFiles] = useState<File[]>([]);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([""]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (!isPayingUser && (files.length + newFiles.length) > 1) {
        toast({
            title: "Upload Limit Reached",
            description: "Free users can upload one file. Upgrade to upload multiple supporting documents.",
            variant: "destructive"
        });
        return;
      }
      
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
  
  const isUploadDisabled = !isPayingUser && files.length >= 1;

  useImperativeHandle(ref, () => ({
    getValues: () => ({
      files,
      portfolioUrls: isPayingUser ? portfolioUrls : [],
    }),
  }));

  return (
    <TooltipProvider>
    <div className="space-y-4">
      <div
        className={cn(
            "relative flex flex-col items-center justify-center w-full p-4 transition-colors border-2 border-dashed rounded-lg", 
            isUploadDisabled ? "cursor-not-allowed bg-secondary/50 border-primary/30" : "cursor-pointer hover:border-primary/80 hover:bg-primary/5"
        )}
        onClick={() => !isUploadDisabled && fileInputRef.current?.click()}
      >
        <UploadCloud className="w-10 h-10 text-muted-foreground" />
        <p className="font-semibold text-primary">Click to upload files</p>
        <p className="text-xs text-muted-foreground">
            {isPayingUser ? "PDF, DOCX, TXT. Ensure one file is your CV." : "PDF, DOCX, TXT. Free users can upload 1 file."}
        </p>
        <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple={isPayingUser}
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            disabled={isUploadDisabled}
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
                <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleRemoveFile(index)} aria-label={`Remove ${file.name}`}>
                    <Trash2 className="w-4 h-4" />
                </Button>
                </li>
            ))}
            </ul>
        </div>
      )}
       <div className="space-y-2">
        <div className="flex items-center gap-2">
            <Label className={cn("text-gray-800", !isPayingUser && "text-gray-500")}>
                Portfolio / Document URLs
            </Label>
            {!isPayingUser && <Lock className="h-3 w-3 text-gray-500" />}
        </div>
        {isPayingUser ? (
          <>
            {portfolioUrls.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="https://docs.google.com/document/d/..."
                  value={url}
                  onChange={(e) => handlePortfolioUrlChange(index, e.target.value)}
                />
                <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => removePortfolioUrlInput(index)} aria-label="Remove URL">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addPortfolioUrlInput} className="hover:bg-primary/10 hover:text-primary">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add URL
            </Button>
          </>
        ) : (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="relative">
                        <Input type="url" placeholder="https://your-portfolio.com" disabled />
                         <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 rounded-md">
                            <Lock className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Upgrade to a premium plan to add links to online documents.</p>
                </TooltipContent>
            </Tooltip>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
});

PortfolioVaultForm.displayName = 'PortfolioVaultForm';
