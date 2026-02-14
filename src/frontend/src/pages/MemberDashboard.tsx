import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MemberHeader from '../components/member/MemberHeader';
import MemberDashboardTab from '../components/member/MemberDashboardTab';
import MemberVideoLibraryTab from '../components/member/MemberVideoLibraryTab';

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MemberHeader />
      
      <main className="flex-1 container mx-auto px-4 py-4 md:py-6 max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto gap-2">
            <TabsTrigger value="dashboard" className="text-sm md:text-base py-2 md:py-3">
              My Dashboard
            </TabsTrigger>
            <TabsTrigger value="videos" className="text-sm md:text-base py-2 md:py-3">
              Video Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 md:space-y-6">
            <MemberDashboardTab />
          </TabsContent>

          <TabsContent value="videos" className="space-y-4 md:space-y-6">
            <MemberVideoLibraryTab />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="py-4 md:py-6 text-center text-xs md:text-sm text-muted-foreground border-t">
        <p>
          © 2025. Built with ❤️ using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
