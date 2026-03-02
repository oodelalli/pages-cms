"use client";

import { useMemo } from "react";
import { Thumbnail } from "@/components/thumbnail";
import { Field } from "@/types/field";
import { useConfig } from "@/contexts/config-context";

type ImageAltValue = { path: string; alt: string };

const ViewComponent = ({
  value,
  field
}: {
  value: ImageAltValue | ImageAltValue[];
  field: Field;
}) => {
  const extraValuesCount = value && Array.isArray(value) ? value.length - 1 : 0;

  const path = useMemo(() => {
    if (!value) return null;
    
    if (Array.isArray(value)) {
      return value[0]?.path || null;
    }
    
    return typeof value === 'object' ? value.path : null;
  }, [value]);

  const { config } = useConfig();

  const mediaName = field.options?.media || config?.object.media?.[0]?.name;

  return (
    <span className="flex items-center gap-x-1.5">
      <Thumbnail name={mediaName} path={path} className="w-8 rounded-md"/>
      {extraValuesCount > 0 && (
        <span className="text-muted-foreground text-xs">
          +{extraValuesCount}
        </span>
      )}
    </span>
  );
}

export { ViewComponent };
