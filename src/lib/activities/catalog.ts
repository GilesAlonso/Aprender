import { readFileSync } from "node:fs";
import path from "node:path";

import {
  InteractiveActivity,
  InteractiveActivityDataset,
  activityCategorySchema,
  interactiveDatasetSchema,
} from "./types";

const DATASET_PATH = path.join(process.cwd(), "data", "content", "interactive-activities.json");

let cachedDataset: InteractiveActivityDataset | null = null;
let activitiesBySlug: Map<string, InteractiveActivity> | null = null;

const loadDatasetFromFile = (): InteractiveActivityDataset => {
  const fileContent = readFileSync(DATASET_PATH, "utf-8");
  const parsed = JSON.parse(fileContent) as unknown;
  return interactiveDatasetSchema.parse(parsed);
};

export const loadInteractiveDataset = (): InteractiveActivityDataset => {
  if (!cachedDataset) {
    cachedDataset = loadDatasetFromFile();
    activitiesBySlug = new Map(
      cachedDataset.activities.map((activity) => [activity.slug, activity])
    );
  }

  return cachedDataset;
};

export const listInteractiveActivities = (type?: string): InteractiveActivity[] => {
  const dataset = loadInteractiveDataset();

  if (!type) {
    return dataset.activities;
  }

  const normalizedType = type.toUpperCase();
  const activityType = activityCategorySchema.parse(normalizedType);
  return dataset.activities.filter((activity) => activity.type === activityType);
};

export const getInteractiveActivityBySlug = (slug: string): InteractiveActivity | null => {
  if (!activitiesBySlug) {
    loadInteractiveDataset();
  }

  return activitiesBySlug?.get(slug) ?? null;
};
