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

export default function AlertManager() {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AlertFormData>();
  const [geoInput, setGeoInput] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [selectedGeos, setSelectedGeos] = useState<string[]>([]);
  const [selectedReferrals, setSelectedReferrals] = useState<string[]>([]);
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const selectedCasinoId = watch("casinoId");

  // Fetch casinos on component mount
  useEffect(() => {
    const fetchCasinos = async () => {
      try {
        const response = await fetch("/api/casinos");
        const data = await response.json();
        setCasinos(data);
      } catch (error) {
        console.error("Failed to fetch casinos:", error);
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
      } catch (error) {
        console.error("Failed to fetch slots:", error);
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
      return;
    }

    const selectedCasino = casinos.find(
      (c) => c.id === Number(selectedCasinoId)
    );
    if (selectedCasino) {
      setValue("casinoName", selectedCasino.name);
      setValue("casinoCleanName", selectedCasino.cleanName);
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
      setValue("slotImage", selectedSlot.image);
    }
  }, [selectedSlotName, slots, setValue]);

  const onSubmit = async (data: AlertFormData) => {
    setIsLoading(true);
    try {
      await createAlert({
        ...data,
        geoTargets: selectedGeos,
        referralCodes: selectedReferrals,
      });
      reset();
      setSelectedGeos([]);
      setSelectedReferrals([]);
      setGeoInput("");
      setReferralInput("");
    } catch (error) {
      console.error("Failed to create alert:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addGeo = () => {
    if (geoInput && !selectedGeos.includes(geoInput)) {
      setSelectedGeos([...selectedGeos, geoInput]);
      setGeoInput("");
    }
  };

  const addReferral = () => {
    if (referralInput && !selectedReferrals.includes(referralInput)) {
      setSelectedReferrals([...selectedReferrals, referralInput]);
      setReferralInput("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create Alert</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            {...register("message", { required: "Message is required" })}
            className="w-full p-2 border rounded-md"
            rows={4}
          />
          {errors.message && (
            <p className="text-red-500 text-sm mt-1">
              {errors.message.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Casino</label>
          <select
            {...register("casinoId")}
            className="w-full p-2 border rounded-md"
            onChange={(e) => {
              register("casinoId").onChange(e);
              setValue("slot", "");
            }}
          >
            <option value="">Select a casino...</option>
            {casinos.map((casino) => (
              <option key={casino.id} value={casino.id}>
                {casino.name} ({casino.software})
              </option>
            ))}
          </select>
        </div>

        {selectedCasinoId && slots.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Slot Machine ({slots.length} available)
            </label>
            <select
              {...register("slot")}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a slot machine...</option>
              {slots.map((slot, index) => (
                <option key={`${slot.name}-${index}`} value={slot.name}>
                  {slot.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Custom URL (Optional)
          </label>
          <input
            type="url"
            {...register("customUrl")}
            className="w-full p-2 border rounded-md"
            placeholder="https://example.com/custom-slot-url"
          />
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
            <label className="block text-sm font-medium mb-2">RTP (%)</label>
            <input
              type="number"
              step="0.01"
              {...register("rtp", { min: 0, max: 100 })}
              className="w-full p-2 border rounded-md"
              placeholder="e.g., 96.5"
            />
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
                  onClick={() =>
                    setSelectedGeos(selectedGeos.filter((g) => g !== geo))
                  }
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
                  onClick={() =>
                    setSelectedReferrals(
                      selectedReferrals.filter((r) => r !== ref)
                    )
                  }
                  className="text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Time</label>
            <input
              type="datetime-local"
              {...register("startTime", { required: "Start time is required" })}
              className="w-full p-2 border rounded-md"
            />
            {errors.startTime && (
              <p className="text-red-500 text-sm mt-1">
                {errors.startTime.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Time</label>
            <input
              type="datetime-local"
              {...register("endTime", { required: "End time is required" })}
              className="w-full p-2 border rounded-md"
            />
            {errors.endTime && (
              <p className="text-red-500 text-sm mt-1">
                {errors.endTime.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Alert"}
        </button>
      </form>
    </div>
  );
}
