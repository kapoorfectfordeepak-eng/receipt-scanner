import ReceiptScanner from "@/components/ReceiptScanner";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Receipt Scanner
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Upload a receipt image or PDF to extract and categorize expenses
          </p>
        </header>

        <ReceiptScanner />

        <footer className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Powered by n8n + GPT-4 Vision</p>
        </footer>
      </div>
    </main>
  );
}
