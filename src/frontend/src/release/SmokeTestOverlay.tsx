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
              <DialogTitle className="text-2xl">Production Smoke Test - Version 37</DialogTitle>
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
            {progressPercent === 100 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <span className="text-lg font-bold">Complete ✓</span>
              </div>
            ) : (
              <div className="text-3xl font-bold text-primary">{progressPercent}%</div>
            )}
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
                  <div>Backend Version: {healthData.version}</div>
                  {versionStatus.isMatch ? (
                    <div className="text-green-600 font-medium">✓ Version matches expected (v1.2.1)</div>
                  ) : (
                    <div className="text-orange-600 font-medium">⚠ {versionStatus.message}</div>
                  )}
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
              <AlertDescription>
                Unable to connect to backend. Verify deployment and network connectivity.
              </AlertDescription>
            </Alert>
          )}

          {/* Test Categories */}
          <Tabs defaultValue="health" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="health" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Health
                <Badge variant="secondary" className="ml-1">
                  {healthChecked}/{healthTests.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
                <Badge variant="secondary" className="ml-1">
                  {adminChecked}/{adminTests.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="member" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Member
                <Badge variant="secondary" className="ml-1">
                  {memberChecked}/{memberTests.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="health" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  {healthTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={test.id}
                        checked={checkedItems.has(test.id)}
                        onCheckedChange={() => toggleItem(test.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={test.id}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {test.description}
                        </label>
                        <p className="text-sm text-muted-foreground">{test.instructions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="admin" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  {adminTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={test.id}
                        checked={checkedItems.has(test.id)}
                        onCheckedChange={() => toggleItem(test.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={test.id}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {test.description}
                        </label>
                        <p className="text-sm text-muted-foreground">{test.instructions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="member" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-3">
                  {memberTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={test.id}
                        checked={checkedItems.has(test.id)}
                        onCheckedChange={() => toggleItem(test.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={test.id}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {test.description}
                        </label>
                        <p className="text-sm text-muted-foreground">{test.instructions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {progressPercent === 100 && (
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              All Tests Complete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
