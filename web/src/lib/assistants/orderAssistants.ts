import { Persona } from "@/app/admin/assistants/interfaces";
import { User } from "../types";
import { checkUserOwnsAssistant } from "./checkOwnership";

export function orderAssistantsForUser(
  assistants: Persona[],
  user: User | null,
  ownedByUser?: boolean
) {
  if (user && user.preferences && user.preferences.chosen_assistants) {
    const chosenAssistantsSet = new Set(user.preferences.chosen_assistants);
    const assistantOrderMap = new Map(
      user.preferences.chosen_assistants.map((id: number, index: number) => [
        id,
        index,
      ])
    );

    let filteredAssistants = assistants.filter((assistant) =>
      chosenAssistantsSet.has(assistant.id)
    );
    if (ownedByUser) {
      filteredAssistants = filteredAssistants.filter((assistant) =>
        checkUserOwnsAssistant(user, assistant)
      );
    }

    if (filteredAssistants.length == 0) {
      return assistants;
    }

    filteredAssistants.sort((a, b) => {
      const orderA = assistantOrderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const orderB = assistantOrderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
    return filteredAssistants;
  }

  return assistants;
}
