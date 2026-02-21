import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Circle, AlertCircle, X, Rocket } from 'lucide-react';
import { smokeTestChecklist, getCategoryProgress, getOverallProgress, type SmokeTestItem } from './smokeTestChecklist';
import { isVersionMatch } from './expectedProductionVersion';

interface SmokeTestOverlayProps {
  open: boolean;
  onClose: () => void;
  healthData?: {
    ok: boolean;
    version: string;
    timestamp: bigint;
  } | null;
}

export function SmokeTestOverlay({ open, onClose, healthData }: SmokeTestOverlayProps) {
  const [items, setItems] = useState<SmokeTestItem[]>(smokeTestChecklist);

  // Auto-check health items based on healthData
  useEffect(() => {
    if (healthData) {
      setItems(prevItems =>
        prevItems.map(item => {
          if (item.id === 'health-backend' && healthData.ok) {
            return { ...item, checked: true };
          }
          if (item.id === 'health-version' && isVersionMatch(healthData.version)) {
            return { ...item, checked: true };
          }
          return item;
        })
      );
    }
  }, [healthData]);

  const handleToggle = (id: string) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const healthProgress = getCategoryProgress('health', items);
  const adminProgress = getCategoryProgress('admin', items);
  const memberProgress = getCategoryProgress('member', items);
  const overallProgress = getOverallProgress(items);

  const isComplete = overallProgress.completed === overallProgress.total;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Rocket className="h-6 w-6 text-primary" />
                Production Smoke Test - Version 45
              </DialogTitle>
              <DialogDescription>
                Verify all critical functionality on mainnet before marking deployment as complete
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Overall Progress: {overallProgress.completed} / {overallProgress.total}
              </span>
              <span className="text-sm text-muted-foreground">
                {overallProgress.percentage}%
              </span>
            </div>
            <Progress value={overallProgress.percentage} className="h-2" />
            {isComplete && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">All tests completed! Production deployment verified ✓</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Scrollable Checklist */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Health Checks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Circle className="h-5 w-5 text-blue-500" />
                    Health Checks
                  </h3>
                  <Badge variant={healthProgress.percentage === 100 ? 'default' : 'secondary'}>
                    {healthProgress.completed} / {healthProgress.total}
                  </Badge>
                </div>
                <div className="space-y-2 pl-7">
                  {items
                    .filter(item => item.category === 'health')
                    .map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <Checkbox
                          id={item.id}
                          checked={item.checked}
                          onCheckedChange={() => handleToggle(item.id)}
                        />
                        <label
                          htmlFor={item.id}
                          className={`text-sm cursor-pointer flex-1 ${
                            item.checked ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {item.description}
                        </label>
                        {item.checked && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </div>
                    ))}
                </div>
              </div>

              <Separator />

              {/* Admin Flow */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Circle className="h-5 w-5 text-purple-500" />
                    Admin Flow
                  </h3>
                  <Badge variant={adminProgress.percentage === 100 ? 'default' : 'secondary'}>
                    {adminProgress.completed} / {adminProgress.total}
                  </Badge>
                </div>
                <div className="space-y-2 pl-7">
                  {items
                    .filter(item => item.category === 'admin')
                    .map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <Checkbox
                          id={item.id}
                          checked={item.checked}
                          onCheckedChange={() => handleToggle(item.id)}
                        />
                        <label
                          htmlFor={item.id}
                          className={`text-sm cursor-pointer flex-1 ${
                            item.checked ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {item.description}
                        </label>
                        {item.checked && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </div>
                    ))}
                </div>
              </div>

              <Separator />

              {/* Member Flow */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Circle className="h-5 w-5 text-green-500" />
                    Member Flow
                  </h3>
                  <Badge variant={memberProgress.percentage === 100 ? 'default' : 'secondary'}>
                    {memberProgress.completed} / {memberProgress.total}
                  </Badge>
                </div>
                <div className="space-y-2 pl-7">
                  {items
                    .filter(item => item.category === 'member')
                    .map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <Checkbox
                          id={item.id}
                          checked={item.checked}
                          onCheckedChange={() => handleToggle(item.id)}
                        />
                        <label
                          htmlFor={item.id}
                          className={`text-sm cursor-pointer flex-1 ${
                            item.checked ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {item.description}
                        </label>
                        {item.checked && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <Separator />

          {/* Backend Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Backend Status (Mainnet)</h4>
            {healthData ? (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {healthData.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Health: {healthData.ok ? 'OK' : 'Error'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isVersionMatch(healthData.version) ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span>Version: {healthData.version}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Backend status unavailable
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
