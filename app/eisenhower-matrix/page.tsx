"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  useDroppable,
  MeasuringStrategy,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { supabase } from "@/lib/supabaseClient";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  GripVertical,
  Calendar as CalendarIcon,
  Pencil,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Globe,
  CheckCircleIcon,
  ClockIcon,
  ClockAlert,
} from "lucide-react";
import {
  format,
  isSameDay,
  isSameMonth,
  // parseISO,
} from "date-fns";
// import { de } from "date-fns/locale"; // If you want a German format
import { Button } from "@/components/ui/button";

// IMPORTANT: your mobile detection hook
import { useIsMobile } from "@/hooks/useIsMobile";
import { ViewGridIcon } from "@heroicons/react/solid";

type Task = {
  id: number;
  title: string;
  description?: string;
  quadrant: string;
  position: number;
  done: boolean;
  completed_at?: string | null;
  due_date?: string | null;
  created_at?: string | null;
};

const quadrantsEn = [
  { id: "urgent-important", title: "Urgent & Important" },
  { id: "urgent-not-important", title: "Urgent, Not Important" },
  { id: "not-urgent-important", title: "Not Urgent, Important" },
  { id: "not-urgent-not-important", title: "Not Urgent, Not Important" },
];

const quadrantsDe = [
  { id: "urgent-important", title: "Dringend & Wichtig" },
  { id: "urgent-not-important", title: "Dringend, Nicht Wichtig" },
  { id: "not-urgent-important", title: "Nicht Dringend, Wichtig" },
  {
    id: "not-urgent-not-important",
    title: "Nicht Dringend, Nicht Wichtig",
  },
];

const quadrantStyles: Record<string, string> = {
  "urgent-important":
    "bg-gradient-to-br from-red-300 via-red-200 to-red-100 dark:from-red-900 dark:via-red-800 dark:to-red-700",
  "urgent-not-important":
    "bg-gradient-to-br from-yellow-300 via-yellow-200 to-yellow-100 dark:from-yellow-900 dark:via-yellow-800 dark:to-yellow-700",
  "not-urgent-important":
    "bg-gradient-to-br from-blue-300 via-blue-200 to-blue-100 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700",
  "not-urgent-not-important":
    "bg-gradient-to-br from-green-300 via-green-200 to-green-100 dark:from-green-900 dark:via-green-800 dark:to-green-700",
};

const quadrantTextColors: Record<string, string> = {
  "urgent-important": "text-red-600 dark:text-red-400",
  "urgent-not-important": "text-yellow-600 dark:text-yellow-400",
  "not-urgent-important": "text-blue-600 dark:text-blue-400",
  "not-urgent-not-important": "text-green-600 dark:text-green-400",
};

// Animation Configuration
const animationConfig = {
  easing: [0.4, 0, 0.2, 1],
  duration: 0.3,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      ...animationConfig,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      ...animationConfig,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { ...animationConfig },
  },
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { ...animationConfig },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

const dropdownVariants = {
  closed: {
    opacity: 0,
    height: 0,
    transition: { ...animationConfig },
  },
  open: {
    opacity: 1,
    height: "auto",
    transition: {
      ...animationConfig,
      staggerChildren: 0.03,
    },
  },
};

const dropdownItemVariants = {
  closed: { opacity: 0, y: -10 },
  open: {
    opacity: 1,
    y: 0,
    transition: { ...animationConfig },
  },
};

const popoverVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...animationConfig },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { ...animationConfig },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...animationConfig },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { ...animationConfig },
  },
};

