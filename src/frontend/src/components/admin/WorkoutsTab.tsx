import { useState } from 'react';
import { useGetAllWorkoutCharts } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Dumbbell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import WorkoutFormDialog from './WorkoutFormDialog';
import type { WorkoutChart } from '../../backend';

export default function WorkoutsTab() {
  const { data: workouts, isLoading } = useGetAllWorkoutCharts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutChart | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredWorkouts = workouts?.filter((workout) =>
    workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workout.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (workout: WorkoutChart) => {
    setSelectedWorkout(workout);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedWorkout(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workout Charts</h2>
          <p className="text-muted-foreground">Create and manage exercise routines for members</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workout Chart
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workout charts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredWorkouts && filteredWorkouts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkouts.map((workout) => (
            <Card key={workout.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleEdit(workout)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 dark:bg-orange-950 rounded-full p-2">
                      <Dumbbell className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{workout.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">{workout.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Exercises:</span>
                  <Badge variant="secondary">{workout.exercises.length} exercises</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {workout.exercises.slice(0, 2).map((exercise, idx) => (
                    <div key={idx}>• {exercise.name}</div>
                  ))}
                  {workout.exercises.length > 2 && <div>• +{workout.exercises.length - 2} more</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No workout charts found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Create your first workout chart to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Workout Chart
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <WorkoutFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        workout={selectedWorkout}
      />
    </div>
  );
}
