import { useEffect } from "react";
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import { z } from "zod";
import { Button } from "../../components/button/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/dialog/Dialog";
import { Field, FieldError, FieldLabel } from "../../components/input/Field";
import { Input } from "../../components/input/Input";

export const DAY_OPTIONS = [
  { value: "MONDAY", label: "Segunda" },
  { value: "TUESDAY", label: "Terça" },
  { value: "WEDNESDAY", label: "Quarta" },
  { value: "THURSDAY", label: "Quinta" },
  { value: "FRIDAY", label: "Sexta" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
] as const;

export const DayOfWeekApiValues = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type DayOfWeekApiEnum = (typeof DayOfWeekApiValues)[number];

export const recurrenceSchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    allowedDays: z.array(z.enum(DayOfWeekApiValues)).optional(),
    intervalValue: z.string().optional(),
    dailyDisplayCount: z.string().optional(),
  })
  .optional();

type RecurrenceFormProps<TFormValues extends FieldValues> = {
  form: UseFormReturn<TFormValues>;
  basePath?: Path<TFormValues> | "";
  title?: string;
  triggerText?: string;
  contentClassName?: string;
};

export function RecurrenceForm<TFormValues extends FieldValues>({
  form,
  basePath = "" as Path<TFormValues> | "",
  title = "Recorrência",
  triggerText = "Editar recorrência",
  contentClassName,
}: RecurrenceFormProps<TFormValues>) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const withBase = (suffix: string) =>
    (basePath ? `${String(basePath)}.${suffix}` : suffix) as Path<TFormValues>;

  const startDatePath = withBase("recurrence.startDate");
  const endDatePath = withBase("recurrence.endDate");
  const allowedDaysPath = withBase("recurrence.allowedDays");
  const intervalPath = withBase("recurrence.intervalValue");
  const dailyDisplayCountPath = withBase("recurrence.dailyDisplayCount");

  const allowedDays =
    (watch(allowedDaysPath) as unknown as DayOfWeekApiEnum[] | undefined) ?? [];

  const allowedDaysSet = new Set<DayOfWeekApiEnum>(allowedDays);

  const toggleDay = (day: DayOfWeekApiEnum) => {
    const next = new Set(allowedDaysSet);
    if (next.has(day)) next.delete(day);
    else next.add(day);

    setValue(
      allowedDaysPath,
      Array.from(next) as PathValue<TFormValues, typeof allowedDaysPath>,
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
  };

  const allowedDaysError = (() => {
    const recurrenceErrors = (errors as any)?.recurrence;
    return recurrenceErrors?.allowedDays?.message as string | undefined;
  })();
  useEffect(() => {
    form.register(allowedDaysPath);
  }, [form, allowedDaysPath]);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="default">
          {triggerText}
        </Button>
      </DialogTrigger>

      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <Field className="col-span-2">
            <FieldLabel>Recorrência (Início)</FieldLabel>
            <Input type="date" {...register(startDatePath)} />
          </Field>

          <Field className="col-span-2">
            <FieldLabel>Recorrência (Fim)</FieldLabel>
            <Input type="date" {...register(endDatePath)} />
          </Field>

          <Field className="col-span-2">
            <FieldLabel>Dias permitidos</FieldLabel>

            <div className="flex flex-wrap gap-2 rounded-md border p-2">
              {DAY_OPTIONS.map((d) => {
                const checked = allowedDaysSet.has(d.value);
                return (
                  <label
                    key={d.value}
                    className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDay(d.value)}
                    />
                    <span>{d.label}</span>
                  </label>
                );
              })}
            </div>

            {allowedDaysError && <FieldError>{allowedDaysError}</FieldError>}
          </Field>

          <Field className="col-span-1">
            <FieldLabel>Intervalo (em dias)</FieldLabel>
            <Input
              {...register(intervalPath)}
              inputMode="numeric"
              placeholder="1"
            />
          </Field>

          <Field className="col-span-1">
            <FieldLabel>Exibições por dia</FieldLabel>
            <Input
              {...register(dailyDisplayCountPath)}
              inputMode="numeric"
              placeholder="1"
            />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
