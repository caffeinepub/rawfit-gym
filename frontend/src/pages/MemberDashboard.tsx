import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import MemberHeader from '../components/member/MemberHeader';
import MemberDashboardTab from '../components/member/MemberDashboardTab';
import MemberVideoLibraryTab from '../components/member/MemberVideoLibraryTab';
import { useMemberAuth } from '../hooks/useMemberAuth';
import { useGetMemberByMembershipId } from '../hooks/useQueries';

export default function MemberDashboard() {
  const navigate = useNavigate();
  const { memberId } = useMemberAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: memberData, isLoading: memberLoading } = useGetMemberByMembershipId(memberId);

  if (!memberId) {
    navigate({ to: '/member-login' });
    return null;
  }

  if (memberLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const member = memberData?.member ?? null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MemberHeader memberProfile={member} />

      <main className="flex-1 container mx-auto px-4 py-4 max-w-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="dashboard" className="flex-1">Dashboard</TabsTrigger>
            <TabsTrigger value="videos" className="flex-1">Video Library</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <MemberDashboardTab memberId={memberId} memberProfile={member} />
          </TabsContent>

          <TabsContent value="videos">
            <MemberVideoLibraryTab />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        <p>
          © {new Date().getFullYear()} RawFit Gym · Built with{' '}
          <span className="text-red-500">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'rawfit-gym')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
