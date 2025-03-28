import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ChevronRight, Settings as SettingsIcon, PanelRightClose, PanelRightOpen, CheckCircle2, Circle, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Api, LoadTableResult } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn, errorToString } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

async function loadTableData(catalog: string, namespace: string, table: string) {
  const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
  const response = await api.v1.loadTable(namespace, table)
  return response
}

type OptimizationStep = {
  name: string;
  status: 'pending' | 'running' | 'done' | 'error';
  error?: string;
  result?: any;
};

export default function OptimizePage() {
  const { catalog, namespace, table } = useParams<{ catalog: string, namespace: string, table: string }>()
  const { toast } = useToast()
  const navigate = useNavigate()
  if (!catalog || !namespace || !table) {
    throw new Error("Invalid table path")
  }

  const [tableData, setTableData] = useState<LoadTableResult | undefined>(undefined)
  const [showOptimizeDialog, setShowOptimizeDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [optimizationSteps, setOptimizationSteps] = useState<OptimizationStep[]>([
    { name: 'Snapshot Expiration', status: 'pending' },
    { name: 'Orphan File Cleanup', status: 'pending' },
    { name: 'Compaction', status: 'pending' },
  ]);

  // Optimization settings
  const [snapshotRetention, setSnapshotRetention] = useState(true)
  const [retentionPeriod, setRetentionPeriod] = useState("5")
  const [minSnapshotsToKeep, setMinSnapshotsToKeep] = useState("1")
  const [orphanFileDeletion, setOrphanFileDeletion] = useState(true)
  const [orphanFileRetention, setOrphanFileRetention] = useState("3")
  const [compaction, setCompaction] = useState(true)

  useEffect(() => {
    loadTableData(catalog, namespace, table).then(setTableData).catch((error) => {
      toast({
        variant: "destructive",
        title: "Failed to load table",
        description: errorToString(error),
      })
    })
  }, [catalog, namespace, table])

  const runOptimizationStep = async (step: OptimizationStep, index: number) => {
    try {
      setOptimizationSteps(steps => {
        const newSteps = [...steps];
        newSteps[index] = { ...step, status: 'running' };
        return newSteps;
      });

      const operation = step.name === 'Compaction' ? 'compact' :
                       step.name === 'Snapshot Expiration' ? 'expire-snapshots' :
                       'clean-orphan-files';

      const response = await fetch(`/api/optimize/${catalog}/${namespace}/${table}/${operation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snapshotRetention: snapshotRetention,
          retentionPeriod: parseInt(retentionPeriod) * 24 * 60 * 60 * 1000,
          minSnapshotsToKeep: parseInt(minSnapshotsToKeep),
          orphanFileDeletion: orphanFileDeletion,
          orphanFileRetention: parseInt(orphanFileRetention) * 24 * 60 * 60 * 1000,
          compaction: compaction,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to run ${step.name}`);
      }

      const result = await response.json();
      
      setOptimizationSteps(steps => {
        const newSteps = [...steps];
        newSteps[index] = { ...step, status: 'done', result };
        return newSteps;
      });

      return true;
    } catch (error) {
      setOptimizationSteps(steps => {
        const newSteps = [...steps];
        newSteps[index] = { ...step, status: 'error', error: errorToString(error) };
        return newSteps;
      });
      return false;
    }
  };

  const handleOptimize = async (action: 'schedule' | 'run') => {
    if (action === 'run') {
      setShowProgressDialog(true);
      setOptimizationSteps(steps => steps.map(step => ({ ...step, status: 'pending' })));

      // Run steps sequentially
      for (let i = 0; i < optimizationSteps.length; i++) {
        const step = optimizationSteps[i];
        const success = await runOptimizationStep(step, i);
        if (!success) {
          toast({
            variant: "destructive",
            title: `Failed to run ${step.name}`,
            description: step.error,
          });
          return;
        }
      }

      toast({
        title: "Optimization completed",
        description: "All optimization steps have been completed successfully.",
      });
    } else {
      // Handle schedule case (just update properties)
      try {
        setIsLoading(true);
        const response = await fetch(`/api/optimize/${catalog}/${namespace}/${table}/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            snapshotRetention: snapshotRetention,
            retentionPeriod: parseInt(retentionPeriod) * 24 * 60 * 60 * 1000,
            minSnapshotsToKeep: parseInt(minSnapshotsToKeep),
            orphanFileDeletion: orphanFileDeletion,
            orphanFileRetention: parseInt(orphanFileRetention) * 24 * 60 * 60 * 1000,
            compaction: compaction,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to schedule optimization');
        }

        toast({
          title: "Optimization scheduled",
          description: "Table optimization has been scheduled successfully.",
        });
        setShowOptimizeDialog(false);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to schedule optimization",
          description: errorToString(error),
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!tableData) return null

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
          <Link to={`/catalog/${catalog}`} className="hover:text-foreground">
            Namespaces
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/catalog/${catalog}/namespace/${namespace}`} className="hover:text-foreground">
            {namespace}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/catalog/${catalog}/namespace/${namespace}/table/${table}`} className="hover:text-foreground">
            {table}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Optimize</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto border-r">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <SettingsIcon className="h-4 w-4" />
              <h1 className="text-xl font-semibold">Table Optimization</h1>
            </div>
            <Button onClick={() => setShowOptimizeDialog(true)}>
              Configure
            </Button>
          </div>

          <div className="p-6 space-y-8">
            {/* Optimization History Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Optimization History</h2>
              {/* TODO: Add optimization history table */}
            </div>
          </div>
        </div>
      </div>

      {/* Enable Optimization Dialog */}
      <Dialog open={showOptimizeDialog} onOpenChange={setShowOptimizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Optimization</DialogTitle>
            <DialogDescription>
              Configure optimization settings for the table.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Snapshot Retention */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Snapshot retention</Label>
                <p className="text-sm text-muted-foreground">
                  Removing old snapshots.
                </p>
              </div>
              <Switch
                checked={snapshotRetention}
                onCheckedChange={setSnapshotRetention}
              />
            </div>
            {snapshotRetention && (
              <div className="grid gap-4 pl-4">
                <div className="grid gap-2">
                  <Label htmlFor="retention-period">Retention period (days)</Label>
                  <Input
                    id="retention-period"
                    type="number"
                    min="1"
                    value={retentionPeriod}
                    onChange={(e) => setRetentionPeriod(e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="min-snapshots">Minimum snapshots to retain</Label>
                  <Input
                    id="min-snapshots"
                    type="number"
                    min="1"
                    value={minSnapshotsToKeep}
                    onChange={(e) => setMinSnapshotsToKeep(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>
            )}

            {/* Orphan File Deletion */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Orphan file deletion</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically clean up unused files periodically.
                </p>
              </div>
              <Switch
                checked={orphanFileDeletion}
                onCheckedChange={setOrphanFileDeletion}
              />
            </div>
            {orphanFileDeletion && (
              <div className="grid gap-2 pl-4">
                <Label htmlFor="orphan-retention">Delete orphan files after (days)</Label>
                <Input
                  id="orphan-retention"
                  type="number"
                  min="1"
                  value={orphanFileRetention}
                  onChange={(e) => setOrphanFileRetention(e.target.value)}
                  placeholder="3"
                />
              </div>
            )}

            {/* Compaction */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compaction</Label>
                <p className="text-sm text-muted-foreground">
                  Combine small data files into larger files.
                </p>
              </div>
              <Switch
                checked={compaction}
                onCheckedChange={setCompaction}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOptimizeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleOptimize('run')} disabled={isLoading}>
              Run Once
            </Button>
            <Button onClick={() => handleOptimize('schedule')} disabled={isLoading}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Optimization Progress</DialogTitle>
            <DialogDescription>
              Running optimization operations. This may take several minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {optimizationSteps.map((step, index) => (
              <div key={step.name} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {step.status === 'pending' && <Circle className="h-5 w-5 text-muted-foreground" />}
                  {step.status === 'running' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  {step.status === 'done' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {step.status === 'error' && <Circle className="h-5 w-5 text-red-500" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{step.name}</div>
                  {step.status === 'error' && (
                    <div className="text-sm text-red-500">{step.error}</div>
                  )}
                  {step.status === 'done' && step.result && (
                    <div className="text-sm text-muted-foreground">
                      {step.name === 'Compaction' && step.result?.rewrittenDataFilesCount != null && step.result?.addedDataFilesCount != null && (
                        <>
                          Rewritten: {step.result.rewrittenDataFilesCount} files,{' '}
                          Added: {step.result.addedDataFilesCount} files
                        </>
                      )}
                      {step.name === 'Snapshot Expiration' && step.result?.deletedDataFilesCount != null && step.result?.deletedManifestFilesCount != null && (
                        <>
                          Deleted: {step.result.deletedDataFilesCount} data files,{' '}
                          {step.result.deletedManifestFilesCount} manifest files
                        </>
                      )}
                      {step.name === 'Orphan File Cleanup' && step.result?.orphanFileLocations != null && (
                        <>
                          Cleaned: {step.result.orphanFileLocations.length} orphan files
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
