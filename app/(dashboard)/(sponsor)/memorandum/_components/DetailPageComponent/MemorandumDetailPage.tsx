"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { IoIosArrowRoundBack } from "react-icons/io";
import { IoIosArrowUp } from "react-icons/io";
import { createLoanRequest } from "../../../_api/loan-requests-api";

// Components
import MemorandumHeader from "./MemorandumHeader";
import HeroSection from "./HeroSection";
import PreviewCover from "./PreviewCover";
import TableOfContents from "./TableOfContents";
import DynamicSectionEditorCard from "./DynamicSectionEditorCard";
import DynamicPreviewSections from "./DynamicPreviewSections";
import {
  formatSectionTitle,
  parsePropertyInformationFromSections,
  sanitizeInlineMarkdownText,
} from "./section-utils";
import { MemorandumTab } from "@/types/memorandum-detail";
import type {
  SectionBlock,
  MemorandumSection,
  MemorandumTableData,
} from "@/types/memorandum-detail";
import api from "@/lib/apiClient";
import { toast } from "sonner";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LoanRequestForm = {
  requestedAmount: string;
  loanTerm: string;
  ltv: string;
};

const MemorandumDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id;
  const memorandumId = Array.isArray(id) ? id[0] : id;

  const [activeTab, setActiveTab] = useState<MemorandumTab>("editor");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);
  const [loanSubmitError, setLoanSubmitError] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [loanForm, setLoanForm] = useState<LoanRequestForm>({
    requestedAmount: "5000000.00",
    loanTerm: "24",
    ltv: "75.00",
  });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/memorandums/${memorandumId}/`);
        
        // API returns: { success, statusCode, message, data: {...}, errors }
        const fetchedData = response.data?.data ?? response.data;

        // Extract property_images array from API response
        // API returns: property_images: [{ type: "cover"|"gallery", url: "..." }]
        if (
          fetchedData?.property_images &&
          Array.isArray(fetchedData.property_images) &&
          fetchedData.property_images.length > 0
        ) {
          // Convert array of objects to array of URLs if needed
          const imageUrls = fetchedData.property_images.map((img: any) => 
            typeof img === 'string' ? img : img.url
          ).filter(Boolean);
          
          if (imageUrls.length > 0) {
            fetchedData.property_images = imageUrls;
          }
        }

        // Fallback: Enrich with property images/thumbnail if missing from memorandum
        if (
          fetchedData?.property &&
          (!fetchedData.property_image_url ||
            !Array.isArray(fetchedData.property_images) ||
            fetchedData.property_images.length === 0)
        ) {
          try {
            const propId =
              typeof fetchedData.property === "object"
                ? fetchedData.property.id
                : fetchedData.property;
            const propRes = await api.get(`/api/properties/${propId}/`);
            const propData = propRes?.data?.data ?? propRes?.data;
            if (propData) {
              if (!fetchedData.property_image_url && propData.thumbnail_url) {
                fetchedData.property_image_url = propData.thumbnail_url;
              }
              if (
                (!fetchedData.property_images ||
                  fetchedData.property_images.length === 0) &&
                Array.isArray(propData.property_images) &&
                propData.property_images.length > 0
              ) {
                fetchedData.property_images = propData.property_images;
              } else if (
                (!fetchedData.property_images ||
                  fetchedData.property_images.length === 0) &&
                propData.thumbnail_url
              ) {
                fetchedData.property_images = [propData.thumbnail_url];
              }
            }
          } catch (propError) {
            // Silently ignore property fetch errors
            console.log("Could not fetch property details for image enrichment");
          }
        }

        setData(fetchedData);
      } catch (error: any) {
        console.error("Error fetching memorandum details:", error);
        
        // Handle standardized error responses
        if (error?.response?.status === 403) {
          toast.error(error?.response?.data?.message || "This memorandum is not available.");
        } else if (error?.response?.status === 404) {
          toast.error("Memorandum not found.");
        } else if (error?.response?.status === 401) {
          toast.error("Authentication required. Please sign in.");
        } else {
          toast.error("Failed to load memorandum details.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (memorandumId) fetchDetail();
  }, [memorandumId]);

  useEffect(() => {
    const handleScroll = () => {
      if (activeTab !== "preview") {
        setShowBackToTop(false);
        return;
      }

      setShowBackToTop(window.scrollY > 320);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [activeTab]);

  const sections = useMemo(() => {
    const responseSections = data?.sections || [];
    return [...responseSections].sort(
      (a: MemorandumSection, b: MemorandumSection) => {
        if (a.order === b.order) {
          return a.id - b.id;
        }
        return a.order - b.order;
      },
    );
  }, [data?.sections]);

  const parsedPropertyInformation = useMemo(() => {
    return parsePropertyInformationFromSections(sections);
  }, [sections]);

  const resolvedPropertyName =
    sanitizeInlineMarkdownText(
      data?.property_name ||
        parsedPropertyInformation.propertyName ||
        "Property",
    ) || "Property";
  const resolvedLocation =
    sanitizeInlineMarkdownText(
      data?.property_address || parsedPropertyInformation.address || "",
    ) || "";
  const resolvedPropertyType =
    sanitizeInlineMarkdownText(
      data?.property_type || parsedPropertyInformation.propertyType || "N/A",
    ) || "N/A";
  const resolvedUnits =
    Number(data?.number_of_units) > 0
      ? Number(data?.number_of_units)
      : Number(parsedPropertyInformation.numberOfUnits) || 0;
  const resolvedYearBuilt =
    Number(data?.year_built) > 0
      ? Number(data?.year_built)
      : Number(parsedPropertyInformation.yearBuilt) || 0;
  const resolvedYearRenovated =
    Number(data?.year_renovated) > 0
      ? Number(data?.year_renovated)
      : Number(parsedPropertyInformation.yearRenovated) || undefined;
  const resolvedOccupancy =
    Number(data?.occupancy) > 0
      ? Number(data?.occupancy)
      : Number(parsedPropertyInformation.occupancy) || 0;
  const resolvedParkingSpaces =
    Number(data?.parking_spaces) > 0
      ? Number(data?.parking_spaces)
      : Number(parsedPropertyInformation.parkingSpaces) || 0;
  const isPublished = String(data?.status || "").toLowerCase() === "published";

  const propertyImages = useMemo(() => {
    if (!data) return [];
    const images: string[] = [];

    // 1. Primary source: property_images array (already normalized to strings in fetchDetail)
    if (Array.isArray(data.property_images) && data.property_images.length > 0) {
      images.push(...data.property_images.filter((img: any): img is string => 
        typeof img === "string" && img.trim().length > 0
      ));
    }
    
    // 2. Fallback: other array fields
    if (Array.isArray(data.images) && data.images.length > 0) {
      images.push(...data.images);
    }

    // 3. Fallback: single image fields (legacy support)
    if (typeof data.property_image_url === "string" && data.property_image_url) {
      images.push(data.property_image_url);
    }
    if (typeof data.image_url === "string" && data.image_url) {
      images.push(data.image_url);
    }

    // Filter valid strings and remove duplicates
    return Array.from(
      new Set(
        images.filter(
          (img): img is string => typeof img === "string" && img.trim().length > 0,
        ),
      ),
    );
  }, [data]);

  const resolvedHeroImage =
    propertyImages[0] ||
    data?.property_image_url ||
    "";

  const updateSectionContent = async (
    sectionId: number,
    content: string,
    tableData?: MemorandumTableData | null,
  ) => {
    if (!memorandumId || !sectionId) {
      alert("Unable to update this section right now.");
      return;
    }

    const payload: Record<string, any> = { content };
    if (tableData !== undefined) {
      payload.table_data = tableData;
    }

    try {
      await api.patch(
        `/api/memorandums/${memorandumId}/sections/${sectionId}/`,
        payload,
      );

      setData((prev: any) => {
        if (!prev?.sections) return prev;
        return {
          ...prev,
          sections: prev.sections.map((item: MemorandumSection) =>
            item.id === sectionId
              ? {
                  ...item,
                  content,
                  ...(tableData !== undefined ? { table_data: tableData } : {}),
                  updated_at: new Date().toISOString(),
                }
              : item,
          ),
        };
      });

      toast.success("Section updated successfully.");
    } catch (error) {
      console.error("Failed to update section content:", error);
      toast.error("Failed to update section. Please try again.");
    }
  };

  const uploadSectionImage = async (sectionId: number, file: File) => {
    const section = sections.find((item: MemorandumSection) => item.id === sectionId);

    if (!memorandumId || !sectionId) {
      alert("Unable to upload image for this section right now.");
      return;
    }

    // Check if section already has an image
    const currentImage = section?.image_url || section?.image;
    if (currentImage) {
      toast.error("This section already has an image.");
      return currentImage;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await api.post(
        `/api/memorandums/${memorandumId}/sections/${sectionId}/image/`,
        formData,
      );

      const responseData = response?.data?.data ?? response?.data;
      const uploadedImageUrl = responseData?.image_url || responseData?.image;

      if (uploadedImageUrl) {
        setData((prev: any) => {
          if (!prev?.sections) return prev;
          return {
            ...prev,
            sections: prev.sections.map((item: MemorandumSection) =>
              item.id === sectionId
                ? {
                    ...item,
                    image_url: uploadedImageUrl,
                    updated_at: new Date().toISOString(),
                  }
                : item,
            ),
          };
        });
        toast.success("Section image uploaded successfully.");
      }

      return uploadedImageUrl;
    } catch (error) {
      console.error("Failed to upload section image:", error);
      toast.error("Failed to upload section image. Please try again.");
      return;
    }
  };

  const handleRegenerateSection = async (
    sectionId: number,
    sectionKey?: string,
    customInstruction?: string,
  ) => {
    if (!memorandumId || !sectionId) {
      toast.error("Unable to regenerate this section right now.");
      return;
    }

    // Find the current section BEFORE starting regeneration to preserve content
    const currentSection = sections.find((s: MemorandumSection) => s.id === sectionId);
    
    if (!currentSection) {
      toast.error("Section not found.");
      return;
    }

    const toastId = toast.loading("Regenerating section with AI...");

    try {
      const payload: { current_context?: string; custom_instruction?: string } = {};
      
      // Send current content as context for better iterations
      if (currentSection.content && currentSection.content.trim()) {
        payload.current_context = currentSection.content;
      }
      
      // Add custom instruction if provided
      if (customInstruction && customInstruction.trim()) {
        payload.custom_instruction = customInstruction.trim();
      }

      console.log("🔄 Regenerating section:", {
        sectionId,
        sectionTitle: currentSection.title || currentSection.label,
        hasCurrentContext: !!payload.current_context,
        currentContextLength: payload.current_context?.length,
        hasCustomInstruction: !!payload.custom_instruction,
        payload,
      });

      const response = await api.post(
        `/api/memorandums/${memorandumId}/sections/${sectionId}/regenerate/`,
        payload,
      );

      const resData = response?.data?.data ?? response?.data;

      console.log("✅ Regenerate API response:", {
        status: response?.status,
        responseStructure: {
          hasData: !!response?.data,
          hasNestedData: !!response?.data?.data,
          dataKeys: Object.keys(resData || {}),
        },
        resData,
        sectionIdMatch: resData?.id === sectionId,
        hasContent: !!resData?.content,
        contentLength: resData?.content?.length,
        contentPreview: resData?.content?.substring(0, 100),
      });

      // Validate response has required data
      if (!resData || resData.id !== sectionId) {
        console.error("❌ Invalid response: section ID mismatch or missing data");
        throw new Error("Invalid response from server");
      }

      if (resData.content === undefined || resData.content === null) {
        console.error("❌ Response missing content field");
        throw new Error("Server returned empty content");
      }

      // Check if content is too short (likely an error or "No data")
      const contentLength = resData.content.trim().length;
      if (contentLength < 20) {
        // Only log in development to avoid console spam
        if (process.env.NODE_ENV === 'development') {
          console.warn("⚠️ Backend returned short content for section:", {
            sectionId,
            sectionTitle: currentSection.title || currentSection.label,
            contentLength,
            content: resData.content,
          });
        }
        throw new Error(
          `Unable to generate content for this section. Backend returned: "${resData.content}". ` +
          `Please try again or contact support if the issue persists.`
        );
      }

      // Update the section with new content
      setData((prev: any) => {
        if (!prev?.sections) {
          console.error("❌ No sections in state");
          return prev;
        }
        
        const updatedSections = prev.sections.map((item: MemorandumSection) => {
          if (item.id === sectionId) {
            const updated = {
              ...item,
              content: resData.content,
              blocks: resData.blocks || item.blocks,
              title: resData.title || item.title,
              section_type: resData.section_type || item.section_type,
              image: resData.image !== undefined ? resData.image : item.image,
              image_url: resData.image_url !== undefined ? resData.image_url : item.image_url,
              order: resData.order !== undefined ? resData.order : item.order,
              updated_at: resData.updated_at || new Date().toISOString(),
            };
            
            console.log("📝 Updated section:", {
              id: updated.id,
              title: updated.title,
              contentLength: updated.content?.length,
            });
            
            return updated;
          }
          return item;
        });

        return {
          ...prev,
          sections: updatedSections,
        };
      });

      toast.success("Section regenerated successfully!", { id: toastId });
    } catch (error: any) {
      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        console.warn("⚠️ Section regeneration failed:", {
          sectionId,
          sectionTitle: currentSection.title || currentSection.label,
          errorMessage: error?.message,
        });
      }
      
      const apiMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to regenerate section.";
      
      toast.error(apiMsg, { id: toastId });
      
      // Don't clear the content on error - keep the original
    }
  };

  const handleRegenerateAll = async () => {
    if (!memorandumId) {
      toast.error("Unable to regenerate memorandum right now.");
      return;
    }

    const toastId = toast.loading("Regenerating all AI sections...");
    setIsRegeneratingAll(true);

    try {
      const response = await api.post(
        `/api/memorandums/${memorandumId}/regenerate/`,
      );

      const resData = response?.data?.data ?? response?.data;
      if (resData?.sections && Array.isArray(resData.sections)) {
        setData(resData);
      } else {
        // Refetch if regenerate doesn't return full data
        const refetchRes = await api.get(`/api/memorandums/${memorandumId}/`);
        const freshData = refetchRes?.data?.data ?? refetchRes?.data;
        if (freshData) setData(freshData);
      }

      toast.success("Memorandum regenerated successfully!", { id: toastId });
    } catch (error: any) {
      console.error("Failed to regenerate memorandum:", error);
      const apiMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to regenerate memorandum. Please try again.";
      toast.error(apiMsg, { id: toastId });
    } finally {
      setIsRegeneratingAll(false);
    }
  };

  const updateMemorandumStatus = async () => {
    if (!memorandumId) {
      toast.error("Unable to publish memorandum right now.");
      return;
    }

    try {
      setIsPublishing(true);
      const payload = {
        status: "published",
      };

      const response = await api.patch(`/api/memorandums/${memorandumId}/`, payload);

      // API returns: { success, statusCode, message, data: { status: "published" }, errors }
      const responseData = response?.data?.data ?? response?.data;

      setData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: responseData?.status || "published",
          updated_at: new Date().toISOString(),
        };
      });

      toast.success("Memorandum published successfully.");
      setIsPublishModalOpen(false);
    } catch (error: any) {
      console.error("Failed to publish memorandum:", error);
      
      // Handle different error scenarios
      const errorMessage = 
        error?.response?.data?.message || 
        error?.response?.data?.errors?.status?.[0] ||
        error?.response?.data?.detail ||
        "Failed to publish memorandum. Please try again.";
      
      toast.error(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExport = () => {
    if (!data?.id) {
      return;
    }

    try {
      sessionStorage.setItem(
        `memorandum-download-${data.id}`,
        JSON.stringify(data),
      );
    } catch (error) {
      console.error("Failed to persist memorandum snapshot for export:", error);
    }

    router.push(`/memorandum/${data.id}/download`);
  };

  const handleLoanFormChange = (
    field: keyof LoanRequestForm,
    value: string,
  ) => {
    setLoanForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitLoanRequest = async () => {
    const propertyId = Number(data?.property);
    const requestedAmountNumber = Number(loanForm.requestedAmount);
    const loanTermNumber = Number(loanForm.loanTerm);
    const ltvNumber = Number(loanForm.ltv);

    if (!Number.isFinite(propertyId) || propertyId <= 0) {
      setLoanSubmitError(
        "Property id is missing in memorandum data. Unable to submit loan request.",
      );
      return;
    }

    if (!Number.isFinite(requestedAmountNumber) || requestedAmountNumber <= 0) {
      setLoanSubmitError("Requested amount must be greater than 0.");
      return;
    }

    if (!Number.isFinite(loanTermNumber) || loanTermNumber <= 0) {
      setLoanSubmitError("Loan term must be a valid number of months.");
      return;
    }

    if (!Number.isFinite(ltvNumber) || ltvNumber <= 0) {
      setLoanSubmitError("LTV must be a valid percentage.");
      return;
    }

    try {
      setIsSubmittingLoan(true);
      setLoanSubmitError("");

      await createLoanRequest({
        property: propertyId,
        requested_amount: requestedAmountNumber.toFixed(2),
        loan_term: loanTermNumber,
        ltv: ltvNumber.toFixed(2),
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loan-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["sponsor-dashboard"] }),
      ]);

      toast.success("Loan request created successfully.");
      setIsLoanModalOpen(false);
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to create loan request. Please review the fields and try again.";
      setLoanSubmitError(
        typeof apiMessage === "string" ? apiMessage : JSON.stringify(apiMessage),
      );
    } finally {
      setIsSubmittingLoan(false);
    }
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading)
    return <div className="p-20 text-center">Loading details...</div>;
  if (!data)
    return <div className="p-20 text-center">Memorandum not found.</div>;

  const tableItems = sections.map(
    (section: MemorandumSection, index: number) => ({
      id: index + 1,
      title:
        section.label ||
        section.title ||
        formatSectionTitle(section.section_key || section.section_type),
      pageNumber: index + 3,
      anchorId: `preview-section-${section.id}`,
    }),
  );

  return (
    <div className="w-full py-6 px-4 md:px-8 lg:px-12 overflow-x-hidden">
      <MemorandumHeader
        memorandumId={data?.id}
        title={data?.title || "Offering Memorandum"}
        subtitle={data?.property_name || ""}
        status={data?.status}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        canPublish={activeTab === "preview" && data?.status !== "Published"}
        isPublishing={isPublishing}
        onPublish={() => setIsPublishModalOpen(true)}
        onExport={handleExport}
        onRegenerateAll={handleRegenerateAll}
        isRegeneratingAll={isRegeneratingAll}
      />

      {activeTab === "editor" && (
        <div className="relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/20 to-orange-400/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="backdrop-blur-sm bg-white/80 shadow-2xl rounded-3xl overflow-hidden mb-10 border-2 border-white/60 hover:shadow-[0_20px_70px_rgba(0,0,0,0.15)] transition-all duration-500">
            {/* Gradient top border */}
            <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
            
            <div className="p-3 md:p-6 lg:p-10">
              <PreviewCover
                presentedBy={data?.sponsor_name || "BANCre Team"}
                confidential={true}
                investmentOpportunity="INVESTMENT OFFERING"
                propertyName={resolvedPropertyName}
                location={resolvedLocation}
                stats={{
                  yearBuilt: resolvedYearBuilt,
                }}
                offeringDate={new Date(
                  data?.created_at || Date.now(),
                ).toLocaleDateString()}
                coverImage={resolvedHeroImage}
              />

              {/* Decorative divider */}
              <div className="flex items-center justify-center my-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <div className="mx-4 w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse"></div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>

              <TableOfContents items={tableItems} />

              {sections.map((section: MemorandumSection) => (
                <DynamicSectionEditorCard
                  key={section.id}
                  section={section}
                  onSave={updateSectionContent}
                  onRegenerate={handleRegenerateSection}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/20 to-orange-400/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="backdrop-blur-sm bg-white/80 shadow-2xl rounded-3xl overflow-hidden mb-10 border-2 border-white/60 hover:shadow-[0_20px_70px_rgba(0,0,0,0.15)] transition-all duration-500">
            {/* Gradient top border */}
            <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
            
            <div className="p-3 md:p-6 lg:p-10">
              <div className="mb-6 flex justify-end">
                {isPublished ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLoanSubmitError("");
                      setIsLoanModalOpen(true);
                    }}
                    className="group relative px-6 py-3 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 transition-all duration-300 group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-pink-600"></div>
                    <span className="relative flex items-center gap-2">
                      <span>Ask Loan</span>
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                ) : null}
              </div>

              <PreviewCover
                presentedBy={data?.sponsor_name || "BANCre Team"}
                confidential={true}
                investmentOpportunity="INVESTMENT OFFERING"
                propertyName={resolvedPropertyName}
                location={resolvedLocation}
                stats={{
                  yearBuilt: resolvedYearBuilt,
                }}
                offeringDate={new Date(
                  data?.created_at || Date.now(),
                ).toLocaleDateString()}
                coverImage={resolvedHeroImage}
              />

              {/* Property Gallery removed - only header image shown above */}

              {/* Decorative divider */}
              <div className="flex items-center justify-center my-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <div className="mx-4 w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse"></div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>

              <TableOfContents items={tableItems} />
              <DynamicPreviewSections sections={sections} />
            </div>
          </div>
        </div>
      )}

      <ConfirmActionModal
        open={isPublishModalOpen}
        onOpenChange={setIsPublishModalOpen}
        title="Publish memorandum?"
        description="Publishing this memorandum will make it visible to lenders, allowing you to request loan quotes for this property."
        confirmText="Publish"
        cancelText="Cancel"
        onConfirm={updateMemorandumStatus}
        isLoading={isPublishing}
      />

      <Dialog open={isLoanModalOpen} onOpenChange={setIsLoanModalOpen}>
        <DialogContent
          showCloseButton={!isSubmittingLoan}
          className="max-w-lg rounded-2xl border border-white/40 bg-white/95 p-0 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md overflow-hidden"
        >
          <div className="h-1.5 bg-linear-to-r from-blue-600 via-blue-500 to-cyan-500" />

          <div className="p-6">
            <DialogHeader className="gap-2">
              <DialogTitle className="text-xl font-semibold text-[#0F172A]">
                Ask Loan
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-[#475569]">
                Submit a loan request for this memorandum property.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700">
                Property: {resolvedPropertyName}
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  Requested Amount
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={loanForm.requestedAmount}
                  onChange={(e) =>
                    handleLoanFormChange("requestedAmount", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000000.00"
                  disabled={isSubmittingLoan}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  Loan Term (months)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={loanForm.loanTerm}
                  onChange={(e) =>
                    handleLoanFormChange("loanTerm", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="24"
                  disabled={isSubmittingLoan}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">LTV</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={loanForm.ltv}
                  onChange={(e) => handleLoanFormChange("ltv", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="75.00"
                  disabled={isSubmittingLoan}
                />
              </div>

              {loanSubmitError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {loanSubmitError}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLoanModalOpen(false)}
                disabled={isSubmittingLoan}
                className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitLoanRequest}
                disabled={isSubmittingLoan}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0D4DA5] hover:bg-[#0A3D84] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingLoan ? "Submitting..." : "Submit Loan Request"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {activeTab === "preview" && showBackToTop ? (
        <button
          type="button"
          onClick={handleBackToTop}
          className="fixed bottom-6 right-26 z-50 h-11 w-11 rounded-full bg-[#0D4DA5] text-white shadow-lg hover:bg-[#0A3D84] transition-colors flex items-center justify-center"
          aria-label="Back to top"
          title="Back to top"
        >
          <IoIosArrowUp className="h-6 w-6" />
        </button>
      ) : null}
    </div>
  );
};

export default MemorandumDetailPage;
