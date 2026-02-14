import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Activity, User, Shield, X } from 'lucide-react';
import { SMOKE_TEST_CHECKLIST, getSmokeTestsByCategory } from './smokeTestChecklist';
import { getVersionStatus } from './expectedProductionVersion';

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
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const healthTests = getSmokeTestsByCategory('health');
  const adminTests = getSmokeTestsByCategory('admin');
  const memberTests = getSmokeTestsByCategory('member');

  const healthChecked = healthTests.filter((t) => checkedItems.has(t.id)).length;
  const adminChecked = adminTests.filter((t) => checkedItems.has(t.id)).length;
  const memberChecked = memberTests.filter((t) => checkedItems.has(t.id)).length;

  const totalTests = SMOKE_TEST_CHECKLIST.length;
  const totalChecked = checkedItems.size;
  const progressPercent = Math.round((totalChecked / totalTests) * 100);

  const versionStatus = getVersionStatus(healthData?.version);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Production Smoke Test - Version 36</DialogTitle>
              <DialogDescription>
                Verify release-critical flows after publishing to production
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Progress Summary */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {totalChecked} / {totalTests} tests
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary">{progressPercent}%</div>
          </div>

          {/* Backend Health Status */}
          {healthData ? (
            <Alert variant={versionStatus.isMatch ? 'default' : 'destructive'}>
              {versionStatus.isMatch ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>Backend Health Check</AlertTitle>
              <AlertDescription>
                <div className="space-y-1">
                  <div>Status: {healthData.ok ? '✓ OK' : '✗ Failed'}</div>
                  <div>{versionStatus.message}</div>
                  <div className="text-xs text-muted-foreground">
                    Timestamp: {new Date(Number(healthData.timestamp) / 1_000_000).toLocaleString()}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Backend Unreachable</AlertTitle>
              <AlertDescription>Unable to connect to backend. Check deployment status.</AlertDescription>
            </Alert>
          )}

          {/* Test Checklist Tabs */}
          <Tabs defaultValue="health" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="health" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Health ({healthChecked}/{healthTests.length})
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin ({adminChecked}/{adminTests.length})
              </TabsTrigger>
              <TabsTrigger value="member" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Member ({memberChecked}/{memberTests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="health" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  {healthTests.map((test) => (
                    <TestItem
                      key={test.id}
                      test={test}
                      checked={checkedItems.has(test.id)}
                      onToggle={() => toggleItem(test.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="admin" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  {adminTests.map((test) => (
                    <TestItem
                      key={test.id}
                      test={test}
                      checked={checkedItems.has(test.id)}
                      onToggle={() => toggleItem(test.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="member" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  {memberTests.map((test) => (
                    <TestItem
                      key={test.id}
                      test={test}
                      checked={checkedItems.has(test.id)}
                      onToggle={() => toggleItem(test.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setCheckedItems(new Set())}>
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCheckedItems(new Set(SMOKE_TEST_CHECKLIST.map((t) => t.id)))}
              >
                Check All
              </Button>
              <Button onClick={onClose} disabled={totalChecked < totalTests}>
                {totalChecked === totalTests ? 'Complete ✓' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TestItemProps {
  test: {
    id: string;
    description: string;
    instructions: string;
  };
  checked: boolean;
  onToggle: () => void;
}

function TestItem({ test, checked, onToggle }: TestItemProps) {
  return (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        checked ? 'bg-primary/5 border-primary' : 'bg-card hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={checked} onCheckedChange={onToggle} className="mt-1" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${checked ? 'line-through text-muted-foreground' : ''}`}>
              {test.description}
            </p>
            {checked && <Badge variant="outline" className="text-xs">✓ Done</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{test.instructions}</p>
        </div>
      </div>
    </div>
  );
}
