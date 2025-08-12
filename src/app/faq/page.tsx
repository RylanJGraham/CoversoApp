
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Header } from "@/components/Header";

export default function FAQPage() {
  return (
    <div className="bg-white text-gray-800 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <header className="text-center py-16 bg-primary/10">
          <h1 className="text-5xl font-bold text-primary">Frequently Asked Questions</h1>
          <p className="text-xl mt-4 text-gray-600">Have questions? We have answers.</p>
        </header>

        <section className="py-20 px-4 max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-xl font-semibold">How does Coverso work?</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed">
                Coverso uses advanced AI to analyze the job description you provide and your CV. It identifies the key skills and qualifications the employer is looking for and then generates a unique, tailored cover letter that highlights your most relevant experience.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-xl font-semibold">Is the generated cover letter unique?</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed">
                Yes, absolutely. Each cover letter is generated from scratch based on the specific job description and your personal documents. It's not a template. You get a completely original letter every time, which you can then edit and finalize.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-xl font-semibold">Is my personal data safe?</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed">
                We take your privacy and data security very seriously. Your uploaded documents are used solely for the purpose of generating your cover letter and are not stored long-term or used for any other purpose. Please refer to our Privacy Policy for more details.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-4">
              <AccordionTrigger className="text-xl font-semibold">Can I edit the cover letter after it's generated?</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed">
                Of course! We provide you with a fully-editable text box to make any tweaks or add your personal touch before you download the final document. We encourage you to review the letter and make it your own.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-xl font-semibold">Is Coverso free?</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed">
                Coverso operates on a credit-based system. Your first few cover letters are on us! After that, you can purchase credit packs to continue using the service. We believe in transparent pricing with no hidden subscriptions.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>
      <footer className="text-center py-8 bg-gray-100 mt-auto">
        <p>&copy; {new Date().getFullYear()} Coverso. All rights reserved.</p>
      </footer>
    </div>
  )
}
