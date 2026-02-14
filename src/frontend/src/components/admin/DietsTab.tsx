import { useState } from 'react';
import { useGetAllDietCharts } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Apple } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import DietFormDialog from './DietFormDialog';
import type { DietChart } from '../../backend';

export default function DietsTab() {
  const { data: diets, isLoading } = useGetAllDietCharts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiet, setSelectedDiet] = useState<DietChart | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredDiets = diets?.filter((diet) =>
    diet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    diet.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (diet: DietChart) => {
    setSelectedDiet(diet);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedDiet(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Diet Charts</h2>
          <p className="text-muted-foreground">Create and manage nutrition plans for members</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Diet Chart
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search diet charts..."
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
      ) : filteredDiets && filteredDiets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDiets.map((diet) => (
            <Card key={diet.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleEdit(diet)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-950 rounded-full p-2">
                      <Apple className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{diet.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">{diet.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Meals:</span>
                  <Badge variant="secondary">{diet.meals.length} meals</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {diet.meals.slice(0, 2).map((meal, idx) => (
                    <div key={idx}>• {meal.name}</div>
                  ))}
                  {diet.meals.length > 2 && <div>• +{diet.meals.length - 2} more</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Apple className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No diet charts found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Create your first diet chart to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Diet Chart
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <DietFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        diet={selectedDiet}
      />
    </div>
  );
}
