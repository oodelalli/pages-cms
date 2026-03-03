"use client";

import { forwardRef, useCallback, useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MediaUpload } from "@/components/media/media-upload";
import { MediaDialog } from "@/components/media/media-dialog";
import { Trash2, Upload, FolderOpen, ArrowUpRight, Edit2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useConfig } from "@/contexts/config-context";
import { extensionCategories, normalizePath } from "@/lib/utils/file";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import { getSchemaByName } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Thumbnail } from "@/components/thumbnail";
import { getAllowedExtensions } from "./index";

const generateId = () => uuidv4().slice(0, 8);

const AltTextModal = ({ 
  open, 
  onOpenChange, 
  file, 
  onSave,
  imagePath,
  mediaName
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: { path: string; alt: string };
  onSave: (alt: string) => void;
  imagePath: string;
  mediaName: string;
}) => {
  const [altText, setAltText] = useState(file.alt);
  const { config } = useConfig();

  useEffect(() => {
    setAltText(file.alt);
  }, [file.alt, open]);

  const handleSave = () => {
    onSave(altText);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Alt Text</DialogTitle>
          <DialogDescription>
            Describe this image for screen readers and SEO.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Thumbnail name={mediaName} path={imagePath} className="rounded-md w-24 h-24 flex-shrink-0"/>
            <div className="text-sm text-muted-foreground overflow-hidden">
              <p className="truncate">{imagePath.split('/').pop()}</p>
              <a 
                href={`https://github.com/${config?.owner}/${config?.repo}/blob/${config?.branch}/${imagePath}`}
                target="_blank"
                className="text-xs hover:underline inline-flex items-center gap-1"
              >
                View on GitHub
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="alt-text">Alt Text</Label>
            <Textarea
              id="alt-text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be descriptive but concise. Include important context that isn't in surrounding text.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ImageThumbnail = ({ 
  id, 
  file, 
  config, 
  media, 
  onRemove, 
  onEditAlt 
}: { 
  id: string;
  file: { path: string; alt: string };
  config: any;
  media: string;
  onRemove: (id: string) => void;
  onEditAlt: (id: string) => void;
}) => {
  const hasAlt = file.alt && file.alt.trim().length > 0;

  return (
    <div className="relative group">
      <Thumbnail name={media} path={file.path} className="rounded-md w-28 h-28"/>
      
      {/* Alt text status indicator */}
      <div className="absolute top-1.5 left-1.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "rounded-full p-1",
                hasAlt ? "bg-green-500/90" : "bg-amber-500/90"
              )}>
                {hasAlt ? (
                  <CheckCircle2 className="h-3 w-3 text-white" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-white" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {hasAlt ? "Alt text added" : "Alt text needed"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-1.5 right-1.5 flex opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-xs"
                variant="secondary"
                onClick={() => onEditAlt(id)}
                className="rounded-r-none"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Edit alt text
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-xs"
                variant="secondary"
                onClick={() => onRemove(id)}
                className="rounded-l-none"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Remove
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

const SortableItem = ({ 
  id, 
  file, 
  config, 
  media, 
  onRemove, 
  onEditAlt 
}: { 
  id: string;
  file: { path: string; alt: string };
  config: any;
  media: string;
  onRemove: (id: string) => void;
  onEditAlt: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ImageThumbnail 
        id={id}
        file={file}
        config={config}
        media={media}
        onRemove={onRemove}
        onEditAlt={onEditAlt}
      />
    </div>
  );
};

const EditComponent = forwardRef((props: any, ref: React.Ref<HTMLInputElement>) => {
  const { value, field, onChange } = props;
  const { config } = useConfig();
  
  const [files, setFiles] = useState<Array<{ id: string, path: string, alt: string }>>(() => 
    value
      ? Array.isArray(value)
        ? value.map((item: any) => ({ 
            id: generateId(), 
            path: typeof item === 'string' ? item : item.path,
            alt: typeof item === 'string' ? '' : (item.alt || '')
          }))
        : [{ 
            id: generateId(), 
            path: typeof value === 'string' ? value : value.path,
            alt: typeof value === 'string' ? '' : (value.alt || '')
          }]
      : []
  );

  const [editingFileId, setEditingFileId] = useState<string | null>(null);

  const mediaConfig = useMemo(() => {
    return (config?.object?.media?.length && field.options?.media !== false)
      ? field.options?.media && typeof field.options.media === 'string'
        ? getSchemaByName(config.object, field.options.media, "media")
        : config.object.media[0]
      : undefined;
  }, [field.options?.media, config?.object]);

  const rootPath = useMemo(() => {
    if (!field.options?.path) {
      return mediaConfig?.input;
    }

    const normalizedPath = normalizePath(field.options.path);
    const normalizedMediaPath = normalizePath(mediaConfig?.input);

    if (!normalizedPath.startsWith(normalizedMediaPath)) {
      console.warn(`"${field.options.path}" is not within media root "${mediaConfig?.input}". Defaulting to media root.`);
      return mediaConfig?.input;
    }

    return normalizedPath;
  }, [field.options?.path, mediaConfig?.input]);

  const allowedExtensions = useMemo(() => {
    if (!mediaConfig) return [];
    return getAllowedExtensions(field, mediaConfig);
  }, [field, mediaConfig]);

  const isMultiple = useMemo(() => 
    !!field.options?.multiple,
    [field.options?.multiple]
  );

  const remainingSlots = useMemo(() => 
    field.options?.multiple
      ? (typeof field.options.multiple === 'object' && field.options.multiple.max)
        ? field.options.multiple.max - files.length
        : Infinity
      : 1 - files.length,
    [field.options?.multiple, files.length]
  );

  const editingFile = useMemo(() => 
    editingFileId ? files.find(f => f.id === editingFileId) : null,
    [editingFileId, files]
  );

  useEffect(() => {
    if (isMultiple) {
      onChange(files.map(f => ({ path: f.path, alt: f.alt })));
    } else {
      onChange(files[0] ? { path: files[0].path, alt: files[0].alt } : null);
    }
  }, [files, isMultiple, onChange]);

  const handleUpload = useCallback((fileData: any) => {
    if (!config) return;
    
    const newFile = { id: generateId(), path: fileData.path, alt: '' };
    
    if (isMultiple) {
      setFiles(prev => [...prev, newFile]);
    } else {
      setFiles([newFile]);
    }
  }, [isMultiple, config]);

  const handleRemove = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  const handleEditAlt = useCallback((fileId: string) => {
    setEditingFileId(fileId);
  }, []);

  const handleSaveAlt = useCallback((fileId: string, newAlt: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, alt: newAlt } : file
    ));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSelected = useCallback((newPaths: string[]) => {
    if (newPaths.length === 0) {
      setFiles([]);
    } else {
      const newFiles = newPaths.map(path => ({
        id: generateId(),
        path,
        alt: ''
      }));
      
      if (isMultiple) {
        setFiles(prev => [...prev, ...newFiles]);
      } else {
        setFiles([newFiles[0]]);
      }
    }
  }, [isMultiple]);

  if (!mediaConfig) {
    return (
      <p className="text-muted-foreground bg-muted rounded-md px-3 py-2">
        No media configuration found. {' '}
        <a 
          href={`/${config?.owner}/${config?.repo}/${encodeURIComponent(config?.branch || "")}/settings`}
          className="underline hover:text-foreground"
        >
          Check your settings
        </a>.
      </p>
    );
  }

  return (
    <>
      <MediaUpload path={rootPath} media={mediaConfig.name} extensions={allowedExtensions || undefined} onUpload={handleUpload} multiple={isMultiple}>
        <MediaUpload.DropZone>
          <div className="space-y-2">
            {files.length > 0 && (
              isMultiple ? (
                <div className="flex flex-wrap gap-2">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={files.map(f => f.id)}
                      strategy={rectSortingStrategy}
                    >
                      {files.map((file) => (
                        <SortableItem 
                          key={file.id}
                          id={file.id}
                          file={{ path: file.path, alt: file.alt }}
                          config={config}
                          media={mediaConfig.name}
                          onRemove={handleRemove}
                          onEditAlt={handleEditAlt}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              ) : (
                <ImageThumbnail 
                  id={files[0].id}
                  file={{ path: files[0].path, alt: files[0].alt }}
                  config={config}
                  media={mediaConfig.name}
                  onRemove={handleRemove}
                  onEditAlt={handleEditAlt}
                />
              )
            )}
            {remainingSlots > 0 && (
              <div className="flex gap-2">
                <MediaUpload.Trigger>
                  <Button type="button" size="sm" variant="outline" className="gap-2">
                    <Upload className="h-3.5 w-3.5"/>
                    Upload
                  </Button>
                </MediaUpload.Trigger>
                <TooltipProvider>
                  <Tooltip>
                    <MediaDialog
                      media={mediaConfig.name}
                      initialPath={rootPath}
                      maxSelected={remainingSlots}
                      extensions={allowedExtensions}
                      onSubmit={handleSelected}
                    >
                      <TooltipTrigger asChild>
                        <Button type="button" size="icon-sm" variant="outline">
                          <FolderOpen className="h-3.5 w-3.5"/>
                        </Button>
                      </TooltipTrigger>
                    </MediaDialog>
                    <TooltipContent>
                      Select from media
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </MediaUpload.DropZone>
      </MediaUpload>

      {editingFile && (
        <AltTextModal
          open={!!editingFileId}
          onOpenChange={(open) => !open && setEditingFileId(null)}
          file={editingFile}
          onSave={(alt) => handleSaveAlt(editingFileId!, alt)}
          imagePath={editingFile.path}
          mediaName={mediaConfig.name}
        />
      )}
    </>
  );
});

EditComponent.displayName = "EditComponent";

export { EditComponent };
