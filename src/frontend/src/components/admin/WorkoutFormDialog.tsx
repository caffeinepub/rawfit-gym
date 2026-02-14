import { useState, useEffect } from 'react';
import { useCreateWorkoutChart, useUpdateWorkoutChart } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkoutChart, Exercise } from '../../backend';

interface WorkoutFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutChart | null;
}

export default function WorkoutFormDialog({ open, onOpenChange, workout }: WorkoutFormDialogProps) {
  const createWorkout = useCreateWorkoutChart();
  const updateWorkout = useUpdateWorkoutChart();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    exercises: [] as Exercise[],
  });

  useEffect(() => {
    if (workout) {
      setFormData({
        name: workout.name,
        description: workout.description,
        exercises: workout.exercises,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        exercises: [],
      });
    }
  }, [workout, open]);

  const addExercise = () => {
    setFormData({
      ...formData,
      exercises: [
        ...formData.exercises,
        {
          name: '',
          sets: BigInt(0),
          reps: BigInt(0),
          instructions: '',
        },
      ],
    });
  };

  const removeExercise = (index: number) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index),
    });
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | bigint) => {
    const updatedExercises = [...formData.exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setFormData({ ...formData, exercises: updatedExercises });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const workoutData: WorkoutChart = {
      id: workout?.id || `workout_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      exercises: formData.exercises,
    };

    if (workout) {
      updateWorkout.mutate(workoutData, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createWorkout.mutate(workoutData, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createWorkout.isPending || updateWorkout.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workout ? 'Edit Workout Chart' : 'Create Workout Chart'}</DialogTitle>
          <DialogDescription>
            {workout ? 'Update workout chart information and exercises' : 'Create a new workout chart with exercises'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workout Chart Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Exercises</Label>
              <Button type="button" size="sm" onClick={addExercise}>
                <Plus className="mr-2 h-4 w-4" />
                Add Exercise
              </Button>
            </div>

            {formData.exercises.map((exercise, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Exercise {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Exercise Name</Label>
                    <Input
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      placeholder="e.g., Push-ups"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Sets</Label>
                      <Input
                        type="number"
                        value={Number(exercise.sets)}
                        onChange={(e) => updateExercise(index, 'sets', BigInt(e.target.value || 0))}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Reps</Label>
                      <Input
                        type="number"
                        value={Number(exercise.reps)}
                        onChange={(e) => updateExercise(index, 'reps', BigInt(e.target.value || 0))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Instructions</Label>
                    <Textarea
                      value={exercise.instructions}
                      onChange={(e) => updateExercise(index, 'instructions', e.target.value)}
                      placeholder="Exercise instructions..."
                      rows={2}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : workout ? (
                'Update Workout Chart'
              ) : (
                'Create Workout Chart'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
