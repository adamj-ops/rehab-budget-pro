import type { Metadata } from 'next';
import './globals.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/nav';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Rehab Budget Pro',
  description: 'Simple, focused budget tracking for fix & flip projects',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>
            <SidebarProvider defaultOpen={true}>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
                  <SidebarTrigger className="-ml-2" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                </header>
                <div className="flex flex-1 flex-col bg-background">
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
            <Toaster richColors position="bottom-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
