"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { WeeklyScheduleGrid } from "./WeeklyScheduleGrid";
import { MemberCreateSchema } from "@/lib/validators";

type FormValues = z.infer<typeof MemberCreateSchema>;

const DEFAULT_SCHEDULE = {
  mon: "onsite", tue: "onsite", wed: "onsite",
  thu: "onsite", fri: "onsite", sat: "dayoff", sun: "dayoff",
} as const;

const SKILL_OPTIONS = [
  { value: "Junior", label: "Junior" },
  { value: "Mid-level", label: "Mid-level" },
  { value: "Senior", label: "Senior" },
  { value: "Lead", label: "Lead" },
];

const TEAM_OPTIONS = [
  { value: "Backend", label: "Backend" },
  { value: "Frontend", label: "Frontend" },
  { value: "DevOps", label: "DevOps" },
  { value: "QA / Testing", label: "QA / Testing" },
  { value: "Mobile", label: "Mobile" },
  { value: "Data / Analytics", label: "Data / Analytics" },
  { value: "Full Stack", label: "Full Stack" },
  { value: "Other", label: "Other (specify below)" },
];

const SHIFT_OPTIONS = [
  { value: "Day Shift", label: "Day Shift (8AM–5PM)" },
  { value: "Afternoon Shift", label: "Afternoon Shift (2PM–11PM)" },
  { value: "Night Shift", label: "Night Shift (10PM–7AM)" },
];

const PROJECT_OPTIONS = [
  { value: "0", label: "0 — None" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3+" },
];

interface ProfileFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => Promise<void>;
}

export function ProfileForm({ defaultValues, onSubmit }: ProfileFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(MemberCreateSchema),
    defaultValues: {
      skillLevel: "Mid-level",
      primaryTeam: "Backend",
      shift: "Day Shift",
      weeklySchedule: DEFAULT_SCHEDULE,
      activeProjectCount: 0,
      isAdmin: false,
      ...defaultValues,
    },
  });

  const primaryTeam = watch("primaryTeam");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input
        label="Full Name"
        placeholder="Juan dela Cruz"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Email"
        type="email"
        placeholder="juan@company.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <Controller
        name="skillLevel"
        control={control}
        render={({ field }) => (
          <Select
            label="Skill Level"
            options={SKILL_OPTIONS}
            error={errors.skillLevel?.message}
            {...field}
          />
        )}
      />

      <Controller
        name="primaryTeam"
        control={control}
        render={({ field }) => (
          <Select
            label="Team / Specialization"
            options={TEAM_OPTIONS}
            error={errors.primaryTeam?.message}
            {...field}
          />
        )}
      />

      {primaryTeam === "Other" && (
        <Input
          label="Specify Team"
          placeholder="e.g. Platform Engineering"
          error={errors.otherTeamName?.message}
          {...register("otherTeamName")}
        />
      )}

      <Controller
        name="shift"
        control={control}
        render={({ field }) => (
          <Select
            label="Shift"
            options={SHIFT_OPTIONS}
            error={errors.shift?.message}
            {...field}
          />
        )}
      />

      <Controller
        name="weeklySchedule"
        control={control}
        render={({ field }) => (
          <WeeklyScheduleGrid value={field.value} onChange={field.onChange} />
        )}
      />

      <Controller
        name="activeProjectCount"
        control={control}
        render={({ field }) => (
          <Select
            label="Active Projects"
            options={PROJECT_OPTIONS}
            error={errors.activeProjectCount?.message}
            value={String(field.value)}
            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
          />
        )}
      />

      <Button type="submit" loading={isSubmitting} className="mt-2">
        Save Profile
      </Button>
    </form>
  );
}