// A wrapper droppable + sortable container for each quadrant
function DroppableZone({
  id,
  title,
  tasks,
  children,
}: {
  id: string;
  title: string;
  tasks: Task[];
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <SortableContext
      id={id}
      items={tasks.map((t) => t.id.toString())}
      strategy={verticalListSortingStrategy}
    >
      <motion.div
        ref={setNodeRef}
        variants={itemVariants}
        className={`p-4 rounded-3xl ${quadrantStyles[id]} min-h-[220px] border border-gray-200/70 dark:border-gray-800/70 shadow-xl`}
        whileHover={{ scale: 1.015 }}
        animate={{ scale: isOver ? 1.015 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center text-gray-900 dark:text-gray-100 tracking-tight">
          {title}
        </h2>
        <div className="space-y-3">{children}</div>
      </motion.div>
    </SortableContext>
  );
}

/** SortableTask: DnD wrapper that delegates actual rendering to DraggableTask. */
function SortableTask({
  task,
  onToggle,
  onDelete,
  onUpdate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  displayAllInfos,
  language,
  isActive,
}: {
  task: Task;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
  onUpdate: (task: Task) => void;
  onMoveUp: (task: Task) => void;
  onMoveDown: (task: Task) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  displayAllInfos?: boolean;
  language: "en" | "de";
  isActive?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : undefined,
    opacity: isActive ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <DraggableTask
        task={task}
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        displayAllInfos={displayAllInfos}
        language={language}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  );
}

/**
 * DraggableTask: The actual "Task" UI with Collapsible + hover tooltip.
 */
function DraggableTask({
  task,
  onToggle,
  onDelete,
  onUpdate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  displayAllInfos = false,
  language,
  dragListeners,
  dragAttributes,
}: {
  task: Task;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
  onUpdate: (task: Task) => void;
  onMoveUp: (task: Task) => void;
  onMoveDown: (task: Task) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  displayAllInfos?: boolean;
  language: "en" | "de";
  dragListeners?: never;
  dragAttributes?: never;
}) {
  const [isOpen, setIsOpen] = useState(false); // Collapsible open state
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [date, setDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  );
  const [displayedMonth, setDisplayedMonth] = useState<Date>(
    date || new Date()
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // For hover/click tooltip
  const isMobile = useIsMobile();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate)
      return language === "en" ? "No due date" : "Kein Fälligkeitsdatum";
    return new Date(dueDate).toLocaleDateString();
  };

  // Collapsible logic: combine "displayAllInfos" + isOpen
  const shouldShowDetails = displayAllInfos || isOpen;

  // Toggle tooltip on mobile tap
  const handleMobileTap = () => {
    if (isMobile) {
      setTooltipOpen((prev) => !prev);
    }
  };

  // Save edited
  const handleSave = async () => {
    if (!editedTask.title.trim()) return;
    const updatedTask = {
      ...editedTask,
      due_date: date ? format(date, "yyyy-MM-dd") : null,
    };
    await onUpdate(updatedTask);
    setIsEditing(false);
  };

  // Cancel editing
  const handleCancel = () => {
    setEditedTask(task);
    setDate(task.due_date ? new Date(task.due_date) : undefined);
    setIsEditing(false);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setIsPopoverOpen(false);
  };

  const handleClearDate = () => {
    setDate(undefined);
    setIsPopoverOpen(false);
  };

  const modifiers = {
    currentMonth: (d: Date) => isSameMonth(d, displayedMonth),
    selected: (d: Date) => (date ? isSameDay(d, date) : false),
  };
  const modifiersClassNames = {
    currentMonth:
      "border-2 border-indigo-600 hover:border-gray-300 text-indigo-600 rounded-full",
    selected: "bg-indigo-500 text-white rounded-full",
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Wrap everything in a relative group for the hover tooltip */}
      <div className="relative group" onClick={handleMobileTap}>
        <Card className="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200/70 dark:border-gray-800/70">
          <Collapsible open={shouldShowDetails} onOpenChange={setIsOpen}>
            <CardContent className="p-4">
              {/* EDIT MODE */}
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={editedTask.title}
                      onChange={(e) =>
                        setEditedTask({ ...editedTask, title: e.target.value })
                      }
                      className="flex-1 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <motion.button
                      variants={buttonVariants}
                      initial="initial"
                      whileHover="hover"
                      whileTap="tap"
                      onClick={handleSave}
                      className="p-2 text-green-500 hover:text-green-600 dark:hover:text-green-400"
                    >
                      <Check className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      variants={buttonVariants}
                      initial="initial"
                      whileHover="hover"
                      whileTap="tap"
                      onClick={handleCancel}
                      className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </div>
                  <Input
                    value={editedTask.description || ""}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        description: e.target.value,
                      })
                    }
                    placeholder={
                      language === "en" ? "Description" : "Beschreibung"
                    }
                    className="border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 w-full"
                  />

                  {/* Date picker popover */}
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <motion.button
                        variants={buttonVariants}
                        initial="initial"
                        whileHover="hover"
                        whileTap="tap"
                        className="w-full flex items-center justify-start text-left font-normal border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        {date ? (
                          format(date, "PPP")
                        ) : (
                          <span>
                            {language === "en"
                              ? "Pick a date"
                              : "Datum auswählen"}
                          </span>
                        )}
                      </motion.button>
                    </PopoverTrigger>
                    <AnimatePresence>
                      {isPopoverOpen && (
                        <PopoverContent className="w-auto p-0 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl shadow-xl">
                          <motion.div
                            variants={popoverVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="p-4"
                          >
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={handleDateSelect}
                              month={displayedMonth}
                              onMonthChange={setDisplayedMonth}
                              initialFocus
                              className="rounded-xl border-none"
                              modifiers={modifiers}
                              modifiersClassNames={modifiersClassNames}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleClearDate}
                              className="mt-2 w-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              {language === "en"
                                ? "Clear Date"
                                : "Datum löschen"}
                            </Button>
                          </motion.div>
                        </PopoverContent>
                      )}
                    </AnimatePresence>
                  </Popover>
                </div>
              ) : (
                // NORMAL MODE
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Left side: drag handle + checkbox + title */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {!task.done && (
                        <div
                          className="flex items-center justify-center w-6 h-6 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          {...dragListeners}
                          {...dragAttributes}
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                      )}
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.done}
                        onCheckedChange={() => onToggle(task.id, task.done)}
                        onClick={(e) => e.stopPropagation()}
                        className="border-gray-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                      <Label
                        className={`text-sm font-medium truncate ${
                          task.done
                            ? "line-through text-gray-500 dark:text-gray-400"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {task.title}
                      </Label>
                    </div>

                    {/* Right side: move up/down + collapsible trigger + edit + delete */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      {!task.done && (
                        <>
                          <motion.button
                            variants={buttonVariants}
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            disabled={!canMoveUp}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveUp(task);
                            }}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            variants={buttonVariants}
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            disabled={!canMoveDown}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveDown(task);
                            }}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </motion.button>
                        </>
                      )}
                      {(task.description || task.due_date) &&
                        !displayAllInfos && (
                          <CollapsibleTrigger asChild>
                            <motion.button
                              variants={buttonVariants}
                              initial="initial"
                              whileHover="hover"
                              whileTap="tap"
                              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              {shouldShowDetails ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </motion.button>
                          </CollapsibleTrigger>
                        )}
                      <motion.button
                        variants={buttonVariants}
                        initial="initial"
                        whileHover="hover"
                        whileTap="tap"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <Pencil className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        variants={buttonVariants}
                        initial="initial"
                        whileHover="hover"
                        whileTap="tap"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(task.id);
                        }}
                        className="p-1 text-red-500 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* The Collapsible content */}
                  {(task.description || task.due_date || task.title) && (
                    <CollapsibleContent className="mt-4 px-2">
                      {task.title && isMobile && (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 break-words tracking-tight">
                          {task.title}
                        </h3>
                      )}
                      {(task.description || task.due_date) && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 break-words">
                              {task.description}
                            </p>
                          )}
                          {task.due_date && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <CalendarIcon className="h-4 w-4" />
                              <span>
                                {language === "en" ? "Due:" : "Fällig:"}
                              </span>
                              <span>{formatDueDate(task.due_date)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CollapsibleContent>
                  )}
                </>
              )}
            </CardContent>
          </Collapsible>
        </Card>

        {/* HOVER/TAP TOOLTIP (displays title, desc, due date) */}
        {(task.description || task.due_date) && (
          <div
            className={`absolute left-0 top-full mt-2 z-50 w-72 
    px-5 py-4 bg-gray-800 text-white text-sm rounded-xl shadow-2xl
    opacity-0 invisible transition-all duration-300 ease-in-out
    group-hover:opacity-100 group-hover:visible
    ${tooltipOpen ? "opacity-100 visible" : ""}`}
          >
            {task.title && (
              <p className="font-semibold text-white mb-3 break-words leading-tight tracking-wide">
                {task.title}
              </p>
            )}
            {task.description && (
              <p className="text-gray-300 mb-3 leading-relaxed break-words">
                {task.description}
              </p>
            )}
            {task.created_at && (
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <ClockIcon className="h-4 w-4 text-gray-500" />
                <span className="font-medium">
                  {language === "en" ? "Created:" : "Erstellt:"}
                </span>
                <span>
                  {new Date(task.created_at).toLocaleString(undefined, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            {task.due_date && (
              <div className="flex items-center gap-2 text-gray-400">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="font-medium">
                  {language === "en" ? "Due:" : "Fällig:"}
                </span>
                <span>{formatDueDate(task.due_date)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function EisenhowerMatrix() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // For new task creation
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoQuadrant, setNewTodoQuadrant] = useState(quadrantsEn[0].id);
  const [newTodoDueDate, setNewTodoDueDate] = useState<Date | undefined>();
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date());
  const [isNewTodoPopoverOpen, setIsNewTodoPopoverOpen] = useState(false);

  // Display states
  const [isDoneOpen, setIsDoneOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [displayAllInfos, setDisplayAllInfos] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "de">("en");

  // For DnD overlay
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // -------------------------------
  // 1) Fetch tasks & load preferences
  // -------------------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDisplayAllInfos = localStorage.getItem("displayAllInfos");
      setDisplayAllInfos(
        storedDisplayAllInfos ? JSON.parse(storedDisplayAllInfos) : false
      );

      const storedLang = localStorage.getItem("language");
      setLanguage(storedLang === "de" ? "de" : "en");
    }
  }, []);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("position", { ascending: true });
      if (error) {
        console.error("Error fetching tasks:", error);
      } else if (data) {
        setTasks(data as Task[]);
      }
      setLoading(false);
      setIsLoaded(true);
    }
    fetchTasks();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("displayAllInfos", JSON.stringify(displayAllInfos));
      localStorage.setItem("language", language);
    }
  }, [displayAllInfos, language]);

  // -------------------------------
  // 2) CRUD: Create, Update, Delete
  // -------------------------------
  // Creating a new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    const maxPosition =
      tasks.filter((t) => t.quadrant === newTodoQuadrant && !t.done).length ||
      0;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: newTodoTitle,
        description: newTodoDescription,
        quadrant: newTodoQuadrant,
        position: maxPosition,
        done: false,
        due_date: newTodoDueDate ? format(newTodoDueDate, "yyyy-MM-dd") : null,
      })
      .select();
    if (error) {
      console.error("Error creating task:", error);
    } else if (data?.length) {
      setTasks((prev) => [...prev, data[0]]);
      setNewTodoTitle("");
      setNewTodoDescription("");
      setNewTodoDueDate(undefined);
    }
  };

  // Toggling done
  const toggleDone = async (taskId: number, currentDone: boolean) => {
    const updatedDone = !currentDone;
    const completedAt = updatedDone ? new Date().toISOString() : null;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, done: updatedDone, completed_at: completedAt }
          : t
      )
    );

    const { error } = await supabase
      .from("tasks")
      .update({ done: updatedDone, completed_at: completedAt })
      .eq("id", taskId);
    if (error) console.error("Error updating task done status:", error);
  };

  // Deleting a task
  const deleteTask = async (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Reorder positions in that quadrant
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== taskId);
      const quadrantTasks = updated
        .filter((t) => t.quadrant === task.quadrant && !t.done)
        .sort((a, b) => a.position - b.position)
        .map((t, index) => ({ ...t, position: index }));
      return updated
        .filter((t) => t.quadrant !== task.quadrant || t.done)
        .concat(quadrantTasks);
    });

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) console.error("Error deleting task:", error);
  };

  // Updating a task's data (title, description, due date)
  const updateTask = async (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    const { error } = await supabase
      .from("tasks")
      .update({
        title: updatedTask.title,
        description: updatedTask.description || null,
        due_date: updatedTask.due_date || null,
      })
      .eq("id", updatedTask.id);
    if (error) console.error("Error updating task:", error);
  };

  // Move up/down within quadrant (arrow buttons)
  const moveTaskUp = async (task: Task) => {
    const quadrantTasks = tasks
      .filter((t) => t.quadrant === task.quadrant && !t.done)
      .sort((a, b) => a.position - b.position);

    const idx = quadrantTasks.findIndex((t) => t.id === task.id);
    if (idx <= 0) return;

    const prevTask = quadrantTasks[idx - 1];
    const newPosTask = prevTask.position;
    const newPosPrev = task.position;

    // Swap in state
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, position: newPosTask }
          : t.id === prevTask.id
          ? { ...t, position: newPosPrev }
          : t
      )
    );

    const updates = [
      { ...task, position: newPosTask },
      { ...prevTask, position: newPosPrev },
    ].map((t) => ({
      ...t,
      description: t.description || null,
      completed_at: t.completed_at || null,
      due_date: t.due_date || null,
    }));

    const { error } = await supabase.from("tasks").upsert(updates);
    if (error) console.error("Error updating tasks:", error);
  };

  const moveTaskDown = async (task: Task) => {
    const quadrantTasks = tasks
      .filter((t) => t.quadrant === task.quadrant && !t.done)
      .sort((a, b) => a.position - b.position);

    const idx = quadrantTasks.findIndex((t) => t.id === task.id);
    if (idx === -1 || idx >= quadrantTasks.length - 1) return;

    const nextTask = quadrantTasks[idx + 1];
    const newPosTask = nextTask.position;
    const newPosNext = task.position;

    // Swap in state
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, position: newPosTask }
          : t.id === nextTask.id
          ? { ...t, position: newPosNext }
          : t
      )
    );

    const updates = [
      { ...task, position: newPosTask },
      { ...nextTask, position: newPosNext },
    ].map((t) => ({
      ...t,
      description: t.description || null,
      completed_at: t.completed_at || null,
      due_date: t.due_date || null,
    }));
    const { error } = await supabase.from("tasks").upsert(updates);
    if (error) console.error("Error updating tasks:", error);
  };

  // -------------------------------
  // 3) Drag & Drop
  // -------------------------------
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = Number.parseInt(event.active.id as string, 10);
    const task = tasks.find((t) => t.id === taskId);
    if (task && !task.done) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = Number(active.id);
    const oldTask = tasks.find((t) => t.id === taskId);
    if (!oldTask || oldTask.done) return;

    const containerId = over?.data?.current?.sortable?.containerId as
      | string
      | undefined;
    const newQuadrant = containerId || (over.id as string);
    const oldQuadrant = oldTask.quadrant;

    // Reordering or moving to a new quadrant
    if (oldQuadrant === newQuadrant) {
      // Reorder in the same quadrant
      const quadrantTasks = tasks
        .filter((t) => t.quadrant === oldQuadrant && !t.done)
        .sort((a, b) => a.position - b.position);

      const activeIndex = quadrantTasks.findIndex((t) => t.id === taskId);
      const overId = Number(over.id);
      const overIndex = quadrantTasks.findIndex((t) => t.id === overId);
      if (overIndex !== -1 && activeIndex !== overIndex) {
        const updated = arrayMove(quadrantTasks, activeIndex, overIndex);
        updated.forEach((item, idx) => {
          item.position = idx;
        });
        setTasks((prev) => {
          const nonQuadrant = prev.filter((p) => p.quadrant !== oldQuadrant);
          return [...nonQuadrant, ...updated];
        });
        const { error } = await supabase.from("tasks").upsert(
          updated.map((t) => ({
            ...t,
            description: t.description || null,
            completed_at: t.completed_at || null,
            due_date: t.due_date || null,
          }))
        );
        if (error) console.error("Error reordering tasks:", error);
      }
    } else {
      // Move to a different quadrant
      const newPosition = tasks.filter(
        (t) => t.quadrant === newQuadrant && !t.done
      ).length;

      setTasks((prev) => {
        const changed = prev.map((p) =>
          p.id === oldTask.id
            ? { ...p, quadrant: newQuadrant, position: newPosition }
            : p
        );
        // re-normalize the positions
        const oldQuadrantTasks = changed
          .filter((t) => t.quadrant === oldQuadrant && !t.done)
          .sort((a, b) => a.position - b.position)
          .map((t, index) => ({ ...t, position: index }));

        const newQuadrantTasks = changed
          .filter((t) => t.quadrant === newQuadrant && !t.done)
          .sort((a, b) => a.position - b.position)
          .map((t, index) => ({ ...t, position: index }));

        return changed.map(
          (x) =>
            oldQuadrantTasks.find((o) => o.id === x.id) ??
            newQuadrantTasks.find((o) => o.id === x.id) ??
            x
        );
      });

      const relevantTasks = tasks.filter(
        (t) => t.quadrant === oldQuadrant || t.quadrant === newQuadrant
      );
      const { error } = await supabase.from("tasks").upsert(
        relevantTasks.map((t) => ({
          ...t,
          quadrant: t.id === oldTask.id ? newQuadrant : t.quadrant,
          position: t.id === oldTask.id ? newPosition : t.position,
          description: t.description || null,
          completed_at: t.completed_at || null,
          due_date: t.due_date || null,
        }))
      );
      if (error) console.error("Error updating quadrant:", error);
    }
  };

  // -------------------------------
  // 4) Calendar + Upcoming Tasks side by side
  // -------------------------------
  // (A) For the calendar, group tasks by date to show which days have tasks
  const tasksWithDueDates = tasks.filter((t) => t.due_date);
  const tasksByDate = tasksWithDueDates.reduce<Record<string, Task[]>>(
    (acc, task) => {
      const dateKey = format(new Date(task.due_date!), "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    },
    {}
  );

  // (B) Highlight days in the calendar that have tasks
  const calendarModifiers = {
    // 1) Day has tasks and ALL are done
    allDone: (date: Date) => {
      const key = format(date, "yyyy-MM-dd");
      const dayTasks = tasksByDate[key] || [];
      if (!dayTasks.length) return false;
      return dayTasks.every((t) => t.done === true);
    },

    // 2) Day has any tasks NOT done
    hasDue: (date: Date) => {
      const key = format(date, "yyyy-MM-dd");
      const dayTasks = tasksByDate[key] || [];
      // If there's at least one undone task, highlight differently
      return dayTasks.some((t) => !t.done);
    },

    // 3) Current day highlight
    today: (date: Date) => {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    },
  };

  const calendarModifiersClassNames = {
    // When ALL tasks for that day are done => highlight green
    allDone:
      "bg-green-200 text-green-900 dark:bg-green-700 dark:text-green-100 font-semibold",

    // When there is at least one undone task => highlight in your previous color
    hasDue:
      "bg-indigo-200 text-indigo-900 dark:bg-indigo-700 dark:text-indigo-100 font-semibold",

    // Current day styling - using a distinct color (e.g., blue)
    today:
      "text-blue-900 border-2 bg-transparent dark:text-blue-100 font-semibold",
  };

  // (C) Track which date is selected in the calendar
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    Date | undefined
  >(undefined);

  // (D) "Upcoming Tasks" are tasks with a due_date in the future (or including overdue).
  // We highlight them if their date matches the selectedCalendarDate
  const getTimeRemaining = (dueDate: string | null) => {
    if (!dueDate)
      return language === "en" ? "No due date" : "Kein Fälligkeitsdatum";
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0)
      return language === "en"
        ? `Overdue by ${-diffDays} day${-diffDays === 1 ? "" : "s"}`
        : `Überfällig um ${-diffDays} Tag${-diffDays === 1 ? "" : "e"}`;
    if (diffDays === 0) return language === "en" ? "Due today" : "Heute fällig";
    return language === "en"
      ? `${diffDays} day${diffDays === 1 ? "" : "s"} remaining`
      : `${diffDays} Tag${diffDays === 1 ? "" : "e"} verbleibend`;
  };

  // -------------
  // Render
  // -------------
  const quadrants = language === "en" ? quadrantsEn : quadrantsDe;

  return (
    <div className="p-8 bg-gradient-to-br from-gray-100 via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      {/* Language Switch */}
      <motion.div className="mb-4 flex justify-end" variants={itemVariants}>
        <motion.button
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          onClick={() => setLanguage(language === "en" ? "de" : "en")}
          className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          title={
            language === "en" ? "Switch to German" : "Zu Englisch wechseln"
          }
        >
          <Globe className="h-6 w-6" />
        </motion.button>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
      >
        {/* New Task Form */}
        <motion.form
          variants={itemVariants}
          onSubmit={handleCreateTask}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800"
        >
          {/* Title */}
          <div className="flex flex-col">
            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              {language === "en" ? "Task" : "Aufgabe"}
            </Label>
            <Input
              id="new-task"
              placeholder={
                language === "en"
                  ? "Add a new task..."
                  : "Neue Aufgabe hinzufügen..."
              }
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 rounded-xl bg-white dark:bg-gray-900 shadow-sm"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col">
            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              {language === "en" ? "Description" : "Beschreibung"}
            </Label>
            <Input
              id="new-description"
              placeholder={
                language === "en"
                  ? "Optional description..."
                  : "Optionale Beschreibung..."
              }
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
              className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 rounded-xl bg-white dark:bg-gray-900 shadow-sm"
            />
          </div>

          {/* Due Date */}
          <div className="md:col-span-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
              {language === "en"
                ? "Due Date (optional)"
                : "Fälligkeitsdatum (optional)"}
            </Label>
            <Popover
              open={isNewTodoPopoverOpen}
              onOpenChange={setIsNewTodoPopoverOpen}
            >
              <PopoverTrigger asChild>
                <motion.button
                  variants={buttonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  className="w-full flex items-center justify-start text-left font-normal border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  {newTodoDueDate ? (
                    format(newTodoDueDate, "PPP")
                  ) : (
                    <span>
                      {language === "en" ? "Pick a date" : "Datum auswählen"}
                    </span>
                  )}
                </motion.button>
              </PopoverTrigger>
              <AnimatePresence>
                {isNewTodoPopoverOpen && (
                  <PopoverContent className="w-auto p-0 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl shadow-xl">
                    <motion.div
                      variants={popoverVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="p-4"
                    >
                      <Calendar
                        mode="single"
                        selected={newTodoDueDate}
                        onSelect={(date) => {
                          setNewTodoDueDate(date || undefined);
                          setIsNewTodoPopoverOpen(false);
                        }}
                        month={displayedMonth}
                        onMonthChange={setDisplayedMonth}
                        initialFocus
                        className="rounded-xl border-none"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewTodoDueDate(undefined);
                          setIsNewTodoPopoverOpen(false);
                        }}
                        className="mt-2 w-full border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {language === "en" ? "Clear Date" : "Datum löschen"}
                      </Button>
                    </motion.div>
                  </PopoverContent>
                )}
              </AnimatePresence>
            </Popover>
          </div>

          {/* Quadrant + Submit */}
          <div className="md:col-span-1 md:col-start-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
              {language === "en" ? "Quadrant" : "Quadrant"}
            </Label>
            <Select value={newTodoQuadrant} onValueChange={setNewTodoQuadrant}>
              <SelectTrigger className="mt-1 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-xl shadow-xl">
                <AnimatePresence>
                  <motion.div
                    variants={dropdownVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                  >
                    {quadrants.map((q) => (
                      <motion.div
                        key={q.id}
                        variants={dropdownItemVariants}
                        whileHover={{
                          scale: 1.02,
                          backgroundColor: "rgba(99, 102, 241, 0.1)",
                        }}
                      >
                        <SelectItem
                          value={q.id}
                          className={`cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg ${
                            quadrantTextColors[q.id]
                          }`}
                        >
                          <span className="font-medium">{q.title}</span>
                        </SelectItem>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex items-end justify-end">
            <motion.button
              type="submit"
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2 shadow-md"
            >
              {language === "en" ? "Add" : "Hinzufügen"}
            </motion.button>
          </div>
        </motion.form>

        {/* Help Dialog */}
        <div className="mb-8">
          <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
            <DialogTrigger asChild>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="mt-2 text-sm  text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                {language === "en"
                  ? "Understanding the Eisenhower Matrix"
                  : "Die Eisenhower-Matrix verstehen"}
              </motion.button>
            </DialogTrigger>
            <DialogContent
              className="
        w-[85%]
        max-w-md 
        sm:max-w-[425px] 
        p-4 
        sm:p-6 
        bg-white 
        dark:bg-gray-900 
        border 
        border-gray-200 
        dark:border-gray-800 
        rounded-xl 
        shadow-xl 
        max-h-[90vh] 
        overflow-y-auto
      "
            >
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {language === "en"
                      ? "The Eisenhower Matrix"
                      : "Die Eisenhower-Matrix"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                    {language === "en"
                      ? "A proven framework for effective task prioritization."
                      : "Ein bewährtes Framework zur effektiven Aufgabenpriorisierung."}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 text-gray-700 dark:text-gray-300">
                  {language === "en" ? (
                    <>
                      <section className="mb-4">
                        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Overview
                        </h3>
                        <p className="text-sm">
                          The Eisenhower Matrix, developed by President Dwight
                          D. Eisenhower, is a strategic tool designed to
                          categorize tasks based on their urgency and
                          importance. It organizes your workload into four
                          quadrants to optimize productivity and
                          decision-making.
                        </p>
                      </section>
                      <section className="mb-4">
                        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Quadrants
                        </h3>
                        <ul className="list-none pl-0 space-y-2 text-sm">
                          <li className="flex items-start">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 mt-1.5 flex-shrink-0"></span>
                            <span>
                              <span className="font-medium text-red-600 dark:text-red-400">
                                Urgent & Important:
                              </span>{" "}
                              Tasks requiring immediate action due to their
                              critical nature.
                              <br />
                              <span className="italic">Examples:</span>{" "}
                              <strong>Job:</strong> Fixing a production bug or
                              finalizing a client proposal due within hours.
                              <br />
                              <span className="italic">Examples:</span>{" "}
                              <strong>Student:</strong> Completing a research
                              paper due tomorrow or preparing for an exam
                              scheduled early in the morning.
                              <br />
                              <span className="font-medium">Action:</span>{" "}
                              Address promptly.
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2 mt-1.5 flex-shrink-0"></span>
                            <span>
                              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                Urgent, Not Important:
                              </span>{" "}
                              Time-sensitive tasks with lower strategic value.
                              <br />
                              <span className="italic">Examples:</span>{" "}
                              <strong>Job:</strong> Answering routine emails or
                              attending a brief, unscheduled meeting that could
                              be delegated.
                              <br />
                              <span className="italic">Examples:</span>{" "}
                              <strong>Student:</strong> Replying to non-critical
                              group chat messages or addressing minor assignment
                              clarifications.
                              <br />
                              <span className="font-medium">Action:</span>{" "}
                              Delegate when feasible.
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2 mt-1.5 flex-shrink-0"></span>
                            <span>
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                Not Urgent, Important:
                              </span>{" "}
                              High-value tasks that contribute to long-term
                              goals.
                              <br />
                              <span className="italic">Examples:</span>{" "}
                              <strong>Job:</strong> Engaging in professional
                              development or planning long-term projects.
                              <br />
                              <span className="italic">Examples:</span>{" "}
                              <strong>Student:</strong> Studying ahead for major
                              exams or working on a long-term project.
                              <br />
                              <span className="font-medium">Action:</span>{" "}
                              Schedule for focused attention.
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 mt-1.5 flex-shrink-0"></span>
                            <span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                Not Urgent, Not Important:
                              </span>{" "}
                              Low-priority tasks that offer minimal value.
                              <br />
                              <span className="italic">Examples:</span>{" "}
                              <strong>Job:</strong> Casual web browsing or
                              organizing already sorted files.
                              <br />
                              <span className="italic">Examples:</span>{" "}
                              <strong>Student:</strong> Scrolling through social
                              media during study sessions or watching videos
                              that aren’t related to coursework.
                              <br />
                              <span className="font-medium">Action:</span>{" "}
                              Minimize or eliminate.
                            </span>
                          </li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                          How to Use This Tool
                        </h3>
                        <p className="text-sm">
                          Input a task with its title, optional description, and
                          due date. Select the appropriate quadrant from the
                          dropdown menu. Adjust priorities using drag-and-drop,
                          mark tasks as completed with the checkbox, or remove
                          them with the delete button as required.
                        </p>
                      </section>
                    </>
                  ) : (
                    <>
                      <section className="mb-4">
                        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Überblick
                        </h3>
                        <p className="text-sm">
                          Die Eisenhower-Matrix, entwickelt von Präsident Dwight
                          D. Eisenhower, ist ein strategisches Werkzeug zur
                          Kategorisierung von Aufgaben nach Dringlichkeit und
                          Wichtigkeit. Sie strukturiert Ihre Arbeitslast in vier
                          Quadranten, um Produktivität und Entscheidungsfindung
                          zu optimieren.
                        </p>
                      </section>
                      <section className="mb-4">
                        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Quadranten
                        </h3>
                        <ul className="list-none pl-0 space-y-2 text-sm">
                          <li className="flex items-start">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 mt-1.5 flex-shrink-0"></span>
                            <span>
                              <span className="font-medium text-red-600 dark:text-red-400">
                                Dringend & Wichtig:
                              </span>{" "}
                              Aufgaben, die sofortiges Handeln erfordern
                              aufgrund ihrer kritischen Natur.
                              <br />
                              <span className="italic">Beispiele:</span>{" "}
                              <strong>Beruf:</strong> Behebung eines kritischen
                              Fehlers in der Produktion oder Fertigstellung
                              eines Kundenangebots, das in wenigen Stunden
                              fällig ist.
                              <br />
                              <span className="italic">Beispiele:</span>{" "}
                              <strong>Student:</strong> Abschluss einer
                              Forschungsarbeit, die morgen fällig ist, oder
                              Vorbereitung auf eine früh am Morgen anstehende
                              Prüfung.
                              <br />
                              <span className="font-medium">
                                Maßnahme:
                              </span>{" "}
                              Sofort bearbeiten.
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2 mt-1.5 flex-shrink-0"></span>
                            <span>
                              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                Dringend, Nicht Wichtig:
                              </span>{" "}
                              Zeitkritische Aufgaben mit geringerem
                              strategischen Wert.
                              <br />
                              <span className="italic">Beispiele:</span>{" "}
                              <strong>Beruf:</strong> Beantwortung
                              routinemäßiger E-Mails oder Teilnahme an einem
                              kurzfristig anberaumten Meeting, das delegiert
                              werden könnte.
                              <br />
                              <span className="italic">Beispiele:</span>{" "}
                              <strong>Student:</strong> Antwort auf nicht
                              dringende Nachrichten in der Studiengruppe oder
                              Klärung von geringfügigen Aufgaben.
                              <br />
                              <span className="font-medium">
                                Maßnahme:
                              </span>{" "}
                              Wenn möglich delegieren.
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2 mt-1.5 flex-shrink-0"></span>
                            <span>
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                Nicht Dringend, Wichtig:
                              </span>{" "}
                              Aufgaben mit hohem langfristigen Wert.
                              <br />
                              <span className="italic">Beispiele:</span>{" "}
                              <strong>Beruf:</strong> Teilnahme an Fortbildungen
                              oder Planung langfristiger Projekte.
                              <br />
                              <span className="italic">Beispiele:</span>{" "}
                              <strong>Student:</strong> Frühzeitiges Lernen für
                              wichtige Prüfungen oder die Bearbeitung von
                              Projekten, die langfristig an Bedeutung gewinnen.
                              <br />
                              <span className="font-medium">Maßnahme:</span> Für
                              gezielte Bearbeitung einplanen.
                            </span>
                          </li>
                          <li className="flex items-start">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 mt-1.5 flex-shrink-0"></span>
                            <span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                Nicht Dringend, Nicht Wichtig:
                              </span>{" "}
                              Aufgaben mit geringer Priorität und minimalem
                              Nutzen.
                              <br />
                              <span className="italic">Beispiele:</span>{" "}
                              <strong>Beruf:</strong> Gelegentliches Surfen im
                              Internet oder Ordnen von bereits gut
                              strukturierten Dateien.
                              <br />
                              <span className="italic">Beispiele:</span>{" "}
                              <strong>Student:</strong> Ungezwungenes Scrollen
                              durch soziale Medien während Lernpausen oder
                              Anschauen von nicht studienrelevanten Videos.
                              <br />
                              <span className="font-medium">
                                Maßnahme:
                              </span>{" "}
                              Minimieren oder eliminieren.
                            </span>
                          </li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Wie dieses Tool genutzt wird
                        </h3>
                        <p className="text-sm">
                          Geben Sie eine Aufgabe mit Titel, optionaler
                          Beschreibung und Fälligkeitsdatum ein. Wählen Sie den
                          passenden Quadranten aus dem Dropdown-Menü. Passen Sie
                          Prioritäten per Drag-and-Drop an, markieren Sie
                          Aufgaben als erledigt mit dem Kontrollkästchen oder
                          entfernen Sie sie bei Bedarf mit dem Löschbutton.
                        </p>
                      </section>
                    </>
                  )}
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <motion.p
            variants={itemVariants}
            className="text-center text-gray-600 dark:text-gray-400"
          >
            {language === "en"
              ? "Loading tasks..."
              : "Aufgaben werden geladen..."}
          </motion.p>
        )}

        {/* Show/Hide Extra Info */}
        <motion.div
          variants={itemVariants}
          className="mb-6 flex items-center gap-2"
        >
          <Checkbox
            id="display-infos"
            checked={displayAllInfos}
            onCheckedChange={() => setDisplayAllInfos((prev) => !prev)}
            className="border-gray-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
          />
          <Label
            htmlFor="display-infos"
            className="text-sm font-medium text-gray-800 dark:text-gray-200"
          >
            {language === "en" ? "Display Info" : "Informationen anzeigen"}
          </Label>
        </motion.div>

        {/* DnD Context for Quadrant tasks */}
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCenter}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        >
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {quadrants.map((q) => {
              const quadrantTasks = tasks
                .filter((t) => t.quadrant === q.id && !t.done)
                .sort((a, b) => a.position - b.position);

              return (
                <DroppableZone
                  key={q.id}
                  id={q.id}
                  title={q.title}
                  tasks={quadrantTasks}
                >
                  <AnimatePresence>
                    {quadrantTasks.map((task, index) => (
                      <SortableTask
                        key={task.id}
                        task={task}
                        onToggle={toggleDone}
                        onDelete={deleteTask}
                        onUpdate={updateTask}
                        onMoveUp={moveTaskUp}
                        onMoveDown={moveTaskDown}
                        canMoveUp={index > 0}
                        canMoveDown={index < quadrantTasks.length - 1}
                        displayAllInfos={displayAllInfos}
                        language={language}
                        isActive={activeTask?.id === task.id}
                      />
                    ))}
                  </AnimatePresence>
                </DroppableZone>
              );
            })}
          </motion.div>

          <DragOverlay>
            {activeTask && (
              <DraggableTask
                task={activeTask}
                onToggle={toggleDone}
                onDelete={deleteTask}
                onUpdate={updateTask}
                onMoveUp={moveTaskUp}
                onMoveDown={moveTaskDown}
                canMoveUp={false}
                canMoveDown={false}
                displayAllInfos={displayAllInfos}
                language={language}
              />
            )}
          </DragOverlay>
        </DndContext>

        {/* 
          -------------- 
          CALENDAR + UPCOMING TASKS SIDE BY SIDE
          --------------
        */}
        <motion.div variants={itemVariants} className="mt-12">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start justify-center">
            {/* CALENDAR VIEW */}
            <div className="flex justify-center">
              <div className=" w-fit">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  {language === "en" ? "Calendar View" : "Kalenderansicht"}
                </h3>
                <div className="md:pl-0 pl-6">
                  <Calendar
                    mode="single"
                    selected={selectedCalendarDate}
                    onSelect={setSelectedCalendarDate}
                    month={displayedMonth}
                    onMonthChange={setDisplayedMonth}
                    // Pass both modifiers
                    modifiers={calendarModifiers}
                    modifiersClassNames={calendarModifiersClassNames}
                    className="mx-auto rounded-xl border dark:border-gray-800 "
                  />
                </div>
              </div>
            </div>

            {/* UPCOMING TASKS */}
            <div className="md:w-8/12 w-full">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                {language === "en" ? "Upcoming Tasks" : "Kommende Aufgaben"}
              </h3>
              <div className="space-y-3">
                <AnimatePresence>
                  {tasks
                    .filter((t) => !t.done && t.due_date) // must have a due date and not done
                    .sort(
                      (a, b) =>
                        new Date(a.due_date!).getTime() -
                        new Date(b.due_date!).getTime()
                    )
                    .map((task) => {
                      // Calculate due time and days remaining
                      const dueTime = new Date(task.due_date!).getTime();
                      const now = Date.now();
                      const daysRemaining = Math.ceil(
                        (dueTime - now) / (1000 * 60 * 60 * 24)
                      );

                      // highlight if matches selectedCalendarDate
                      const isHighlighted =
                        selectedCalendarDate &&
                        task.due_date &&
                        isSameDay(
                          new Date(task.due_date),
                          selectedCalendarDate
                        );

                      return (
                        <motion.div
                          key={task.id}
                          variants={itemVariants}
                          className={`bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-800
                ${
                  isHighlighted
                    ? "bg-yellow-50 ring-2 ring-yellow-300 dark:bg-yellow-900/10"
                    : ""
                }
                transition-all duration-200`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Task Title and Checkbox */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Checkbox
                                id={`upcoming-task-${task.id}`}
                                checked={task.done}
                                onCheckedChange={() =>
                                  toggleDone(task.id, task.done)
                                }
                                className="border-gray-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 h-5 w-5"
                              />
                              <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {task.title}
                              </Label>
                            </div>

                            {/* Due Date and Actions */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="flex flex-col items-end">
                                <span
                                  className={`text-xs font-medium ${
                                    dueTime < now
                                      ? "text-red-500 dark:text-red-400"
                                      : daysRemaining === 1
                                      ? "text-orange-500 dark:text-orange-400"
                                      : "text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  {daysRemaining === 1 && (
                                    <ClockAlert className="h-4 w-4 inline-block mr-1" />
                                  )}
                                  {getTimeRemaining(task.due_date!)}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {new Date(task.due_date!).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </span>
                              </div>
                              <motion.button
                                variants={buttonVariants}
                                initial="initial"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => deleteTask(task.id)}
                                className="p-1.5 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 border-t border-gray-100 dark:border-gray-800 pt-2 break-words">
                              {task.description}
                            </p>
                          )}

                          {/* Quadrant */}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {language === "en" ? "Quadrant:" : "Quadrant:"}{" "}
                            <span className="font-medium">
                              {
                                quadrants.find((q) => q.id === task.quadrant)
                                  ?.title
                              }
                            </span>
                          </p>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Completed Tasks */}
        <motion.div variants={itemVariants} className="mt-12">
          <Dialog open={isDoneOpen} onOpenChange={setIsDoneOpen}>
            <DialogTrigger asChild>
              <motion.button
                variants={buttonVariants}
                initial="initial"
                whileHover="none"
                whileTap="tap"
                className="w-full flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl shadow-md p-4"
              >
                <span className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {language === "en"
                    ? "Completed Tasks"
                    : "Abgeschlossene Aufgaben"}{" "}
                  ({tasks.filter((t) => t.done).length})
                </span>
                {isDoneOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                )}
              </motion.button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto mt-4 space-y-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-4 overflow-y-auto max-h-[calc(100vh-100px)]">
              <DialogHeader className="border-b border-gray-200 dark:border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {language === "en"
                      ? "Completed Tasks"
                      : "Abgeschlossene Aufgaben"}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                  {language === "en"
                    ? "Here are the tasks you have completed."
                    : "Hier sind die Aufgaben, die Sie abgeschlossen haben."}
                </DialogDescription>
              </DialogHeader>

              {tasks.filter((t) => t.done).length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center p-4 text-center text-balance"
                >
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {language === "en"
                      ? "Hmm, seems like there are no done tasks yet."
                      : "Hmm, es sieht so aus, als wären noch keine Aufgaben erledigt."}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {language === "en"
                      ? "Keep pushing forward – your breakthrough is just around the corner!"
                      : "Bleib dran – dein Durchbruch ist zum Greifen nah!"}
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {tasks
                    .filter((t) => t.done)
                    .map((task) => (
                      <motion.div
                        key={task.id}
                        variants={itemVariants}
                        className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-800"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`done-task-${task.id}`}
                              checked={task.done}
                              onCheckedChange={() =>
                                toggleDone(task.id, task.done)
                              }
                              className="border-gray-400  data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                            />
                            <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 line-through">
                              {task.title}
                            </Label>
                          </div>
                          <motion.button
                            variants={buttonVariants}
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => deleteTask(task.id)}
                            className="p-1 text-red-500  hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                        {task.description && (
                          <p className="text-xs mb-4 text-gray-600 dark:text-gray-400 mt-2 break-words">
                            {task.description}
                          </p>
                        )}

                        <div className="*:py-1">
                          {task.created_at && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                              <ClockIcon className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">
                                {language === "en" ? "Created:" : "Erstellt:"}
                              </span>
                              {new Date(task.created_at).toLocaleString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            {language === "en"
                              ? "Completed:"
                              : "Abgeschlossen:"}{" "}
                            {new Date(task.completed_at!).toLocaleString(
                              undefined,
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                          {task.due_date && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4 text-blue-500" />
                              {language === "en" ? "Due:" : "Fällig:"}{" "}
                              {new Date(task.due_date).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                }
                              )}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <ViewGridIcon className="h-4 w-4 text-purple-500" />
                            {language === "en" ? "Quadrant:" : "Quadrant:"}{" "}
                            {
                              quadrants.find((q) => q.id === task.quadrant)
                                ?.title
                            }
                          </p>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>
      </motion.div>
    </div>
  );
}
