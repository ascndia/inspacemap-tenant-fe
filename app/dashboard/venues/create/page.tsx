"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { VenueDetailsStep } from "@/components/venues/create-venue/venue-details-step";
import { VenueGalleryStep } from "@/components/venues/create-venue/venue-gallery-step";
import { PermissionGuard } from "@/components/auth/permission-guard";

const STEPS = [
  {
    id: "details",
    title: "Venue Details",
    description: "Basic information and location",
  },
  {
    id: "gallery",
    title: "Gallery & Media",
    description: "Cover image and photo gallery",
  },
];

export default function CreateVenuePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [venueData, setVenueData] = useState({
    // Details step
    name: "",
    slug: "",
    description: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    latitude: null as number | null,
    longitude: null as number | null,
    floorCount: 1,

    // Gallery step
    coverImageId: null as string | null,
    galleryItems: [] as string[],
  });

  const updateVenueData = (updates: Partial<typeof venueData>) => {
    setVenueData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      // In a real app, this would make an API call to create the venue
      console.log("Creating venue:", venueData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to venues list
      router.push("/dashboard/venues");
    } catch (error) {
      console.error("Failed to create venue:", error);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <PermissionGuard
      permission="venue:create"
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">
            You don't have permission to create venues
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/venues")}
            className="mt-4"
          >
            Back to Venues
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/venues")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Venues
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Venue</h1>
            <p className="text-muted-foreground">
              Set up your venue in two simple steps
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      index <= currentStep
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p
                      className={`text-sm font-medium ${
                        index <= currentStep
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-12 h-px mx-4 ${
                        index < currentStep
                          ? "bg-primary"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 0 && (
              <VenueDetailsStep data={venueData} onUpdate={updateVenueData} />
            )}
            {currentStep === 1 && (
              <VenueGalleryStep data={venueData} onUpdate={updateVenueData} />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep === STEPS.length - 1 ? (
              <Button onClick={handleSave}>Create Venue</Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
