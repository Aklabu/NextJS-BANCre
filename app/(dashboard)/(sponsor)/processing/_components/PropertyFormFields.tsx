"use client";

import React from "react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";

type PropertyFormData = {
  property_name: string;
  property_address: string;
  property_type: string;
  number_of_units?: number;
  rentable_area?: string;
  year_built?: number;
  occupancy?: string;
  year_renovated?: number;
  parking_spaces?: number;
};

type PropertyFormFieldsProps = {
  register: UseFormRegister<PropertyFormData>;
  errors: FieldErrors<PropertyFormData>;
};

export const PropertyFormFields = ({ register, errors }: PropertyFormFieldsProps) => {
  const inputClass =
    "border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent py-2.5 px-3 rounded-xl text-sm transition";
  const errorClass = "text-xs text-red-500 mt-0.5";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5">
      {/* Property Name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="property_name" className="text-sm font-medium text-gray-700">
          Property Name
        </label>
        <input
          id="property_name"
          type="text"
          className={inputClass}
          placeholder="e.g. Sunset Apartments"
          {...register("property_name")}
        />
        {errors.property_name && <p className={errorClass}>{errors.property_name.message}</p>}
      </div>

      {/* Property Address */}
      <div className="flex flex-col gap-1">
        <label htmlFor="property_address" className="text-sm font-medium text-gray-700">
          Property Address
        </label>
        <input
          id="property_address"
          type="text"
          className={inputClass}
          placeholder="e.g. 123 Main St, NY"
          {...register("property_address")}
        />
        {errors.property_address && <p className={errorClass}>{errors.property_address.message}</p>}
      </div>

      {/* Property Type */}
      <div className="flex flex-col gap-1">
        <label htmlFor="property_type" className="text-sm font-medium text-gray-700">
          Property Type
        </label>
        <input
          id="property_type"
          type="text"
          className={inputClass}
          placeholder="e.g. Multifamily, Office, Retail"
          {...register("property_type")}
        />
        {errors.property_type && <p className={errorClass}>{errors.property_type.message}</p>}
      </div>

      {/* Number of Units */}
      <div className="flex flex-col gap-1">
        <label htmlFor="number_of_units" className="text-sm font-medium text-gray-700">
          Number of Units
        </label>
        <input
          id="number_of_units"
          type="number"
          className={inputClass}
          placeholder="e.g. 24"
          {...register("number_of_units")}
        />
        {errors.number_of_units && <p className={errorClass}>{errors.number_of_units.message}</p>}
      </div>

      {/* Rentable Area */}
      <div className="flex flex-col gap-1">
        <label htmlFor="rentable_area" className="text-sm font-medium text-gray-700">
          Rentable Area (RSF)
        </label>
        <input
          id="rentable_area"
          type="text"
          className={inputClass}
          placeholder="e.g. 12500"
          {...register("rentable_area")}
        />
        {errors.rentable_area && <p className={errorClass}>{errors.rentable_area.message}</p>}
      </div>

      {/* Year Built */}
      <div className="flex flex-col gap-1">
        <label htmlFor="year_built" className="text-sm font-medium text-gray-700">
          Year Built
        </label>
        <input
          id="year_built"
          type="number"
          className={inputClass}
          placeholder="e.g. 1998"
          {...register("year_built")}
        />
        {errors.year_built && <p className={errorClass}>{errors.year_built.message}</p>}
      </div>

      {/* Occupancy Rate */}
      <div className="flex flex-col gap-1">
        <label htmlFor="occupancy" className="text-sm font-medium text-gray-700">
          Occupancy Rate (%)
        </label>
        <input
          id="occupancy"
          type="text"
          className={inputClass}
          placeholder="e.g. 92"
          {...register("occupancy")}
        />
        {errors.occupancy && <p className={errorClass}>{errors.occupancy.message}</p>}
      </div>

      {/* Year Renovated */}
      <div className="flex flex-col gap-1">
        <label htmlFor="year_renovated" className="text-sm font-medium text-gray-700">
          Year Renovated
        </label>
        <input
          id="year_renovated"
          type="number"
          className={inputClass}
          placeholder="e.g. 2015"
          {...register("year_renovated")}
        />
        {errors.year_renovated && <p className={errorClass}>{errors.year_renovated.message}</p>}
      </div>

      {/* Parking Spaces */}
      <div className="flex flex-col gap-1">
        <label htmlFor="parking_spaces" className="text-sm font-medium text-gray-700">
          Parking Spaces
        </label>
        <input
          id="parking_spaces"
          type="number"
          className={inputClass}
          placeholder="e.g. 40"
          {...register("parking_spaces")}
        />
        {errors.parking_spaces && <p className={errorClass}>{errors.parking_spaces.message}</p>}
      </div>
    </div>
  );
};
