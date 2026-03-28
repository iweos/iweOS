"use client";

import { useEffect, useMemo, useState } from "react";

type ShellTourProps = {
  mode: "admin" | "teacher";
  teacherPortalAdmin?: boolean;
};

type TourStep = {
  id: string;
  title: string;
  body: string;
  selector?: string;
};

type TourRect = {
  top: number;
  left: number;
  width: number;
  height: number;
} | null;

function getStorageKey(mode: "admin" | "teacher") {
  return `iweos-tour-seen-${mode}`;
}

function getSteps(mode: "admin" | "teacher", teacherPortalAdmin?: boolean): TourStep[] {
  if (mode === "teacher") {
    return [
      {
        id: "teacher-sidebar",
        title: "This menu is your daily workspace",
        body: "Use the sidebar to move between students, attendance, grade entry, conduct, comments, and results.",
        selector: "[data-tour='sidebar-main']",
      },
      {
        id: "teacher-students",
        title: "Students and analytics",
        body: "Open Students to compare a selected student against class averages and subject positions.",
        selector: "[data-tour='teacher-students-link']",
      },
      {
        id: "teacher-attendance",
        title: "Attendance stays inside the result flow",
        body: "Attendance records feed the result sheet, so teachers can keep attendance aligned with the selected term and class.",
        selector: "[data-tour='teacher-attendance-link']",
      },
      {
        id: "teacher-grade-entry",
        title: "Grade entry saves automatically",
        body: "Scores save as you leave a field, and only active students in the selected class remain in view.",
        selector: "[data-tour='teacher-grade-entry-link']",
      },
      {
        id: "teacher-results",
        title: "Results and comments close the loop",
        body: "Use comments and results to review what will appear on the report card before it is published.",
        selector: "[data-tour='teacher-results-link']",
      },
      {
        id: "notifications",
        title: "Watch the bell for school updates",
        body: "Notifications now show class assignments, result publication changes, student additions, and other updates that affect your classes.",
        selector: "[data-tour='topbar-notifications']",
      },
      {
        id: "footer-tour",
        title: teacherPortalAdmin ? "Admin override is still teacher-first here" : "Need this walkthrough again later?",
        body: teacherPortalAdmin
          ? "Because you are viewing the teacher portal as an admin, you can still reopen this tour and jump back to administration whenever needed."
          : "Use the footer button at the bottom of the page whenever you want to replay the tour or open the full guide.",
        selector: "[data-tour='tour-footer']",
      },
    ];
  }

  return [
    {
      id: "admin-sidebar",
      title: "This sidebar runs the school setup",
      body: "The left menu is where you control staff, students, academic setup, grading, payments, and settings.",
      selector: "[data-tour='sidebar-main']",
    },
    {
      id: "admin-teachers",
      title: "Teachers come first",
      body: "Start by adding or linking teachers, then assign them to classes so the teacher portal only shows the right work.",
      selector: "[data-tour='admin-teachers-link']",
    },
    {
      id: "admin-academic-setup",
      title: "Build your academic structure here",
      body: "Use Academic Setup for classes, subjects, and sessions before grading begins.",
      selector: "[data-tour='admin-academic-group']",
    },
    {
      id: "admin-assignments",
      title: "Assignments connect the school structure",
      body: "Teacher-Class, Class-Subject, and Enrollments tie staff, subjects, and students together for each term.",
      selector: "[data-tour='admin-assignments-group']",
    },
    {
      id: "admin-grading",
      title: "Grading manages the whole result workflow",
      body: "From grade scales to assessment types, conduct, results, and promotions, this section drives report generation.",
      selector: "[data-tour='admin-grading-group']",
    },
    {
      id: "admin-payments",
      title: "Payments stay in a dedicated workspace",
      body: "Use the payment section for invoices, transactions, reconciliation, reports, and fee setup.",
      selector: "[data-tour='admin-payments-group']",
    },
    {
      id: "notifications",
      title: "The bell now carries operational updates",
      body: "Notifications help admins and teachers see new student imports, result updates, class assignments, and other important actions.",
      selector: "[data-tour='topbar-notifications']",
    },
    {
      id: "profile",
      title: "Account controls stay here",
      body: "Use the profile menu for account actions like sign out and quick settings access.",
      selector: "[data-tour='topbar-profile']",
    },
    {
      id: "footer-tour",
      title: "Replay the tour any time",
      body: "The footer includes a Start Tour action and the full Guide page, so new staff can onboard themselves whenever they need help.",
      selector: "[data-tour='tour-footer']",
    },
  ];
}

export default function ShellTour({ mode, teacherPortalAdmin = false }: ShellTourProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TourRect>(null);
  const steps = useMemo(() => getSteps(mode, teacherPortalAdmin), [mode, teacherPortalAdmin]);
  const currentStep = steps[stepIndex];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const seenKey = getStorageKey(mode);
    const hasSeen = window.localStorage.getItem(seenKey) === "true";

    if (!hasSeen) {
      const timeoutId = window.setTimeout(() => {
        setStepIndex(0);
        setOpen(true);
        window.localStorage.setItem(seenKey, "true");
      }, 700);

      return () => window.clearTimeout(timeoutId);
    }
  }, [mode]);

  useEffect(() => {
    function handleOpenTour() {
      setStepIndex(0);
      setOpen(true);
    }

    window.addEventListener("iweos:open-tour", handleOpenTour as EventListener);
    return () => {
      window.removeEventListener("iweos:open-tour", handleOpenTour as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!open || !currentStep?.selector) {
      setTargetRect(null);
      return;
    }

    function updateRect() {
      const element = document.querySelector(currentStep.selector ?? "");
      if (!(element instanceof HTMLElement)) {
        setTargetRect(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      element.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open, currentStep]);

  if (!open || !currentStep) {
    return null;
  }

  const cardStyle =
    targetRect && typeof window !== "undefined"
      ? {
          top: Math.min(targetRect.top + targetRect.height + 18, window.innerHeight - 230),
          left: Math.min(Math.max(targetRect.left, 20), window.innerWidth - 360),
        }
      : undefined;

  return (
    <div className="shell-tour-layer" role="dialog" aria-modal="true" aria-label="Product tour">
      <div className="shell-tour-backdrop" onClick={() => setOpen(false)} />
      {targetRect ? (
        <div
          className="shell-tour-spotlight"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          aria-hidden="true"
        />
      ) : null}
      <div className={`shell-tour-card${targetRect ? "" : " is-centered"}`} style={cardStyle}>
        <div className="shell-tour-progress">
          <span>
            Step {stepIndex + 1} of {steps.length}
          </span>
          <button type="button" className="shell-tour-close" onClick={() => setOpen(false)} aria-label="Close tour">
            <i className="fas fa-times" />
          </button>
        </div>
        <h3>{currentStep.title}</h3>
        <p>{currentStep.body}</p>
        <div className="shell-tour-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            disabled={stepIndex === 0}
          >
            Back
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => setOpen(false)}>
            Skip
          </button>
          {stepIndex === steps.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
              Finish
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
