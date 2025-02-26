"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
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
} from "lucide-react";
import { format, isSameMonth, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";

type Task = {
  id: number;
  title: string;
  description?: string;
  quadrant: string;
  position: number;
  done: boolean;
  completed_at?: string | null;
  due_date?: string | null;
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
    // We wrap the quadrant in a SortableContext so we can reorder within this container
    <SortableContext
      id={id}
      items={tasks.map((t) => t.id.toString())}
      strategy={verticalListSortingStrategy}
    >
      <motion.div
        ref={setNodeRef}
        variants={itemVariants}
        className={`p-6 rounded-3xl ${quadrantStyles[id]} min-h-[300px] border border-gray-200/70 dark:border-gray-800/70 shadow-xl`}
        whileHover={{ scale: 1.015 }}
        animate={{ scale: isOver ? 1.015 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <h2 className="text-xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100 tracking-tight">
          {title}
        </h2>
        <div className="space-y-4">{children}</div>
      </motion.div>
    </SortableContext>
  );
}

// Wraps the "task card" with `useSortable` to allow reordering in the same quadrant
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
  // isActive is used to fade out the "original" item if it's being dragged
  isActive?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    over,
  } = useSortable({ id: task.id.toString() });

  // Convert transform to string for inline style
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Increase z-index while dragging to avoid overshadow by siblings
    zIndex: isDragging ? 999 : undefined,
    // Slightly fade the non-dragging copy if it is "active"
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
 * The "display" portion of each task card.
 * We separated the actual DnD logic into `SortableTask`.
 * If you want to keep the manual up/down arrows, you can do so here.
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
  // These come from useSortable in `SortableTask`.
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
  dragListeners?: any;
  dragAttributes?: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [date, setDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  );
  const [displayedMonth, setDisplayedMonth] = useState<Date>(
    date || new Date()
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate)
      return language === "en" ? "No due date" : "Kein Fälligkeitsdatum";
    return new Date(dueDate).toLocaleDateString();
  };

  const handleSave = async () => {
    if (!editedTask.title.trim()) return;
    const updatedTask = {
      ...editedTask,
      due_date: date ? format(date, "yyyy-MM-dd") : null,
    };
    await onUpdate(updatedTask);
    setIsEditing(false);
  };

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

  const shouldShowDetails = displayAllInfos || isOpen;

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Card className="bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200/70 dark:border-gray-800/70">
        <Collapsible open={shouldShowDetails} onOpenChange={setIsOpen}>
          <CardContent className="p-4">
            {isEditing ? (
              // Edit Mode
              <div className="space-y-3">
                <div className="flex items-center gap-2">
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
                  className="border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500"
                />
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
                            {language === "en" ? "Clear Date" : "Datum löschen"}
                          </Button>
                        </motion.div>
                      </PopoverContent>
                    )}
                  </AnimatePresence>
                </Popover>
              </div>
            ) : (
              // Normal Display Mode
              <>
                <div className="flex items-center justify-between">
                  {/* Drag Handle (only if not done) */}
                  {!task.done && (
                    <div
                      className="mr-3 flex items-center justify-center w-6 h-6 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      {...dragListeners}
                      {...dragAttributes}
                    >
                      <GripVertical className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex items-center space-x-3 flex-1">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.done}
                      onCheckedChange={() => onToggle(task.id, task.done)}
                      onClick={(e) => e.stopPropagation()}
                      className="border-gray-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                    <Label
                      htmlFor={`task-${task.id}`}
                      className={`text-sm font-medium ${
                        task.done
                          ? "line-through text-gray-500 dark:text-gray-400"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {task.title}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Up/Down arrow buttons (only if not done) */}
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
                          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"
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
                          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30"
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
                            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <Pencil className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      variants={buttonVariants}
                      initial="initial"
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => onDelete(task.id)}
                      className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
                {(task.description || task.due_date) && (
                  <CollapsibleContent className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {task.description && (
                      <p className="mb-1">{task.description}</p>
                    )}
                    {task.due_date && (
                      <p className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />{" "}
                        {language === "en" ? "Due:" : "Fällig:"}{" "}
                        {formatDueDate(task.due_date)}
                      </p>
                    )}
                  </CollapsibleContent>
                )}
              </>
            )}
          </CardContent>
        </Collapsible>
      </Card>
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

  // For DnD overlay (the "ghost" item)
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Load user preferences & fetch tasks
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

  // Creating a new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    // position = number of existing tasks in that quadrant (not done)
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

    setTasks((prev) => {
      // remove from array
      const updated = prev.filter((t) => t.id !== taskId);
      // reassign positions in the old quadrant
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

  // Updating a task's data (title, desc, due date)
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

  // Move a task "up" within its quadrant (manual arrow)
  const moveTaskUp = async (task: Task) => {
    const quadrantTasks = tasks
      .filter((t) => t.quadrant === task.quadrant && !t.done)
      .sort((a, b) => a.position - b.position);

    const idx = quadrantTasks.findIndex((t) => t.id === task.id);
    if (idx <= 0) return;

    const prevTask = quadrantTasks[idx - 1];
    const newPosTask = prevTask.position;
    const newPosPrev = task.position;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === task.id) {
          return { ...t, position: newPosTask };
        } else if (t.id === prevTask.id) {
          return { ...t, position: newPosPrev };
        }
        return t;
      })
    );

    // Persist
    const updates = [
      { ...task, position: newPosTask },
      { ...prevTask, position: newPosPrev },
    ].map((t) => ({
      id: t.id,
      quadrant: t.quadrant,
      position: t.position,
      title: t.title,
      done: t.done,
      description: t.description || null,
      completed_at: t.completed_at || null,
      due_date: t.due_date || null,
    }));
    const { error } = await supabase.from("tasks").upsert(updates);
    if (error) console.error("Error updating tasks:", error);
  };

  // Move a task "down" within its quadrant (manual arrow)
  const moveTaskDown = async (task: Task) => {
    const quadrantTasks = tasks
      .filter((t) => t.quadrant === task.quadrant && !t.done)
      .sort((a, b) => a.position - b.position);

    const idx = quadrantTasks.findIndex((t) => t.id === task.id);
    if (idx === -1 || idx >= quadrantTasks.length - 1) return;

    const nextTask = quadrantTasks[idx + 1];
    const newPosTask = nextTask.position;
    const newPosNext = task.position;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === task.id) {
          return { ...t, position: newPosTask };
        } else if (t.id === nextTask.id) {
          return { ...t, position: newPosNext };
        }
        return t;
      })
    );

    // Persist
    const updates = [
      { ...task, position: newPosTask },
      { ...nextTask, position: newPosNext },
    ].map((t) => ({
      id: t.id,
      quadrant: t.quadrant,
      position: t.position,
      title: t.title,
      done: t.done,
      description: t.description || null,
      completed_at: t.completed_at || null,
      due_date: t.due_date || null,
    }));
    const { error } = await supabase.from("tasks").upsert(updates);
    if (error) console.error("Error updating tasks:", error);
  };

  // Display completed tasks' timestamps
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleString();
  };

  // For "Upcoming" tasks
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

  /**
   * DnDKit events:
   * 1) If we drag a task from one quadrant to the same quadrant => reorder
   * 2) If we drag it to a new quadrant => move it to bottom of new quadrant
   */
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = Number.parseInt(event.active.id as string, 10);
    const task = tasks.find((t) => t.id === taskId);
    if (task && !task.done) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // You can handle custom logic here if needed
    // e.g. highlight droppable areas
  };

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    // Clear any "ghost" item you may have
    setActiveTask(null);

    // If no valid drop target, do nothing
    if (!over) return;

    const taskId = Number(active.id);
    const oldTask = tasks.find((t) => t.id === taskId);
    if (!oldTask || oldTask.done) return;

    // 1) Extract the container ID from the drop event data
    //    If we're dropping onto another *task*, `over.id` is that task's ID,
    //    but `over.data.current.sortable.containerId` is the actual quadrant name.
    const containerId = over?.data?.current?.sortable?.containerId as
      | string
      | undefined;

    // 2) If containerId is missing, fall back to over.id (which might be the quadrant)
    const newQuadrant = containerId || (over.id as string);
    const oldQuadrant = oldTask.quadrant;

    // 3) If the quadrant didn't change, we're just reordering tasks in the same quadrant
    if (oldQuadrant === newQuadrant) {
      // Find the old quadrant tasks sorted by position
      const quadrantTasks = tasks
        .filter((t) => t.quadrant === oldQuadrant && !t.done)
        .sort((a, b) => a.position - b.position);

      const activeIndex = quadrantTasks.findIndex((t) => t.id === taskId);
      const overId = Number(over.id);
      const overIndex = quadrantTasks.findIndex((t) => t.id === overId);

      // If we dragged over a valid item and the order changed, reorder with arrayMove
      if (overIndex !== -1 && activeIndex !== overIndex) {
        const updated = arrayMove(quadrantTasks, activeIndex, overIndex);

        // Reassign position indexes in the updated list
        updated.forEach((item, idx) => {
          item.position = idx;
        });

        // Merge back into our main tasks array
        setTasks((prev) => {
          const nonQuadrant = prev.filter((p) => p.quadrant !== oldQuadrant);
          return [...nonQuadrant, ...updated];
        });

        // Persist to DB
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
      // 4) Quadrant changed => place the task at bottom of new quadrant
      const newPosition = tasks.filter(
        (t) => t.quadrant === newQuadrant && !t.done
      ).length;

      // Update quadrant & position of this one item
      setTasks((prev) => {
        // 1) First, update the quadrant for the dragged item
        const changed = prev.map((p) =>
          p.id === oldTask.id
            ? { ...p, quadrant: newQuadrant, position: newPosition }
            : p
        );
        // 2) Reassign positions in the OLD quadrant
        const oldQuadrantTasks = changed
          .filter((t) => t.quadrant === oldQuadrant && !t.done)
          .sort((a, b) => a.position - b.position)
          .map((t, index) => ({ ...t, position: index }));

        // 3) Reassign positions in the NEW quadrant
        const newQuadrantTasks = changed
          .filter((t) => t.quadrant === newQuadrant && !t.done)
          .sort((a, b) => a.position - b.position)
          .map((t, index) => ({ ...t, position: index }));

        // 4) Merge them all back
        return changed.map(
          (x) =>
            oldQuadrantTasks.find((o) => o.id === x.id) ??
            newQuadrantTasks.find((o) => o.id === x.id) ??
            x
        );
      });

      // Persist to DB for all affected tasks
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
  }

  // New todo date selection
  const handleNewTodoDateSelect = (selectedDate: Date | undefined) => {
    setNewTodoDueDate(selectedDate);
    setIsNewTodoPopoverOpen(false);
  };
  const handleNewTodoClearDate = () => {
    setNewTodoDueDate(undefined);
    setIsNewTodoPopoverOpen(false);
  };

  const modifiers = {
    currentMonth: (date: Date) => isSameMonth(date, displayedMonth),
    selected: (date: Date) =>
      newTodoDueDate ? isSameDay(date, newTodoDueDate) : false,
  };
  const modifiersClassNames = {
    currentMonth:
      "border-2 border-indigo-600 hover:border-gray-300 text-indigo-600 rounded-full",
    selected: "bg-indigo-500 text-white rounded-full",
  };

  const quadrants = language === "en" ? quadrantsEn : quadrantsDe;

  return (
    <div className="container mx-auto p-8 bg-gradient-to-br from-gray-100 via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      {/* Language Switch */}
      <motion.div className="absolute top-4 right-4" variants={itemVariants}>
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
        className="max-w-5xl mx-auto"
      >
        {/* New Task Form */}
        <motion.form
          variants={itemVariants}
          onSubmit={handleCreateTask}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800"
        >
          {/* Title */}
          <div className="md:col-span-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
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
            {/* Info Modal Trigger */}
            <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
              <DialogTrigger asChild>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  {language === "en"
                    ? "Understanding the Eisenhower Matrix"
                    : "Die Eisenhower-Matrix verstehen"}
                </motion.button>
              </DialogTrigger>
              {/* Info Modal */}
              <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl">
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
                                <span className="font-medium">
                                  Action:
                                </span>{" "}
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
                                <strong>Job:</strong> Answering routine emails
                                or attending a brief, unscheduled meeting that
                                could be delegated.
                                <br />
                                <span className="italic">Examples:</span>{" "}
                                <strong>Student:</strong> Replying to
                                non-critical group chat messages or addressing
                                minor assignment clarifications.
                                <br />
                                <span className="font-medium">
                                  Action:
                                </span>{" "}
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
                                <strong>Student:</strong> Studying ahead for
                                major exams or working on a long-term project.
                                <br />
                                <span className="font-medium">
                                  Action:
                                </span>{" "}
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
                                <strong>Student:</strong> Scrolling through
                                social media during study sessions or watching
                                videos that aren’t related to coursework.
                                <br />
                                <span className="font-medium">
                                  Action:
                                </span>{" "}
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
                            Input a task with its title, optional description,
                            and due date. Select the appropriate quadrant from
                            the dropdown menu. Adjust priorities using
                            drag-and-drop, mark tasks as completed with the
                            checkbox, or remove them with the delete button as
                            required.
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
                            Die Eisenhower-Matrix, entwickelt von Präsident
                            Dwight D. Eisenhower, ist ein strategisches Werkzeug
                            zur Kategorisierung von Aufgaben nach Dringlichkeit
                            und Wichtigkeit. Sie strukturiert Ihre Arbeitslast
                            in vier Quadranten, um Produktivität und
                            Entscheidungsfindung zu optimieren.
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
                                <strong>Beruf:</strong> Behebung eines
                                kritischen Fehlers in der Produktion oder
                                Fertigstellung eines Kundenangebots, das in
                                wenigen Stunden fällig ist.
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
                                <strong>Beruf:</strong> Teilnahme an
                                Fortbildungen oder Planung langfristiger
                                Projekte.
                                <br />
                                <span className="italic">Beispiele:</span>{" "}
                                <strong>Student:</strong> Frühzeitiges Lernen
                                für wichtige Prüfungen oder die Bearbeitung von
                                Projekten, die langfristig an Bedeutung
                                gewinnen.
                                <br />
                                <span className="font-medium">
                                  Maßnahme:
                                </span>{" "}
                                Für gezielte Bearbeitung einplanen.
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
                            Beschreibung und Fälligkeitsdatum ein. Wählen Sie
                            den passenden Quadranten aus dem Dropdown-Menü.
                            Passen Sie Prioritäten per Drag-and-Drop an,
                            markieren Sie Aufgaben als erledigt mit dem
                            Kontrollkästchen oder entfernen Sie sie bei Bedarf
                            mit dem Löschbutton.
                          </p>
                        </section>
                      </>
                    )}
                  </div>
                </motion.div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Description */}
          <div className="md:col-span-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
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
                        onSelect={handleNewTodoDateSelect}
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
                        onClick={handleNewTodoClearDate}
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

        {/* DnD Context for cross-quadrant moves & in-quadrant reorder */}
        <DndContext
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCenter}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        >
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {quadrants.map((q) => {
              // All tasks in quadrant q.id, not done, sorted by position
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
                        // Fade the "original" item if it's currently dragged as an overlay
                        isActive={activeTask?.id === task.id}
                      />
                    ))}
                  </AnimatePresence>
                </DroppableZone>
              );
            })}
          </motion.div>

          {/* DragOverlay for cross-quadrant ghost */}
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

        {/* Upcoming Tasks */}
        <motion.div variants={itemVariants} className="mt-12">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            {language === "en" ? "Upcoming Tasks" : "Kommende Aufgaben"}
          </h3>
          <div className="space-y-4">
            <AnimatePresence>
              {tasks
                .filter((t) => !t.done && t.due_date)
                .sort(
                  (a, b) =>
                    new Date(a.due_date!).getTime() -
                    new Date(b.due_date!).getTime()
                )
                .map((task) => (
                  <motion.div
                    key={task.id}
                    variants={itemVariants}
                    className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`upcoming-task-${task.id}`}
                          checked={task.done}
                          onCheckedChange={() => toggleDone(task.id, task.done)}
                          className="border-gray-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                        <Label
                          htmlFor={`upcoming-task-${task.id}`}
                          className="text-sm font-medium text-gray-900 dark:text-gray-100"
                        >
                          {task.title}
                        </Label>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-xs font-medium ${
                            new Date(task.due_date!).getTime() < Date.now()
                              ? "text-red-500 dark:text-red-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {getTimeRemaining(task.due_date!)}
                        </span>
                        <motion.button
                          variants={buttonVariants}
                          initial="initial"
                          whileHover="hover"
                          whileTap="tap"
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {task.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {language === "en" ? "Quadrant:" : "Quadrant:"}{" "}
                      {quadrants.find((q) => q.id === task.quadrant)?.title}
                    </p>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Completed Tasks */}
        <motion.div variants={itemVariants} className="mt-12">
          <Collapsible open={isDoneOpen} onOpenChange={setIsDoneOpen}>
            <CollapsibleTrigger asChild>
              <motion.button
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                className="w-full flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl shadow-md p-4"
              >
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
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
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-6 space-y-4">
              <AnimatePresence>
                {tasks
                  .filter((t) => t.done)
                  .map((task) => (
                    <motion.div
                      key={task.id}
                      variants={itemVariants}
                      className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`done-task-${task.id}`}
                            checked={task.done}
                            onCheckedChange={() =>
                              toggleDone(task.id, task.done)
                            }
                            className="border-gray-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                          />
                          <Label
                            htmlFor={`done-task-${task.id}`}
                            className="text-sm font-medium text-gray-500 dark:text-gray-400 line-through"
                          >
                            {task.title}
                          </Label>
                        </div>
                        <motion.button
                          variants={buttonVariants}
                          initial="initial"
                          whileHover="hover"
                          whileTap="tap"
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {task.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {language === "en" ? "Completed:" : "Abgeschlossen:"}{" "}
                        {formatTimestamp(task.completed_at!)}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {language === "en" ? "Due:" : "Fällig:"}{" "}
                          {formatTimestamp(task.due_date)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {language === "en" ? "Quadrant:" : "Quadrant:"}{" "}
                        {quadrants.find((q) => q.id === task.quadrant)?.title}
                      </p>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      </motion.div>
    </div>
  );
}
