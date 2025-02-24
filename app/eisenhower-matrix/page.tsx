"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  ChevronDown,
  ChevronUp,
  Trash2,
  GripVertical,
  Calendar as CalendarIcon,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { format, isSameMonth } from "date-fns";

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

const quadrants = [
  { id: "urgent-important", title: "Urgent & Important" },
  { id: "urgent-not-important", title: "Urgent, Not Important" },
  { id: "not-urgent-important", title: "Not Urgent, Important" },
  { id: "not-urgent-not-important", title: "Not Urgent, Not Important" },
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

// Color mapping for quadrant selector text
const quadrantTextColors: Record<string, string> = {
  "urgent-important": "text-red-600 dark:text-red-400",
  "urgent-not-important": "text-yellow-600 dark:text-yellow-400",
  "not-urgent-important": "text-blue-600 dark:text-blue-400",
  "not-urgent-not-important": "text-green-600 dark:text-green-400",
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

const selectVariants = {
  closed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
  open: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3, ease: "easeInOut", staggerChildren: 0.05 },
  },
};

const selectItemVariants = {
  closed: { opacity: 0, y: -10 },
  open: { opacity: 1, y: 0 },
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const popoverVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
};

function DroppableZone({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <motion.div
      ref={setNodeRef}
      variants={itemVariants}
      className={`p-6 rounded-3xl ${
        quadrantStyles[id]
      } min-h-[300px] border border-gray-200/70 dark:border-gray-800/70 shadow-xl transition-all duration-300 ${
        isOver ? "ring-2 ring-indigo-500 ring-opacity-70 scale-102" : ""
      }`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400 }}
      style={{ zIndex: 1, position: "relative" }}
    >
      <h2 className="text-xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100 tracking-tight">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function DraggableTask({
  task,
  onToggle,
  onDelete,
  onUpdate,
  isDraggingOverlay = false,
  isActive = false,
  displayAllInfos = false,
}: {
  task: Task;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
  onUpdate: (task: Task) => void;
  isDraggingOverlay?: boolean;
  isActive?: boolean;
  displayAllInfos?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id.toString(),
    disabled: isDraggingOverlay,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [date, setDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  );
  const [displayedMonth, setDisplayedMonth] = useState<Date>(
    date || new Date()
  );

  const motionStyle =
    transform && !isDraggingOverlay
      ? { x: transform.x, y: transform.y, rotate: 2, scale: 1.05 }
      : { x: 0, y: 0, rotate: 0, scale: 1 };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return "No due date";
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

  const modifiers = {
    currentMonth: (d: Date) => isSameMonth(d, displayedMonth),
  };

  const modifiersClassNames = {
    currentMonth: "border-2 border-indigo-600 text-indigo-600 rounded-full",
  };

  const shouldShowDetails = displayAllInfos || isOpen;

  return (
    <motion.div
      ref={setNodeRef}
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isActive ? 0 : 1, ...motionStyle }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        rotate: { duration: 0.1 },
      }}
      style={{
        zIndex: isDraggingOverlay ? 10000 : 2,
        position: isDraggingOverlay ? "absolute" : "relative",
      }}
    >
      <Card
        className={`bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200/70 dark:border-gray-800/70 transition-all duration-300 ${
          isDraggingOverlay ? "shadow-2xl" : "hover:shadow-2xl"
        }`}
      >
        <Collapsible open={shouldShowDetails} onOpenChange={setIsOpen}>
          <CardContent className="p-4">
            {isEditing ? (
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
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleSave}
                    className="p-2 text-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleCancel}
                    className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                  placeholder="Description"
                  className="border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className="w-full flex items-center justify-start text-left font-normal border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 transition-all duration-300"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </motion.button>
                  </PopoverTrigger>
                  <AnimatePresence>
                    <PopoverContent className="w-auto p-0 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl shadow-xl">
                      <motion.div
                        variants={popoverVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          month={displayedMonth}
                          onMonthChange={setDisplayedMonth}
                          initialFocus
                          className="rounded-xl border-none"
                          modifiers={modifiers}
                          modifiersClassNames={modifiersClassNames}
                        />
                      </motion.div>
                    </PopoverContent>
                  </AnimatePresence>
                </Popover>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div
                    className="flex mr-4 items-center justify-center w-6 h-6 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    {...listeners}
                    {...attributes}
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>
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
                    {(task.description || task.due_date) &&
                      !displayAllInfos && (
                        <CollapsibleTrigger asChild>
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
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
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => onDelete(task.id)}
                      className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                        <CalendarIcon className="h-3 w-3" /> Due:{" "}
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
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoQuadrant, setNewTodoQuadrant] = useState(quadrants[0].id);
  const [newTodoDueDate, setNewTodoDueDate] = useState<Date | undefined>();
  const [displayedMonth, setDisplayedMonth] = useState<Date>(new Date());
  const [isDoneOpen, setIsDoneOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [displayAllInfos, setDisplayAllInfos] = useState(() => {
    const storedValue = localStorage.getItem("displayAllInfos");
    return storedValue ? JSON.parse(storedValue) : false;
  });

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
    localStorage.setItem("displayAllInfos", JSON.stringify(displayAllInfos));
  }, [displayAllInfos]);

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

  const handleDragStart = (event: any) => {
    const taskId = Number.parseInt(event.active.id, 10);
    const task = tasks.find((t) => t.id === taskId);
    if (task && !task.done) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = Number.parseInt(active.id as string, 10);
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.done) return;

    const newQuadrant = over.id as string;
    let updatedTasks = [...tasks];

    if (task.quadrant !== newQuadrant) {
      updatedTasks = updatedTasks.map((t) =>
        t.id === taskId ? { ...t, quadrant: newQuadrant } : t
      );
      const oldQuadrantTasks = updatedTasks
        .filter((t) => t.quadrant === task.quadrant && !t.done)
        .sort((a, b) => a.position - b.position)
        .map((t, index) => ({ ...t, position: index }));
      const newQuadrantTasks = updatedTasks
        .filter((t) => t.quadrant === newQuadrant && !t.done)
        .sort((a, b) => a.position - b.position)
        .map((t, index) => ({ ...t, position: index }));
      updatedTasks = updatedTasks.map((t) => {
        const oldMatch = oldQuadrantTasks.find((ot) => ot.id === t.id);
        const newMatch = newQuadrantTasks.find((nt) => nt.id === t.id);
        return oldMatch || newMatch || t;
      });
    } else {
      const quadrantTasks = updatedTasks
        .filter((t) => t.quadrant === newQuadrant && !t.done)
        .sort((a, b) => a.position - b.position);
      const draggedTaskIndex = quadrantTasks.findIndex((t) => t.id === taskId);
      quadrantTasks.splice(draggedTaskIndex, 1);
      const dropIndex = Math.round(event.delta.y / 80);
      const newIndex = Math.min(
        Math.max(draggedTaskIndex + dropIndex, 0),
        quadrantTasks.length
      );
      quadrantTasks.splice(newIndex, 0, task);
      updatedTasks = updatedTasks.map((t) => {
        const match = quadrantTasks.find((qt) => qt.id === t.id);
        return match ? { ...t, position: quadrantTasks.indexOf(match) } : t;
      });
    }

    setTasks(updatedTasks);

    const updates = updatedTasks
      .filter((t) => t.quadrant === newQuadrant || t.quadrant === task.quadrant)
      .map((t) => ({
        id: t.id,
        quadrant: t.quadrant,
        position: t.position,
        title: t.title,
        done: t.done,
        description: t.description || null,
        completed_at: t.completed_at || null,
        due_date: t.due_date || null,
      }));

    const { error } = await supabase
      .from("tasks")
      .upsert(updates, { onConflict: "id" });
    if (error) console.error("Error updating tasks:", error);
  };

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

  const deleteTask = async (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

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

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleString();
  };

  const getTimeRemaining = (dueDate: string | null) => {
    if (!dueDate) return "No due date";
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return `Overdue by ${-diffDays} day${-diffDays === 1 ? "" : "s"}`;
    if (diffDays === 0) return "Due today";
    return `${diffDays} day${diffDays === 1 ? "" : "s"} remaining`;
  };

  const modifiers = {
    currentMonth: (date: Date) => isSameMonth(date, displayedMonth),
  };

  const modifiersClassNames = {
    currentMonth:
      "border-2 border-indigo-600 border-opacity-60 hover:border-gray-300 text-white rounded-full",
  };

  return (
    <div className="container overflow-clip mx-auto p-8 bg-gradient-to-br from-gray-100 via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 min-h-screen overflow-x-hidden">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        className="max-w-5xl mx-auto"
      >
        <motion.form
          variants={itemVariants}
          onSubmit={handleCreateTask}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800"
        >
          <div className="md:col-span-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
              Task
            </Label>
            <Input
              id="new-task"
              placeholder="Add a new task..."
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 rounded-xl bg-white dark:bg-gray-900 shadow-sm transition-all duration-300"
            />
          </div>
          <div className="md:col-span-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
              Description
            </Label>
            <Input
              id="new-description"
              placeholder="Optional description..."
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
              className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 rounded-xl bg-white dark:bg-gray-900 shadow-sm transition-all duration-300"
            />
          </div>
          <div className="md:col-span-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
              Due Date (optional)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="w-full flex items-center justify-start text-left font-normal border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 transition-all duration-300"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  {newTodoDueDate ? (
                    format(newTodoDueDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </motion.button>
              </PopoverTrigger>
              <AnimatePresence>
                <PopoverContent className="w-auto p-0 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl shadow-xl">
                  <motion.div
                    variants={popoverVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <Calendar
                      mode="single"
                      selected={newTodoDueDate}
                      onSelect={setNewTodoDueDate}
                      month={displayedMonth}
                      onMonthChange={setDisplayedMonth}
                      initialFocus
                      className="rounded-xl border-none"
                      modifiers={modifiers}
                      modifiersClassNames={modifiersClassNames}
                    />
                  </motion.div>
                </PopoverContent>
              </AnimatePresence>
            </Popover>
          </div>
          <div className="md:col-span-1 md:col-start-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 block">
              Quadrant
            </Label>
            <Select value={newTodoQuadrant} onValueChange={setNewTodoQuadrant}>
              <SelectTrigger className="mt-1 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-xl shadow-xl">
                <AnimatePresence>
                  <motion.div
                    variants={selectVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                  >
                    {quadrants.map((q) => (
                      <motion.div
                        key={q.id}
                        variants={selectItemVariants}
                        whileHover={{
                          scale: 1.02,
                          backgroundColor: "rgba(99, 102, 241, 0.1)",
                        }}
                        className="rounded-lg"
                      >
                        <SelectItem
                          value={q.id}
                          className={`cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors duration-200 ${
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
              whileHover="hover"
              whileTap="tap"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2 shadow-md hover:shadow-lg transition-all duration-300"
            >
              Add
            </motion.button>
          </div>
        </motion.form>

        {loading && (
          <motion.p
            variants={itemVariants}
            className="text-center text-gray-600 dark:text-gray-400"
          >
            Loading tasks...
          </motion.p>
        )}

        <motion.div
          variants={itemVariants}
          className="mb-6 flex items-center gap-2"
        >
          <Checkbox
            id="display-infos"
            checked={displayAllInfos}
            onCheckedChange={() => setDisplayAllInfos((prev: boolean) => !prev)}
            className="border-gray-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
          />
          <Label
            htmlFor="display-infos"
            className="text-sm font-medium text-gray-800 dark:text-gray-200"
          >
            Display Info
          </Label>
        </motion.div>

        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {quadrants.map((q) => (
              <DroppableZone key={q.id} id={q.id} title={q.title}>
                <AnimatePresence>
                  {tasks
                    .filter((t) => t.quadrant === q.id && !t.done)
                    .sort((a, b) => a.position - b.position)
                    .map((task) => (
                      <motion.div variants={itemVariants} key={task.id}>
                        <DraggableTask
                          task={task}
                          onToggle={toggleDone}
                          onDelete={deleteTask}
                          onUpdate={updateTask}
                          isActive={activeTask?.id === task.id}
                          displayAllInfos={displayAllInfos}
                        />
                      </motion.div>
                    ))}
                </AnimatePresence>
              </DroppableZone>
            ))}
          </motion.div>
          <DragOverlay>
            {activeTask ? (
              <DraggableTask
                task={activeTask}
                onToggle={toggleDone}
                onDelete={deleteTask}
                onUpdate={updateTask}
                isDraggingOverlay={true}
                displayAllInfos={displayAllInfos}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        <motion.div variants={itemVariants} className="mt-12">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Upcoming Tasks
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
                          whileHover="hover"
                          whileTap="tap"
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                      Quadrant:{" "}
                      {quadrants.find((q) => q.id === task.quadrant)?.title}
                    </p>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-12">
          <Collapsible open={isDoneOpen} onOpenChange={setIsDoneOpen}>
            <CollapsibleTrigger asChild>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="w-full flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl shadow-md p-4 transition-all duration-300"
              >
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Completed Tasks ({tasks.filter((t) => t.done).length})
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
                          whileHover="hover"
                          whileTap="tap"
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
                        Completed: {formatTimestamp(task.completed_at!)}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Due: {formatTimestamp(task.due_date)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Quadrant:{" "}
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
