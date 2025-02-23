"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  type DragEndEvent,
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
import { ChevronDown, ChevronUp, Trash2, GripVertical } from "lucide-react";

type Task = {
  id: number;
  title: string;
  description?: string;
  quadrant: string;
  position: number;
  done: boolean;
  completed_at?: string | null;
};

const quadrants = [
  { id: "urgent-important", title: "Urgent & Important" },
  { id: "urgent-not-important", title: "Urgent, Not Important" },
  { id: "not-urgent-important", title: "Not Urgent, Important" },
  { id: "not-urgent-not-important", title: "Not Urgent, Not Important" },
];

const quadrantStyles: Record<string, string> = {
  "urgent-important":
    "bg-gradient-to-br from-red-200 to-red-100 dark:from-red-800 dark:to-red-700",
  "urgent-not-important":
    "bg-gradient-to-br from-yellow-200 to-yellow-100 dark:from-yellow-800 dark:to-yellow-700",
  "not-urgent-important":
    "bg-gradient-to-br from-blue-200 to-blue-100 dark:from-blue-800 dark:to-blue-700",
  "not-urgent-not-important":
    "bg-gradient-to-br from-green-200 to-green-100 dark:from-green-800 dark:to-green-700",
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
      className={`p-6 rounded-2xl ${
        quadrantStyles[id]
      } min-h-[250px] border border-gray-200/50 dark:border-gray-800/50 shadow-lg transition-all ${
        isOver ? "ring-2 ring-indigo-500 ring-opacity-50" : ""
      }`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400 }}
      style={{ zIndex: 1, position: "relative" }}
    >
      <h2 className="text-xl font-medium mb-4 text-center text-gray-900 dark:text-gray-100">
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
}: {
  task: Task;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id.toString(),
    });

  const motionStyle = transform
    ? {
        x: transform.x,
        y: transform.y,
        rotate: isDragging ? 2 : 0,
        scale: isDragging ? 1.05 : 1,
      }
    : { x: 0, y: 0, rotate: 0, scale: 1 };

  return (
    <motion.div
      ref={setNodeRef}
      className="relative group"
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        ...motionStyle,
      }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        rotate: { duration: 0.1 },
      }}
      style={{
        zIndex: isDragging ? 9999 : 2,
        position: isDragging ? "fixed" : "relative",
        cursor: "default",
      }}
    >
      <Card
        className={`bg-white/90 dark:bg-gray-900/90 shadow-md rounded-lg border border-gray-200 dark:border-gray-800 transition-shadow ${
          isDragging ? "shadow-xl" : "hover:shadow-xl"
        }`}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div
            className="flex mr-4 items-center justify-center w-6 h-6 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700"
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
              className="border-gray-400"
            />
            <Label
              htmlFor={`task-${task.id}`}
              className={`text-sm font-medium ${
                task.done
                  ? "line-through text-gray-500"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {task.title}
            </Label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
      {task.description && (
        <motion.div
          className="absolute z-10 top-full left-0 mt-2 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg hidden group-hover:block"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
        >
          {task.description}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function EisenhowerMatrix() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoQuadrant, setNewTodoQuadrant] = useState(quadrants[0].id);
  const [isDoneOpen, setIsDoneOpen] = useState(false);

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
    }
    fetchTasks();
  }, []);

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
      })
      .select();
    if (error) {
      console.error("Error creating task:", error);
    } else if (data?.length) {
      setTasks((prev) => [...prev, data[0]]);
      setNewTodoTitle("");
      setNewTodoDescription("");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = Number.parseInt(active.id as string, 10);
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.done) return;

    const newQuadrant = over.id as string;
    let updatedTasks = [...tasks];

    if (task.quadrant !== newQuadrant) {
      // Move task to new quadrant
      updatedTasks = updatedTasks.map((t) =>
        t.id === taskId ? { ...t, quadrant: newQuadrant } : t
      );

      // Re-index old quadrant
      const oldQuadrantTasks = updatedTasks
        .filter((t) => t.quadrant === task.quadrant && !t.done)
        .sort((a, b) => a.position - b.position)
        .map((t, index) => ({ ...t, position: index }));

      // Re-index new quadrant (append dragged task at the end)
      const newQuadrantTasks = updatedTasks
        .filter((t) => t.quadrant === newQuadrant && !t.done)
        .sort((a, b) => a.position - b.position)
        .map((t, index) => ({ ...t, position: index }));

      // Update the full task list
      updatedTasks = updatedTasks.map((t) => {
        const oldMatch = oldQuadrantTasks.find((ot) => ot.id === t.id);
        const newMatch = newQuadrantTasks.find((nt) => nt.id === t.id);
        return oldMatch || newMatch || t;
      });
    } else {
      // Reorder within the same quadrant
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

      // Update positions
      updatedTasks = updatedTasks.map((t) => {
        const match = quadrantTasks.find((qt) => qt.id === t.id);
        return match ? { ...t, position: quadrantTasks.indexOf(match) } : t;
      });
    }

    setTasks(updatedTasks);

    // Prepare updates for Supabase
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
      }));

    console.log("Upserting tasks:", updates);

    const { error } = await supabase.from("tasks").upsert(updates, {
      onConflict: "id",
    });

    if (error) {
      console.error(
        "Error updating tasks:",
        error.message,
        error.details,
        error.hint
      );
    }
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

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <form
          onSubmit={handleCreateTask}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 bg-white/80 dark:bg-gray-900/80 p-6 rounded-2xl shadow-xl backdrop-blur-sm"
        >
          <div className="md:col-span-2">
            <Label
              htmlFor="new-task"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Task Title
            </Label>
            <Input
              id="new-task"
              placeholder="Add a new task..."
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              className="mt-1 border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <Label
              htmlFor="new-description"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </Label>
            <Input
              id="new-description"
              placeholder="Optional description..."
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
              className="mt-1 border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label
                htmlFor="quadrant"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Quadrant
              </Label>
              <Select
                value={newTodoQuadrant}
                onValueChange={setNewTodoQuadrant}
              >
                <SelectTrigger id="quadrant" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quadrants.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Add
            </Button>
          </div>
        </form>

        {loading && (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Loading tasks...
          </p>
        )}

        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {quadrants.map((q) => (
              <DroppableZone key={q.id} id={q.id} title={q.title}>
                <AnimatePresence>
                  {tasks
                    .filter((t) => t.quadrant === q.id && !t.done)
                    .sort((a, b) => a.position - b.position)
                    .map((task) => (
                      <DraggableTask
                        key={task.id}
                        task={task}
                        onToggle={toggleDone}
                        onDelete={deleteTask}
                      />
                    ))}
                </AnimatePresence>
              </DroppableZone>
            ))}
          </div>
        </DndContext>

        <Collapsible
          open={isDoneOpen}
          onOpenChange={setIsDoneOpen}
          className="mt-10"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full flex justify-between items-center bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="text-lg font-medium">
                Done Tasks ({tasks.filter((t) => t.done).length})
              </span>
              {isDoneOpen ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <AnimatePresence>
              {tasks
                .filter((t) => t.done)
                .map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white/90 dark:bg-gray-900/90 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`done-task-${task.id}`}
                          checked={task.done}
                          onCheckedChange={() => toggleDone(task.id, task.done)}
                          className="border-gray-400"
                        />
                        <Label
                          htmlFor={`done-task-${task.id}`}
                          className="text-sm font-medium text-gray-500 line-through"
                        >
                          {task.title}
                        </Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {task.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Completed: {formatTimestamp(task.completed_at!)}
                    </p>
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
    </div>
  );
}
