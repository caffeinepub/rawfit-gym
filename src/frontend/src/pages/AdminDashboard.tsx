import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '../components/Header';
import DashboardTab from '../components/admin/DashboardTab';
import MembersTab from '../components/admin/MembersTab';
import DietsTab from '../components/admin/DietsTab';
import WorkoutsTab from '../components/admin/WorkoutsTab';
import PackagesTab from '../components/admin/PackagesTab';
import AttendanceTab from '../components/admin/AttendanceTab';
import VideoLibraryTab from '../components/admin/VideoLibraryTab';
import PauseRequestsTab from '../components/admin/PauseRequestsTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 h-auto gap-2">
            <TabsTrigger value="dashboard" className="text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="members" className="text-sm">Members</TabsTrigger>
            <TabsTrigger value="diets" className="text-sm">Diets</TabsTrigger>
            <TabsTrigger value="workouts" className="text-sm">Workouts</TabsTrigger>
            <TabsTrigger value="packages" className="text-sm">Packages</TabsTrigger>
            <TabsTrigger value="attendance" className="text-sm">Attendance</TabsTrigger>
            <TabsTrigger value="videos" className="text-sm">Videos</TabsTrigger>
            <TabsTrigger value="pause-requests" className="text-sm">Pause Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <MembersTab />
          </TabsContent>

          <TabsContent value="diets" className="space-y-6">
            <DietsTab />
          </TabsContent>

          <TabsContent value="workouts" className="space-y-6">
            <WorkoutsTab />
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <PackagesTab />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <AttendanceTab />
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <VideoLibraryTab />
          </TabsContent>

          <TabsContent value="pause-requests" className="space-y-6">
            <PauseRequestsTab />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>
          © {new Date().getFullYear()}. Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
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
