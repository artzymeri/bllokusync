"use client";

import { useState, useEffect } from "react";
import { useMonthlyReportPreview, useGenerateMonthlyReport, usePropertyReports } from "@/hooks/useMonthlyReports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Euro,
  TrendingUp,
  Save,
  PieChart,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calculator, Loader2, Mail
} from "lucide-react";
import { toast } from "sonner";

interface SpendingAllocation {
  config_id: number;
  config_title: string;
  allocated_amount: number;
  percentage: number;
  description?: string | null;
}

interface MonthlyReportDashboardProps {
  propertyId: number;
  month: number;
  year: number;
  onSuccess?: () => void;  // Add callback for successful generation
}

export function MonthlyReportDashboard({ propertyId, month, year, onSuccess }: MonthlyReportDashboardProps) {
  const [notes, setNotes] = useState("");
  const [spendingAllocations, setSpendingAllocations] = useState<SpendingAllocation[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sendEmailToTenants, setSendEmailToTenants] = useState(true);
  // Local input states for editing
  const [editingAmounts, setEditingAmounts] = useState<Record<number, string>>({});
  const [editingPercentages, setEditingPercentages] = useState<Record<number, string>>({});

  const { data: previewData, isLoading: isLoadingPreview, refetch: refetchPreview } = useMonthlyReportPreview({
    propertyId,
    month,
    year,
  });

  // Check if report already exists for this property/month/year
  const { data: existingReportsData } = usePropertyReports(propertyId, { year });

  const generateMutation = useGenerateMonthlyReport();

  const preview = previewData?.preview;

  // Check if a report already exists for the selected month
  const existingReport = existingReportsData?.reports?.find((report: any) => {
    const reportDate = new Date(report.report_month);
    return reportDate.getMonth() + 1 === month && reportDate.getFullYear() === year;
  });

  // Refetch preview data when filters change
  useEffect(() => {
    if (propertyId && month && year) {
      refetchPreview();
    }
  }, [propertyId, month, year, refetchPreview]);

  // Initialize spending allocations when preview data loads (ONLY ONCE)
  useEffect(() => {
    if (preview?.spending_configs && preview.spending_configs.length > 0 && !isInitialized) {
      const totalBudget = parseFloat(preview.total_budget);
      const equalShare = totalBudget / preview.spending_configs.length;

      const initialAllocations = preview.spending_configs.map((config: any) => ({
        config_id: config.id,
        config_title: config.title,
        allocated_amount: equalShare,
        percentage: (100 / preview.spending_configs.length),
        description: config.description,
      }));

      setSpendingAllocations(initialAllocations);
      setIsInitialized(true);

      // Initialize editing states
      const amounts: Record<number, string> = {};
      const percentages: Record<number, string> = {};
      initialAllocations.forEach(alloc => {
        amounts[alloc.config_id] = alloc.allocated_amount.toFixed(2);
        percentages[alloc.config_id] = alloc.percentage.toFixed(1);
      });
      setEditingAmounts(amounts);
      setEditingPercentages(percentages);
    }
  }, [preview, isInitialized]);

  // Reset initialization when filters change
  useEffect(() => {
    setIsInitialized(false);
    setSpendingAllocations([]);
    setIsEditMode(false);
    setEditingAmounts({});
    setEditingPercentages({});
    setNotes("");
  }, [propertyId, month, year]);

  const handleAmountInputChange = (configId: number, value: string) => {
    // Allow typing freely, including empty string
    setEditingAmounts(prev => ({ ...prev, [configId]: value }));
  };

  const handleAmountBlur = (configId: number) => {
    const value = editingAmounts[configId] || "0";
    const numAmount = parseFloat(value) || 0;
    const totalBudget = parseFloat(preview?.total_budget || "0");
    const newPercentage = totalBudget > 0 ? (numAmount / totalBudget) * 100 : 0;

    // Calculate what the total percentage would be with this change
    const otherAllocationsTotal = spendingAllocations
      .filter(alloc => alloc.config_id !== configId)
      .reduce((sum, alloc) => sum + alloc.percentage, 0);

    const totalPercentage = otherAllocationsTotal + newPercentage;

    // Check if it would exceed 100%
    if (totalPercentage > 100) {
      toast.error(`Nuk mund të alokoni €${numAmount.toFixed(2)}. Alokimi total do të jetë ${totalPercentage.toFixed(1)}%, i cili tejkalon 100%.`);

      // Revert to previous value
      const currentAllocation = spendingAllocations.find(a => a.config_id === configId);
      if (currentAllocation) {
        setEditingAmounts(prev => ({
          ...prev,
          [configId]: currentAllocation.allocated_amount.toFixed(2)
        }));
      }
      return;
    }

    // Update the actual allocation
    setSpendingAllocations(prev =>
      prev.map(alloc =>
        alloc.config_id === configId
          ? {
              ...alloc,
              allocated_amount: numAmount,
              percentage: newPercentage
            }
          : alloc
      )
    );

    // Update the editing state with formatted value
    setEditingAmounts(prev => ({ ...prev, [configId]: numAmount.toFixed(2) }));

    // Update corresponding percentage display
    setEditingPercentages(prev => ({ ...prev, [configId]: newPercentage.toFixed(1) }));
  };

  const handlePercentageInputChange = (configId: number, value: string) => {
    // Allow typing freely, including empty string
    setEditingPercentages(prev => ({ ...prev, [configId]: value }));
  };

  const handlePercentageBlur = (configId: number) => {
    const value = editingPercentages[configId] || "0";
    const numPercentage = parseFloat(value) || 0;

    // Calculate what the total percentage would be with this change
    const otherAllocationsTotal = spendingAllocations
      .filter(alloc => alloc.config_id !== configId)
      .reduce((sum, alloc) => sum + alloc.percentage, 0);

    const totalPercentage = otherAllocationsTotal + numPercentage;

    // Check if it would exceed 100%
    if (totalPercentage > 100) {
      toast.error(`Nuk mund të alokoni ${numPercentage.toFixed(1)}%. Alokimi total do të jetë ${totalPercentage.toFixed(1)}%, i cili tejkalon 100%.`);

      // Revert to previous value
      const currentAllocation = spendingAllocations.find(a => a.config_id === configId);
      if (currentAllocation) {
        setEditingPercentages(prev => ({
          ...prev,
          [configId]: currentAllocation.percentage.toFixed(1)
        }));
      }
      return;
    }

    const totalBudget = parseFloat(preview?.total_budget || "0");
    const amount = (totalBudget * numPercentage) / 100;

    // Update the actual allocation
    setSpendingAllocations(prev =>
      prev.map(alloc =>
        alloc.config_id === configId
          ? {
              ...alloc,
              allocated_amount: amount,
              percentage: numPercentage
            }
          : alloc
      )
    );

    // Update the editing states with formatted values
    setEditingPercentages(prev => ({ ...prev, [configId]: numPercentage.toFixed(1) }));
    setEditingAmounts(prev => ({ ...prev, [configId]: amount.toFixed(2) }));
  };

  const handleGenerateReport = async () => {
    if (!preview) return;

    // Prevent duplicate report generation
    if (existingReport) {
      toast.error(`Një raport tashmë ekziston për këtë periudhë. Ju lutem fshini raportin ekzistues fillimisht ose shiheni në listën e raporteve.`);
      return;
    }

    try {
      await generateMutation.mutateAsync({
        propertyId,
        month,
        year,
        notes,
        spendingAllocations,
        sendEmailToTenants,
      });

      toast.success("Raporti mujor u gjenerua me sukses!");
      setIsEditMode(false);

      // Call the onSuccess callback to close the modal
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Dështoi gjenerimi i raportit");
    }
  };

  const totalAllocated = spendingAllocations.reduce((sum, alloc) => sum + alloc.allocated_amount, 0);
  const totalBudget = parseFloat(preview?.total_budget || "0");
  const remainingBudget = totalBudget - totalAllocated;
  const allocationPercentage = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;

  if (isLoadingPreview) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!preview) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nuk ka të dhëna të disponueshme për periudhën e zgjedhur. Ju lutem sigurohuni që banorët kanë regjistrime pagese për këtë muaj.
        </AlertDescription>
      </Alert>
    );
  }

  const collectionRate = preview.total_tenants > 0
    ? (preview.paid_tenants / preview.total_tenants) * 100
    : 0;

  return (
    <div className="space-y-4 md:space-y-6 w-full">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Buxheti Total</CardTitle>
            <Euro className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">€{parseFloat(preview.total_budget).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Nga {preview.paid_tenants} banorë të paguar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Norma e Mbledhjes</CardTitle>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{collectionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {preview.paid_tenants} nga {preview.total_tenants} banorë
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Shuma Në pritje</CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-orange-600">€{parseFloat(preview.pending_amount).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {preview.total_tenants - preview.paid_tenants} banorë të papaguar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Kategoritë e Shpenzimeve</CardTitle>
            <PieChart className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{preview.spending_configs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Kategori të alokimit të buxhetit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Allocations */}
      {preview.spending_configs && preview.spending_configs.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base md:text-lg">Alokimi i Buxhetit</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Shpërndani buxhetin e mbledhur nëpër kategoritë e shpenzimeve
                </CardDescription>
              </div>
              <Button
                variant={isEditMode ? "secondary" : "default"}
                onClick={() => setIsEditMode(!isEditMode)}
                size="sm"
                className="h-8 md:h-9 text-xs md:text-sm w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
              >
                <Calculator className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                {isEditMode ? "Anulo Ndryshimin" : "Ndrysho Alokimet"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            {/* Allocation Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 p-3 md:p-4 bg-muted rounded-lg">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Totali i Alokuar</p>
                <p className="text-base md:text-lg font-bold">€{totalAllocated.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Mbetur</p>
                <p className={`text-base md:text-lg font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  €{Math.abs(remainingBudget).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Alokimi %</p>
                <p className="text-base md:text-lg font-bold">{allocationPercentage.toFixed(1)}%</p>
              </div>
            </div>

            {remainingBudget < -0.01 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs md:text-sm">
                  Alokimi total tejkalon buxhetin e disponueshëm me €{Math.abs(remainingBudget).toFixed(2)}
                </AlertDescription>
              </Alert>
            )}

            {/* Allocation Table - Desktop */}
            <div className="hidden lg:block w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: '22%' }}>Kategoria</TableHead>
                    <TableHead style={{ width: '28%' }}>Përshkrimi</TableHead>
                    <TableHead className="text-right" style={{ width: '18%' }}>Shuma (€)</TableHead>
                    <TableHead className="text-right" style={{ width: '14%' }}>Përqindja (%)</TableHead>
                    <TableHead className="text-right" style={{ width: '18%' }}>Vizuale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spendingAllocations.map((allocation, index) => {
                    const colors = [
                      'bg-blue-500',
                      'bg-green-500',
                      'bg-yellow-500',
                      'bg-purple-500',
                      'bg-pink-500',
                      'bg-indigo-500',
                      'bg-red-500',
                      'bg-teal-500',
                    ];
                    const colorClass = colors[index % colors.length];

                    return (
                      <TableRow key={allocation.config_id}>
                        <TableCell className="font-medium text-sm">{allocation.config_title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]" title={allocation.description || undefined}>
                          {allocation.description || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditMode ? (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingAmounts[allocation.config_id] || allocation.allocated_amount.toFixed(2)}
                              onChange={(e) => handleAmountInputChange(allocation.config_id, e.target.value)}
                              onBlur={() => handleAmountBlur(allocation.config_id)}
                              className="w-24 ml-auto text-right h-8 text-sm"
                            />
                          ) : (
                            <span className="font-mono text-sm">€{allocation.allocated_amount.toFixed(2)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditMode ? (
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={editingPercentages[allocation.config_id] || allocation.percentage.toFixed(1)}
                              onChange={(e) => handlePercentageInputChange(allocation.config_id, e.target.value)}
                              onBlur={() => handlePercentageBlur(allocation.config_id)}
                              className="w-16 ml-auto text-right h-8 text-sm"
                            />
                          ) : (
                            <span className="font-mono text-sm">{allocation.percentage.toFixed(1)}%</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2 min-w-[80px]">
                            <div
                              className={`${colorClass} h-2 rounded-full transition-all`}
                              style={{ width: `${Math.min(allocation.percentage, 100)}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Allocation Cards - Mobile/Tablet */}
            <div className="lg:hidden space-y-3">
              {spendingAllocations.map((allocation, index) => {
                const colors = [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-purple-500',
                  'bg-pink-500',
                  'bg-indigo-500',
                  'bg-red-500',
                  'bg-teal-500',
                ];
                const colorClass = colors[index % colors.length];

                return (
                  <Card key={allocation.config_id} className={`border-l-4 ${colorClass.replace('bg-', 'border-l-')}`}>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h4 className="font-medium text-sm md:text-base">{allocation.config_title}</h4>
                        {allocation.description && (
                          <p className="text-xs text-muted-foreground mt-1">{allocation.description}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Shuma (€)</label>
                          {isEditMode ? (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingAmounts[allocation.config_id] || allocation.allocated_amount.toFixed(2)}
                              onChange={(e) => handleAmountInputChange(allocation.config_id, e.target.value)}
                              onBlur={() => handleAmountBlur(allocation.config_id)}
                              className="w-full text-right h-8 text-xs md:text-sm mt-1"
                            />
                          ) : (
                            <p className="font-mono text-sm md:text-base font-bold mt-1">€{allocation.allocated_amount.toFixed(2)}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Përqindja (%)</label>
                          {isEditMode ? (
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={editingPercentages[allocation.config_id] || allocation.percentage.toFixed(1)}
                              onChange={(e) => handlePercentageInputChange(allocation.config_id, e.target.value)}
                              onBlur={() => handlePercentageBlur(allocation.config_id)}
                              className="w-full text-right h-8 text-xs md:text-sm mt-1"
                            />
                          ) : (
                            <p className="font-mono text-sm md:text-base font-bold mt-1">{allocation.percentage.toFixed(1)}%</p>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${colorClass} h-2 rounded-full transition-all`}
                          style={{ width: `${Math.min(allocation.percentage, 100)}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Visual Budget Breakdown */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm md:text-base">Shpërndarja e Buxhetit</h4>
              <div className="flex w-full h-10 md:h-12 rounded-lg overflow-hidden border">
                {spendingAllocations.map((allocation, index) => {
                  const colors = [
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-yellow-500',
                    'bg-purple-500',
                    'bg-pink-500',
                    'bg-indigo-500',
                    'bg-red-500',
                    'bg-teal-500',
                  ];
                  return (
                    <div
                      key={allocation.config_id}
                      className={`${colors[index % colors.length]} flex items-center justify-center text-white text-xs font-medium`}
                      style={{ width: `${allocation.percentage}%` }}
                      title={`${allocation.config_title}: €${allocation.allocated_amount.toFixed(2)}`}
                    >
                      {allocation.percentage > 10 && `${allocation.percentage.toFixed(0)}%`}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3 mt-2">
                {spendingAllocations.map((allocation, index) => {
                  const colors = [
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-yellow-500',
                    'bg-purple-500',
                    'bg-pink-500',
                    'bg-indigo-500',
                    'bg-red-500',
                    'bg-teal-500',
                  ];
                  return (
                    <div key={allocation.config_id} className="flex items-center gap-2 text-xs md:text-sm">
                      <div className={`w-3 h-3 md:w-4 md:h-4 rounded ${colors[index % colors.length]}`} />
                      <span>{allocation.config_title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Details */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Detajet e Pagesës</CardTitle>
          <CardDescription className="text-xs md:text-sm">Ndarja e pagesave të banorëve për këtë periudhë</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: '18%' }}>Banori</TableHead>
                  <TableHead style={{ width: '24%' }}>Email</TableHead>
                  <TableHead style={{ width: '10%' }}>Kati</TableHead>
                  <TableHead style={{ width: '14%' }}>Shuma</TableHead>
                  <TableHead style={{ width: '18%' }}>Statusi</TableHead>
                  <TableHead style={{ width: '16%' }}>Data e Pagesës</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.payments && preview.payments.length > 0 ? (
                  preview.payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium text-sm">
                        {payment.tenant.name} {payment.tenant.surname}
                      </TableCell>
                      <TableCell className="text-sm truncate max-w-[200px]" title={payment.tenant.email}>
                        {payment.tenant.email}
                      </TableCell>
                      <TableCell className="text-sm">{payment.tenant.floor_assigned || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">€{parseFloat(payment.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {payment.status === 'paid' && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Paguar
                          </Badge>
                        )}
                        {payment.status === 'pending' && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            Në pritje
                          </Badge>
                        )}
                        {payment.status === 'overdue' && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Vonuar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {payment.payment_date || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nuk u gjetën regjistrime pagese për këtë periudhë
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {preview.payments && preview.payments.length > 0 ? (
              preview.payments.map((payment: any) => (
                <Card key={payment.id} className="border-l-4 border-l-indigo-500">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          {payment.tenant.name} {payment.tenant.surname}
                        </p>
                        <p className="text-xs text-muted-foreground">{payment.tenant.email}</p>
                      </div>
                      <div>
                        {payment.status === 'paid' && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Paguar
                          </Badge>
                        )}
                        {payment.status === 'pending' && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            Në pritje
                          </Badge>
                        )}
                        {payment.status === 'overdue' && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Vonuar
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex gap-3 text-xs">
                        <span className="text-muted-foreground">Kati: {payment.tenant.floor_assigned || "—"}</span>
                        <span className="text-muted-foreground">Data: {payment.payment_date || "—"}</span>
                      </div>
                      <p className="font-mono text-base font-bold text-indigo-600">€{parseFloat(payment.amount).toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">
                Nuk u gjetën regjistrime pagese për këtë periudhë
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Shënimet e Raportit</CardTitle>
          <CardDescription className="text-xs md:text-sm">Shtoni çdo shënim ose koment shtesë për këtë raport</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Vendosni shënime rreth raportit të këtij muaji, rrethana të veçanta, artikuj mirëmbajtjeje, etj."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="text-xs md:text-sm"
          />
        </CardContent>
      </Card>

      {/* Email Notification Option */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="send-email-to-tenants" 
              checked={sendEmailToTenants}
              onCheckedChange={(checked) => setSendEmailToTenants(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label 
                htmlFor="send-email-to-tenants" 
                className="text-sm md:text-base font-medium cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Dërgo njoftim me email tek të gjithë banorët
                </div>
              </Label>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Banorët do të marrin një email me detajet e raportit mujor kur gjeneroni raportin
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Report Button */}
      <div className="flex justify-end gap-3">
        <Button
          size="lg"
          onClick={handleGenerateReport}
          disabled={generateMutation.isPending || remainingBudget < -0.01}
          className="w-full sm:w-auto h-10 md:h-11 text-xs md:text-base bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="mr-2 h-4 w-4 md:h-5 md:w-5" />
          {generateMutation.isPending ? "Duke gjeneruar..." : "Gjenero & Ruaj Raportin"}
        </Button>
      </div>
    </div>
  );
}
