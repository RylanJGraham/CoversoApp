"use client";

import { useState, useRef, type ChangeEvent, useMemo } from "react";
import Image from 'next/image';
import { generateCoverLetter, type GenerateCoverLetterOutput } from "@/ai/flows/cover-letter-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  FileUp,
  FlaskConical,
  Link as LinkIcon,
  Loader2,
  Trash2,
  FileText,
  Wand2,
  Download,
  AlertCircle,
  UploadCloud,
  User,
  PlusCircle,
  BrainCircuit,
  ListChecks,
  ClipboardPaste,
  Info,
  DollarSign,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";


type AppState = "idle" | "loading" | "success" | "error";

// Pricing for Gemini 1.5 Flash (as a reference for gemini-2.0-flash)
const INPUT_PRICE_PER_1K_CHARS = 0.000125;
const OUTPUT_PRICE_PER_1K_CHARS = 0.000250;
// Rough estimate of a base prompt size + output size
const BASE_PROMPT_CHARS = 1500;
const AVG_COVER_LETTER_CHARS = 2000;


export function SkillSync() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([""]);
  const [fullName, setFullName] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [aiResult, setAiResult] = useState<GenerateCoverLetterOutput | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const estimatedCost = useMemo(() => {
    const personalInfoChars = fullName.length + userLocation.length + phone.length + email.length + linkedinUrl.length;
    const jobDescChars = jobDescription.length;
    const portfolioUrlChars = portfolioUrls.join('').length;
    // We can't know the file content length without reading them, so we'll add a rough estimate per file.
    const avgFileChars = 5000; // Estimate 5k characters per document
    const fileChars = files.length * avgFileChars;
    
    const totalInputChars = personalInfoChars + jobDescChars + portfolioUrlChars + fileChars + BASE_PROMPT_CHARS;
    
    const inputCost = (totalInputChars / 1000) * INPUT_PRICE_PER_1K_CHARS;
    const outputCost = (AVG_COVER_LETTER_CHARS / 1000) * OUTPUT_PRICE_PER_1K_CHARS;

    const totalCost = inputCost + outputCost;
    
    // Format to 6 decimal places for small costs
    return totalCost.toFixed(6);
  }, [fullName, userLocation, phone, email, linkedinUrl, jobDescription, portfolioUrls, files]);


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


  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast({ title: "No CV Uploaded", description: "Please upload your CV to get started.", variant: "destructive" });
      return;
    }
     if (!fullName || !userLocation) {
      toast({ title: "Missing Personal Info", description: "Please provide your full name and location.", variant: "destructive" });
      return;
    }
    if (!jobDescription) {
      toast({ title: "No Job Description", description: "Please paste the job description.", variant: "destructive" });
      return;
    }
    
    setAppState("loading");
    setAiResult(null);
    setGeneratedCoverLetter("");
    setError(null);

    try {
      const cvFile = files.find(f => f.name.toLowerCase().includes('cv') || f.name.toLowerCase().includes('resume')) || files[0];
      const supportingFiles = files.filter(f => f !== cvFile);

      const cvDataUri = await fileToDataUri(cvFile);
      const supportingDocs = await Promise.all(supportingFiles.map(fileToDataUri));
      const finalPortfolioUrls = portfolioUrls.filter(url => url.trim() !== "");

      const result = await generateCoverLetter({
        fullName,
        userLocation,
        phone,
        email,
        linkedinUrl,
        cvDataUri,
        jobDescription,
        supportingDocs,
        portfolioUrls: finalPortfolioUrls,
      });

      setAiResult(result);
      setGeneratedCoverLetter(result.coverLetter);
      setAppState("success");
      toast({
        title: "Cover Letter Generated!",
        description: "Your new cover letter is ready for editing and download.",
      });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      setAppState("error");
      toast({
        title: "AI Generation Failed",
        description: "Something went wrong. Please check your inputs and try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDownload = () => {
    if (!generatedCoverLetter) return;
    const blob = new Blob([generatedCoverLetter], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cover-letter.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const Step = ({
    step,
    title,
    description,
    children,
    className,
  }: {
    step: number;
    title: string;
    description: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {step}
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );


  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <header className="p-4 border-b bg-card shadow-sm sticky top-0 z-10">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <FlaskConical className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold font-headline text-foreground">
                SkillSync
              </h1>
            </div>
          </div>
      </header>
      
      <div className="w-full mb-8">
          <Image 
            src="https://placehold.co/1200x400.png"
            alt="Hero image showing a professional work environment"
            width={1200}
            height={400}
            className="w-full h-auto object-cover"
            data-ai-hint="professional workspace"
          />
      </div>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 items-center w-full">
            <div className="w-full space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Left Column */}
                  <div className="w-full">
                    <Step step={1} title="Personal Info Vault" description="Your personal details for the cover letter.">
                      <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name*</Label>
                          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rylan James Graham" required />
                          </div>
                          <div className="space-y-2">
                          <Label htmlFor="location">Location*</Label>
                          <Input id="location" value={userLocation} onChange={(e) => setUserLocation(e.target.value)} placeholder="Barcelona, Spain" required />
                          </div>
                          <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 635967609" />
                          </div>
                          <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rylangraham02@gmail.com" />
                          </div>
                          <div className="space-y-2">
                          <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                          <Input id="linkedin" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
                          </div>
                      </div>
                    </Step>
                  </div>
                  
                  {/* Right Column */}
                  <div className="w-full flex flex-col gap-8">
                    <Step step={2} title="Portfolio Vault" description="Upload your CV and supporting documents.">
                       <div className="space-y-4">
                        <div
                        className="relative flex flex-col items-center justify-center w-full p-6 transition-colors border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/80 hover:bg-primary/5"
                        onClick={() => fileInputRef.current?.click()}
                        >
                        <UploadCloud className="w-10 h-10 mb-2 text-muted-foreground" />
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
                            <Label>Uploaded Files:</Label>
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
                        <Label>Portfolio / Document URLs</Label>
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
                    </Step>
                    
                    <Step step={3} title="Job Description" description="Paste the full text of the job description below.">
                       <Textarea
                          placeholder="Paste job description here..."
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          required
                          className="min-h-[150px] text-sm"
                          />
                    </Step>
                  </div>
                </div>

                <div className="w-full space-y-4">
                  <Card>
                    <CardHeader>
                       <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl font-bold text-primary-foreground">
                            4
                          </div>
                          <div>
                            <CardTitle>Generate</CardTitle>
                            <CardDescription>All set! Click the button below to generate your cover letter.</CardDescription>
                          </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-500" />
                          <span className="font-semibold">Estimated Cost:</span>
                          <span>${estimatedCost}</span>
                          </div>
                          <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                              <Info className="h-4 w-4 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                              <p className="max-w-[200px] text-xs">
                                  This is a rough estimate based on the amount of text you provide and the expected length of the generated cover letter. Actual cost may vary.
                              </p>
                              </TooltipContent>
                          </Tooltip>
                          </TooltipProvider>
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={appState === 'loading'}>
                          {appState === 'loading' ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          ) : (
                          <Wand2 className="w-5 h-5 mr-2" />
                          )}
                          {appState === 'loading' ? "Drafting Your Cover Letter..." : "Generate Cover Letter"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="w-full space-y-4">
                    <Card className="min-h-[60vh] flex flex-col">
                        <CardHeader>
                            <CardTitle>Your Generated Cover Letter</CardTitle>
                            <CardDescription>The AI-generated result will appear here. You can edit it before downloading.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col">
                            {appState === 'loading' && (
                            <div className="flex-grow flex flex-col items-center justify-center text-center">
                                <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                                <p className="font-semibold">The Alchemist is at work...</p>
                                <p className="text-sm text-muted-foreground">Analyzing your documents and the job posting.</p>
                            </div>
                            )}
                            {appState === 'idle' && (
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-lg">
                                <Wand2 className="w-12 h-12 mb-4 text-muted-foreground" />
                                <p className="font-semibold">Ready for Magic</p>
                                <p className="text-sm text-muted-foreground">Fill in the details above to generate your cover letter.</p>
                            </div>
                            )}
                            {appState === 'error' && (
                            <div className="flex-grow flex flex-col items-center justify-center text-center text-destructive">
                                <AlertCircle className="w-12 h-12 mb-4" />
                                <p className="font-semibold">An Error Occurred</p>
                                <p className="text-sm">{error}</p>
                            </div>
                            )}
                            {appState === 'success' && (
                            <div className="flex-grow flex flex-col">
                                <Textarea
                                value={generatedCoverLetter}
                                onChange={(e) => setGeneratedCoverLetter(e.target.value)}
                                placeholder="Your generated cover letter will appear here..."
                                className="flex-grow w-full text-sm resize-none"
                                rows={20}
                                />
                                <Button onClick={handleDownload} className="mt-4" disabled={!generatedCoverLetter}>
                                <Download className="w-4 h-4 mr-2" />
                                Download as Markdown
                                </Button>
                            </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    {appState === 'success' && aiResult && (
                    <Card>
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BrainCircuit className="h-6 w-6" />
                            AI Analysis
                        </CardTitle>
                        <CardDescription>Here's what the AI understood from the job posting.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                            <h3 className="font-semibold">Job Title</h3>
                            <p className="text-muted-foreground">{aiResult.jobTitle}</p>
                            </div>
                            <div>
                            <h3 className="font-semibold">Company Name</h3>
                            <p className="text-muted-foreground">{aiResult.companyName}</p>
                            </div>
                            <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                <ListChecks className="h-5 w-5" />
                                Key Focus Points
                            </h3>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                                {aiResult.keyFocusPoints.map((point, index) => (
                                <li key={index}>{point}</li>
                                ))}
                            </ul>
                            </div>
                        </CardContent>
                    </Card>
                    )}
                </div>
            </div>
        </form>
      </main>
    </div>
  );
}

    