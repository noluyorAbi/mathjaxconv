"use client";

import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// ❗ PASSE DEN IMPORT AN DEINE SUPABASE CLIENT-DATEI AN
import { supabase } from "@/lib/supabaseClient";

interface ModuleData {
  id?: number;
  title: string;
  grade: string;
  credits: number;
}

interface SemesterData {
  name: string;
  modules: ModuleData[];
}

export default function SemesterOverview() {
  const [semesters, setSemesters] = useState<SemesterData[]>([]);

  // --- States fürs Modal und die Form-Felder ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("1. Semester");
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleGrade, setModuleGrade] = useState("");
  const [moduleCredits, setModuleCredits] = useState("");
  const [semesterTerm, setSemesterTerm] = useState("WS 23/24");

  // Beim ersten Rendern: Daten aus Supabase laden
  useEffect(() => {
    fetchGradesFromSupabase();
  }, []);

  async function fetchGradesFromSupabase() {
    const { data, error } = await supabase.from("grades").select("*");
    if (error) {
      console.error("Fehler beim Laden der Daten:", error);
      return;
    }

    // data könnte so aussehen:
    // [
    //   { id: 1, semester: "1. Semester", title: "Modul A", grade: "2,3", credits: 6, term: "WS 23/24" },
    //   ...
    // ]
    // -> Wir wollen sie nach "semester" gruppieren.
    const semesterNames = Array.from(
      new Set(data.map((item) => item.semester))
    ) as string[];

    const grouped: SemesterData[] = semesterNames.map((semName) => {
      const modulesForThisSemester = data
        .filter((d) => d.semester === semName)
        .map((d) => ({
          id: d.id,
          title: d.title,
          grade: d.grade,
          credits: d.credits,
        }));
      return {
        name: semName,
        modules: modulesForThisSemester,
      };
    });

    setSemesters(grouped);
  }

  // Modal öffnen/schließen
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Neue Note in Supabase speichern und in den State einfügen
  async function handleSaveGrade() {
    const creditsInt = parseInt(moduleCredits, 10) || 0;
    const { data, error } = await supabase
      .from("grades")
      .insert({
        semester: selectedSemester,
        title: moduleTitle,
        grade: moduleGrade,
        credits: creditsInt,
        term: semesterTerm,
      })
      .select();

    if (error) {
      console.error("Fehler beim Hinzufügen der Note:", error);
      return;
    }

    if (data && data.length > 0) {
      const newEntry = data[0];
      setSemesters((prev) => {
        // Existiert das Semester schon in prev?
        const existing = prev.find((s) => s.name === selectedSemester);
        if (existing) {
          // Semester vorhanden, Module erweitern
          return prev.map((s) => {
            if (s.name === selectedSemester) {
              return {
                ...s,
                modules: [
                  ...s.modules,
                  {
                    id: newEntry.id,
                    title: newEntry.title,
                    grade: newEntry.grade,
                    credits: newEntry.credits,
                  },
                ],
              };
            }
            return s;
          });
        } else {
          // Semester gibt es noch nicht – neu anlegen
          return [
            ...prev,
            {
              name: selectedSemester,
              modules: [
                {
                  id: newEntry.id,
                  title: newEntry.title,
                  grade: newEntry.grade,
                  credits: newEntry.credits,
                },
              ],
            },
          ];
        }
      });
    }

    // Formular zurücksetzen
    setSelectedSemester("1. Semester");
    setModuleTitle("");
    setModuleGrade("");
    setModuleCredits("");
    setSemesterTerm("WS 23/24");

    // Modal schließen
    setIsModalOpen(false);
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Semesterübersicht
      </h1>

      <Accordion type="single" collapsible className="space-y-4">
        {semesters.map((semester) => (
          <AccordionItem
            key={semester.name}
            value={semester.name}
            className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
          >
            <AccordionTrigger className="px-6 py-4 text-lg font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-800">
              {semester.name}
            </AccordionTrigger>
            <AccordionContent className="p-4">
              <Card className="border-none shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl text-gray-800 dark:text-gray-200">
                    {semester.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200 dark:border-gray-700">
                        <TableHead className="text-gray-700 dark:text-gray-300">
                          Modul
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">
                          Note
                        </TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">
                          CP
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {semester.modules.map((mod, idx) => (
                        <TableRow
                          key={mod.id ?? idx}
                          className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <TableCell className="font-medium text-gray-900 dark:text-white">
                            {mod.title}
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {mod.grade}
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {mod.credits}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Button-Leiste (nur 1 Button) */}
      <div className="mt-8 flex justify-start gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button
          onClick={openModal}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center gap-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Note hinzufügen
        </Button>
      </div>

      {/* Modal für "Note hinzufügen" */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            {/* Modal-Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Note hinzufügen
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Formularfelder */}
            <div className="space-y-4">
              {/* Semester-Auswahl */}
              <div className="space-y-2">
                <label
                  htmlFor="semester"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Semester
                </label>
                <select
                  id="semester"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option>1. Semester</option>
                  <option>2. Semester</option>
                  <option>3. Semester</option>
                  <option>4. Semester</option>
                  <option>5. Semester</option>
                  <option>6. Semester</option>
                </select>
              </div>

              {/* Modulbezeichnung */}
              <div className="space-y-2">
                <label
                  htmlFor="bezeichnung"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Bezeichnung
                </label>
                <input
                  id="bezeichnung"
                  type="text"
                  placeholder="z.B. Datenbanksysteme"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Note */}
              <div className="space-y-2">
                <label
                  htmlFor="note"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Note
                </label>
                <input
                  id="note"
                  type="text"
                  placeholder="z.B. 2,3"
                  value={moduleGrade}
                  onChange={(e) => setModuleGrade(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Credits */}
              <div className="space-y-2">
                <label
                  htmlFor="cp"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  CP
                </label>
                <input
                  id="cp"
                  type="text"
                  placeholder="z.B. 5"
                  value={moduleCredits}
                  onChange={(e) => setModuleCredits(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* SemesterTerm (WS/SS) */}
              <div className="space-y-2">
                <label
                  htmlFor="semesterTerm"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Semester (z.B. WS 23/24)
                </label>
                <select
                  id="semesterTerm"
                  value={semesterTerm}
                  onChange={(e) => setSemesterTerm(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option>WS 23/24</option>
                  <option>SS 24</option>
                  <option>WS 24/25</option>
                  <option>SS 25</option>
                </select>
              </div>
            </div>

            {/* Modal-Action-Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                onClick={closeModal}
                variant="outline"
                className="border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveGrade}
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Speichern
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
