import { Session } from "botbuilder";
import { config } from "../../config";

export function getText(session: Session, key: string): string {
  return session.localizer.gettext(session.preferredLocale(), key);
}

export function getLocale(culture: string): string {
  if (config.get("FrenchAllowed") as boolean && culture) {
    switch (culture.toUpperCase().substring(0, 2)) {
      case 'FR':
        return 'fr';
      default:
        return 'en';
    }
  } else {
    return 'en';
  }
}