"use client";

import { TrendingUp, FileCheck, Clock, CheckCircle2 } from "lucide-react";
import type { LenderDashboardStats } from "../api";

type DashboardStatsProps = {
  stats: LenderDashboardStats;
  loading?: boolean;
};

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  iconBgColor,
  iconColor,
  loading,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  subtitle: string;
  iconBgColor: string;
  iconColor: string;
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
          <div className={`${iconBgColor} rounded-lg p-3`}>
            <div className="w-6 h-6 bg-gray-300 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value.toLocaleString()}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`${iconBgColor} rounded-lg p-3`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};

const DashboardStats = ({ stats, loading }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <StatCard
        icon={TrendingUp}
        title="Active Requests"
        value={stats.active_requests}
        subtitle="Available opportunities"
        iconBgColor="bg-blue-50"
        iconColor="text-blue-600"
        loading={loading}
      />
      <StatCard
        icon={FileCheck}
        title="Quotes Provided"
        value={stats.quotes_provided}
        subtitle="Total quotes submitted"
        iconBgColor="bg-purple-50"
        iconColor="text-purple-600"
        loading={loading}
      />
      <StatCard
        icon={Clock}
        title="Pending Review"
        value={stats.pending_review}
        subtitle="Awaiting sponsor decision"
        iconBgColor="bg-amber-50"
        iconColor="text-amber-600"
        loading={loading}
      />
      <StatCard
        icon={CheckCircle2}
        title="Accepted Quotes"
        value={stats.accepted_quotes}
        subtitle="Successfully won deals"
        iconBgColor="bg-green-50"
        iconColor="text-green-600"
        loading={loading}
      />
    </div>
  );
};

export default DashboardStats;
