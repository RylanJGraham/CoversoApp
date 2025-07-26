"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { generateCoverLetter } from "@/ai/flows/cover-letter-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
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
  PlusCircle
} from "lucide-react";

type AppState = "idle" | "loading" | "success" | "error";

export function SkillSync() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobPostingUrl, setJobPostingUrl] = useState("");
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([""]);
  const [fullName, setFullName] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");

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
    if (!jobPostingUrl) {
      toast({ title: "No Job Posting URL", description: "Please provide a link to the job posting.", variant: "destructive" });
      return;
    }
    
    setAppState("loading");
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
        jobPostingUrl,
        supportingDocs,
        portfolioUrls: finalPortfolioUrls,
      });

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


  return (
    <div className="flex flex-col min-h-screen bg-background font-body">
      <header className="p-4 border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FlaskConical className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold font-headline text-foreground">
                SkillSync
              </h1>
            </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Personal Info Vault
                </CardTitle>
                <CardDescription>Enter your personal details to be included in the cover letter.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                  <Input id="linkedin" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="h-6 w-6" />
                  Portfolio Vault
                </CardTitle>
                <CardDescription>Upload your CV, supporting documents, and add links to online portfolios.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-6 w-6" />
                  Job Posting Link
                </CardTitle>
                <CardDescription>Provide a link to the job posting (e.g., LinkedIn, company career page).</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="url"
                  placeholder="https://www.linkedin.com/jobs/view/..."
                  value={jobPostingUrl}
                  onChange={(e) => setJobPostingUrl(e.target.value)}
                  required
                />
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full" disabled={appState === 'loading'}>
              {appState === 'loading' ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5 mr-2" />
              )}
              {appState === 'loading' ? "Drafting Your Cover Letter..." : "Generate Cover Letter"}
            </Button>
          </div>
          
          <div className="lg:sticky top-28">
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
                    <p className="text-sm text-muted-foreground">Fill in the details on the left to generate your cover letter.</p>
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
          </div>
        </form>
      </main>
    </div>
  );
}
