"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PropertyManagerLayout } from "@/components/layouts/PropertyManagerLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useProperty, useUpdateProperty } from "@/hooks/useProperties";
import { useCities } from "@/hooks/useCities";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = parseInt(params.id as string);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city_id: 0,
    latitude: null as number | null,
    longitude: null as number | null,
    floors_from: null as number | null,
    floors_to: null as number | null,
    show_monthly_reports_to_tenants: true,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isMapLocked, setIsMapLocked] = useState(false);

  const { data: propertyData, isLoading } = useProperty(propertyId);
  const { data: citiesData, isLoading: citiesLoading } = useCities();
  const updateMutation = useUpdateProperty();

  const cities = citiesData?.data || [];

  useEffect(() => {
    if (propertyData?.success && propertyData.data) {
      const property = propertyData.data;
      const hasCoordinates = property.latitude !== null && property.longitude !== null;

      setFormData({
        name: property.name,
        address: property.address,
        city_id: property.city_id,
        latitude: property.latitude,
        longitude: property.longitude,
        floors_from: property.floors_from,
        floors_to: property.floors_to,
        show_monthly_reports_to_tenants: property.show_monthly_reports_to_tenants ?? true,
      });

      // Lock the map if coordinates already exist
      setIsMapLocked(hasCoordinates);
    }
  }, [propertyData]);

  // Check if form is ready to display (both property and cities loaded)
  const isFormReady = !isLoading && !citiesLoading && formData.city_id > 0;

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.city_id) {
      setError("Ju lutemi zgjidhni një qytet");
      toast.error("Ju lutemi zgjidhni një qytet");
      return;
    }

    try {
      const result = await updateMutation.mutateAsync({
        id: propertyId,
        data: {
          name: formData.name,
          address: formData.address,
          city_id: formData.city_id,
          latitude: formData.latitude,
          longitude: formData.longitude,
          floors_from: formData.floors_from,
          floors_to: formData.floors_to,
          show_monthly_reports_to_tenants: formData.show_monthly_reports_to_tenants,
        },
      });

      if (result.success) {
        setSuccess(true);
        toast.success("Prona u përditësua me sukses! Duke ridrejtuar...");
        setTimeout(() => {
          router.push("/property_manager/properties");
        }, 1500);
      } else {
        setError(result.message || "Dështoi përditësimi i pronës");
        toast.error(result.message || "Dështoi përditësimi i pronës");
      }
    } catch (err) {
      setError("Dështoi lidhja me serverin");
      toast.error("Dështoi lidhja me serverin");
      console.error("Update property error:", err);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["property_manager"]}>
        <PropertyManagerLayout title="Ndrysho Pronën">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        </PropertyManagerLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["property_manager"]}>
      <PropertyManagerLayout title="Ndrysho Pronën">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
          {/* Back Button */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/property_manager/properties")}
              className="h-9 w-9 md:h-10 md:w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <p className="text-xs md:text-sm text-slate-600">
              Përditëso informacionin e pronës
            </p>
          </div>

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800 text-xs md:text-sm">
                Prona u përditësua me sukses! Duke ridrejtuar...
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs md:text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {isFormReady && (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Property Details Form */}
              <Card className="border-indigo-200">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Detajet e Pronës</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Përditëso informacionin e pronës më poshtë
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs md:text-sm">Emri i Pronës *</Label>
                    <Input
                      id="name"
                      placeholder="p.sh., Apartamentet Greenwood"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      disabled={updateMutation.isPending}
                      className="text-sm md:text-base h-9 md:h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs md:text-sm">Adresa *</Label>
                    <Input
                      id="address"
                      placeholder="p.sh., Rruga Kryesore 123"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      required
                      disabled={updateMutation.isPending}
                      className="text-sm md:text-base h-9 md:h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs md:text-sm">Qyteti *</Label>
                    <Select
                      value={formData.city_id.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, city_id: parseInt(value) })
                      }
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger id="city" className="text-sm md:text-base h-9 md:h-10">
                        <SelectValue placeholder="Zgjidhni një qytet" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()} className="text-sm md:text-base">
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm">Diapazoni i Kateve (Opsionale)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="floors_from" className="text-xs text-slate-600">Nga</Label>
                        <Select
                          value={formData.floors_from !== null ? formData.floors_from.toString() : "none"}
                          onValueChange={(value) =>
                            setFormData({ ...formData, floors_from: value === "none" ? null : parseInt(value) })
                          }
                          disabled={updateMutation.isPending}
                        >
                          <SelectTrigger id="floors_from" className="text-sm md:text-base h-9 md:h-10">
                            <SelectValue placeholder="Kati fillestar" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="none" className="text-sm">Nuk është specifikuar</SelectItem>
                            {Array.from({ length: 221 }, (_, i) => i - 20).map((floor) => (
                              <SelectItem key={floor} value={floor.toString()} className="text-sm">
                                {floor === 0 ? "Niveli Përdhesë" : floor < 0 ? `B${Math.abs(floor)}` : `Kati ${floor}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="floors_to" className="text-xs text-slate-600">Në</Label>
                        <Select
                          value={formData.floors_to !== null ? formData.floors_to.toString() : "none"}
                          onValueChange={(value) =>
                            setFormData({ ...formData, floors_to: value === "none" ? null : parseInt(value) })
                          }
                          disabled={updateMutation.isPending}
                        >
                          <SelectTrigger id="floors_to" className="text-sm md:text-base h-9 md:h-10">
                            <SelectValue placeholder="Kati përfundimtar" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="none" className="text-sm">Nuk është specifikuar</SelectItem>
                            {Array.from({ length: 221 }, (_, i) => i - 20).map((floor) => (
                              <SelectItem key={floor} value={floor.toString()} className="text-sm">
                                {floor === 0 ? "Niveli Përdhesë" : floor < 0 ? `B${Math.abs(floor)}` : `Kati ${floor}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">
                      Specifikoni diapazonin e kateve për këtë pronë (nga -20 nëntokë deri në 200 mbi tokë)
                    </p>
                  </div>

                  <div className="flex items-center justify-between space-x-2 p-4 border border-slate-200 rounded-lg bg-slate-50">
                    <div className="space-y-0.5 flex-1">
                      <Label htmlFor="monthly-reports" className="text-sm font-medium">
                        Raportet Mujore për Banorët
                      </Label>
                      <p className="text-xs text-slate-600">
                        Lejoni banorët e kësaj prone të shohin raportet mujore
                      </p>
                    </div>
                    <Switch
                      id="monthly-reports"
                      checked={formData.show_monthly_reports_to_tenants}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, show_monthly_reports_to_tenants: checked })
                      }
                      disabled={updateMutation.isPending}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location Picker */}
              <LocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={handleLocationChange}
                disabled={updateMutation.isPending || isMapLocked}
                isLocked={isMapLocked}
                onToggleLock={() => setIsMapLocked(!isMapLocked)}
              />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 gap-2 text-xs md:text-sm h-9 md:h-10"
                  isLoading={updateMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  Përditëso Pronën
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/property_manager/properties")}
                  disabled={updateMutation.isPending}
                  className="text-xs md:text-sm h-9 md:h-10"
                >
                  Anulo
                </Button>
              </div>
            </form>
          )}
        </div>
      </PropertyManagerLayout>
    </ProtectedRoute>
  );
}
