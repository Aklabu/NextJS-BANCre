"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Button from "@/components/Button";
import type { PlaceData, PropertyData } from "./place-types";
import { useImageUpload } from "./useFileUpload";
import { PropertyImageUpload } from "./PropertyImageUpload";
import { PropertyFormFields } from "./PropertyFormFields";

const propertySchema = z.object({
  property_name: z.string().min(1, "Property name is required"),
  property_address: z.string().min(1, "Address is required"),
  property_type: z.string().min(1, "Property type is required"),
  number_of_units: z.preprocess(
    (val) => (val === "" || val === undefined || isNaN(Number(val)) ? undefined : Number(val)),
    z.number().int().min(1, "At least 1 unit").optional()
  ),
  rentable_area: z.preprocess(
    (val) => (val === undefined || val === null ? "" : String(val)),
    z.string().optional()
  ),
  year_built: z.preprocess(
    (val) => (val === "" || val === undefined || isNaN(Number(val)) ? undefined : Number(val)),
    z
      .number()
      .int()
      .min(1800, "Enter a valid year")
      .max(new Date().getFullYear(), "Cannot be in the future")
      .optional()
  ),
  occupancy: z.preprocess(
    (val) => (val === undefined || val === null ? "" : String(val)),
    z.string().optional()
  ),
  year_renovated: z.preprocess(
    (val) => (val === "" || val === undefined || isNaN(Number(val)) ? undefined : Number(val)),
    z
      .number()
      .int()
      .min(1800, "Enter a valid year")
      .max(new Date().getFullYear(), "Cannot be in the future")
      .optional()
  ),
  parking_spaces: z.preprocess(
    (val) => (val === "" || val === undefined || isNaN(Number(val)) ? undefined : Number(val)),
    z.number().int().min(0, "Min 0").optional()
  ),
});

type PropertyFormData = z.infer<typeof propertySchema>;

type AddPropertyInfoProps = {
  id: number;
  title?: string;
  description?: string;
  setCurrentStep?: React.Dispatch<React.SetStateAction<number>>;
  setPropertyId?: React.Dispatch<React.SetStateAction<number | null>>;
  setPropertyData?: React.Dispatch<React.SetStateAction<PropertyData | null>>;
  placeData?: PlaceData | null;
  propertyData?: PropertyData | null;
};

const normalizeType = (t?: unknown): string => {
  if (!t) return "";
  const s = String(t).trim().toLowerCase();
  if (s.includes("multi")) return "Multifamily";
  if (s.includes("indus")) return "Industrial";
  if (s.includes("retail")) return "Retail";
  if (s.includes("office")) return "Office";
  return "Other";
};

const AddPropertyInfo = ({
  id,
  title,
  description,
  setCurrentStep,
  setPropertyId,
  setPropertyData,
  placeData,
  propertyData,
}: AddPropertyInfoProps) => {
  const [location] = React.useState({
    lat: placeData?.lat || 0,
    lng: placeData?.lng || 0,
  });

  // Use custom hook for image management
  const imageUpload = useImageUpload(6, placeData?.photos);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      property_name: propertyData?.property_name || placeData?.property_name || placeData?.name || "",
      property_address: propertyData?.property_address || placeData?.property_address || placeData?.address || "",
      property_type: normalizeType(propertyData?.property_type || placeData?.property_type),
      number_of_units: (propertyData?.number_of_units ?? placeData?.number_of_units) ? Number(propertyData?.number_of_units ?? placeData?.number_of_units) : undefined,
      rentable_area: (propertyData?.rentable_area ?? placeData?.rentable_area) ? String(propertyData?.rentable_area ?? placeData?.rentable_area) : "",
      year_built: (propertyData?.year_built ?? placeData?.year_built) ? Number(propertyData?.year_built ?? placeData?.year_built) : undefined,
      occupancy: (propertyData?.occupancy ?? placeData?.occupancy) ? String(propertyData?.occupancy ?? placeData?.occupancy) : "",
      year_renovated: (propertyData?.year_renovated ?? placeData?.year_renovated) ? Number(propertyData?.year_renovated ?? placeData?.year_renovated) : undefined,
      parking_spaces: (propertyData?.parking_spaces ?? placeData?.parking_spaces) !== undefined ? Number(propertyData?.parking_spaces ?? placeData?.parking_spaces) : undefined,
    },
  });

  const onSubmit = async (data: PropertyFormData) => {
    if (location.lat === 0 && location.lng === 0) {
      toast.error("Please select a location on the map before continuing.");
      return;
    }

    // Just save the property data locally - don't create property yet
    // Property will be created in the next step (FileUpload) with all documents
    const savedProperty: PropertyData = {
      ...data,
      place_id: placeData?.place_id,
      latitude: location.lat,
      longitude: location.lng,
      photos: imageUpload.images.map((img) => (img.source === "place" ? img.url : img.name)),
      types: placeData?.types,
      // Store uploaded image files for next step
      uploadedImageFiles: imageUpload.getUploadedFiles(),
      placePhotoUrls: imageUpload.getPlacePhotoUrls(),
    };
    
    setPropertyData?.(savedProperty);
    toast.success("Property details saved. Continue to upload documents.");

    // Move to next step (document upload)
    setCurrentStep?.((prev) => prev + 1);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 border border-[#99A1AF] p-6 rounded-2xl bg-white shadow-sm"
      >
        <h1 className="text-lg font-semibold text-gray-800 mb-1">Property Details</h1>
        <p className="text-sm text-[#4A5565] mb-5">
          Review the AI-enriched property information below. Fields with data have been auto-populated
          — edit them as needed or fill in any blank fields.
        </p>
        <hr className="border-[#E5E7EB] mb-6" />

        {/* Location Info from Previous Step */}
        {placeData && (
          <div className="mb-6 rounded-xl border border-[#DDE3EA] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6A7282]">
                Location from previous step
              </p>
              {(placeData.property_type || placeData.number_of_units) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Enriched
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-gray-900">{placeData.name || "Unnamed place"}</p>
            <p className="mt-1 text-sm text-[#4A5565]">{placeData.address || "No address available"}</p>
            <p className="mt-2 text-xs text-[#6A7282]">
              {placeData.lat.toFixed(6)}, {placeData.lng.toFixed(6)}
              {typeof placeData.rating === "number" ? ` - Rating ${placeData.rating}` : ""}
            </p>
          </div>
        )}

        {/* Property Form Fields */}
        <PropertyFormFields register={register} errors={errors} />

        {/* Property Images */}
        <div className="mt-8">
          <PropertyImageUpload
            images={imageUpload.images}
            onAddImages={imageUpload.addImages}
            onRemoveImage={imageUpload.removeImage}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-8 pt-5 border-t border-[#E5E7EB]">
          <Button
            text="Back"
            type="button"
            className="button-outline"
            onClick={() => setCurrentStep?.((prev) => Math.max(prev - 1, 0))}
          />
          <Button
            text={isSubmitting ? "Submitting..." : "Continue"}
            type="submit"
            arrow={!isSubmitting}
            isDisabled={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
};

export default AddPropertyInfo;
