import { useState, useEffect } from 'react';
import { useCreateDietChart, useUpdateDietChart } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DietChart, Meal } from '../../backend';

interface DietFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diet: DietChart | null;
}

export default function DietFormDialog({ open, onOpenChange, diet }: DietFormDialogProps) {
  const createDiet = useCreateDietChart();
  const updateDiet = useUpdateDietChart();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meals: [] as Meal[],
  });

  useEffect(() => {
    if (diet) {
      setFormData({
        name: diet.name,
        description: diet.description,
        meals: diet.meals,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        meals: [],
      });
    }
  }, [diet, open]);

  const addMeal = () => {
    setFormData({
      ...formData,
      meals: [
        ...formData.meals,
        {
          name: '',
          description: '',
          calories: BigInt(0),
          protein: BigInt(0),
          carbs: BigInt(0),
          fats: BigInt(0),
        },
      ],
    });
  };

  const removeMeal = (index: number) => {
    setFormData({
      ...formData,
      meals: formData.meals.filter((_, i) => i !== index),
    });
  };

  const updateMeal = (index: number, field: keyof Meal, value: string | bigint) => {
    const updatedMeals = [...formData.meals];
    updatedMeals[index] = { ...updatedMeals[index], [field]: value };
    setFormData({ ...formData, meals: updatedMeals });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dietData: DietChart = {
      id: diet?.id || `diet_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      meals: formData.meals,
    };

    if (diet) {
      updateDiet.mutate(dietData, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createDiet.mutate(dietData, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createDiet.isPending || updateDiet.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{diet ? 'Edit Diet Chart' : 'Create Diet Chart'}</DialogTitle>
          <DialogDescription>
            {diet ? 'Update diet chart information and meals' : 'Create a new diet chart with meal plans'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Diet Chart Name *</Label>
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
              <Label>Meals</Label>
              <Button type="button" size="sm" onClick={addMeal}>
                <Plus className="mr-2 h-4 w-4" />
                Add Meal
              </Button>
            </div>

            {formData.meals.map((meal, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Meal {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMeal(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Meal Name</Label>
                      <Input
                        value={meal.name}
                        onChange={(e) => updateMeal(index, 'name', e.target.value)}
                        placeholder="e.g., Breakfast"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Calories</Label>
                      <Input
                        type="number"
                        value={Number(meal.calories)}
                        onChange={(e) => updateMeal(index, 'calories', BigInt(e.target.value || 0))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={meal.description}
                      onChange={(e) => updateMeal(index, 'description', e.target.value)}
                      placeholder="Meal details..."
                      rows={2}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Protein (g)</Label>
                      <Input
                        type="number"
                        value={Number(meal.protein)}
                        onChange={(e) => updateMeal(index, 'protein', BigInt(e.target.value || 0))}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Carbs (g)</Label>
                      <Input
                        type="number"
                        value={Number(meal.carbs)}
                        onChange={(e) => updateMeal(index, 'carbs', BigInt(e.target.value || 0))}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fats (g)</Label>
                      <Input
                        type="number"
                        value={Number(meal.fats)}
                        onChange={(e) => updateMeal(index, 'fats', BigInt(e.target.value || 0))}
                        required
                      />
                    </div>
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
              ) : diet ? (
                'Update Diet Chart'
              ) : (
                'Create Diet Chart'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
