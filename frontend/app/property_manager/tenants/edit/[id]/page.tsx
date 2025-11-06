"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { PropertyManagerLayout } from "@/components/layouts/PropertyManagerLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTenant, useUpdateTenant } from "@/hooks/useUsers";
import { useProperties } from "@/hooks/useProperties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import PaymentTracker from "@/components/PaymentTracker";

export default function EditTenantPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = parseInt(params.id as string);

  const { data: tenantData, isLoading } = useTenant(tenantId);
  const updateMutation = useUpdateTenant();

  // Fetch properties managed by this property manager - refetch on mount to ensure fresh data
  const { data: propertiesData, isLoading: propertiesLoading, refetch: refetchProperties } = useProperties(
    {
      myProperties: true,
    }
  );

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    number: "",
    property_id: "",
    floor_assigned: "" as string,
    monthly_rate: "" as string,
    apartment_label: "",
    notice_day: "" as string,
  });
  const [error, setError] = useState("");
  const [isRefetching, setIsRefetching] = useState(true);

  // Refetch properties when component mounts to avoid stale cache from tenants list
  useEffect(() => {
    const doRefetch = async () => {
      await refetchProperties();
      setIsRefetching(false);
    };
    doRefetch();
  }, [refetchProperties]);

  // Get managed properties
  const managedProperties = useMemo(() => {
    if (!propertiesData?.data) return [];
    return propertiesData.data;
  }, [propertiesData]);

  // Get available floors from selected property
  const availableFloors = useMemo(() => {
    if (!formData.property_id || !propertiesData?.data) return [];

    // Find the selected property
    const property = propertiesData.data.find((p: any) => p.id === parseInt(formData.property_id));

    if (!property) return [];

    const floorsFrom = property.floors_from ?? null;
    const floorsTo = property.floors_to ?? null;

    // If no floor range is defined, return empty array
    if (floorsFrom === null || floorsTo === null) return [];

    // Generate floor range from floors_from to floors_to
    const floors = [];
    for (let i = floorsFrom; i <= floorsTo; i++) {
      floors.push(i);
    }

    return floors;
  }, [propertiesData, formData.property_id]);

  useEffect(() => {
    // Only set form data when both tenant data AND properties data are available
    if (tenantData?.data && propertiesData?.data && !isRefetching) {
      const tenant = tenantData.data;
      setFormData({
        name: tenant.name,
        surname: tenant.surname,
        email: tenant.email,
        password: "",
        number: tenant.number || "",
        property_id: tenant.property_ids && tenant.property_ids.length > 0
          ? tenant.property_ids[0].toString()
          : "",
        floor_assigned: tenant.floor_assigned !== null && tenant.floor_assigned !== undefined
          ? tenant.floor_assigned.toString()
          : "",
        monthly_rate: tenant.monthly_rate !== null && tenant.monthly_rate !== undefined
          ? tenant.monthly_rate.toString()
          : "",
        apartment_label: tenant.apartment_label || "",
        notice_day: tenant.notice_day !== null && tenant.notice_day !== undefined
          ? tenant.notice_day.toString()
          : "",
      });
    }
  }, [tenantData, propertiesData, isRefetching]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate property selection
    if (!formData.property_id) {
      setError("Ju lutemi zgjidhni një pronë për këtë banorë");
      toast.error("Ju lutemi zgjidhni një pronë për këtë banorë");
      return;
    }

    try {
      const updateData: any = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        number: formData.number || null,
        property_ids: [parseInt(formData.property_id)],
        floor_assigned: formData.floor_assigned ? parseInt(formData.floor_assigned) : null,
        monthly_rate: formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
        apartment_label: formData.apartment_label || null,
        notice_day: formData.notice_day ? parseInt(formData.notice_day) : null,
      };

      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await updateMutation.mutateAsync({
        id: tenantId,
        data: updateData,
      });

      toast.success("Banori u përditësua me sukses! Duke ridrejtuar...");
      setTimeout(() => {
        router.push("/property_manager/tenants");
      }, 1500);
    } catch (err: any) {
      const errorMessage = err?.message || "Dështoi përditësimi i banorit";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Update tenant error:", err);
    }
  };

  if (isLoading || propertiesLoading || isRefetching) {
    return (
      <ProtectedRoute allowedRoles={["property_manager"]}>
        <PropertyManagerLayout title="Ndrysho Banorin">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </PropertyManagerLayout>
      </ProtectedRoute>
    );
  }

  if (!tenantData?.data || tenantData.data.role !== "tenant") {
    return (
      <ProtectedRoute allowedRoles={["property_manager"]}>
        <PropertyManagerLayout title="Ndrysho Banorin">
          <Alert variant="destructive">
            <AlertDescription className="text-xs md:text-sm">
              Banori nuk u gjet ose ID e pavlefshme.
            </AlertDescription>
          </Alert>
        </PropertyManagerLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["property_manager"]}>
      <PropertyManagerLayout title="Ndrysho Banorin">
        <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
          {/* Back button */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/property_manager/tenants")}
              className="h-9 w-9 md:h-10 md:w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <p className="text-xs md:text-sm text-slate-600">
              Përditëso detajet për këtë banorë
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Informacioni i Banorit</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Përditëso detajet për këtë banorë
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription className="text-xs md:text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs md:text-sm">Emri *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                      placeholder="Agron"
                      className="text-sm md:text-base h-9 md:h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="surname" className="text-xs md:text-sm">Mbiemri *</Label>
                    <Input
                      id="surname"
                      value={formData.surname}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, surname: e.target.value }))
                      }
                      required
                      placeholder="Krasniqi"
                      className="text-sm md:text-base h-9 md:h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs md:text-sm">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                    placeholder="agron.krasniqi@example.com"
                    className="text-sm md:text-base h-9 md:h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs md:text-sm">Fjalëkalimi i Ri</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Lëreni bosh për të mbajtur fjalëkalimin aktual"
                    minLength={6}
                    className="text-sm md:text-base h-9 md:h-10"
                  />
                  <p className="text-xs text-slate-500">
                    Plotësoni vetëm nëse dëshironi të ndryshoni fjalëkalimin
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number" className="text-xs md:text-sm">Numri i Telefonit</Label>
                  <Input
                    id="number"
                    type="tel"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, number: e.target.value }))
                    }
                    placeholder="+38349123456"
                    className="text-sm md:text-base h-9 md:h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="property_id" className="text-xs md:text-sm">Zgjidhni Pronën</Label>
                  <Select
                    key={formData.property_id || 'no-selection'}
                    value={formData.property_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, property_id: value }))
                    }
                    required
                  >
                    <SelectTrigger className="text-sm md:text-base h-9 md:h-10">
                      <SelectValue placeholder="Zgjidhni një pronë" />
                    </SelectTrigger>
                    <SelectContent>
                      {managedProperties.length === 0 && (
                        <SelectItem value="no-properties" disabled className="text-sm">
                          Asnjë pronë nuk u gjet
                        </SelectItem>
                      )}
                      {managedProperties.map((property: any) => (
                        <SelectItem key={property.id} value={property.id.toString()} className="text-sm md:text-base">
                          {property.name} - {property.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Caktoni banorin në një pronë
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor_assigned" className="text-xs md:text-sm">Numri i Katit</Label>
                  <select
                    id="floor_assigned"
                    value={formData.floor_assigned}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, floor_assigned: e.target.value }))
                    }
                    disabled={!formData.property_id || availableFloors.length === 0}
                    className={`w-full h-9 md:h-10 px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      !formData.property_id || availableFloors.length === 0
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-white"
                    }`}
                  >
                    <option value="">
                      {!formData.property_id
                        ? "Zgjidhni një pronë së pari"
                        : availableFloors.length === 0
                        ? "Asnjë kat i disponueshëm"
                        : "Zgjidhni një kat (opsionale)"}
                    </option>
                    {availableFloors.map((floor) => (
                      <option key={floor} value={floor.toString()}>
                        Kati {floor}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    Caktoni banorin në një kat specifik (opsionale)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_rate" className="text-xs md:text-sm">Norma Mujore</Label>
                  <div className="relative">
                    <Input
                      id="monthly_rate"
                      type="number"
                      value={formData.monthly_rate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, monthly_rate: e.target.value }))
                      }
                      placeholder="p.sh., 500, 1000, 1500..."
                      min="0"
                      step="0.01"
                      className="pr-8 text-sm md:text-base h-9 md:h-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-xs md:text-sm">
                      €
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Vendosni qiranë mujore për banorin
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apartment_label" className="text-xs md:text-sm">Shenja e Apartamentit</Label>
                  <Input
                    id="apartment_label"
                    value={formData.apartment_label}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, apartment_label: e.target.value }))
                    }
                    placeholder="P.sh., A1, B2, etj."
                    className="text-sm md:text-base h-9 md:h-10"
                  />
                  <p className="text-xs text-slate-500">
                    Caktoni një shenjë për apartamentin (opsionale)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notice_day" className="text-xs md:text-sm">Dita e Njoftimit</Label>
                  <Input
                    id="notice_day"
                    type="number"
                    value={formData.notice_day}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notice_day: e.target.value }))
                    }
                    placeholder="P.sh., 1, 15, 30..."
                    min="0"
                    className="text-sm md:text-base h-9 md:h-10"
                  />
                  <p className="text-xs text-slate-500">
                    Vendosni ditën e njoftimit për këtë banorë (opsionale)
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/property_manager/tenants")}
                    className="flex-1 text-xs md:text-sm h-9 md:h-10"
                  >
                    Anulo
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs md:text-sm h-9 md:h-10"
                  >
                    {updateMutation.isPending ? (
                      <>Duke përditësuar...</>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Përditëso Banorin
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Payment Tracker Section */}
          {tenantData && formData.property_id && (
            <Card className="mt-4 md:mt-6">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Ndjekja e Pagesave</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Ndiqni pagesat mujore për këtë banorë. Regjistrat e pagesave gjenerohen automatikisht
                  nga data e krijimit të pronës deri në muajin aktual.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentTracker
                  tenantId={tenantId}
                  propertyId={formData.property_id ? parseInt(formData.property_id) : undefined}
                  monthlyRate={formData.monthly_rate ? parseFloat(formData.monthly_rate) : undefined}
                  editable={true}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </PropertyManagerLayout>
    </ProtectedRoute>
  );
}
