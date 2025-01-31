"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { createAlert } from "@/app/actions/alert";
import { getSlotsForCasino } from "@/app/actions/slots";

interface AlertFormData {
  message: string;
  geoTargets: string[];
  referralCodes: string[];
  startTime: string;
  endTime: string;
  casinoId?: number;
  casinoName?: string;
  casinoCleanName?: string;
  casinoImage?: string;
  slot?: string;
  slotImage?: string;
  customUrl?: string;
  maxPotential?: number;
  recommendedBet?: number;
  stopLimit?: number;
  targetWin?: number;
  maxWin?: number;
  rtp?: number;
}

interface Casino {
  id: number;
  name: string;
  cleanName?: string;
  software: string;
  button?: string;
  validGames: Array<{
    name: string;
    image?: string;
    cleanName?: string;
  }>;
}

interface Slot {
  name: string;
  image?: string;
  cleanName?: string;
}

function formatCurrency(value: number | undefined): string {
  if (!value) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatPercentage(value: number | undefined): string {
  if (!value) return "";
  return `${value}%`;
}

function formatMultiplier(value: number | undefined): string {
  if (!value) return "";
  return `${value}x`;
}

function formatAlertMessage(data: AlertFormData): string {
  const parts = [data.message];

  if (data.casinoName) {
    parts.push(`\n\nCasino: ${data.casinoName}`);
    if (data.casinoImage) {
      parts.push(`Casino Image: /casino/${data.casinoImage}`);
    }
  }

  if (data.slot) {
    parts.push(`Game: ${data.slot}`);
    if (data.slotImage) {
      parts.push(`Game Image: /sloticonssquare/${data.slotImage}`);
    }
  }

  if (data.customUrl) {
    parts.push(`URL: ${data.customUrl}`);
  }

  const details = [];
  if (data.maxPotential)
    details.push(`Max Potential: ${formatMultiplier(data.maxPotential)}`);
  if (data.recommendedBet)
    details.push(`Recommended Bet: ${formatCurrency(data.recommendedBet)}`);
  if (data.stopLimit)
    details.push(`Stop Limit: ${formatCurrency(data.stopLimit)}`);
  if (data.targetWin)
    details.push(`Target Win: ${formatCurrency(data.targetWin)}`);
  if (data.maxWin) details.push(`Max Win: ${formatCurrency(data.maxWin)}`);
  if (data.rtp) details.push(`RTP: ${formatPercentage(data.rtp)}`);

  if (details.length > 0) {
    parts.push("\nDetails:");
    parts.push(details.join("\n"));
  }

  return parts.join("\n");
}

export default function AlertManager() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AlertFormData>({
    defaultValues: {
      message: "",
      geoTargets: [],
      referralCodes: [],
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 45 * 60 * 1000).toISOString().slice(0, 16),
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });
  const [geoInput, setGeoInput] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [selectedGeos, setSelectedGeos] = useState<string[]>([]);
  const [selectedReferrals, setSelectedReferrals] = useState<string[]>([]);
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const selectedCasinoId = watch("casinoId");

  const formValues = watch();
  const formattedMessage = formatAlertMessage(formValues);

  // Fetch casinos on component mount
  useEffect(() => {
    const fetchCasinos = async () => {
      try {
        const response = await fetch("/api/casinos");
        const data = await response.json();
        setCasinos(data);
      } catch (err) {
        console.error("Failed to fetch casinos:", err);
        setErrorMessage("Failed to fetch casinos");
      }
    };
    fetchCasinos();
  }, []);

  // Update slots when casino is selected
  useEffect(() => {
    if (!selectedCasinoId) {
      setSlots([]);
      setValue("slot", "");
      return;
    }

    const fetchSlots = async () => {
      try {
        const data = await getSlotsForCasino(selectedCasinoId.toString());
        setSlots(data);
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        setErrorMessage("Failed to fetch slots");
        setSlots([]);
      }
    };

    fetchSlots();
  }, [selectedCasinoId, setValue]);

  // Update casino details when selected
  useEffect(() => {
    if (!selectedCasinoId) {
      setValue("casinoName", "");
      setValue("casinoCleanName", "");
      setValue("casinoImage", "");
      return;
    }

    const selectedCasino = casinos.find(
      (c) => c.id === Number(selectedCasinoId)
    );
    if (selectedCasino) {
      setValue("casinoName", selectedCasino.name);
      setValue("casinoCleanName", selectedCasino.cleanName);
      setValue("casinoImage", selectedCasino.button);
    }
  }, [selectedCasinoId, casinos, setValue]);

  // Update slot details when selected
  const selectedSlotName = watch("slot");
  useEffect(() => {
    if (!selectedSlotName) {
      setValue("slotImage", "");
      return;
    }

    const selectedSlot = slots.find((s) => s.name === selectedSlotName);
    if (selectedSlot) {
      // Extract the filename from the image path if it exists
      const imageFilename = selectedSlot.image?.split("/").pop();
      setValue("slotImage", imageFilename);
    }
  }, [selectedSlotName, slots, setValue]);

  const onSubmit = async (data: AlertFormData) => {
    try {
      console.log("Form submission started with data:", data);
      setIsSubmitting(true);
      setErrorMessage(null);

      // Basic validation first
      if (!data.message?.trim()) {
        setErrorMessage("Message is required");
        setIsSubmitting(false);
        return;
      }

      // Required fields validation
      if (!data.casinoId) {
        setErrorMessage("Casino selection is required");
        setIsSubmitting(false);
        return;
      }

      if (!data.slot) {
        setErrorMessage("Slot selection is required");
        setIsSubmitting(false);
        return;
      }

      if (!data.rtp) {
        setErrorMessage("RTP is required");
        setIsSubmitting(false);
        return;
      }

      // Format dates properly
      const startDate = new Date(data.startTime);
      const endDate = new Date(data.endTime);
      const now = new Date();

      // Date validation
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setErrorMessage("Please enter valid dates");
        setIsSubmitting(false);
        return;
      }

      if (endDate <= startDate) {
        setErrorMessage("End time must be after start time");
        setIsSubmitting(false);
        return;
      }

      if (startDate < now) {
        setErrorMessage("Start time cannot be in the past");
        setIsSubmitting(false);
        return;
      }

      // Handle URL if provided (but don't validate if empty)
      if (data.customUrl?.trim()) {
        if (!data.customUrl.match(/^https?:\/\//)) {
          data.customUrl = `https://${data.customUrl}`;
        }
      }

      // Create the formatted message
      const formattedMessage = formatAlertMessage(data);

      // Clean and format the data for submission
      const formattedData = {
        message: formattedMessage,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        geoTargets: selectedGeos,
        referralCodes: selectedReferrals,
        // Only include optional fields if they have values
        ...(data.casinoId && { casinoId: Number(data.casinoId) }),
        ...(data.casinoName && { casinoName: data.casinoName }),
        ...(data.casinoCleanName && { casinoCleanName: data.casinoCleanName }),
        ...(data.casinoImage && { casinoImage: data.casinoImage }),
        ...(data.slot && { slot: data.slot }),
        ...(data.slotImage && { slotImage: data.slotImage }),
        ...(data.customUrl?.trim() && { customUrl: data.customUrl.trim() }),
        ...(data.maxPotential && { maxPotential: Number(data.maxPotential) }),
        ...(data.recommendedBet && {
          recommendedBet: Number(data.recommendedBet),
        }),
        ...(data.stopLimit && { stopLimit: Number(data.stopLimit) }),
        ...(data.targetWin && { targetWin: Number(data.targetWin) }),
        ...(data.maxWin && { maxWin: Number(data.maxWin) }),
        ...(data.rtp && { rtp: Number(data.rtp) }),
      };

      console.log("Submitting formatted data:", formattedData);

      // Attempt to create the alert
      const result = await createAlert(formattedData);

      if (!result) {
        throw new Error("Failed to create alert - no response from server");
      }

      // Reset form on success
      reset({
        message: "",
        startTime: new Date().toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 45 * 60 * 1000)
          .toISOString()
          .slice(0, 16),
      });
      setSelectedGeos([]);
      setSelectedReferrals([]);
      setGeoInput("");
      setReferralInput("");
      setValue("casinoId", undefined);
      setValue("slot", "");
      setErrorMessage(null);

      // Show success message
      window.alert("Alert created successfully!");
    } catch (err) {
      console.error("Failed to create alert:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setErrorMessage(`Failed to create alert: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addGeo = (e: React.FormEvent) => {
    e.preventDefault();
    if (geoInput && !selectedGeos.includes(geoInput)) {
      setSelectedGeos([...selectedGeos, geoInput]);
      setGeoInput("");
    }
  };

  const addReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (referralInput && !selectedReferrals.includes(referralInput)) {
      setSelectedReferrals([...selectedReferrals, referralInput]);
      setReferralInput("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create Alert</h2>
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {errorMessage}
        </div>
      )}
      <form
        onSubmit={handleSubmit((data) => {
          console.log("Form submitted with data:", data);
          onSubmit(data);
        })}
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-medium mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register("message", {
              required: "Message is required",
              minLength: {
                value: 10,
                message: "Message must be at least 10 characters",
              },
            })}
            className={`w-full p-2 border rounded-md ${
              errors.message ? "border-red-500" : ""
            }`}
            rows={4}
            disabled={isSubmitting}
          />
          {errors.message && (
            <p className="text-red-500 text-sm mt-1">
              {errors.message.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Casino <span className="text-red-500">*</span>
          </label>
          <select
            {...register("casinoId", {
              required: "Casino selection is required",
            })}
            className={`w-full p-2 border rounded-md ${
              errors.casinoId ? "border-red-500" : ""
            }`}
            onChange={(e) => {
              register("casinoId").onChange(e);
              setValue("slot", "");
            }}
            disabled={isSubmitting}
          >
            <option value="">Select a casino...</option>
            {casinos.map((casino) => (
              <option key={casino.id} value={casino.id}>
                {casino.name} ({casino.software})
              </option>
            ))}
          </select>
          {errors.casinoId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.casinoId.message}
            </p>
          )}
        </div>

        {selectedCasinoId && slots.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Slot Machine ({slots.length} available){" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              {...register("slot", { required: "Slot selection is required" })}
              className={`w-full p-2 border rounded-md ${
                errors.slot ? "border-red-500" : ""
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select a slot machine...</option>
              {slots.map((slot, index) => (
                <option key={`${slot.name}-${index}`} value={slot.name}>
                  {slot.name}
                </option>
              ))}
            </select>
            {errors.slot && (
              <p className="text-red-500 text-sm mt-1">{errors.slot.message}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Custom URL (Optional)
          </label>
          <input
            type="text"
            {...register("customUrl", {
              validate: {
                validUrl: (value) => {
                  if (!value?.trim()) return true; // Allow empty
                  try {
                    new URL(
                      value.startsWith("http") ? value : `https://${value}`
                    );
                    return true;
                  } catch {
                    return "Please enter a valid URL";
                  }
                },
              },
            })}
            className={`w-full p-2 border rounded-md ${
              errors.customUrl ? "border-red-500" : ""
            }`}
            placeholder="example.com/custom-slot-url"
            disabled={isSubmitting}
          />
          {errors.customUrl && (
            <p className="text-red-500 text-sm mt-1">
              {errors.customUrl.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              {...register("startTime", { required: "Start time is required" })}
              className={`w-full p-2 border rounded-md ${
                errors.startTime ? "border-red-500" : ""
              }`}
              disabled={isSubmitting}
            />
            {errors.startTime && (
              <p className="text-red-500 text-sm mt-1">
                {errors.startTime.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              {...register("endTime", { required: "End time is required" })}
              className={`w-full p-2 border rounded-md ${
                errors.endTime ? "border-red-500" : ""
              }`}
              disabled={isSubmitting}
            />
            {errors.endTime && (
              <p className="text-red-500 text-sm mt-1">
                {errors.endTime.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Potential (x)
            </label>
            <input
              type="number"
              step="0.01"
              {...register("maxPotential", { min: 0 })}
              className="w-full p-2 border rounded-md"
              placeholder="e.g., 5000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Recommended Bet ($)
            </label>
            <input
              type="number"
              step="0.01"
              {...register("recommendedBet", { min: 0 })}
              className="w-full p-2 border rounded-md"
              placeholder="e.g., 0.40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Stop Limit ($)
            </label>
            <input
              type="number"
              step="0.01"
              {...register("stopLimit", { min: 0 })}
              className="w-full p-2 border rounded-md"
              placeholder="e.g., 100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Target Win ($)
            </label>
            <input
              type="number"
              step="0.01"
              {...register("targetWin", { min: 0 })}
              className="w-full p-2 border rounded-md"
              placeholder="e.g., 500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Win ($)
            </label>
            <input
              type="number"
              step="0.01"
              {...register("maxWin", { min: 0 })}
              className="w-full p-2 border rounded-md"
              placeholder="e.g., 1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              RTP (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register("rtp", {
                required: "RTP is required",
                min: { value: 0, message: "RTP must be greater than 0" },
                max: { value: 1000, message: "RTP cannot exceed 1000%" },
              })}
              className={`w-full p-2 border rounded-md ${
                errors.rtp ? "border-red-500" : ""
              }`}
              placeholder="e.g., 96.5"
              disabled={isSubmitting}
            />
            {errors.rtp && (
              <p className="text-red-500 text-sm mt-1">{errors.rtp.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Geo Targets</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={geoInput}
              onChange={(e) => setGeoInput(e.target.value)}
              className="flex-1 p-2 border rounded-md"
              placeholder="Enter geo location (or leave empty for all)"
            />
            <button
              type="button"
              onClick={addGeo}
              className="px-4 py-2 bg-green-600 text-white rounded-md"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedGeos.map((geo) => (
              <span
                key={geo}
                className="px-2 py-1 bg-green-100 rounded-md flex items-center gap-2"
              >
                {geo}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedGeos(selectedGeos.filter((g) => g !== geo));
                  }}
                  className="text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Referral Codes
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value)}
              className="flex-1 p-2 border rounded-md"
              placeholder="Enter referral code (or leave empty for all)"
            />
            <button
              type="button"
              onClick={addReferral}
              className="px-4 py-2 bg-green-600 text-white rounded-md"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedReferrals.map((ref) => (
              <span
                key={ref}
                className="px-2 py-1 bg-green-100 rounded-md flex items-center gap-2"
              >
                {ref}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedReferrals(
                      selectedReferrals.filter((r) => r !== ref)
                    );
                  }}
                  className="text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 border rounded-md p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Preview</h3>
          <div className="bg-white p-4 rounded border">
            <div className="flex flex-wrap gap-4 mb-4">
              {formValues.casinoImage && (
                <div>
                  <p className="text-sm font-medium mb-2">Casino Image:</p>
                  <img
                    src={`/casino/${formValues.casinoImage}`}
                    alt={formValues.casinoName || "Casino"}
                    className="max-w-[200px] h-auto rounded border"
                  />
                </div>
              )}
              {formValues.slotImage && (
                <div>
                  <p className="text-sm font-medium mb-2">Slot Image:</p>
                  <img
                    src={`/sloticonssquare/${formValues.slotImage}`}
                    alt={formValues.slot || "Slot"}
                    className="max-w-[200px] h-auto rounded border"
                  />
                </div>
              )}
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {formattedMessage}
            </pre>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Creating Alert..." : "Create Alert"}
          </button>
        </div>
      </form>
    </div>
  );
}
