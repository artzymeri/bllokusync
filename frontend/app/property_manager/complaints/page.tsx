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
import { AlertCircle, Building2, CheckCircle2, Clock, Loader2, MessageSquare, User, XCircle, Archive } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { sidebarCountsKeys } from "@/hooks/usePropertyManagerSidebarCounts";

interface Complaint {
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

export default function PropertyManagerComplaintsPage() {
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const queryClient = useQueryClient();

  // Fetch complaints
  useEffect(() => {
    const fetchComplaints = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedProperty !== "all") {
          params.append("property_id", selectedProperty);
        }
        if (selectedStatus !== "all") {
          params.append("status", selectedStatus);
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/complaints/manager?${params.toString()}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setComplaints(data.complaints);
        } else {
          toast.error("Dështoi ngarkimi i ankesave");
        }
      } catch (error) {
        console.error("Error fetching complaints:", error);
        toast.error("Dështoi ngarkimi i ankesave");
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
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
    if (!selectedComplaint || !newStatus) return;

    setIsUpdating(true);
    try {
      const response_text = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/complaints/${selectedComplaint.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, response: response }),
      });

      if (response_text.ok) {
        toast.success("Statusi i ankesës u përditësua me sukses");
        setSelectedComplaint(null);
        setNewStatus("");
        setResponse("");

        // Invalidate sidebar counts
        queryClient.invalidateQueries({ queryKey: sidebarCountsKeys.all });

        // Refresh complaints
        const params = new URLSearchParams();
        if (selectedProperty !== "all") {
          params.append("property_id", selectedProperty);
        }
        if (selectedStatus !== "all") {
          params.append("status", selectedStatus);
        }

        const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/complaints/manager?${params.toString()}`, {
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setComplaints(data.complaints);
        }
      } else {
        const data = await response_text.json();
        toast.error(data.message || "Dështoi përditësimi i statusit të ankesës");
      }
    } catch (error) {
      console.error("Error updating complaint status:", error);
      toast.error("Dështoi përditësimi i statusit të ankesës");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchiveComplaints = async () => {
    if (selectedIds.length === 0) return;

    setIsArchiving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/complaints/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive complaints');
      }

      // Refetch the complaints
      setComplaints(prevComplaints => prevComplaints.filter(c => !selectedIds.includes(c.id)));
      queryClient.invalidateQueries({ queryKey: sidebarCountsKeys.all });

      toast.success(`${selectedIds.length} ankesë/a u arkivuan me sukses`);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to archive complaints:', err);
      toast.error('Dështoi arkivimi i ankesave');
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
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    in_progress: complaints.filter((c) => c.status === 'in_progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    rejected: complaints.filter((c) => c.status === 'rejected').length,
  };

  return (
    <ProtectedRoute allowedRoles={["property_manager"]}>
      <PropertyManagerLayout title="Ankesat">
        <div className="space-y-4 md:space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Ankesat Totale</CardTitle>
                <MessageSquare className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Në pritje</CardTitle>
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Në progres</CardTitle>
                <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{stats.in_progress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Zgjidhur</CardTitle>
                <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{stats.resolved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Refuzuar</CardTitle>
                <XCircle className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">{stats.rejected}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base md:text-lg">Pamja e Ankesave</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Menaxhoni ankesat nga pronat tuaja
                    </CardDescription>
                  </div>
                  {selectedIds.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleArchiveComplaints}
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
                      <SelectItem value="resolved" className="text-xs md:text-sm">Zgjidhur</SelectItem>
                      <SelectItem value="rejected" className="text-xs md:text-sm">Refuzuar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-emerald-600" />
                </div>
              ) : complaints.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs md:text-sm">
                    Nuk u gjetën ankesa që përputhen me filtrat e zgjedhur.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Checkbox
                              checked={selectedIds.length === complaints.length}
                              onCheckedChange={(checked) => {
                                setSelectedIds(checked ? complaints.map(c => c.id) : []);
                              }}
                              aria-label="Përzgjedh të gjitha"
                            />
                          </TableHead>
                          <TableHead>Titulli</TableHead>
                          <TableHead>Prona</TableHead>
                          <TableHead>Banori</TableHead>
                          <TableHead>Kati</TableHead>
                          <TableHead>Statusi</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Veprimet</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {complaints.map((complaint) => (
                          <TableRow key={complaint.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.includes(complaint.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedIds((prev) => 
                                    checked ? [...prev, complaint.id] : prev.filter(id => id !== complaint.id)
                                  );
                                }}
                                aria-label={`Përzgjedh ankesën #${complaint.id}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="max-w-[200px]">
                                <div className="font-medium truncate">{complaint.title}</div>
                                {complaint.description && (
                                  <div className="text-xs text-muted-foreground truncate mt-1">
                                    {complaint.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div className="max-w-[150px] truncate">
                                  {complaint.property.name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">
                                    {complaint.tenant.name} {complaint.tenant.surname}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {complaint.tenant.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {complaint.tenant.floor_assigned !== null
                                ? complaint.tenant.floor_assigned
                                : "N/A"}
                            </TableCell>
                            <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(complaint.created_at), "PP")}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(complaint.created_at), "p")}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedComplaint(complaint);
                                  setNewStatus(complaint.status);
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
                    {complaints.map((complaint) => (
                      <Card key={complaint.id} className="border-l-4 border-l-emerald-500">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-sm mb-1">{complaint.title}</h3>
                              {complaint.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {complaint.description}
                                </p>
                              )}
                            </div>
                            {getStatusBadge(complaint.status)}
                          </div>

                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-start gap-2">
                              <Building2 className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{complaint.property.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{complaint.property.address}</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <User className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">
                                  {complaint.tenant.name} {complaint.tenant.surname}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">{complaint.tenant.email}</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs pt-2 border-t">
                            <div>
                              <span className="text-muted-foreground">Kati: </span>
                              <span className="font-medium">
                                {complaint.tenant.floor_assigned !== null
                                  ? complaint.tenant.floor_assigned
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              {format(new Date(complaint.created_at), "PP")}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setNewStatus(complaint.status);
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
        <Dialog open={!!selectedComplaint} onOpenChange={(open) => !open && setSelectedComplaint(null)}>
          <DialogContent className="w-[95vw] max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Përditëso Statusin e Ankesës</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                Ndryshoni statusin e kësaj ankese
              </DialogDescription>
            </DialogHeader>

            {selectedComplaint && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs md:text-sm font-medium">Detajet e Ankesës</div>
                  <div className="text-xs md:text-sm text-muted-foreground space-y-1">
                    <div><strong>Titulli:</strong> {selectedComplaint.title}</div>
                    {selectedComplaint.description && (
                      <div><strong>Përshkrimi:</strong> {selectedComplaint.description}</div>
                    )}
                    <div><strong>Prona:</strong> {selectedComplaint.property.name}</div>
                    <div>
                      <strong>Banori:</strong> {selectedComplaint.tenant.name} {selectedComplaint.tenant.surname}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-medium">Statusi i Ri</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="text-xs md:text-sm">Në pritje</SelectItem>
                      <SelectItem value="in_progress" className="text-xs md:text-sm">Në progres</SelectItem>
                      <SelectItem value="resolved" className="text-xs md:text-sm">Zgjidhur</SelectItem>
                      <SelectItem value="rejected" className="text-xs md:text-sm">Refuzuar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm font-medium">Përgjigja (Opsionale)</Label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Vendosni përgjigjen tuaj këtu"
                    rows={3}
                    className="text-xs md:text-sm"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedComplaint(null)}
                disabled={isUpdating}
                className="h-9 text-xs md:text-sm"
              >
                Anulo
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={isUpdating || !newStatus}
                className="h-9 text-xs md:text-sm"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
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
