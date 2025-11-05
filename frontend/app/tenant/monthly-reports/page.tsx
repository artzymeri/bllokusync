"use client";

import { TenantLayout } from "@/components/layouts/TenantLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar, Euro, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import { useTenantPropertyReports } from "@/hooks/useMonthlyReports";
import { generateMonthlyReportPDF } from "@/lib/pdf-generator";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { formatMonthYear } from "@/lib/utils";

export default function TenantMonthlyReportsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [downloadingReportId, setDownloadingReportId] = useState<number | null>(null);

  const { data, isLoading, error } = useTenantPropertyReports({ year: selectedYear });

  const reports = data?.reports || [];

  // Generate year options (current year and past 5 years)
  const yearOptions = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  }, [currentYear]);

  const handleDownloadReport = async (report: any) => {
    try {
      setDownloadingReportId(report.id);
      toast.info("Duke gjeneruar PDF...");

      // Generate PDF using the same function as Property Manager
      await generateMonthlyReportPDF(report);

      toast.success("PDF u shkarkua me sukses!");
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error(error.message || "Gabim në gjenerimin e PDF");
    } finally {
      setDownloadingReportId(null);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('sq-AL', {
      style: 'currency',
      currency: 'EUR',
    }).format(parseFloat(amount));
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["tenant"]}>
        <TenantLayout title="Raportet Mujore">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        </TenantLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['tenant']}>
      <TenantLayout title="Raportet Mujore">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Year Filter Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Filtro Raportet
                </CardTitle>
                <CardDescription>
                  Zgjidhni vitin për të parë raportet mujore
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Viti</Label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(value) => setSelectedYear(parseInt(value))}
                    >
                      <SelectTrigger id="year">
                        <SelectValue placeholder="Zgjidhni vitin" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {reports.length > 0 && (
                    <div className="pt-4 space-y-2">
                      <p className="text-sm font-medium">Statistika për {selectedYear}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 p-3 rounded-md border border-emerald-200">
                          <p className="text-xs text-emerald-600 font-medium">Raporte Totale</p>
                          <p className="text-2xl font-bold text-emerald-700">{reports.length}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                          <p className="text-xs text-blue-600 font-medium">Buxheti Total</p>
                          <p className="text-lg font-bold text-blue-700">
                            {formatCurrency(
                              reports.reduce((sum, r) => sum + parseFloat(r.total_budget), 0).toFixed(2)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Rreth Raporteve Mujore</CardTitle>
                <CardDescription>Si funksionojnë raportet mujore</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Çfarë përmbajnë raportet:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Buxheti total i pronës për muajin</li>
                    <li>Shpërndarja e shpenzimeve sipas kategorive</li>
                    <li>Pagesa të paguara dhe në pritje</li>
                    <li>Shënime nga menaxheri i pronës</li>
                    <li>Detaje të plota financiare</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Si të përdorni raportet:</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Zgjidhni vitin në kartën e filtrit</p>
                    <p>• Shikoni listën e raporteve më poshtë</p>
                    <p>• Klikoni "Shkarko Raportin" për PDF</p>
                    <p>• Raportet përditësohen nga menaxheri</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <CardTitle>Raportet për {selectedYear}</CardTitle>
              <CardDescription>
                Të gjitha raportet mujore të disponueshme për vitin e zgjedhur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="flex flex-col items-center justify-center py-8 text-red-600">
                  <AlertCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p className="font-medium">Gabim në ngarkimin e raporteve</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {error instanceof Error ? error.message : 'Gabim në ngarkimin e raporteve'}
                  </p>
                </div>
              )}

              {!error && reports.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>Nuk ka raporte të disponueshme për vitin {selectedYear}</p>
                  <p className="text-sm mt-1">Raportet gjenerohen nga menaxheri i pronës</p>
                </div>
              )}

              {!error && reports.length > 0 && (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{formatMonthYear(report.report_month)}</h3>
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                <FileText className="h-3 w-3 mr-1" />
                                Raport
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {report.property?.name || 'Prona Juaj'}
                            </p>
                          </div>
                        </div>

                        {/* Budget Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-md border border-emerald-200">
                            <div className="bg-emerald-600 p-2 rounded-full">
                              <Euro className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-emerald-600 font-medium">Buxheti Total</p>
                              <p className="text-lg font-bold text-emerald-700">
                                {formatCurrency(report.total_budget)}
                              </p>
                            </div>
                          </div>

                          {parseFloat(report.pending_amount) > 0 && (
                            <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-md border border-amber-200">
                              <div className="bg-amber-600 p-2 rounded-full">
                                <AlertCircle className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-amber-600 font-medium">Në Pritje</p>
                                <p className="text-lg font-bold text-amber-700">
                                  {formatCurrency(report.pending_amount)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Spending Breakdown */}
                        {report.spending_breakdown && report.spending_breakdown.length > 0 && (
                          <div className="mb-4 p-3 bg-slate-50 rounded-md border border-slate-200">
                            <div className="flex items-center gap-2 mb-3">
                              <TrendingUp className="h-4 w-4 text-slate-600" />
                              <span className="text-sm font-medium text-slate-700">Shpërndarja e Buxhetit</span>
                            </div>
                            <div className="space-y-2">
                              {report.spending_breakdown.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600 truncate flex-1">{item.config_title}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-500 text-xs">{item.percentage}%</span>
                                    <span className="font-semibold text-slate-900 min-w-[80px] text-right">
                                      {formatCurrency(item.allocated_amount.toString())}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {report.notes && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-xs font-semibold text-blue-900 mb-1">Shënime nga Menaxheri:</p>
                            <p className="text-sm text-blue-800">
                              {report.notes}
                            </p>
                          </div>
                        )}

                        {/* Download Button */}
                        <Button
                          onClick={() => handleDownloadReport(report)}
                          disabled={downloadingReportId === report.id}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                          {downloadingReportId === report.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Duke Gjeneruar PDF...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Shkarko Raportin
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TenantLayout>
    </ProtectedRoute>
  );
}
