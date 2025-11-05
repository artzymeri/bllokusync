"use client";

import { TenantLayout } from "@/components/layouts/TenantLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";

interface ProblemOption {
  id: number;
  title: string;
  description: string;
}

interface Property {
  id: number;
  name: string;
  address: string;
  floors_from: number | null;
  floors_to: number | null;
  problemOptions: ProblemOption[];
}

interface Report {
  id: number;
  property_id: number;
  problem_option_id: number;
  floor: number | null;
  description: string;
  status: string;
  created_at: string;
  property: {
    name: string;
    address: string;
  };
  problemOption: {
    title: string;
  };
}

export default function ReportProblemPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedProblem, setSelectedProblem] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [myReports, setMyReports] = useState<Report[]>([]);

  // Fetch problem options for tenant's properties
  useEffect(() => {
    const fetchProblemOptions = async () => {
      try {
        const response = await apiFetch('/api/reports/problem-options');

        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties);
          if (data.properties.length > 0) {
            setSelectedProperty(data.properties[0]);
          }
        } else {
          console.error("Failed to fetch problem options:", response.status);
          toast.error("Gabim në ngarkimin e opsioneve të problemeve");
        }
      } catch (error) {
        console.error("Error fetching problem options:", error);
        toast.error("Gabim në ngarkimin e opsioneve të problemeve");
      } finally {
        setFetchingData(false);
      }
    };

    const fetchMyReports = async () => {
      try {
        const response = await apiFetch('/api/reports/my-reports');

        if (response.ok) {
          const data = await response.json();
          setMyReports(data.reports);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };

    if (user) {
      fetchProblemOptions();
      fetchMyReports();
    }
  }, [user]);

  const handlePropertyChange = (propertyId: string) => {
    const property = properties.find((p) => p.id.toString() === propertyId);
    setSelectedProperty(property || null);
    setSelectedProblem("");
    setSelectedFloor("");
  };

  const generateFloorOptions = () => {
    if (!selectedProperty || selectedProperty.floors_from === null || selectedProperty.floors_to === null) {
      return [];
    }

    const floors = [];
    for (let i = selectedProperty.floors_from; i <= selectedProperty.floors_to; i++) {
      floors.push(i);
    }
    return floors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProperty || !selectedProblem) {
      toast.error("Ju lutem zgjidhni një pronë dhe llojin e problemit");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/api/reports', {
        method: "POST",
        body: JSON.stringify({
          property_id: selectedProperty.id,
          problem_option_id: parseInt(selectedProblem),
          floor: selectedFloor ? parseInt(selectedFloor) : null,
          description: null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Problemi u raportua me sukses!");
        setSelectedProblem("");
        setSelectedFloor("");

        // Refresh reports list
        const reportsResponse = await apiFetch('/api/reports/my-reports');
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setMyReports(reportsData.reports);
        }
      } else {
        toast.error(data.message || "Gabim në dërgimin e raportit");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Gabim në dërgimin e raportit");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            <Clock className="mr-1 h-3 w-3" />
            Në Pritje
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Loader2 className="mr-1 h-3 w-3" />
            Në Proces
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            E Zgjidhur
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            E Refuzuar
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (fetchingData) {
    return (
      <ProtectedRoute allowedRoles={["tenant"]}>
        <TenantLayout title="Raportimet">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        </TenantLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["tenant"]}>
      <TenantLayout title="Raportimet">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Report Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-emerald-600" />
                  Raporto Problem
                </CardTitle>
                <CardDescription>
                  Raportoni një problem për pronën tuaj
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="property">Prona</Label>
                    <Select
                      value={selectedProperty?.id.toString()}
                      onValueChange={handlePropertyChange}
                      disabled
                    >
                      <SelectTrigger id="property">
                        <SelectValue placeholder="Zgjidhni pronën" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.name} - {property.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProperty && selectedProperty.problemOptions.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="problem">Lloji i Problemit</Label>
                      <Select value={selectedProblem} onValueChange={setSelectedProblem}>
                        <SelectTrigger id="problem">
                          <SelectValue placeholder="Zgjidhni llojin e problemit" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedProperty.problemOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id.toString()}>
                              {option.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedProperty &&
                    selectedProperty.floors_from !== null &&
                    selectedProperty.floors_to !== null && (
                      <div className="space-y-2">
                        <Label htmlFor="floor">Kati (Opsionale)</Label>
                        <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                          <SelectTrigger id="floor">
                            <SelectValue placeholder="Zgjidhni katin" />
                          </SelectTrigger>
                          <SelectContent>
                            {generateFloorOptions().map((floor) => (
                              <SelectItem key={floor} value={floor.toString()}>
                                Kati {floor}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={loading || !selectedProperty || !selectedProblem}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Duke Dërguar...
                      </>
                    ) : (
                      "Dërgo Raportin"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Rreth Raportimeve</CardTitle>
                <CardDescription>Si funksionon procesi i raportimit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Kur të raportoni një problem:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Probleme me objektet ose paisjet</li>
                    <li>Nevoja për mirëmbajtje</li>
                    <li>Shqetësime për sigurinë</li>
                    <li>Probleme me infrastrukturën</li>
                    <li>Çdo problem tjetër në pronë</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Kuptimi i gjendjes:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusBadge("pending")}
                      <span className="text-muted-foreground">Në pritje të shqyrtimit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge("in_progress")}
                      <span className="text-muted-foreground">Po trajtohet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge("resolved")}
                      <span className="text-muted-foreground">Problemi u zgjidh</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge("rejected")}
                      <span className="text-muted-foreground">Nuk mund të përpunohet</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Raportetimet e Mia</CardTitle>
              <CardDescription>
                Ndiqni gjendjen e raporteve tuaja të dërguara
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>Nuk ka raporte të dërguara ende</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-semibold">{report.problemOption.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {report.property.name}
                            </p>
                            {report.floor && (
                              <p className="text-xs text-muted-foreground">
                                Kati {report.floor}
                              </p>
                            )}
                            {report.description && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {report.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            {getStatusBadge(report.status)}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-3">
                          Dërguar më {formatDate(report.created_at)}
                        </div>
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
