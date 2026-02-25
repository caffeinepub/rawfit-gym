import { useGetAllMembers, useGetAllDietCharts, useGetAllWorkoutCharts, useGetAllMembershipPackages } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Apple, Dumbbell, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PauseRequestNotifications from './PauseRequestNotifications';

export default function DashboardTab() {
  const { data: members, isLoading: membersLoading } = useGetAllMembers();
  const { data: diets, isLoading: dietsLoading } = useGetAllDietCharts();
  const { data: workouts, isLoading: workoutsLoading } = useGetAllWorkoutCharts();
  const { data: packages, isLoading: packagesLoading } = useGetAllMembershipPackages();

  const stats = [
    {
      title: 'Total Members',
      value: members?.length || 0,
      icon: Users,
      loading: membersLoading,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
    },
    {
      title: 'Diet Charts',
      value: diets?.length || 0,
      icon: Apple,
      loading: dietsLoading,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-950',
    },
    {
      title: 'Workout Charts',
      value: workouts?.length || 0,
      icon: Dumbbell,
      loading: workoutsLoading,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-950',
    },
    {
      title: 'Packages',
      value: packages?.length || 0,
      icon: Package,
      loading: packagesLoading,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-950',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">Overview of your gym management system</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pause Request Notifications */}
      <PauseRequestNotifications />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to RawFit Gym</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your comprehensive gym management system is ready for production use.
            </p>
            <p className="text-sm text-muted-foreground">
              Get started by creating your first member profile, diet chart, or workout plan using the tabs above.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use the tabs above to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Manage member profiles and registrations</li>
              <li>Create and assign diet charts</li>
              <li>Create and assign workout plans</li>
              <li>Track attendance records</li>
              <li>Upload workout videos</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Production Ready</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The RawFit Gym application is now live and ready for real gym operations:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Complete member management system</li>
            <li>Diet and workout chart creation and assignment</li>
            <li>Attendance tracking and reporting</li>
            <li>Location-based video library access (100m radius verification)</li>
            <li>Membership status management (active, paused, inactive)</li>
            <li>Mobile-optimized member interface</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
