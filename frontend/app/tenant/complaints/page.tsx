"use client";

import { TenantLayout } from "@/components/layouts/TenantLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Clock, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";

interface Property {
  id: number;
  name: string;
  address: string;
}

interface Complaint {
  id: number;
  property_id: number;
  title: string;
  description: string;
  response: string;
  status: string;
  created_at: string;
  property: {
    name: string;
    address: string;
  };
}

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);

  // Fetch properties and complaints
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await apiFetch('/api/complaints/properties');

        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties);
          // Automatically select the first (and only) property for the tenant
          if (data.properties.length > 0) {
            setSelectedProperty(data.properties[0].id.toString());
          }
        } else {
          console.error("Failed to fetch properties:", response.status);
          toast.error("Gabim në ngarkimin e pronave");
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast.error("Gabim në ngarkimin e pronave");
      } finally {
        setFetchingData(false);
      }
    };

    const fetchMyComplaints = async () => {
      try {
        const response = await apiFetch('/api/complaints/my-complaints');

        if (response.ok) {
          const data = await response.json();
          setMyComplaints(data.complaints);
        }
      } catch (error) {
        console.error("Error fetching complaints:", error);
      }
    };

    if (user) {
      fetchProperties();
      fetchMyComplaints();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProperty || !title.trim()) {
      toast.error("Ju lutem zgjidhni një pronë dhe vendosni titullin");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/api/complaints', {
        method: "POST",
        body: JSON.stringify({
          property_id: parseInt(selectedProperty),
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Ankesa u dërgua me sukses!");
        // Don't reset selectedProperty since it's auto-selected
        setTitle("");
        setDescription("");

        // Refresh complaints list
        const complaintsResponse = await apiFetch('/api/complaints/my-complaints');
        if (complaintsResponse.ok) {
          const complaintsData = await complaintsResponse.json();
          setMyComplaints(complaintsData.complaints);
        }
      } else {
        toast.error(data.message || "Gabim në dërgimin e ankesës");
      }
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Gabim në dërgimin e ankesës");
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
            <AlertTriangle className="mr-1 h-3 w-3" />
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
        <TenantLayout title="Ankesat">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        </TenantLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["tenant"]}>
      <TenantLayout title="Ankesat">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Complaint Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  Dërgo Ankesë
                </CardTitle>
                <CardDescription>
                  Paraqisni një ankesë për pronën tuaj
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="property">Prona</Label>
                    <Select
                      value={selectedProperty}
                      onValueChange={setSelectedProperty}
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

                  <div className="space-y-2">
                    <Label htmlFor="title">Titulli</Label>
                    <Input
                      id="title"
                      placeholder="Përshkrim i shkurtër i ankesës suaj"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={255}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Përshkrimi (Opsional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Jepni më shumë detaje rreth ankesës suaj..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Duke Dërguar...
                      </>
                    ) : (
                      "Dërgo Ankesën"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Rreth Ankesave</CardTitle>
                <CardDescription>Si funksionon procesi i ankesave</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Kur të dërgoni një ankesë:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Probleme me menaxhimin e pronës</li>
                    <li>Shqetësime për mirëmbajtjen</li>
                    <li>Zhurmë ose shqetësime</li>
                    <li>Probleme me objektet</li>
                    <li>Çdo shqetësim tjetër</li>
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
                      <span className="text-muted-foreground">Çështja u zgjidh</span>
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

          {/* My Complaints */}
          <Card>
            <CardHeader>
              <CardTitle>Ankesat e Mia</CardTitle>
              <CardDescription>
                Ndiqni gjendjen e ankesave tuaja të dërguara
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myComplaints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>Nuk ka ankesa të dërguara ende</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myComplaints.map((complaint) => (
                    <Card key={complaint.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-semibold">{complaint.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {complaint.property.name}
                            </p>
                            {complaint.description && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {complaint.description}
                              </p>
                            )}
                            {complaint.response && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Përgjigja e Menaxherit të Pronës:</p>
                                <p className="text-sm text-blue-800">
                                  {complaint.response}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            {getStatusBadge(complaint.status)}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-3">
                          Dërguar më {formatDate(complaint.created_at)}
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
