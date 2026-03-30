import { z, ZodIssueCode } from "zod";
import { ViewComponent } from "./view-component";
import { EditComponent } from "./edit-component";
import { Field } from "@/types/field";
import { swapPrefix } from "@/lib/github-image";
import { getSchemaByName } from "@/lib/schema";
import { getFileExtension, extensionCategories } from "@/lib/utils/file";

type ImageAltValue = { path: string; alt: string };

// TODO: sanitize/normalize values on read (e.g. array to string, empty/invalid values)
const read = (value: any, field: Field, config: Record<string, any>): ImageAltValue | ImageAltValue[] | null => {
  if (!value) return null;
  if (Array.isArray(value) && !value.length) return null;

  const mediaConfig = (config?.object?.media?.length && field.options?.media !== false)
    ? field.options?.media && typeof field.options.media === 'string'
      ? getSchemaByName(config.object, field.options.media, "media")
      : config.object.media[0]
    : undefined;

  if (!mediaConfig) return value;

  if (Array.isArray(value)) {
    return value.map(v => read(v, field, config)) as ImageAltValue[];
  }

  // Handle the object structure
  if (typeof value === 'object' && value.path) {
    return {
      path: swapPrefix(value.path, mediaConfig.output, mediaConfig.input, true),
      alt: value.alt || ''
    };
  }

  return value;
};

const write = (value: any, field: Field, config: Record<string, any>): ImageAltValue | ImageAltValue[] | null => {
  if (!value) return null;
  if (Array.isArray(value) && !value.length) return null;

  const mediaConfig = (config?.object?.media?.length && field.options?.media !== false)
    ? field.options?.media && typeof field.options.media === 'string'
      ? getSchemaByName(config.object, field.options.media, "media")
      : config.object.media[0]
    : undefined;

  if (!mediaConfig) return value;

  if (Array.isArray(value)) {
    return value.map(v => write(v, field, config)) as ImageAltValue[];
  }

  // Handle the object structure
  if (typeof value === 'object' && value.path) {
    return {
      path: swapPrefix(value.path, mediaConfig.input, mediaConfig.output),
      alt: value.alt || ''
    };
  }

  return value;
};

const getAllowedExtensions = (field: Field, mediaConfig: any): string[] | undefined => {
  const baseExtensions = [...(extensionCategories['image'] || [])];

  if (!mediaConfig) return baseExtensions;
  if (!field.options?.extensions && !field.options?.categories) return mediaConfig?.extensions || baseExtensions;

  let extensions = baseExtensions;

  if (field.options?.extensions && Array.isArray(field.options?.extensions)) {
    extensions = [...field.options?.extensions];
  } else if (Array.isArray(field.options?.categories)) {
    extensions = field.options?.categories.flatMap(
      (category: string) => extensionCategories[category] || []
    );
  } else if (mediaConfig?.extensions && Array.isArray(mediaConfig.extensions)) {
    extensions = [...mediaConfig.extensions];
  }

  if (extensions.length > 0 && mediaConfig?.extensions && Array.isArray(mediaConfig.extensions)) {
    extensions = extensions.filter(ext => mediaConfig.extensions.includes(ext));
  }

  return extensions;
};

const schema = (field: Field, configObject?: Record<string, any>) => {
  const mediaConfig = configObject && (field.options?.media === false
    ? undefined
    : field.options?.media && typeof field.options.media === 'string'
      ? getSchemaByName(configObject, field.options.media, "media")
      : configObject.media?.[0]);
  const mediaInputPath = mediaConfig?.input;
  const allowedExtensions = getAllowedExtensions(field, mediaConfig);
  let zodSchema: z.ZodTypeAny;

  const isMultiple = !!field.options?.multiple;

  // Define the object schema with path and alt
  const imageAltSchema = z.object({
    path: z.string(),
    alt: z.string()
  });

  zodSchema = isMultiple
    ? z.array(imageAltSchema).optional().nullable()
    : imageAltSchema.optional().nullable();

  zodSchema = zodSchema.superRefine((data, ctx) => {
    let isEmpty = false;
    let hasEmptyElementInArray = false;

    if (isMultiple) {
      isEmpty = data === null || data === undefined || data.length === 0;
      if (Array.isArray(data) && data.length > 0) {
        hasEmptyElementInArray = data.some(item =>
          typeof item === 'object' && (!item.path || item.path === "")
        );
      }
    } else {
      isEmpty = data === null || data === undefined ||
        (typeof data === 'object' && (!data.path || data.path === ""));
    }

    if (field.required && isEmpty) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "This field is required",
      });
    }

    if (isMultiple && hasEmptyElementInArray) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: "Image path cannot be empty within the list.",
      });
      return;
    }

    if (isEmpty) return;

    // Path and extension checks
    const checkImageAlt = (item: unknown) => {
      if (typeof item !== 'object' || !item || !('path' in item)) return;

      const path = (item as ImageAltValue).path;
      const alt = (item as ImageAltValue).alt;

      if (typeof path !== 'string' || path === "") return;

      // Path Prefix Check
      if (mediaInputPath && !path.startsWith(mediaInputPath)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: `Path must start with the media directory: ${mediaInputPath}`
        });
      }

      // Extension Check
      const fileExtension = getFileExtension(path);
      if (allowedExtensions && allowedExtensions.length > 0) {
        if (!allowedExtensions.includes(fileExtension)) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            message: `Invalid file extension '.${fileExtension}'. Allowed: ${allowedExtensions.map((e: string) => `.${e}`).join(', ')}`
          });
        }
      }

      // Alt text validation
      if (field.required && (!alt || alt.trim() === "")) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          message: "Alt text is required"
        });
      }
    };

    // Apply checks to array elements or single object
    if (isMultiple && Array.isArray(data)) {
      data.forEach(checkImageAlt);
    } else if (!isMultiple) {
      checkImageAlt(data);
    }
  });

  return zodSchema;
};

const defaultValue = (field: Field) => {
  return field.options?.multiple ? [] : null;
};

const label = "Image with Alt";

export { label, schema, ViewComponent, EditComponent, read, write, defaultValue, getAllowedExtensions };
