"use client";

import { useState } from "react";
import { PropertyManagerLayout } from "@/components/layouts/PropertyManagerLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { usePropertyManagerReports, useUpdateReportStatus } from "@/hooks/useReports";
import { useProperties } from "@/hooks/useProperties";
import { Report } from "@/lib/report-api";
import { Property } from "@/lib/property-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Building2, CheckCircle2, Clock, FileText, User, XCircle, Archive } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatShortDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { sidebarCountsKeys } from "@/hooks/usePropertyManagerSidebarCounts";

export default function PropertyManagerReportsPage() {
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const queryClient = useQueryClient();

  // Build query params
  const queryParams: Record<string, string | number> = {};
  if (selectedProperty !== "all") {
    queryParams.property_id = parseInt(selectedProperty);
  }
  if (selectedStatus !== "all") {
    queryParams.status = selectedStatus;
  }

  const { data: reportsData, isLoading, error } = usePropertyManagerReports(queryParams);
  const { data: propertiesData } = useProperties({ limit: 1000 });
  const updateReportMutation = useUpdateReportStatus();

  const reports = reportsData?.reports || [];
  const properties = propertiesData?.properties || [];

  const handleStatusUpdate = async () => {
    if (!selectedReport || !newStatus) return;

    try {
      await updateReportMutation.mutateAsync({
        id: selectedReport.id,
        data: { status: newStatus as 'pending' | 'in_progress' | 'resolved' | 'rejected' }
      });
      setSelectedReport(null);
      setNewStatus("");
    } catch (err) {
      // Error is handled by the mutation
      console.error('Failed to update report status:', err);
    }
  };

  const handleArchiveReports = async () => {
    if (selectedIds.length === 0) return;

    setIsArchiving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reports/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive reports');
      }

      // Refetch the reports
      queryClient.invalidateQueries({ queryKey: ['propertyManagerReports'] });
      // Invalidate sidebar counts
      queryClient.invalidateQueries({ queryKey: sidebarCountsKeys.all });

      toast.success(`${selectedIds.length} raport(e) u arkivuan me sukses`);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to archive reports:', err);
      toast.error('Dështoi arkivimi i raporteve');
    } finally {
      setIsArchiving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs"><Clock className="mr-1 h-3 w-3" />Në pritje</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs"><AlertCircle className="mr-1 h-3 w-3" />Në progres</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs"><CheckCircle2 className="mr-1 h-3 w-3" />Zgjidhur</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs"><XCircle className="mr-1 h-3 w-3" />Refuzuar</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  // Stats
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  return (
    <ProtectedRoute allowedRoles={['property_manager']}>
      <PropertyManagerLayout title="Raportet">
        <div className="space-y-4 md:space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Raportet Totale</CardTitle>
                <FileText className="h-3 w-3 md:h-4 md:w-4 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-slate-700">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Në pritje</CardTitle>
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-yellow-700">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Në progres</CardTitle>
                <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-blue-700">{stats.inProgress}</div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Zgjidhur</CardTitle>
                <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold text-green-700">{stats.resolved}</div>
              </CardContent>
            </Card>
          </div>

          {/* Reports Table with Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base md:text-lg">Pamja e Raporteve</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Menaxhoni dhe përgjigjuni raporteve të problemeve të banorëve
                    </CardDescription>
                  </div>
                  {selectedIds.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleArchiveReports}
                      disabled={isArchiving}
                      className="flex items-center gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      Arkivo ({selectedIds.length})
                    </Button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger className="w-full sm:w-[200px] h-9 md:h-10 text-xs md:text-sm">
                      <SelectValue placeholder="Të Gjitha Pronat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs md:text-sm">Të Gjitha Pronat</SelectItem>
                      {properties?.map((property: Property) => (
                        <SelectItem key={property.id} value={property.id.toString()} className="text-xs md:text-sm">
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9 md:h-10 text-xs md:text-sm">
                      <SelectValue placeholder="Të Gjitha Statuset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs md:text-sm">Të Gjitha Statuset</SelectItem>
                      <SelectItem value="pending" className="text-xs md:text-sm">Në pritje</SelectItem>
                      <SelectItem value="in_progress" className="text-xs md:text-sm">Në progres</SelectItem>
                      <SelectItem value="resolved" className="text-xs md:text-sm">Zgjidhur</SelectItem>
                      <SelectItem value="rejected" className="text-xs md:text-sm">Refuzuar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs md:text-sm">
                    {(error as any)?.response?.data?.message || 'Dështoi ngarkimi i raporteve'}
                  </AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-slate-600 text-xs md:text-sm">Duke ngarkuar raportet...</div>
                </div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 md:py-12 text-slate-500">
                  <FileText className="mb-3 md:mb-4 h-10 w-10 md:h-12 md:w-12 text-slate-300" />
                  <p className="text-base md:text-lg font-medium">Nuk u gjetën raporte</p>
                  <p className="text-xs md:text-sm">Provoni të rregulloni filtrat tuaj</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <div className="flex items-center">
                              <Checkbox
                                checked={selectedIds.length === reports.length}
                                onCheckedChange={(checked) => {
                                  setSelectedIds(checked ? reports.map(report => report.id) : []);
                                }}
                                aria-label="Përzgjedh të gjitha"
                                className="h-4 w-4 text-indigo-600"
                              />
                            </div>
                          </TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Prona</TableHead>
                          <TableHead>Banori</TableHead>
                          <TableHead>Problemi</TableHead>
                          <TableHead>Kati</TableHead>
                          <TableHead>Statusi</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Veprimet</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">
                              <Checkbox
                                checked={selectedIds.includes(report.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedIds((prev) => 
                                    checked ? [...prev, report.id] : prev.filter(id => id !== report.id)
                                  );
                                }}
                                aria-label={`Përzgjedh raportin #${report.id}`}
                                className="h-4 w-4 text-indigo-600"
                              />
                            </TableCell>
                            <TableCell className="font-medium">#{report.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-slate-400" />
                                <span className="font-medium">{report.property?.name}</span>
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {report.property?.address}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-slate-400" />
                                <span>{report.tenant?.name} {report.tenant?.surname}</span>
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {report.tenant?.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{report.problemOption?.title}</div>
                              {report.description && (
                                <div className="mt-1 text-xs text-slate-500 max-w-xs truncate">
                                  {report.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {report.floor !== null ? `Kati ${report.floor}` : '-'}
                            </TableCell>
                            <TableCell>{getStatusBadge(report.status)}</TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {formatShortDate(report.created_at)}
                              <div className="text-xs text-slate-400">
                                {new Date(report.created_at).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setNewStatus(report.status);
                                }}
                              >
                                Përditëso Statusin
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {reports.map((report) => (
                      <Card key={report.id} className="border-l-4 border-l-indigo-500">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-sm text-indigo-600">#{report.id}</span>
                                {getStatusBadge(report.status)}
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Building2 className="h-3 w-3 text-slate-400" />
                                    <span className="font-medium text-sm">{report.property?.name}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 ml-5">
                                    {report.property?.address}
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <User className="h-3 w-3 text-slate-400" />
                                    <span className="text-sm">{report.tenant?.name} {report.tenant?.surname}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 ml-5">
                                    {report.tenant?.email}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t space-y-2">
                            <div>
                              <div className="text-xs text-slate-500 uppercase mb-1">Problemi</div>
                              <div className="font-medium text-sm">{report.problemOption?.title}</div>
                              {report.description && (
                                <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                                  {report.description}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center text-xs">
                              <div>
                                <span className="text-slate-500">Kati: </span>
                                <span className="font-medium">{report.floor !== null ? `Kati ${report.floor}` : '-'}</span>
                              </div>
                              <div className="text-slate-500">
                                {formatShortDate(report.created_at)}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => {
                              setSelectedReport(report);
                              setNewStatus(report.status);
                            }}
                          >
                            Përditëso Statusin
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Update Status Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={(open) => {
          if (!open) {
            setSelectedReport(null);
            setNewStatus("");
          }
        }}>
          <DialogContent className="w-[95vw] max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Përditëso Statusin e Raportit</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                Ndryshoni statusin e raportit #{selectedReport?.id}
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4">
                {/* Report Details */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:p-4 space-y-3">
                  <div>
                    <div className="text-xs text-slate-500 uppercase">Prona</div>
                    <div className="font-medium text-sm md:text-base">{selectedReport.property?.name}</div>
                    <div className="text-xs md:text-sm text-slate-600">{selectedReport.property?.address}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase">Banori</div>
                    <div className="font-medium text-sm md:text-base">
                      {selectedReport.tenant?.name} {selectedReport.tenant?.surname}
                    </div>
                    <div className="text-xs md:text-sm text-slate-600">{selectedReport.tenant?.email}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase">Problemi</div>
                    <div className="font-medium text-sm md:text-base">{selectedReport.problemOption?.title}</div>
                    {selectedReport.description && (
                      <div className="text-xs md:text-sm text-slate-600 mt-1">{selectedReport.description}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase">Data e Raportimit</div>
                    <div className="text-sm md:text-base">{formatShortDate(selectedReport.created_at)}</div>
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Statusi i Ri
                  </label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Zgjidhni statusin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Në pritje</SelectItem>
                      <SelectItem value="in_progress">Në progres</SelectItem>
                      <SelectItem value="resolved">Zgjidhur</SelectItem>
                      <SelectItem value="rejected">Refuzuar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedReport(null);
                  setNewStatus("");
                }}
              >
                Anulo
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={updateReportMutation.isPending || !newStatus}
              >
                {updateReportMutation.isPending ? "Duke ruajtur..." : "Ruaj Ndryshimet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive Reports Confirmation Dialog */}
        <Dialog open={selectedIds.length > 0 && isArchiving} onOpenChange={(open) => {
          if (!open) {
            setSelectedIds([]);
            setIsArchiving(false);
          }
        }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Konfirmoni Arkivimin</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                Jeni të sigurt që dëshironi të arkivoni këta raporte?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedIds([]);
                  setIsArchiving(false);
                }}
              >
                Anulo
              </Button>
              <Button
                onClick={handleArchiveReports}
                disabled={isArchiving}
              >
                {isArchiving ? "Duke arkivuar..." : "Arkivo Raportet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PropertyManagerLayout>
    </ProtectedRoute>
  );
}
