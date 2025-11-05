"use client";

import { useState, useEffect } from "react";
import { PropertyManagerLayout } from "@/components/layouts/PropertyManagerLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
import { AlertCircle, Building2, CheckCircle2, Clock, Loader2, Lightbulb, User, XCircle, Archive } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { sidebarCountsKeys } from "@/hooks/usePropertyManagerSidebarCounts";

interface Suggestion {
  id: number;
  property_id: number;
  tenant_user_id: number;
  title: string;
  description: string;
  response: string;
  status: string;
  created_at: string;
  property: {
    id: number;
    name: string;
    address: string;
  };
  tenant: {
    id: number;
    name: string;
    surname: string;
    email: string;
    number: string;
    floor_assigned: number | null;
  };
}

interface Property {
  id: number;
  name: string;
  address: string;
}

export default function PropertyManagerSuggestionsPage() {
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const queryClient = useQueryClient();

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedProperty !== "all") {
          params.append("property_id", selectedProperty);
        }
        if (selectedStatus !== "all") {
          params.append("status", selectedStatus);
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/suggestions/manager?${params.toString()}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions);
        } else {
          toast.error("Dështoi ngarkimi i sugjerimeve");
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        toast.error("Dështoi ngarkimi i sugjerimeve");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [selectedProperty, selectedStatus]);

  // Fetch properties for filter
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/properties?limit=1000`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    };

    fetchProperties();
  }, []);

  const handleStatusUpdate = async () => {
    if (!selectedSuggestion || !newStatus) return;

    setIsUpdating(true);
    try {
      const response_text = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/suggestions/${selectedSuggestion.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, response: response }),
      });

      if (response_text.ok) {
        toast.success("Statusi i sugjerimit u përditësua me sukses");
        setSelectedSuggestion(null);
        setNewStatus("");
        setResponse("");

        // Invalidate sidebar counts
        queryClient.invalidateQueries({ queryKey: sidebarCountsKeys.all });

        // Refresh suggestions
        const params = new URLSearchParams();
        if (selectedProperty !== "all") {
          params.append("property_id", selectedProperty);
        }
        if (selectedStatus !== "all") {
          params.append("status", selectedStatus);
        }

        const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/suggestions/manager?${params.toString()}`, {
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setSuggestions(data.suggestions);
        }
      } else {
        const data = await response_text.json();
        toast.error(data.message || "Dështoi përditësimi i statusit të sugjerimit");
      }
    } catch (error) {
      console.error("Error updating suggestion status:", error);
      toast.error("Dështoi përditësimi i statusit të sugjerimit");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchiveSuggestions = async () => {
    if (selectedIds.length === 0) return;

    setIsArchiving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/suggestions/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive suggestions');
      }

      // Refetch the suggestions
      setSuggestions(prevSuggestions => prevSuggestions.filter(s => !selectedIds.includes(s.id)));
      queryClient.invalidateQueries({ queryKey: sidebarCountsKeys.all });

      toast.success(`${selectedIds.length} sugjerim/e u arkivuan me sukses`);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to archive suggestions:', err);
      toast.error('Dështoi arkivimi i sugjerimeve');
    } finally {
      setIsArchiving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Në pritje</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><AlertCircle className="mr-1 h-3 w-3" />Në progres</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle2 className="mr-1 h-3 w-3" />Implementuar</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="mr-1 h-3 w-3" />Refuzuar</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Stats
  const stats = {
    total: suggestions.length,
    pending: suggestions.filter((s) => s.status === 'pending').length,
    in_progress: suggestions.filter((s) => s.status === 'in_progress').length,
    resolved: suggestions.filter((s) => s.status === 'resolved').length,
    rejected: suggestions.filter((s) => s.status === 'rejected').length,
  };

  return (
    <ProtectedRoute allowedRoles={["property_manager"]}>
      <PropertyManagerLayout title="Sugjerimet">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totali</CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Në pritje</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Në progres</CardTitle>
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.in_progress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Implementuar</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.resolved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Refuzuar</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rejected}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Pamja e Sugjerimeve</CardTitle>
                    <CardDescription>
                      Shqyrtoni sugjerimet e banorëve për pronat tuaja
                    </CardDescription>
                  </div>
                  {selectedIds.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleArchiveSuggestions}
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
                      {properties?.map((property) => (
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
                      <SelectItem value="resolved" className="text-xs md:text-sm">Implementuar</SelectItem>
                      <SelectItem value="rejected" className="text-xs md:text-sm">Refuzuar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : suggestions.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nuk u gjetën sugjerime që përputhen me filtrat e zgjedhur.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedIds.length > 0 && selectedIds.length === suggestions.length}
                                onCheckedChange={(checked) => {
                                  setSelectedIds(checked ? suggestions.map((s) => s.id) : []);
                                }}
                                aria-label="Select all"
                              />
                              Titulli
                            </div>
                          </TableHead>
                          <TableHead>Prona</TableHead>
                          <TableHead>Banori</TableHead>
                          <TableHead>Kati</TableHead>
                          <TableHead>Statusi</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Veprimet</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestions.map((suggestion) => (
                          <TableRow key={suggestion.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2 max-w-[200px]">
                                <Checkbox
                                  checked={selectedIds.includes(suggestion.id)}
                                  onCheckedChange={(checked) => {
                                    setSelectedIds((prev) => 
                                      checked ? [...prev, suggestion.id] : prev.filter(id => id !== suggestion.id)
                                    );
                                  }}
                                  aria-label={`Select suggestion #${suggestion.id}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{suggestion.title}</div>
                                  {suggestion.description && (
                                    <div className="text-xs text-muted-foreground truncate mt-1">
                                      {suggestion.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div className="max-w-[150px] truncate">
                                  {suggestion.property.name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">
                                    {suggestion.tenant.name} {suggestion.tenant.surname}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {suggestion.tenant.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {suggestion.tenant.floor_assigned !== null
                                ? suggestion.tenant.floor_assigned
                                : "N/A"}
                            </TableCell>
                            <TableCell>{getStatusBadge(suggestion.status)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(suggestion.created_at), "PP")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(suggestion.created_at), "p")}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSuggestion(suggestion);
                                  setNewStatus(suggestion.status);
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

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {suggestions.map((suggestion) => (
                      <Card key={suggestion.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">
                                {suggestion.title}
                              </CardTitle>
                              {suggestion.description && (
                                <CardDescription className="text-sm mt-1 line-clamp-2">
                                  {suggestion.description}
                                </CardDescription>
                              )}
                            </div>
                            {getStatusBadge(suggestion.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{suggestion.property.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {suggestion.tenant.name} {suggestion.tenant.surname}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {suggestion.tenant.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Kati:</span>
                            <span className="font-medium">
                              {suggestion.tenant.floor_assigned !== null
                                ? suggestion.tenant.floor_assigned
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Data:</span>
                            <div className="text-right">
                              <div>{format(new Date(suggestion.created_at), "PP")}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(suggestion.created_at), "p")}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setSelectedSuggestion(suggestion);
                              setNewStatus(suggestion.status);
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

        {/* Status Update Dialog */}
        <Dialog open={!!selectedSuggestion} onOpenChange={(open) => !open && setSelectedSuggestion(null)}>
          <DialogContent className="max-w-[95vw] md:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Përditëso Statusin e Sugjerimit</DialogTitle>
              <DialogDescription>
                Ndryshoni statusin e këtij sugjerimi
              </DialogDescription>
            </DialogHeader>

            {selectedSuggestion && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Detajet e Sugjerimit</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div><strong>Titulli:</strong> {selectedSuggestion.title}</div>
                    {selectedSuggestion.description && (
                      <div><strong>Përshkrimi:</strong> {selectedSuggestion.description}</div>
                    )}
                    <div><strong>Prona:</strong> {selectedSuggestion.property.name}</div>
                    <div>
                      <strong>Banori:</strong> {selectedSuggestion.tenant.name} {selectedSuggestion.tenant.surname}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Statusi i Ri</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Në pritje</SelectItem>
                      <SelectItem value="in_progress">Në progres</SelectItem>
                      <SelectItem value="resolved">Implementuar</SelectItem>
                      <SelectItem value="rejected">Refuzuar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Përgjigja (Opsionale)</Label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Vendosni përgjigjen tuaj këtu"
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setSelectedSuggestion(null)} disabled={isUpdating} className="w-full sm:w-auto">
                Anulo
              </Button>
              <Button onClick={handleStatusUpdate} disabled={isUpdating || !newStatus} className="w-full sm:w-auto">
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Duke përditësuar...
                  </>
                ) : (
                  "Përditëso Statusin"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PropertyManagerLayout>
    </ProtectedRoute>
  );
}
