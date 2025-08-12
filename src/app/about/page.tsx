
import Image from 'next/image';
import { Header } from '@/components/Header';

export default function AboutPage() {
  return (
    <div className="bg-white text-gray-800 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <header className="text-center py-16 bg-primary/10">
          <h1 className="text-5xl font-bold text-primary">About Coverso</h1>
          <p className="text-xl mt-4 text-gray-600">Leveling the Playing Field in the Age of AI Recruitment</p>
        </header>

        <section className="py-20 px-4 max-w-4xl mx-auto">
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-3xl font-semibold mb-4">The Game Has Changed. Have You?</h2>
              <p className="text-lg leading-relaxed">
                In today's job market, your application isn't just being read by a person. It's scanned, sorted, and ranked by sophisticated AI before a human ever sees it. Companies use these tools to handle thousands of applications, looking for the perfect keywords and metrics. If your resume and cover letter aren't tailored precisely to their algorithms, you don't stand a chance.
              </p>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-semibold mb-4">Fight Fire with Fire</h2>
              <p className="text-lg leading-relaxed">
                Why should companies be the only ones using AI to their advantage? Coverso was born from a simple idea: give job seekers the same power. We use advanced generative AI to help you create perfectly tailored, professional cover letters in minutes, not hours. We analyze the job description, understand what the hiring AI is looking for, and craft a letter that highlights your most relevant skills and experiences.
              </p>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-semibold mb-4">Your Time Is Valuable. Stop Wasting It.</h2>
              <p className="text-lg leading-relaxed">
                The average job search is a grueling, time-consuming process. Writing a unique cover letter for every single application is exhausting and often feels fruitless. Coverso automates the most tedious part of the process, freeing you up to focus on what really matters: preparing for interviews, networking, and finding the right opportunities.
              </p>
              <p className="text-lg mt-4 font-semibold text-primary">
                Stop playing a game that's rigged against you. Start using Coverso and give your application the AI-powered edge it deserves.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="text-center py-8 bg-gray-100 mt-auto">
        <p>&copy; {new Date().getFullYear()} Coverso. All rights reserved.</p>
      </footer>
    </div>
  );
}
