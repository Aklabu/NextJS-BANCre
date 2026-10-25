"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaPlus } from "react-icons/fa6";
import { LuDollarSign } from "react-icons/lu";
import { toast } from "sonner";

import {
  fetchLoanRequests,
  deleteLoanRequest,
  type SponsorLoanRequestItem,
} from "../_api/loan-requests-api";
import SponsorLoanRequestCard from "../_components/SponsorLoanRequestCard";
import CreateLoanRequestModal from "../_components/CreateLoanRequestModal";
import UpdateLoanRequestModal from "../_components/UpdateLoanRequestModal";
import LoanRequestQuotesModal from "../_components/LoanRequestQuotesModal";
import ConfirmActionModal from "@/components/ConfirmActionModal";

const MyLoanRequestsPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // TanStack Query for Loan Requests
  const { data: loanRequests = [], isLoading: requestsLoading } =
    useQuery<SponsorLoanRequestItem[]>({
      queryKey: ["loan-requests"],
      queryFn: () => fetchLoanRequests(1, 100),
      staleTime: 60 * 1000,
    });

  // Fetch properties for property selection in modal
  const { data: properties = [] } = useQuery<any[]>({
    queryKey: ["properties"],
    queryFn: async () => {
      const api = (await import("@/lib/apiClient")).default;
      const res = await api
        .get("/api/properties/")
        .catch(() => api.get("/api/properties/"));
      const raw = res?.data?.data ?? res?.data;
      return Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.results)
          ? raw.results
          : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Loan Request Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLoanRequest, setEditingLoanRequest] =
    useState<SponsorLoanRequestItem | null>(null);
  const [deletingLoanRequest, setDeletingLoanRequest] =
    useState<SponsorLoanRequestItem | null>(null);
  const [selectedQuotesRequest, setSelectedQuotesRequest] =
    useState<SponsorLoanRequestItem | null>(null);
  const [selectedQuotesRequestId, setSelectedQuotesRequestId] = useState<
    number | null
  >(null);
  const [isDeletingRequest, setIsDeletingRequest] = useState(false);

  const executeDeleteLoanRequest = async () => {
    if (!deletingLoanRequest) return;
    try {
      setIsDeletingRequest(true);
      await deleteLoanRequest(deletingLoanRequest.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loan-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["sponsor-dashboard"] }),
      ]);
      toast.success("Loan request deleted successfully.");
      setDeletingLoanRequest(null);
    } catch (error) {
      console.error("Failed to delete loan request", error);
      toast.error("Failed to delete loan request.");
    } finally {
      setIsDeletingRequest(false);
    }
  };

  // Stats calculations
  const activeRequests = loanRequests.filter(
    (r) => r.status?.toLowerCase() === "active"
  ).length;
  const underReviewRequests = loanRequests.filter((r) =>
    r.status?.toLowerCase().includes("review")
  ).length;
  const closedRequests = loanRequests.filter(
    (r) => r.status?.toLowerCase() === "closed"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            My Loan Requests
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage all your commercial property loan requests in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FaPlus className="text-xs" />
          <span>New loan request</span>
        </button>
      </div>

      {/* ── Stats Overview ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Requests</p>
          <p className="text-3xl font-semibold text-gray-900">
            {loanRequests.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Active</p>
          <p className="text-3xl font-semibold text-blue-600">
            {activeRequests}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Under Review</p>
          <p className="text-3xl font-semibold text-yellow-600">
            {underReviewRequests}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Closed</p>
          <p className="text-3xl font-semibold text-gray-600">
            {closedRequests}
          </p>
        </div>
      </div>

      {/* ── All Loan Requests ── */}
      <div>
        {requestsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-xl bg-white border border-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : loanRequests.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-gray-300 rounded-xl bg-white">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-3">
              <LuDollarSign />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No loan requests created yet
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
              Select any of your commercial properties and request loan terms to
              get quotes from lenders.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
            >
              <FaPlus className="text-xs" />
              <span>Create Loan Request</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Showing all {loanRequests.length} loan request
                {loanRequests.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loanRequests.map((request) => (
                <SponsorLoanRequestCard
                  key={request.id}
                  request={request}
                  onEdit={(req) => setEditingLoanRequest(req)}
                  onDelete={(req) => setDeletingLoanRequest(req)}
                  onViewQuotes={(req) => {
                    setSelectedQuotesRequest(req);
                    setSelectedQuotesRequestId(req.id);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Create Loan Request Modal ── */}
      <CreateLoanRequestModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        properties={properties}
      />

      {/* ── Update Loan Request Modal ── */}
      <UpdateLoanRequestModal
        open={Boolean(editingLoanRequest)}
        onOpenChange={(open) => {
          if (!open) setEditingLoanRequest(null);
        }}
        loanRequest={editingLoanRequest}
      />

      {/* ── Delete Loan Request Modal ── */}
      <ConfirmActionModal
        open={Boolean(deletingLoanRequest)}
        onOpenChange={(open) => {
          if (!open && !isDeletingRequest) setDeletingLoanRequest(null);
        }}
        title="Delete loan request?"
        description={
          deletingLoanRequest
            ? `This will permanently remove the loan request for "${deletingLoanRequest.property_name}".`
            : "This will permanently remove the selected loan request."
        }
        confirmText="Delete Request"
        destructive
        isLoading={isDeletingRequest}
        onConfirm={executeDeleteLoanRequest}
      />

      {/* ── Loan Request Quotes Modal ── */}
      <LoanRequestQuotesModal
        open={Boolean(selectedQuotesRequestId || selectedQuotesRequest)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuotesRequest(null);
            setSelectedQuotesRequestId(null);
          }
        }}
        loanRequestId={
          selectedQuotesRequestId || selectedQuotesRequest?.id || null
        }
        loanRequest={selectedQuotesRequest}
      />
    </div>
  );
};

export default MyLoanRequestsPage;
