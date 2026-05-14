"use client";

import type {
  ChangeEvent,
  InputHTMLAttributes,
  TextareaHTMLAttributes
} from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { inputClass, textareaClass } from "@/components/form-controls";

type CharacterCountProps = {
  value: string;
  max: number;
  min?: number;
  className?: string;
  id?: string;
};

function toInputText(value: InputHTMLAttributes<HTMLInputElement>["value"]): string {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

function toTextareaText(value: TextareaHTMLAttributes<HTMLTextAreaElement>["value"]): string {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

export function CharacterCount({
  value,
  max,
  min,
  className,
  id
}: CharacterCountProps) {
  const isUnderMin = typeof min === "number" && value.length > 0 && value.length < min;
  const isOverMax = value.length > max;

  return (
    <span
      aria-live="polite"
      className={`mt-2 block text-xs leading-5 ${
        isUnderMin || isOverMax ? "text-accent" : "text-muted"
      }${className ? ` ${className}` : ""}`}
      id={id}
    >
      {value.length} / {max}
    </span>
  );
}

type LimitedInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "maxLength" | "minLength" | "value"
> & {
  defaultValue?: string;
  maxLength: number;
  minLength?: number;
  value?: string;
};

export function LimitedInput({
  className = inputClass,
  defaultValue,
  maxLength,
  minLength,
  onChange,
  value,
  ...props
}: LimitedInputProps) {
  const counterId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const initialValue = useMemo(() => toInputText(defaultValue), [defaultValue]);
  const [localValue, setLocalValue] = useState(initialValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : localValue;
  const describedBy = [props["aria-describedby"], counterId].filter(Boolean).join(" ") || undefined;

  useEffect(() => {
    const form = inputRef.current?.form;

    if (!form || isControlled) {
      return;
    }

    const handleReset = () => {
      window.setTimeout(() => setLocalValue(initialValue), 0);
    };

    form.addEventListener("reset", handleReset);

    return () => {
      form.removeEventListener("reset", handleReset);
    };
  }, [initialValue, isControlled]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isControlled) {
      setLocalValue(event.target.value);
    }

    onChange?.(event);
  }

  return (
    <>
      <input
        {...props}
        aria-describedby={describedBy}
        className={className}
        maxLength={maxLength}
        minLength={minLength}
        onChange={handleChange}
        ref={inputRef}
        value={currentValue}
      />
      <CharacterCount id={counterId} max={maxLength} min={minLength} value={currentValue} />
    </>
  );
}

type LimitedTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "defaultValue" | "maxLength" | "minLength" | "value"
> & {
  defaultValue?: string;
  maxLength: number;
  minLength?: number;
  value?: string;
};

export function LimitedTextarea({
  className = textareaClass,
  defaultValue,
  maxLength,
  minLength,
  onChange,
  value,
  ...props
}: LimitedTextareaProps) {
  const counterId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialValue = useMemo(() => toTextareaText(defaultValue), [defaultValue]);
  const [localValue, setLocalValue] = useState(initialValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : localValue;
  const describedBy = [props["aria-describedby"], counterId].filter(Boolean).join(" ") || undefined;

  useEffect(() => {
    const form = textareaRef.current?.form;

    if (!form || isControlled) {
      return;
    }

    const handleReset = () => {
      window.setTimeout(() => setLocalValue(initialValue), 0);
    };

    form.addEventListener("reset", handleReset);

    return () => {
      form.removeEventListener("reset", handleReset);
    };
  }, [initialValue, isControlled]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    if (!isControlled) {
      setLocalValue(event.target.value);
    }

    onChange?.(event);
  }

  return (
    <>
      <textarea
        {...props}
        aria-describedby={describedBy}
        className={className}
        maxLength={maxLength}
        minLength={minLength}
        onChange={handleChange}
        ref={textareaRef}
        value={currentValue}
      />
      <CharacterCount id={counterId} max={maxLength} min={minLength} value={currentValue} />
    </>
  );
}
