"use client";

import { useState } from "react";
import { LEVELS, type Course, type Level } from "@/lib/data";
import { CourseCard } from "@/components/ui";
import CourseActions from "@/components/CourseActions";

export default function CourseCatalog({ courses }: { courses: Course[] }) {
  const [level, setLevel] = useState<Level | "Semua">("Semua");
  const filters: (Level | "Semua")[] = ["Semua", ...LEVELS];
  const visible =
    level === "Semua" ? courses : courses.filter((c) => c.level === level);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setLevel(f)}
            aria-pressed={level === f}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              level === f
                ? "border-accent bg-accent text-white"
                : "border-line bg-card text-muted hover:border-accent/40 hover:text-fg"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            footer={
              <CourseActions
                courseId={c.id}
                lessons={c.lessons}
                progress={c.progress}
              />
            }
          />
        ))}
      </div>
    </div>
  );
}
